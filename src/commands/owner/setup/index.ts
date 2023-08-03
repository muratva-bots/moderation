import { Team } from 'discord.js';
import mainHandler from './mainHandler';

const Command: Moderation.ICommand = {
    usages: ['setup', 'kur'],
    description: 'Bot kurulumlarını tamamlarsınız.',
    examples: ['setup <menüyü takip edin>'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return message.guild.ownerId === message.author.id || ownerID === message.author.id;
    },
    execute: async ({ client, message, guildData }) => {
        mainHandler(client, message, guildData);
    },
};

export default Command;
