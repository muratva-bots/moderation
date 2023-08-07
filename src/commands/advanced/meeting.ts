import { EmbedBuilder, PermissionFlagsBits, TextChannel, inlineCode, time } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['meeting', 'toplantı'],
    description: 'Toplantı başlatmanıza yarar.',
    examples: ['meeting'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (guildData.ownerRoles && guildData.ownerRoles.some((r) => message.member.roles.cache.has(r))),
    execute: ({ client, message, guildData }) => {
        if (!message.guild.roles.cache.has(guildData.meetingRole)) {
            client.utils.sendTimedMessage(message, 'Rol ayarlanmamış');
            return;
        }

        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalına katılıp kullanman lazım!');
            return;
        }

        const channel = message.member.voice.channel;
        if (guildData.meetingRole && message.guild.roles.cache.has(guildData.meetingRole)) {
            message.guild.members.cache
                .filter((member) => !channel.members.has(member.id) && member.roles.cache.has(guildData.meetingRole))
                .forEach((member) => member.roles.remove(guildData.meetingRole));
            channel.members
                .filter((member) => !member.user.bot && !member.roles.cache.has(guildData.meetingRole))
                .forEach((member) => member.roles.add(guildData.meetingRole));
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL({ forceStatic: true, size: 4096 }),
                    },
                    description: `${channel} odasındaki üyelere toplantıya katıldı rolü verildi. ${client.utils.getEmoji(
                        'greentick',
                    )}`,
                }),
            ],
        });

        const meetingLog = message.guild.channels.cache.find(
            (channel) => channel.name === 'meeting-log',
        ) as TextChannel;
        if (meetingLog) {
            const arr = client.utils.splitMessage(
                [
                    `${time(Math.floor(Date.now() / 1000), 'D')} tarihinde yapılan toplantıya ${inlineCode(
                        channel.members.size.toString(),
                    )} adet üye katıldı. Katılan üyeler;\n`,
                    channel.members.map((member) => `${member} (${inlineCode(member.id)})`).join('\n'),
                ].join('\n'),
                { maxLength: 2000, char: ',' },
            );
            for (const newText of arr) meetingLog.send({ content: newText });
        }
    },
};

export default Command;
