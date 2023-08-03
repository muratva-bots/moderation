import afkHandler from './afkHandler';
import complimentHandler from './complimentHandler';
import guildCommandHandler from './guildCommandHandler';
import botCommandHandler from './botCommandHandler';
import { Events, bold, inlineCode } from 'discord.js';
import { ModerationClass } from '@/models';

const MessageCreate: Moderation.IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (!message.guild || message.author.bot || !message.content.length) return;

        const guildData = client.servers.get(message.guildId) || new ModerationClass();
        if (message.content.trim() === `${client.config.PREFIX}tag` && guildData.tags && guildData.tags.length) {
            message.reply({ content: guildData.tags.join(', ') });
            return;
        }

        if (message.content.trim() === `${client.config.PREFIX}link`) {
            const vanityURL = await message.guild.fetchVanityData();
            if (!vanityURL) {
                client.utils.sendTimedMessage(message, 'Bu sunucunun bir özel davet linki bulunmuyor.');
                return;
            }

            message.reply({
                content: [
                    `discord.gg/${message.guild.vanityURLCode}`,
                    bold(`Url Kullanımı: ${inlineCode(vanityURL.uses.toString())}`),
                ].join('\n'),
            });
        }

        botCommandHandler(client, message, guildData);
        guildCommandHandler(client, message, guildData);
        complimentHandler(client, message, guildData);
        afkHandler(client, message);
    },
};

export default MessageCreate;
