import { ChannelType, PermissionFlagsBits, Team, inlineCode } from 'discord.js';

const logChannelNames = [
    'guard-log',
    'role-log',
    'voice-mute-log',
    'chat-mute-log',
    'quarantine-log',
    'ban-log',
    'meeting-log',
    'unregistered-log',
    'register-log',
    'ads-log',
    'penal-log',
    'staff-tag-log',
    'tag-log',
    'banned-tag-log',
    'unfinished-penals',
    'message-log',
    'voice-log',
    'staff-logs',
    'auto-downgrade-staff',
    'guard-yt'
];

const Command: Moderation.ICommand = {
    usages: ['logscreate', 'logoluştur', 'logkur'],
    description: 'Geliştirici komutu.',
    examples: ['logkur'],
    checkPermission: ({ client, message }) => {
        return client.config.BOT_OWNERS.includes(message.author.id);

    },
    execute: async ({ message }) => {
        const logParent = await message.guild.channels.create({
            name: `${message.guild.name} Logs`,
            type: ChannelType.GuildCategory,
            position: message.guild.channels.cache.size + 1,
            permissionOverwrites: [
                {
                    id: message.guild.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
            ],
        });
        for (const logChannelName of logChannelNames) {
            const logChannel = await message.guild.channels.create({
                name: logChannelName,
                type: ChannelType.GuildText,
            });
            await logChannel.setParent(logParent.id, { lockPermissions: true });

            message.channel.send(`${logChannel} (${inlineCode(logChannel.id)}) oluşturuldu!`);
        }
    },
};

export default Command;
