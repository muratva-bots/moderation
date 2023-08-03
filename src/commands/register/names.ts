import { UserModel } from '@/models';
import {
    EmbedBuilder,
    inlineCode,
    bold,
    PermissionFlagsBits,
    roleMention,
    time,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    ComponentType,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['isimler'],
    description: 'Belirtilen kullanıcının geçmiş isimlerini görüntülersiniz.',
    examples: ['isimler @kullanıcı', 'isimler 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
    execute: async ({ client, message, args, guildData }) => {
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
                .slice(0, 10)
                .map((n) =>
                    [
                        inlineCode(`•`),
                        `${time(Math.floor(n.time / 1000), 'D')}:`,
                        n.name ? n.name : undefined,
                        n.role ? roleMention(n.role) : undefined,
                        n.role ? bold(`(${n.type})`) : bold(n.type),
                    ]
                        .filter(Boolean)
                        .join(' '),
                )
                .join('\n'),
            footer: {
                text: `${document.names.length} adet isim kayıdı bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.voiceLogs.length > 10 ? [paginationButtons(page, totalData)] : [],
        });

        if (10 >= document.voiceLogs.length) return;

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
                            .slice(page === 1 ? 0 : page * 10 - 10, page * 10)
                            .map((n) =>
                                [
                                    inlineCode(`•`),
                                    `${time(Math.floor(n.time / 1000), 'D')}:`,
                                    n.name ? n.name : undefined,
                                    n.role ? roleMention(n.role) : undefined,
                                    n.role ? bold(`(${n.type})`) : bold(n.type),
                                ]
                                    .filter(Boolean)
                                    .join(' '),
                            )
                            .join('\n'),
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
