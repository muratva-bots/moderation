import { Client } from '@/structures';
import { Message } from 'discord.js';
import { COMPLIMENTS } from '@/assets';
import { ModerationClass } from '@/models';

let complimentCounter = 0;

async function complimentHandler(client: Client, message: Message, guildData: ModerationClass) {
    if (
        message.author.bot ||
        !message.guildId ||
        message.content.startsWith(client.config.PREFIX) ||
        message.content.length < 5 ||
        guildData.compliment ||
        guildData.chatChannel !== message.channelId
    )
        return;

    complimentCounter++;
    if (complimentCounter !== 500) return;
    complimentCounter = 0;

    message.reply(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
}

export default complimentHandler;
