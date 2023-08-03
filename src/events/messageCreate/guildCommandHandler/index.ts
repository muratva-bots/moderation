import { Message, PermissionFlagsBits } from 'discord.js';

import { Client } from '@/structures';
import { ModerationClass } from '@/models';
import { SpecialCommandFlags } from '@/enums';
import roleHandler from './roleHandler';
import punishmentHandler from './punishmentHandler';
import { teamHandler } from './team';

async function guildCommandHandler(client: Client, message: Message, guildData: ModerationClass) {
    if (!message.content || !message.guild || message.author.bot) return;

    const [commandName, ...args] = message.content.slice(client.config.PREFIX.length).trim().split(' ');
    const command = (guildData.specialCommands || []).find((command) =>
        command.usages.includes(commandName?.toLowerCase()),
    );
    if (!command) return;

    const canExecute = command.auth.some((a) => message.member.roles.cache.has(a) || message.author.id === a);
    if (!canExecute && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const limit = client.utils.checkLimit(message.author.id, 1000, 3, 1000 * 20);
    if (limit.hasLimit) {
        client.utils.sendTimedMessage(message, `bokunu çıkardın knk ${limit.time} bekle.`);
        return;
    }

    if (command.type === SpecialCommandFlags.Team) teamHandler(client, message, command);
    if (command.type === SpecialCommandFlags.Role) roleHandler(client, message, command, args);
    if (command.type === SpecialCommandFlags.Punishment) punishmentHandler(client, message, command, args);
    if (command.type === SpecialCommandFlags.Message) message.channel.send(command.content);
}

export default guildCommandHandler;
