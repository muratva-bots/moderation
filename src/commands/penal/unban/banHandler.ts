import { PenalClass } from '@/models';
import { Client } from '@/structures';
import { Message, User } from 'discord.js';

async function banHandler(client: Client, message: Message, user: User, penals: PenalClass[]) {
    if (!penals.length) {
        const ban = message.guild.bans.fetch(user.id);
        if (!ban) {
            client.utils.sendTimedMessage(message, 'Kullanıcının yasaklaması yok.');
            return;
        }
    }
    message.guild.members.unban(user.id);
}

export default banHandler;
