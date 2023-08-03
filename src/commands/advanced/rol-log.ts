import { RoleLogFlags } from '@/enums';
import { UserModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    VoiceChannel,
    codeBlock,
} from 'discord.js';

const types = {
    [RoleLogFlags.Add]: 'Ekleme (Komut)',
    [RoleLogFlags.AddAdmin]: 'Ekleme (Sağ Tık)',
    [RoleLogFlags.Remove]: 'Çıkarma (Komut)',
    [RoleLogFlags.RemoveAdmin]: 'Çıkarma (Sağ Tık)',
};

const Command: Moderation.ICommand = {
    usages: ['rollog', 'rol-log'],
    description: 'Belirttiğiniz üyenin tüm rol log verilerini görüntülersiniz.',
    examples: ['rollog @kullanıcı', 'rollog 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ViewAuditLog),
    execute: async ({ client, message, args }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const document = await UserModel.findOne({ id: user.id, guild: message.guildId });
        if (!document || !document.roleLogs.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmamaktadır.');
            return;
        }

        let page = 1;
        const totalData = Math.ceil(document.roleLogs.length / 5);

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: document.roleLogs
                .slice(0, 5)
                .map((d) => {
                    const roles = d.roles
                        .filter((r) => message.guild.roles.cache.has(r))
                        .map((r) => message.guild.roles.cache.get(r).name);
                    const user = client.users.cache.get(d.admin);
                    return codeBlock(
                        'fix',
                        [
                            `${roles.length === 1 ? 'Rol' : 'Roller'}: ${roles.join(', ')}`,
                            `İşlem: ${types[d.type]}`,
                            d.admin
                                ? user
                                    ? `Yetkili: ${user.username} (${user.id})`
                                    : `Yetkili: ${d.admin}`
                                : undefined,
                            `Tarih: ${new Date().toLocaleString('tr-TR', {
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
                .join(''),
            footer: {
                text: `${document.roleLogs.length} adet rol güncellemesi bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.roleLogs.length > 5 ? [paginationButtons(page, totalData)] : [],
        });

        if (5 >= document.roleLogs.length) return;

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
            // murat tasarım yapamıyorken
            question.edit({
                embeds: [
                    embed.setDescription(
                        document.roleLogs
                            .slice(page === 1 ? 0 : page * 5 - 5, page * 5)
                            .map((d) => {
                                const roles = d.roles
                                    .filter((r) => message.guild.roles.cache.has(r))
                                    .map((r) => message.guild.roles.cache.get(r).name);
                                const user = client.users.cache.get(d.admin);
                                return codeBlock(
                                    'fix',
                                    [
                                        `${roles.length === 1 ? 'Rol' : 'Roller'}: ${roles.join(', ')}`,
                                        `İşlem: ${types[d.type]}`,
                                        d.admin
                                            ? user
                                                ? `Yetkili: ${user.username} (${user.id})`
                                                : `Yetkili: ${d.admin}`
                                            : undefined,
                                        `Tarih: ${new Date().toLocaleString('tr-TR', {
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
                            .join(''),
                    ),
                ],
                components: [paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                const row = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'button-end',
                            label: 'Mesajın Geçerlilik Süresi Doldu.',
                            emoji: { name: '⏱️' },
                            style: ButtonStyle.Danger,
                            disabled: true,
                        }),
                    ],
                });

                question.edit({ components: [row] });
            }
        });
    },
};

export default Command;

function paginationButtons(page: number, totalData: number) {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'first',
                emoji: {
                    id: '1070037431690211359',
                },
                style: ButtonStyle.Secondary,
                disabled: page === 1,
            }),
            new ButtonBuilder({
                custom_id: 'previous',
                emoji: {
                    id: '1061272577332498442',
                },
                style: ButtonStyle.Secondary,
                disabled: page === 1,
            }),
            new ButtonBuilder({
                custom_id: 'count',
                label: `${page}/${totalData}`,
                style: ButtonStyle.Secondary,
                disabled: true,
            }),
            new ButtonBuilder({
                custom_id: 'next',
                emoji: {
                    id: '1061272499670745229',
                },
                style: ButtonStyle.Secondary,
                disabled: totalData === page,
            }),
            new ButtonBuilder({
                custom_id: 'last',
                emoji: {
                    id: '1070037622820458617',
                },
                style: ButtonStyle.Secondary,
                disabled: page === totalData,
            }),
        ],
    });
}
