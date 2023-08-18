import { EmbedBuilder, TextChannel, bold, PermissionFlagsBits, inlineCode } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['clear', 'sil', 'temizle'],
    description: 'Kanalda belirtilen sayıda mesaj siler. (Dilerseniz spesifik bir kullanıcı da belirtebilirsiniz)',
    examples: ['sil @kullanıcı 10', 'sil 10'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        (guildData.jailAuth && guildData.jailAuth.some((r) => message.member.roles.cache.has(r))),
        execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getUser(args[0])) || reference;
        const count = parseInt(args[reference ? 0 : user ? 1 : 0]);
        if (!count || count < 1) {
            client.utils.sendTimedMessage(message, 'Lütfen silmek için değer belirt.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL(),
            },
            description: `Mesajlar siliniyor ${client.utils.getEmoji('loading')}`,
        });

        const firstMessages = await message.channel.messages.fetch({ limit: count >= 100 ? 100 : count });
        const deleteMessages: string[] = user
            ? [...firstMessages.values()].filter((msg) => msg.author.id === user.id).map((m) => m.id)
            : [...firstMessages.keys()];
        if (!deleteMessages.filter((m) => m !== message.id).length) {
            client.utils.sendTimedMessage(
                message,
                user
                    ? `${user} (${inlineCode(user.id)}) adlı kullanıcının mesajı bulunmuyor.`
                    : 'Kanalda mesaj bulunmuyor.',
            );
            return;
        }

        const loadingMessage = await message.channel.send({ embeds: [embed] });

        let remaining = count - (count >= 100 ? 100 : count);
        while (remaining > 0) {
            const messages = await message.channel.messages.fetch({
                limit: remaining >= 100 ? 100 : remaining,
                before: firstMessages.last()!.id,
            });

            const filteredMessages = user
                ? [...messages.values()].filter((msg) => msg.author.id === user.id).map((m) => m.id)
                : [...messages.keys()];
            if (!filteredMessages.length) break;

            deleteMessages.push(...filteredMessages);
        }

        const deletedMessages = await (message.channel as TextChannel).bulkDelete(deleteMessages, true);
        if (loadingMessage.deletable) loadingMessage.delete();
        message.channel.send({
            embeds: [
                embed.setDescription(
                    `Başarıyla ${bold(deletedMessages.size.toString())} adet mesaj silindi. ${client.utils.getEmoji(
                        'greentick',
                    )}`,
                ),
            ],
        });
    },
};

export default Command;
