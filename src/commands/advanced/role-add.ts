import { PenalFlags, RoleLogFlags, SpecialCommandFlags } from '@/enums';
import { PenalModel, UserModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    TextChannel,
    bold,
    inlineCode,
    time
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['re', 'rolekle', 'r', 'rolver', 'rol-ver', 'rver', 'rol-ekle', 'r-ver'],
    description: 'Belirttiğiniz kullanıcıya menüden seçtiğiniz rolleri ekler/kaldırır.',
    examples: ['re @kullanıcı <menüden rol seçiniz>', 're 123456789123456789 <menüden rol seçiniz>'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.banAuth && guildData.banAuth.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
            return;
        }
        if (member.permissions.has(PermissionFlagsBits.ManageRoles) && message.member.id !== member.id) {
            client.utils.sendTimedMessage(
                message,
                `Belirttiğin üyenin ${inlineCode('ROL_YÖNET')} izni olduğu için ona işlem yapamazsın.`,
            );
            return;
        }

        const hasPenal = await PenalModel.exists({
            user: member.id,
            guild: member.guild.id,
            $or: [{ type: PenalFlags.Ads }, { type: PenalFlags.Ban }, { type: PenalFlags.ForceBan }, { type: PenalFlags.Quarantine }]
        });
        if (hasPenal) {
            client.utils.sendTimedMessage(
                message,
                "Kullanıcının cezası bulunuyor işlem yapamazsın."
            );
            return;
        }

        const minStaffRole = await message.guild.roles.cache.get(guildData.maxRoleAddRole);
        if (!minStaffRole) return message.channel.send('En alt yetkili rolü ayarlanmamış.');

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const row = new ActionRowBuilder<RoleSelectMenuBuilder>({
            components: [
                new RoleSelectMenuBuilder({
                    custom_id: 'menu',
                    max_values: 25,
                    min_values: 1,
                    placeholder: 'Rol ara..',
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: [
                        `Aşağıdaki menüden ${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcıya yapacağınız işlemi seçin.`,
                        `${bold(
                            'NOT:',
                        )} Eğer belirttiğiniz rol kullanıcıda varsa rolü çeker. ${minStaffRole} rolünün altındaki rolleri verebilirsiniz veya alabilirsiniz.`,
                    ].join('\n'),
                }),
            ],
            components: [row],
        });

        const filter = (i: RoleSelectMenuInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.RoleSelect,
        });

        if (collected) {
            const roles = collected.values.map((roleId) => message.guild.roles.cache.get(roleId));
            const specialCommands = (guildData.specialCommands || []).filter(c => c.type === SpecialCommandFlags.Punishment);
            const added: string[] = [];
            const removed: string[] = [];
            const now = Date.now();
            let hasPenalRole = false;

            for (const role of roles) {
                if ([
                    guildData.adsRole,
                    guildData.chatMuteRole,
                    guildData.voiceMuteRole,
                    guildData.quarantineRole,
                    guildData.underworldRole,
                    ...specialCommands.map(c => c.punishRole)
                ].includes(role.id)) {
                    hasPenalRole = true;
                    return;
                }

                if (
                    !(guildData.ownerRoles || []).some((r) => message.member.roles.cache.has(r)) &&
                    role.position > minStaffRole.position
                )
                    return;

                if (member.roles.cache.has(role.id)) {
                    await UserModel.updateOne(
                        { id: member.id, guild: message.guildId },
                        {
                            $push: {
                                roleLogs: {
                                    type: RoleLogFlags.Remove,
                                    roles: [role.id],
                                    time: now,
                                    admin: message.author.id,
                                },
                            },
                        },
                        { upsert: true },
                    );
                    removed.push(role.toString());
                    member.roles.remove(role);
                } else {
                    await UserModel.updateOne(
                        { id: member.id, guild: message.guildId },
                        {
                            $push: {
                                roleLogs: {
                                    type: RoleLogFlags.Add,
                                    roles: [role.id],
                                    time: now,
                                    admin: message.author.id,
                                },
                            },
                        },
                        { upsert: true },
                    );
                    added.push(role.toString());
                    member.roles.add(role);
                }
            }

            const embed = new EmbedBuilder();
            const channel = (await message.guild.channels.cache.find(
                (c) => c.isTextBased() && c.name === 'role-log',
            )) as TextChannel;
            if (channel) {
                if (added.length) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(`${added.length > 1 ? 'Roller' : 'Rol'} Eklendi!`)
                                .setFields([
                                    { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                                    {
                                        name: 'Yetkili',
                                        value: `${message.author} (${inlineCode(message.author.id)})`,
                                        inline: true,
                                    },
                                    { name: 'Tarih', value: time(Math.floor(Date.now() / 1000), 'R'), inline: true },
                                    {
                                        name: `İşlem Yapılan ${added.length > 1 ? 'Roller' : 'Rol'}`,
                                        value: added.join(', '),
                                        inline: false,
                                    },
                                ]),
                        ],
                    });
                }
                if (removed.length) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`${removed.length > 1 ? 'Roller' : 'Rol'} Çıkarıldı!`)
                                .setFields([
                                    { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                                    {
                                        name: 'Yetkili',
                                        value: `${message.author} (${inlineCode(message.author.id)})`,
                                        inline: true,
                                    },
                                    { name: 'Tarih', value: time(Math.floor(Date.now() / 1000), 'R'), inline: true },
                                    {
                                        name: `İşlem Yapılan ${removed.length > 1 ? 'Roller' : 'Rol'}`,
                                        value: removed.join(', '),
                                        inline: false,
                                    },
                                ]),
                        ],
                    });
                }
            }

            let content = `${member} adlı `;
            if (added.length && removed.length) {
                content += [
                    `kullanıcıya ${added.map((r) => bold(r)).join(', ')} ${added.length > 1 ? 'rolleri' : 'rolü'
                    } eklendi`,
                    `ve ${removed.map((r) => bold(r)).join(', ')} ${removed.length > 1 ? 'rolleri' : 'rolü'
                    } çıkarıldı.`,
                ].join(' ');
            } else if (added.length) {
                content += `kullanıcıya ${added.map((r) => bold(r)).join(', ')} ${added.length > 1 ? 'rolleri' : 'rolü'
                    } eklendi.`;
            } else if (removed.length) {
                content += `kullanıcıdan ${removed.map((r) => bold(r)).join(', ')} ${removed.length > 1 ? 'adlı roller' : 'rolü'
                    } çıkarıldı.`;
            } else if (!added.length && !removed.length) {
                content = 'Geçersiz rol girmişsin.';
            }

            question.edit({
                embeds: [embed.setColor('Random').setDescription(`${content}${hasPenal ? `\n${bold("NOT:")} Ceza rollerini vermek için ceza komutlarını kullanabilirsin.` : ""}`).setFields([]).setTitle(null)],
                components: [],
            });
        } else {
            const timeFinished = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'timefinished',
                        disabled: true,
                        emoji: { name: '⏱️' },
                        style: ButtonStyle.Danger,
                    }),
                ],
            });
            question.edit({
                embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                components: [timeFinished],
            });
        }
    },
};

export default Command;
