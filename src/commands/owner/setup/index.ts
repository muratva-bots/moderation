import { Team } from 'discord.js';
import mainHandler from './mainHandler';

const Command: Moderation.ICommand = {
    usages: ['setup', 'kur'],
    description: 'Bot kurulumlarını tamamlarsınız.',
    examples: ['setup <menüyü takip edin>'],
    checkPermission: ({ client, message }) => {
        return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);

    },
    execute: async ({ client, message, guildData }) => {
        mainHandler(client, message, guildData);
    },
};

export default Command;
