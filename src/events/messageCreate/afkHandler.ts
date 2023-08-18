import { Message, time, EmbedBuilder, bold, APIEmbedField, userMention } from 'discord.js';

import { Client } from '@/structures';

function afkHandler(client: Client, message: Message, prefix: string) {
    if ((prefix && message.content?.toLowerCase().startsWith(`${prefix}afk`)) || message.author.bot) return;

    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
    });

    const displayName = message.member.displayName;
    if (displayName.startsWith('[AFK]')) {
        message.member.setNickname(displayName.replace(/\[AFK\] ?/g, ''));
    }

    const authorAfk = client.afkUsers.get(message.author.id);
    if (authorAfk) {
        embed.setDescription(`${message.author}, artık ${bold('AFK')} olarak gözükmüyorsun`);
        if (authorAfk.mentions.length) {
            embed.addFields([
                {
                    name: 'Sen yokken seni etiketleyen kullanıcılar',
                    value: authorAfk.mentions.map((m) => `${userMention(m.user)} (${time(m.time)})`).join('\n'),
                },
            ]);
        }

        message.channel.send({ embeds: [embed] }).then((msg) => setTimeout(() => msg.delete(), 5000));
        client.afkUsers.delete(message.author.id);
        return;
    }

    const mentionedUsers = message.mentions.users.filter((user) => client.afkUsers.has(user.id));
    if (25 >= mentionedUsers.size && mentionedUsers.size) {
        const now = Math.floor(Date.now() / 1000);
        const fields: APIEmbedField[] = [];
        mentionedUsers.forEach((user) => {
            const afkData = client.afkUsers.get(user.id);
            const afkDurationFormatted = time(Math.floor(afkData.date / 1000), 'R');
            if (!afkData.mentions.some((m) => m.user === message.author.id))
                afkData.mentions.push({ user: message.author.id, time: now });

            fields.push({
                name: `${user.username}`,
                value: `Sebep: ${afkData.reason || 'Sebep belirtilmemiş.'}\n AFK Süresi: ${afkDurationFormatted}`,
                inline: false,
            });
        });

        message
            .reply({
                embeds: [
                    embed
                        .setDescription(null)
                        .setTitle(`Belirttiğin ${mentionedUsers.size > 1 ? 'Kullanıcılar' : 'Kullanıcı'} AFK!`)
                        .setFields(fields),
                ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 4000));
    }
}

export default afkHandler;
