import { NameFlags } from '@/enums';
import { UserModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    codeBlock,
} from 'discord.js';

const titles = {
    [NameFlags.Register]: 'Kayıt Olma',
    [NameFlags.ChangeGender]: 'Yanlış Cinsiyet Kaydı',
    [NameFlags.Unregister]: 'Kayıtsıza Atılma',
    [NameFlags.ChangeName]: 'İsim Değiştirme (Yetkili)',
    [NameFlags.BoosterChangeName]: 'İsim Değiştirme (Boost)',
    [NameFlags.BoostFinish]: 'Nitrosu Bitti',
    [NameFlags.ManuelBoostFinish]: 'Boostu Çekti',
    [NameFlags.AutoRegister]: 'Oto Kayıt',
    [NameFlags.Kick]: 'Sunucudan Atıldı',
    [NameFlags.Leave]: 'Sunucudan Çıktı',
};

const Command: Moderation.ICommand = {
    usages: ['isimler'],
    description: 'Belirtilen kullanıcının geçmiş isimlerini görüntülersiniz.',
    examples: ['isimler @kullanıcı', 'isimler 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const user =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        const document = await UserModel.findOne({ id: user.id, guild: message.guild.id });
        if (!document || !document.names.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        let page = 1;
        const totalData = Math.ceil(document.voiceLogs.length / 10);

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: document.names
                .slice(0, 5)
                .map((n) => {
                    const user = client.users.cache.get(n.admin);
                    return codeBlock(
                        'fix',
                        [
                            n.role ? message.guild.roles.cache.get(n.role)?.name || '@silinmiş' : undefined,
                            `İşlem: ${n.type}`,
                            `İsim: ${n.name || 'Bulunamadı'}`,
                            n.admin || n.admin !== user.id
                                ? user
                                    ? `Yetkili: ${user.username} (${user.id})`
                                    : `Yetkili: ${n.admin}`
                                : undefined,
                            `Tarih: ${new Date(n.time).toLocaleString('tr-TR', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                            })}`,
                        ]
                            .filter(Boolean)
                            .join('\n'),
                    );
                })
                .join('\n'),
            footer: {
                text: `${document.names.length} adet isim kayıdı bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.voiceLogs.length > 5 ? [client.utils.paginationButtons(page, totalData)] : [],
        });

        if (5 > document.voiceLogs.length) return;

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            question.edit({
                embeds: [
                    embed.setDescription(
                        document.names
                            .slice(page === 1 ? 0 : page * 5 - 5, page * 5)
                            .map((n) => {
                                const user = client.users.cache.get(n.admin);
                                return codeBlock(
                                    'fix',
                                    [
                                        n.role ? message.guild.roles.cache.get(n.role)?.name || '@silinmiş' : undefined,
                                        `İşlem: ${titles[n.type]}`,
                                        `İsim: ${n.name}`,
                                        n.admin || n.admin !== user.id
                                            ? user
                                                ? `Yetkili: ${user.username} (${user.id})`
                                                : `Yetkili: ${n.admin}`
                                            : undefined,
                                        `Tarih: ${new Date(n.time).toLocaleString('tr-TR', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            year: 'numeric',
                                            hour12: false,
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}`,
                                    ]
                                        .filter(Boolean)
                                        .join('\n'),
                                );
                            })
                            .join('\n'),
                    ),
                ],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
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

                question.edit({ components: [timeFinished] });
            }
        });
    },
};

export default Command;
