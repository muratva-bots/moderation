import {
    EmbedBuilder,
    bold,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    inlineCode,
    ButtonInteraction,
    ComponentType,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['allvm', 'allmute', 'herkesisustur', 'hsustur', 'muteall'],
    description: 'Ses kanalındaki bulunan tüm kullanıcılara mute atar/açarsınız.',
    examples: ['allmute <işlem seçin>'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.MuteMembers),
    execute: async ({ client, message }) => {
        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalında bulunman gerekiyor.');
            return;
        }

        const channel = message.member.voice.channel;
        if (3 >= channel.members.size) {
            client.utils.sendTimedMessage(
                message,
                "Kanalda bulunan kullanıcı sayısı 3'ten az olduğu için işlem iptal edildi!",
            );
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'mute',
                    emoji: { id: '1133142520818311350' },
                    label: 'Herkesi Sustur',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'unmute',
                    emoji: { id: '1133142999715549317' },
                    label: 'Susturmayı Kaldır',
                    style: ButtonStyle.Secondary,
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
            embeds: [
                embed.setDescription(
                    `${channel} ${inlineCode(channel.id)} adlı kanalda sesteki kullanıcılara yapacağınız işlemi seçin.`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });
        if (collected) {
            collected.deferUpdate();

            const request = collected.customId === 'mute';
            message.member.voice.channel.members
                .filter((m) => m.id !== message.member.id && m.voice && m.voice.serverMute !== request)
                .forEach((m) => m.voice.setMute(request));

            message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${message.member.voice.channel} adlı kanaldaki herkesin konuşması ${bold(
                            request
                                ? `kapatıldı ${client.utils.getEmoji('voicemute')}`
                                : `açıldı ${client.utils.getEmoji('voice')}`,
                        )}.`,
                    ),
                ],
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
