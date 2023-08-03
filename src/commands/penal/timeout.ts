import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { bold, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['timeout'],
    description: 'Sunucuda kurallara uymayan bir kullanıcıyı 1 saatliğine uzaklaştırır.',
    examples: ['timeout @kullanıcı', 'timeout 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
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

        member.timeout(1000 * 60 * 60);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(
                        '1 saatliğine',
                    )} uzaklaştırıldı.`,
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
