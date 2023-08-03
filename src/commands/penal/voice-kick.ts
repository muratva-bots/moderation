import { EmbedBuilder, PermissionFlagsBits, inlineCode } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['kes', 'voicekick', 'voice-kick', 'at', 'bağlantıkes'],
    description: 'Sesli kanalda olan kullanıcıyı sesten atarsınız.',
    examples: ['kes @kullanıcı', 'kes 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ViewAuditLog),
    execute: async ({ client, message, args, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (member.id === message.author.id) {
            client.utils.sendTimedMessage(message, 'Bu komutu kendi üzerinde kullanamazsın!');
            return;
        }

        if (!member.voice.channelId) {
            client.utils.sendTimedMessage(message, `Belirttiğin kullanıcı adlı kullanıcı seste bulunmuyor!`);
            return;
        }

        if (
            ![
                guildData.underworldRole,
                guildData.adsRole,
                guildData.quarantineRole,
                ...(guildData.unregisterRoles || []),
            ].some((role) => member.roles.cache.has(role))
        ) {
            client.utils.sendTimedMessage(message, 'Kayıtsız veya cezalı birini belirt!');
            return;
        }

        const minStaffRole = message.guild.roles.cache.get(guildData.minStaffRole);
        if (!minStaffRole) return message.channel.send('En alt yetkili rolü ayarlanmamış.');

        if (member.roles.highest.position >= minStaffRole.position) {
            client.utils.sendTimedMessage(message, 'Yetkililere işlem uygulayamazsın.');
            return;
        }

        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} kullanıcısı ${inlineCode(member.voice.channel.name)} ses kanalından çıkarıldı!`,
                ),
            ],
        });
        member.voice.disconnect();
    },
};

export default Command;
