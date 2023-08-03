import { DEFAULTS } from '@/assets';
import { LimitFlags, NeedFlags, PenalFlags } from '@/enums';
import { ModerationClass, PenalModel } from '@/models';
import { Client } from '@/structures';
import {
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    inlineCode,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    APISelectMenuOption,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
    GuildMember,
    Message,
    User,
    time,
} from 'discord.js';
import ms from 'ms';

const Command: Moderation.ICommand = {
    usages: ['ban', 'underworld', 'doo'],
    description: 'Belirttiğiniz üyeyi banlarsınız.',
    examples: ['ban @kullanıcı', 'ban 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
    execute: async ({ client, message, args, guildData }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const limit = client.utils.checkLimit(
            message.author.id,
            LimitFlags.Ban,
            guildData.underworldLimitTime || DEFAULTS.underworld.limit.count,
            guildData.underworldLimitCount || DEFAULTS.underworld.limit.time,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum ban limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const member = await client.utils.getMember(message.guild, user.id);
        if (member) {
            if (client.utils.checkUser(message, member)) return;
            if (guildData.underworldRole && message.guild.roles.cache.has(guildData.underworldRole)) {
                if (member.roles.cache.has(guildData.underworldRole)) {
                    client.utils.sendTimedMessage(message, 'Belirttiğin kişi zaten cezalı?');
                    return;
                }
            } else {
                const ban = await message.guild.bans.fetch({ user: user.id });
                if (ban) {
                    client.utils.sendTimedMessage(message, 'Belirttiğin kişi zaten cezalı?');
                    return;
                }
            }
        }

        const reasons =
            guildData.underworldReasons && guildData.underworldReasons.length
                ? guildData.underworldReasons
                : DEFAULTS.underworld.reasons;

        const options: APISelectMenuOption[] = [
            ...reasons.map((l) => ({
                label: l.name,
                placeholder: l.placeholder,
                value: l.value,
                emoji: {
                    id: '1135792463425056838',
                },
            })),
            {
                label: 'Başka Bir Sebep Varsa Seçiniz.',
                value: 'other',
                emoji: {
                    id: '1135792274161274991',
                },
            },
        ];

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'quarantine',
                    placeholder: 'Sebep seçilmemiş!',
                    options,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const question = await message.reply({
            content: `${user} kullanıcısına ban işlemi uygulamak için aşağıdaki menüden sebep seçiniz!`,
            components: [row],
        });
        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 3,
            componentType: ComponentType.StringSelect,
        });

        if (collected) {
            if (collected.values[0] === 'other') {
                const rowOne = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'time',
                            max_length: 3,
                            label: 'Süre',
                            required: true,
                            placeholder: '5m',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });
                const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'reason',
                            max_length: 50,
                            required: true,
                            label: 'Sebep',
                            placeholder: 'Rahatsızlık vermek.',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'quarantine-modal',
                    title: 'Ses Susturması',
                    components: [rowOne, rowTwo],
                });

                await collected.showModal(modal);

                const modalCollector = await collected.awaitModalSubmit({
                    filter: (i: ModalSubmitInteraction) => i.user.id === message.author.id,
                    time: 1000 * 60 * 5,
                });
                if (modalCollector) {
                    modalCollector.deferUpdate();

                    const timing = ms(modalCollector.fields.getTextInputValue('time'));
                    const reason = modalCollector.fields.getTextInputValue('reason');

                    if (!timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'Geçerli bir süre belirt!');
                        return;
                    }
                    if (timing < ms('30s') || ms('1y') < timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'En fazla 1 yıl veya en az 30 saniye girebilirsin.');
                        return;
                    }

                    banUser(client, message, user, member, guildData, timing, reason, false, question);
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                    });
                }
                return;
            }

            collected.deferUpdate();

            const reason = reasons.find((r) => r.value === collected.values[0]);
            if (reason.needType === NeedFlags.Image) {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            'Kanıt için ekran görüntüsünü atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.',
                        ),
                    ],
                    components: [],
                });
                const filter = (msg: Message) => msg.author.id === message.author.id && msg.attachments.size > 0;
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const attachment = collected.first().attachments.first().proxyURL;
                    banUser(
                        client,
                        message,
                        user,
                        member,
                        guildData,
                        reason.time,
                        reason.name,
                        false,
                        question,
                        attachment,
                    );
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                    });
                }
                return;
            }

            if (reason.needType === NeedFlags.User) {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            "Kullanıcının ID'sini atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.",
                        ),
                    ],
                    components: [],
                });
                const filter = async (msg: Message) => {
                    if (msg.author.id !== message.author.id) return false;
                    return !!(await client.utils.getUser(msg.content));
                };
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const user = await client.utils.getUser(collected.first().content);
                    banUser(
                        client,
                        message,
                        user,
                        member,
                        guildData,
                        reason.time,
                        `${reason.name}\nHesap: ${user.username} (${user.id})`,
                        false,
                        question,
                    );
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                    });
                }
                return;
            }

            banUser(client, message, user, member, guildData, reason.time, reason.name, false, question);
        } else {
            question.edit({
                embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
            });
        }
    },
};

export default Command;

export async function banUser(
    client: Client,
    message: Message,
    user: User,
    member: GuildMember,
    guildData: ModerationClass,
    timing: number,
    reason: string,
    system: boolean = false,
    question: Message,
    image?: string,
) {
    const roles = member
        ? member.roles.cache.filter((r) => !r.managed && r.id !== message.guildId).map((r) => r.id)
        : [];
    if (member && guildData.underworldRole && message.guild.roles.cache.has(guildData.underworldRole)) {
        if (member.voice.channelId) member.voice.disconnect();
        client.utils.setRoles(member, guildData.underworldRole);
    } else if (!guildData.underworldRole)
        message.guild.members.ban(user.id, { reason: `${message.author.username}: ${reason}` });

    const now = Date.now();
    const newID = (await PenalModel.countDocuments({ guild: message.guildId })) + 1;
    const penal = await PenalModel.create({
        id: newID,
        guild: message.guildId,
        admin: message.author.id,
        user: user.id,
        type: PenalFlags.Ban,
        reason: reason,
        finish: now + timing,
        start: now,
        roles,
    });

    await client.utils.sendLog({
        guild: message.guild,
        channel: 'quarantine-log',
        penal,
        user: user,
        admin: message.author,
        attachment: image,
    });

    question.edit({
        content: '',
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${user} (${inlineCode(user.id)}) adlı kullanıcı ${
                    system ? reason : `"${bold(reason)}" sebebiyle`
                } ${time(Math.floor(penal.finish / 1000), 'R')} karantina cezası aldı. (Ceza Numarası: ${inlineCode(
                    `#${newID}`,
                )})`,
                thumbnail: {
                    url: 'https://cdn.discordapp.com/attachments/839954721187037184/848339514052706344/can.gif',
                },
            }),
        ],
        components: [],
    });
}
