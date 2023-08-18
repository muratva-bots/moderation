import {
    Message,
    ActionRowBuilder,
    Team,
    ButtonBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonStyle,
    bold,
    ButtonInteraction,
    ComponentType,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['roleselect', 'role-select'],
    description: 'Rol seçme mesajını attırırsınız.',
    examples: ['roleselect <menüden işlem seçin>'],
    checkPermission: ({ client, message }) => {
        return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);

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
                    custom_id: 'giveaway',
                    label: 'Etkinlik/Çekiliş Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'relation',
                    label: 'İlişki Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'game',
                    label: 'Oyun Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'color',
                    label: 'Renk Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'zodiac',
                    label: 'Burç Mesajı',
                    style: ButtonStyle.Primary,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [embed.setDescription('Hangi rol alma sistemini istiyorsanız o butona basmanız yeterli!')],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'giveaway') {
                const row = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'event-role',
                            emoji: '🎉',
                            label: 'Etkinlik Katılımcısı',
                            style: ButtonStyle.Success,
                        }),
                        new ButtonBuilder({
                            custom_id: 'giveaway-role',
                            emoji: '🎁',
                            label: 'Çekiliş Katılımcısı',
                            style: ButtonStyle.Success,
                        }),
                    ],
                });
                message.channel.send({
                    content: [
                        `Merhaba ${bold(message.guild.name)} üyeleri,`,
                        `Çekiliş katılımcısı alarak ${client.utils.getEmoji("spotify")}, ${client.utils.getEmoji("netflix")}, ${client.utils.getEmoji("nitroboost")}, ${client.utils.getEmoji("exxen")} gibi çeşitli ödüllerin sahibi olabilirsiniz.`,
                        `Etkinlik katılımcısı alarak çeşitli etkinliklerin yapıldığı anlarda herkesten önce haberdar olabilirsiniz ve çekilişlere önceden katılma hakkı kazanabilirsiniz.`,

                        `Aşağıda ki butonlara basarak siz de bu ödülleri kazanmaya hemen başlayabilirsiniz!`,
                    ].join('\n'),
                    components: [row],
                });
            }

            if (i.customId === 'relation') {
                menuCreate(message, 'İlişki rollerini seçmek için tıkla!', 'love-roles', guildData.loveRoles);
            }
            if (i.customId === 'game') {
                menuCreate(message, 'Oyun rollerini seçmek için tıkla!', 'game-roles', guildData.gameRoles);
            }
            if (i.customId === 'color') {
                menuCreate(message, 'Renk rollerini seçmek için tıkla!', 'color-roles', guildData.colorRoles);
            }
            if (i.customId === 'zodiac') {
                menuCreate(message, 'Burç rollerini seçmek için tıkla!', 'zodiac-roles', guildData.zodiacRoles);
            }
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

async function menuCreate(message: Message, placeholder: string, customId: string, options: string[]) {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: customId,
                placeholder: placeholder,
                options: options.map((rol) => ({
                    label: message.guild.roles.cache.get(rol).name,
                    value: rol,
                })),
            }),
        ],
    });
    await message.channel.send({ components: [row] });
}
