import { PermissionFlagsBits } from 'discord.js';

interface EmojiParsed {
    animated: boolean;
    name: string;
    id: string | undefined;
}

const Command: Moderation.ICommand = {
    usages: ['emojiekle', 'emoji-ekle'],
    description: 'Belirttiğiniz emojiyi sunucuya eklersiniz.',
    examples: ['emojiekle <emoji> <emoji-ismi>'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers),
    execute: async ({ message, args }) => {
        let emoji = args[0];
        let emojiName = args[1];

        if (!emoji) return message.reply({ content: 'Bir emoji belirtmelisin.' });

        const parsedEmoji: EmojiParsed = parseEmoji(emoji);

        if (parsedEmoji.id) {
            const link = `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? `gif` : 'png'}`;

            const createdEmoji = await message.guild.emojis.create({
                attachment: link,
                name: emojiName || parsedEmoji.name,
            });

            message.reply({
                content: `Başarıyla ${createdEmoji} - (${emojiName || parsedEmoji.name}) emojisi sunucuya eklendi.`,
            });
        } else message.reply({ content: 'Belirttiğin emoji bulunamadı.' });
    },
};

export default Command;

function parseEmoji(text: string): EmojiParsed | null {
    if (text.includes('%')) text = decodeURIComponent(text);
    if (!text.includes(':')) return { animated: false, name: text, id: undefined };
    const match = text.match(/<?(?:(a):)?(\w{1,32}):(\d{17,19})?>?/);
    return (
        match && {
            animated: Boolean(match[1]),
            name: match[2],
            id: match[3],
        }
    );
}
