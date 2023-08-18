import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['untimeout'],
    description: 'Sunucudan uzaklaştırılmış bir kullanıcının uzaklaştırılmasını kaldırır.',
    examples: ['untimeout 123456789123456789', 'untimeout @kullanıcı'],
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    (guildData.jailAuth && guildData.jailAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
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

        member.timeout(null);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcının uzaklaştırılması kaldırıldı.`,
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                }),
            ],
        });
    },
};

export default Command;
