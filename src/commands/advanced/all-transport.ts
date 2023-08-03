import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    PermissionFlagsBits,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['toplutaşı', 'alltransport', 'toplu-taşı', 'all-transport', 'ttaşı', 'ttasi'],
    description: 'Bulunduğunuz ses kanalındaki tüm üyeleri başka bir ses kanalına taşımanızı sağlar.',
    examples: ['toplutaşı <kanal seçin>'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.MoveMembers),
    execute: async ({ client, message }) => {
        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalına katılıp kullanman lazım!');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const memberVoiceChannel = message.member.voice.channel;
        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'menu',
                    placeholder: 'Kanal ara..',
                    channel_types: [ChannelType.GuildVoice],
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${memberVoiceChannel} kanalında bulunan ${inlineCode(
                        memberVoiceChannel.members.size.toString(),
                    )} adet üyenin taşınacağı kanalı seç.`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ChannelSelectMenuInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.ChannelSelect,
        });

        if (collected) {
            const channel = message.guild.channels.cache.get(collected.values[0]);
            message.member.voice.channel.members.forEach((b) => b.voice.setChannel(channel.id));

            question.edit({
                embeds: [
                    embed.setDescription(
                        `${client.utils.getEmoji(
                            'greentick',
                        )} ${memberVoiceChannel} kanalında bulunan üyeler ${channel} adlı kanala taşındı.`,
                    ),
                ],
                components: [],
            });
        } else {
            question.edit({
                embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                components: [],
            });
        }
    },
};

export default Command;
