import { ModerationClass, UserModel } from '@/models';
import {
    EmbedBuilder,
    inlineCode,
    TextChannel,
    bold,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    GuildMember,
    Message,
    time,
    roleMention,
    ButtonInteraction,
    ComponentType,
} from 'discord.js';
import { quarantineUser } from '../penal/quarantine';
import { NameFlags } from '@/enums';

const titles = {
    [NameFlags.Register]: "Kayıt Olma",
    [NameFlags.ChangeGender]: "Yanlış Cinsiyet Kaydı",
    [NameFlags.Unregister]: "Kayıtsıza Atılma",
    [NameFlags.ChangeName]: "İsim Değiştirme (Yetkili)",
    [NameFlags.BoosterChangeName]: "İsim Değiştirme (Boost)",
    [NameFlags.BoostFinish]: "Nitrosu Bitti",
    [NameFlags.ManuelBoostFinish]: "Boostu Çekti",
    [NameFlags.AutoRegister]: "Oto Kayıt",
    [NameFlags.Kick]: "Sunucudan Atıldı",
    [NameFlags.Leave]: "Sunucudan Çıktı"
};

const Command: Moderation.ICommand = {
    usages: ['register', 'woman', 'kız', 'kadın', 'bayan', 'k'],
    description: 'Belirttiğiniz üyeyi kadın olarak kayıt edersiniz.',
    examples: ['k @kullanıcı isim yaş', 'k 123456789123456789 isim yaş'],
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some(r => message.member.roles.cache.has(r))), 
    execute: async ({ client, message, args, guildData }) => {
        if (!guildData.menuRegister) return;

        if (guildData.registerSystem == false) {
            message.channel.send({
                content: `🔒 Kayıtlar bir yönetici tarafından __geçici bir süreliğine kapatılmıştır.__ Lütfen bu süreçte beklemede kalın. Anlayışla karşıladığınız için teşekkürler!`,
            });
            return;
        }
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (
            ((!guildData.manRoles ||
                !guildData.manRoles.length ||
                !guildData.manRoles.some((r) => message.guild.roles.cache.has(r))) &&
                (!guildData.womanRoles ||
                    !guildData.womanRoles.length ||
                    !guildData.womanRoles.some((r) => message.guild.roles.cache.has(r)))) ||
            (guildData.registeredRole && !message.guild.roles.cache.has(guildData.registeredRole))
        ) {
            message.channel.send('Rol ayarı yapılmamış.');
            return;
        }

        if (
            [...(guildData.manRoles || []), ...(guildData.womanRoles || []), guildData.registeredRole].some((role) =>
                member.roles.cache.has(role),
            )
        ) {
            if ([...guildData.manRoles].some((r) => member.roles.cache.has(r))) {
                const document =
                    (await UserModel.findOne({ id: member.id, guild: message.guildId })) ||
                    new UserModel({ id: member.id, guild: message.guildId });
                const lastName = document.names[document.names.length - 1];
                document.names.push({
                    admin: message.author.id,
                    time: Date.now(),
                    type: NameFlags.ChangeGender,
                    name: lastName ? lastName.name : member.displayName,
                    role: guildData.womanRoles[0],
                });
                document.save();

                await member.roles.remove(guildData.manRoles);
                await member.roles.add(guildData.womanRoles);

                message.channel.send({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            description: `${member} (${inlineCode(
                                member.id,
                            )}) adlı kullanıcıya kadın rolü verildi ve erkek rolü alındı.`,
                        }),
                    ],
                });
                return;
            }

            client.utils.sendTimedMessage(message, 'Kayıtlı olmayan geçerli birini belirtmelisin.');
            return;
        }

        if (client.utils.checkUser(message, member)) return;

        const tags = guildData.tags || [];
        const hasTag = tags.some((t) => member.user.displayName.includes(t));

        let name;
        if (guildData.needName) {
            args = args.splice(reference ? 0 : 1);
            name = args
                .filter((arg) => isNaN(parseInt(arg)))
                .map((arg) => arg[0].toUpperCase() + arg.slice(1).toLowerCase())
                .join(' ');
            if (!name || name.length > 15) {
                client.utils.sendTimedMessage(message, '15 karakteri geçmeyecek isim girmelisin.');
                return;
            }

            if (guildData.tags.length && guildData.secondTag) {
                name = `${hasTag ? guildData.tags[0] : guildData.secondTag} ${name}`;
            }
        }

        if (guildData.needName && guildData.needAge) {
            const age = args.filter((arg) => !isNaN(parseInt(arg)))[0] || undefined;
            if (!age || age.length > 2) {
                client.utils.sendTimedMessage(message, '2 karakteri geçmeyecek yaş girmelisin.');
                return;
            }

            const numAge = Number(age);
            if (guildData.minAge && guildData.minAge > numAge) {
                client.utils.sendTimedMessage(
                    message,
                    `Sunucuya ${inlineCode(guildData.minAge.toString())} yaşının altındaki üyeleri kaydedemezsin.`,
                );

                if (guildData.minAgePunish) {
                    quarantineUser(
                        client,
                        message,
                        member.user,
                        member,
                        guildData,
                        1000 * 60 * 60 * 24 * 365 * (guildData.minAge - numAge),
                        'sunucunun yaş sınırlarının altında bir üye',
                    );
                }
                return;
            }

            name = `${name} | ${age}`;
        }

        if (guildData.taggedMode) {
            if (
                guildData.tags.some((t) => !member.user.displayName.toLowerCase().includes(t.toLowerCase())) &&
                !member.premiumSince &&
                !member.roles.cache.has(guildData.vipRole)
            ) {
                client.utils.sendTimedMessage(
                    message,
                    `Şuanda taglı alımdayız kayıt olabilmen için tagımıza (${guildData.tags.join(
                        ', ',
                    )}) sahip olman veya boost basman gerekiyor!`,
                );
                return;
            }
        }

        if (
            !(guildData.womanRoles || []).some((r) => message.guild.roles.cache.has(r)) &&
            !(guildData.manRoles || []).some((r) => message.guild.roles.cache.has(r))
        ) {
            await register(member, message, guildData, name);
            await member.roles.remove(guildData.unregisterRoles);
            await member.roles.add([guildData.registeredRole]);
            if (message.guild.roles.cache.has(guildData.familyRole) && hasTag) member.roles.add(guildData.familyRole);

            message.channel.send({
                embeds: [
                    new EmbedBuilder({
                        description: `${member} üyesi başarıyla kayıt edildi.`,
                    }),
                ],
            });
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'man',
                    style: ButtonStyle.Secondary,
                    emoji: {
                        id: '1134923311449645107',
                    },
                }),
                new ButtonBuilder({
                    custom_id: 'woman',
                    style: ButtonStyle.Secondary,
                    emoji: {
                        id: '1134923336686776350',
                    },
                }),
            ],
        });

        const document =
            (await UserModel.findOne({ id: member.id, guild: message.guildId })) ||
            new UserModel({ id: member.id, guild: message.guildId });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description:
                document.names.length > 0
                    ? [
                          `Bu Kullanıcının Sunucudaki Eski İsimleri [ ${bold(document.names.length.toString())} ]`,
                          `${document.names
                              .slice(
                                  document.names.length ? document.names.length - 10 : 0,
                                  document.names.length ? document.names.length : 10,
                              )
                              .map((n) =>
                                  [
                                      inlineCode(`•`),
                                      `${time(Math.floor(n.time / 1000), 'D')}:`,
                                      n.name ? n.name : undefined,
                                      n.role ? roleMention(n.role) : undefined,
                                      n.role ? bold(`(${titles[n.type]})`) : bold(titles[n.type]),
                                  ]
                                      .filter(Boolean)
                                      .join(' '),
                              )
                              .join('\n')}`,
                      ].join('\n')
                    : name
                    ? `${member} kişisinin ismi "**${name}**" olarak değiştirildi.`
                    : 'Kullanıcının cinsiyetini belirleyin.',
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 3,
            componentType: ComponentType.Button,
        });
        if (collected) {
            let roles: string[];
            if (collected.customId === 'man')
                roles = (guildData.manRoles || []).filter((r) => message.guild.roles.cache.has(r));
            else roles = (guildData.womanRoles || []).filter((r) => message.guild.roles.cache.has(r));

            if (message.guild.roles.cache.has(guildData.familyRole) && hasTag) roles.push(guildData.familyRole);
            if (message.guild.roles.cache.has(guildData.registeredRole)) roles.push(guildData.registeredRole);
            if (roles.length) client.utils.setRoles(member, [...new Set(roles)]);

            if (name) member.setNickname(name);

            await UserModel.updateOne(
                { id: message.author.id },
                {
                    $inc: {
                        [`registers.${
                            [...(guildData.manRoles || []), ...(guildData.womanRoles || [])].some((r) =>
                                message.guild.roles.cache.has(r),
                            )
                                ? collected.customId === 'man'
                                    ? 'man'
                                    : 'woman'
                                : 'normal'
                        }`]: 1,
                    },
                },
                { upsert: true, setDefaultsOnInsert: true, strict: false },
            );

            question.edit({
                embeds: [
                    embed.setDescription(
                        `${member} üyesi başarıyla ${inlineCode(
                            collected.customId === 'man' ? 'erkek' : 'kadın',
                        )} olarak kayıt edildi.`,
                    ),
                ],
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

async function register(member: GuildMember, message: Message, guildData: ModerationClass, name?: string) {
    if (name) await member.setNickname(name);

    await UserModel.updateOne(
        { id: member.id, guild: message.guildId },
        {
            $push: {
                names: {
                    admin: message.author.id,
                    type: NameFlags.Register,
                    time: Date.now(),
                    role:
                        guildData.womanRoles && guildData.womanRoles.length
                            ? guildData.womanRoles[0]
                            : guildData.registeredRole,
                    name: name ? name : undefined,
                },
            },
        },
        { upsert: true },
    );

    const chatChannel = message.guild.channels.cache.find(
        (c) => c.isTextBased() && c.id === guildData.chatChannel,
    ) as TextChannel;
    if (chatChannel) {
        chatChannel
            .send({
                content: `${member} aramıza hoşgeldin, seninle beraber ${bold(
                    message.guild.memberCount.toString(),
                )} kişi olduk.`,
            })
            .then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    const registerLogChannel = message.guild.channels.cache.find((c) => c.id === 'register-log') as TextChannel;
    if (registerLogChannel) {
        registerLogChannel.send({
            content: `${member} (${inlineCode(member.id.toString())}) adlı kullanıcı ${message.author} (${inlineCode(
                message.author.id.toString(),
            )}) tarafından kayıt edildi.`,
        });
    }
}
