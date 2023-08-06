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
    [RoleLogFlags.TagRemove]: 'Tagı Çıkardı',
    [RoleLogFlags.AnotherTagAdd]: 'Başka Sunucunun Tagını Aldı',
    [RoleLogFlags.BannedTagAdd]: 'Yasaklı Sunucu Tagı Aldı'
};

const Command: Moderation.ICommand = {
    usages: ['rollog', 'rol-log'],
    description: 'Belirttiğiniz üyenin tüm rol log verilerini görüntülersiniz.',
    examples: ['rollog @kullanıcı', 'rollog 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ViewAuditLog) ||
        (guildData.botCommandAuth && guildData.botCommandAuth.some(r => message.member.roles.cache.has(r))),
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
                            `Tarih: ${new Date(d.time).toLocaleString('tr-TR', {
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
            components: document.roleLogs.length > 5 ? [client.utils.paginationButtons(page, totalData)] : [],
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
                                        `Tarih: ${new Date(d.time).toLocaleString('tr-TR', {
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
