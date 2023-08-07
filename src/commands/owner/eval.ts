import { codeBlock, Team } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['eval', 'sıla'],
    description: 'gixli.',
    examples: ['gixli'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return ownerID === message.author.id;
    },
    execute: async ({ client, message, args }) => {
        const code = args.join(' ');
        let evaled: string;
        try {
            evaled = await eval(code);
        } catch (err) {
            evaled = err;
        }

        const texts = client.utils.splitMessage(clean(evaled), { maxLength: 2000 });
        for (const newText of texts) message.channel.send(codeBlock('xl', newText));
    },
};

export default Command;

function clean(text: any): string {
    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 });
    text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
    return text;
}
