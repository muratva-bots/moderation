import { EmbedBuilder, PermissionFlagsBits, roleMention } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['süpheli', 'şüpheli', 'suphe', 'şüphe'],
    description: 'Belirttiğiniz kullanıcı şüpheli hesapsa şüpheli rolü verir.',
    examples: ['şüpheli @kullanıcı', 'şüpheli 123456789123456789'],
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some(r => message.member.roles.cache.has(r))), 
    execute: async ({ client, message, args, guildData }) => {
        if (
            !guildData.unregisterRoles ||
            !guildData.unregisterRoles.length ||
            !guildData.unregisterRoles.some((i) => message.guild.roles.cache.has(i))
        ) {
            client.utils.sendTimedMessage(message, 'Kayıtsız rolü ayarlanmamış.');
            return;
        }

        if (!guildData.suspectedRole || !message.guild.roles.cache.has(guildData.suspectedRole)) {
            client.utils.sendTimedMessage(message, 'Şüpheli rolü ayarlanmamış');
            return;
        }

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

        if (client.utils.checkUser(message, member)) return;

        if (!guildData.unregisterRoles.some((i) => member.roles.cache.has(i))) {
            client.utils.sendTimedMessage(
                message,
                'Sadece rolü olmayan veya kayıtsız rolü olanlar üzerinde bu komutu deneyebilirsin!',
            );
            return;
        }

        if (Date.now() - member.user.createdTimestamp >= 1000 * 60 * 60 * 24 * 7) {
            client.utils.sendTimedMessage(message, 'Bu kullanıcı şüpheli bir hesap değil!');
            return;
        }

        client.utils.setRoles(member, guildData.suspectedRole);

        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} kullanıcısı şüpheli hesap olduğu için ${roleMention(guildData.suspectedRole)} verildi!`,
                ),
            ],
        });
    },
};

export default Command;
