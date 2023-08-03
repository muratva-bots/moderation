import { Message } from 'discord.js';
import { ISpecialCommand } from '@/models';
import { Client } from '@/structures';
import punish from './punish';
import unpunish from './unpunish';

function punishmentHandler(client: Client, message: Message, command: ISpecialCommand, args: string[]) {
    if (command.isUn) unpunish(client, message, command, args);
    else punish(client, message, command, args);
}

export default punishmentHandler;
