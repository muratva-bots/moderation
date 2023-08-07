import { ChannelType, EmbedBuilder, PermissionFlagsBits, inlineCode } from 'discord.js';
const Command: Moderation.ICommand = {
    usages: ['dağıt', 'dagit'],
    description: 'Bulunduğunuz ses kanalındaki üyeleri public odalara dağıtmaya yarar.',
    examples: ['dagit'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (guildData.ownerRoles && guildData.ownerRoles.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Önce bir ses kanalına bağlanman gerekiyor!');
            return;
        }

        const publicRooms = message.guild.channels.cache.filter(
            (c) =>
                c.parentId === guildData.publicParent &&
                c.id !== guildData.afkRoom &&
                c.type === ChannelType.GuildVoice,
        );
        [...message.member.voice.channel.members.values()].forEach((m, index) => {
            setTimeout(() => {
                if (m.voice.channelId !== message.member.voice.channelId) return;
                m.voice.setChannel(publicRooms.random().id);
            }, index * 1000);
        });

        message.channel.send({
            embeds: [
                embed.setDescription(
                    `${inlineCode(
                        message.member.voice.channel.name,
                    )} kanalındaki kullanıcılar başarıyla public kanallara dağıtılmaya başlandı.`,
                ),
            ],
        });
    },
};

export default Command;
