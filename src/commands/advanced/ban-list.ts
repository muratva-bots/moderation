import { PermissionFlagsBits, codeBlock, inlineCode } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['ban-list', 'banlist', 'banliste', 'ban-liste'],
    description: 'Sunucudan yasaklanmış kişilerin tam listesini görürsünüz.',
    examples: ['banlist'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.BanMembers) ||
        (guildData.banAuth && guildData.banAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message }) => {
        const bans = await message.guild.bans.fetch();

        const text = bans
            .map((ban) => `${ban.user} (${inlineCode(ban.user.id)}): ${ban.reason || 'Sebep belirtilmemiş.'}`)
            .join('\n');
        const [firstContent, ...arr] = client.utils.splitMessage(text, { maxLength: 2000, char: '\n' });
        message.channel.send({
            content: [
                codeBlock(
                    `Sunucumuzda toplam ${bans.size} yasaklı kullanıcı bulunmakta. Kişilerin ban nedenlerini öğrenmek icin ${client.config.PREFIXES[0]}banbilgi <id> komutunu kullanabilirsin.`,
                ),
                firstContent,
            ].join('\n'),
        });
        for (const newText of arr) message.channel.send({ content: newText });
    },
};

export default Command;
