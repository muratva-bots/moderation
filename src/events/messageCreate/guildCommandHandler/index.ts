import { Message, PermissionFlagsBits } from 'discord.js';

import { Client } from '@/structures';
import { SpecialCommandFlags } from '@/enums';
import roleHandler from './roleHandler';
import punishmentHandler from './punishmentHandler';
import { teamHandler } from './team';

async function guildCommandHandler(client: Client, message: Message, guildData: Moderation.IGuildData, prefix: string) {
    if (!message.content || !message.guild || message.author.bot) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = guildData.specialCommands?.find((command) =>
        command.usages.map((u) => u.toLowerCase().trim()).includes(commandName?.toLowerCase()),
    );
    if (!command) return;

    const canExecute = command.auth.some((a) => message.member.roles.cache.has(a) || message.author.id === a);
    if (!canExecute && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const limit = client.utils.checkLimit(message.author.id, 1000, 3, 1000 * 20);
    if (limit.hasLimit) {
        const needTime = Number(limit.time.match(/\d+/)[0]);
        client.utils.sendTimedMessage(
            message,
            `Çok hızlı komut kullanıyorsun ${limit.time} bekle.`,
            Date.now() - needTime,
        );
        return;
    }

    if (command.type === SpecialCommandFlags.Team) teamHandler(client, message, command, args);
    if (command.type === SpecialCommandFlags.Role) roleHandler(client, message, command, args);
    if (command.type === SpecialCommandFlags.Punishment) punishmentHandler(client, message, command, args);
    if (command.type === SpecialCommandFlags.Message) message.channel.send(command.content);
}

export default guildCommandHandler;
