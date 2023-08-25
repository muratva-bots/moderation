import { Message, PermissionFlagsBits, Team } from 'discord.js';

import { ModerationClass } from '@/models';
import { Client } from '@/structures';

function botCommandHandler(client: Client, message: Message, guildData: ModerationClass, prefix: string) {
    if (message.author.bot || !message.guild || !prefix) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = client.commands.find(
        (command) => command.usages.includes(commandName?.toLowerCase()) && !command.isDisabled,
    );
    const ownerID =
        client.application.owner instanceof Team
            ? (client.application.owner as Team).ownerId
            : client.application.owner.id;
    if (
        !command ||
        (guildData.chatChannel &&
            guildData.chatChannel === message.channelId &&
            !command.chatUsable &&
            !message.member.permissions.has(PermissionFlagsBits.Administrator)) ||
        ([
            guildData.underworldRole,
            guildData.adsRole,
            guildData.quarantineRole,
            ...(guildData.unregisterRoles || []),
        ].some((role) => message.member.roles.cache.has(role)) &&
            !message.member.permissions.has(PermissionFlagsBits.Administrator))
    )
        return;

    let canExecute = false;
    if (
        (![
            'emojiscreate',
            'invasion',
            'logscreate',
            'ayarlar',
            'suspectcontrol',
            'fastlogin',
            'kullanıcı-panel',
            'monthlyrole',
            'roleselect',
            'solvingauthcall',
            'eval',
            'setup',
        ].includes(command.usages[0]) &&
            message.member.permissions.has(PermissionFlagsBits.Administrator)) ||
        !command.checkPermission ||
        (command.checkPermission && command.checkPermission({ client, message, guildData }))
    )
        canExecute = true;

    const canExecuteData = guildData.canExecutes?.find((c) => c.name === command.usages[0]);
    if (
        canExecuteData &&
        canExecuteData.specialPass?.some((id) => id === message.author.id || message.member.roles.cache.has(id))
    )
        canExecute = true;

    if (
        message.author.id !== ownerID &&
        message.author.id !== message.guild.ownerId &&
        message.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
        const limit = client.utils.checkLimit(message.author.id, 1000, 5, 1000 * 20);
        if (limit.hasLimit) {
            const needTime = Number(limit.time.match(/\d+/)[0]);
            client.utils.sendTimedMessage(
                message,
                `Çok hızlı komut kullanıyorsun ${limit.time} bekle.`,
                Date.now() - needTime,
            );
            return;
        }
    }

    if (canExecute) command.execute({ client, message, args, guildData });
}

export default botCommandHandler;
