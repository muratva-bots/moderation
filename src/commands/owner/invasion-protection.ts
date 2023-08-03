import { GuildModel } from '@/models';
import {
    ActionRowBuilder,
    Team,
    ButtonStyle,
    ButtonBuilder,
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    codeBlock,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['invasion', 'otorol', 'oto-rol', 'istila'],
    description: 'İstila koruması (otorol) açar-kapatırsınız.',
    examples: ['istila <menüden işlem seçin>'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return message.guild.ownerId === message.author.id || ownerID === message.author.id;
    },
    execute: async ({ client, message, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true }),
            },
            footer: {
                text: client.config.STATUS,
            },
        });

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'invasion-open',
                    label: 'Aç',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'invasion-off',
                    label: 'Kapat',
                    style: ButtonStyle.Danger,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    [
                        `Sunucuya fake hesap istilası durumunda otorol otomatik olarak kapatılır. Tabii manuel olarak sende ayarlayabilirsin!`,
                        `${codeBlock(
                            'fix',
                            `# Otorol Sistemi şuan \n ${guildData.invasionProtection ? 'Açık' : 'Kapalı'}`,
                        )}`,
                    ].join('\n'),
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            const status = i.customId === 'invasion-open';
            i.reply({
                content: `Otorol sistemi ${
                    status
                        ? 'açıldı, artık yeni gelen üyelere rol verilecek'
                        : 'kapatıldı, artık yeni gelen üyelere rol verilmeyecek'
                }`,
            });
            await GuildModel.updateOne({ id: message.guildId }, { $set: { 'moderation.invasionProtection': status } });
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
