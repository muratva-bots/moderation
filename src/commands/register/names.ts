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
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some(r => message.member.roles.cache.has(r))), 
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
            components: document.voiceLogs.length > 10 ? [client.utils.paginationButtons(page, totalData)] : [],
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
