import { EmbedBuilder, inlineCode, PermissionFlagsBits } from 'discord.js';

const types: Object = {
    mobile: '📱 Telefon',
    desktop: '💻 Masaüstü Uygulama',
    web: '🌏 İnternet Tarayıcısı',
};

const Command: Moderation.ICommand = {
    usages: ['cihaz', 'device'],
    description: 'Belirtilen kullanıcının cihaz bilgilerini görüntülersiniz.',
    examples: ['cihaz @kullanıcı', 'cihaz 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ViewAuditLog) ||
        (guildData.minStaffRole && message.member.roles.cache.has(guildData.minStaffRole)),
            execute: async ({ client, message, args }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            (message.member.voice.channelId ? message.member.voice.channel : undefined);
        if (channel && channel.isVoiceBased()) {
            const members: string[] = [];
            channel.members.forEach((member) => {
                let device = 'Bulunamadı.';
                if (member.presence?.status !== 'offline') {
                    device = Object.keys(member.presence?.clientStatus || {})
                        .map((type) => types[type])
                        .join(' | ');
                }
                members.push(`${member} (${inlineCode(member.id)}): ${device}`);
            });

            const texts = client.utils.splitMessage(members.join('\n'), { maxLength: 2000, char: '\n' });
            for (const newText of texts)
                message.channel.send({
                    embeds: [
                        embed.setDescription(
                            newText || 'Seste kimse bulunmadığı için cihaz bilgilerini gösteremiyorum.',
                        ),
                    ],
                });
            return;
        }

        const member =
            message.mentions.members!.first() ||
            message.guild.members.cache.get(args[0]) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı veya kanal belirt!');
            return;
        }

        if (member.user.bot) {
            client.utils.sendTimedMessage(message, `${member} (${inlineCode(member.id)}) bir bot olamaz!`);
            return;
        }

        if (member.presence?.status == 'offline') {
            client.utils.sendTimedMessage(
                message,
                `${member} (${inlineCode(member.id)}) kullanıcısının cihaz bilgisi bulunamadı.`,
            );
            return;
        }

        message.channel.send({
            embeds: [
                embed.setDescription(
                    `${member} (${inlineCode(member.id)}) kullanıcısının kullandığı cihaz: ${inlineCode(
                        Object.keys(member.presence?.clientStatus || {})
                            .map((type) => types[type])
                            .join(' | '),
                    )}`,
                ),
            ],
        });
    },
};

export default Command;
