import { EMOJIS } from '@/assets';
import { Team, inlineCode } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['emojiscreate', 'emojikur'],
    description: 'Geliştirici komutu.',
    examples: ['Bot için gerekli olan emojileri kurar.'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return ownerID === message.author.id;
    },
    execute: async ({ message }) => {
        for (const emoji of EMOJIS) {
            const createdEmoji = await message.guild.emojis.create({ name: emoji.name, attachment: emoji.link });
            message.channel.send(`${createdEmoji} (${inlineCode(createdEmoji.id)}) oluşturuldu!`);
        }
    },
};

export default Command;
