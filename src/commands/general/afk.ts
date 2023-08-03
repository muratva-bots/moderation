import { bold } from 'discord.js';

const inviteRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;

const Command: Moderation.ICommand = {
    usages: ['afk'],
    description: 'AFK moduna giriş yaparsınız.',
    examples: ['afk <sebep>'],
    execute: async ({ client, message, args }) => {
        const reason = args.join(' ') || '';

        if (inviteRegex.test(reason) || message.mentions.everyone) return message.delete();

        client.afkUsers.set(message.author.id, {
            date: Date.now(),
            reason: reason.length > 0 ? reason.slice(0, 2000) : null,
            mentions: [],
        });
        const newName = `[AFK] ${message.member.displayName}`;
        if (!message.member.displayName.startsWith('[AFK]') && message.member.manageable && 32 > newName.length)
            message.member.setNickname(newName);

        message.channel
            .send(`${message.author}, seni etiketleyenlere ${bold('AFK')} olduğunu bildireceğim.`)
            .then((msg) => setTimeout(() => msg.delete(), 5000));
    },
};

export default Command;
