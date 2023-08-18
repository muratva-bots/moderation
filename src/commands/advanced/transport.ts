import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['taşı', 'transport'],
    description: 'Bir kullanıcıyı bir ses kanalından diğerine taşır.',
    examples: ['taşı @kullanıcı <menüden kanal seçin>', 'taşı 123456789123456789 <menüden kanal seçin>'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.MoveMembers) ||
        (guildData.moveAuth && guildData.moveAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli birini belirt.');
            return;
        }

        if (!member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalında bulunması gerekiyor.');
            return;
        }

        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'menu',
                    placeholder: 'Kanal ara..',
                    channel_types: [ChannelType.GuildVoice],
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

        const question = await message.channel.send({
            embeds: [embed.setDescription(`${member} adlı kullanıcının taşınacağı kanalı seç.`)],
            components: [row],
        });

        const filter = (i: ChannelSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.ChannelSelect,
        });

        collector.on("collect", async(i: ChannelSelectMenuInteraction) => {
            const channel = message.guild.channels.cache.get(i.values[0]);
            if (!channel.permissionsFor(message.member).has(PermissionFlagsBits.Connect)) {
                question.edit({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            description: 'Kanala katılma iznin olmadığından işlem iptal edildi.',
                        }),
                    ],
                    components: [],
                });
                return;
            }

            if (member.voice.channelId) member.voice.setChannel(channel.id);

            question.edit({
                embeds: [
                    new EmbedBuilder({
                        color: client.utils.getRandomColor(),
                        description: `${member} adlı kullanıcı ${channel} adlı kanala taşındı.`,
                    }),
                ],
                components: [],
            });
        })


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

                question.edit({ embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                components: [timeFinished] });
            }
        })
    },
};

export default Command;
