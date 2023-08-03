import { ModerationClass, PenalClass } from '@/models';
import { Client } from '@/structures';
import { GuildMember, Message, Role } from 'discord.js';

function underworldHandler(
    client: Client,
    message: Message,
    member: GuildMember,
    underworldRole: Role,
    guildData: ModerationClass,
    penals: PenalClass[],
) {
    if (!member.roles.cache.has(underworldRole.id)) {
        client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
        return;
    }

    if (
        !guildData.unregisterRoles ||
        !guildData.unregisterRoles.length ||
        !guildData.unregisterRoles.some((r) => message.guild.roles.cache.has(r))
    )
        return message.channel.send('Kayıtsız rolü/rolleri ayarlanmamış.');

    if (penals.length) client.utils.setRoles(member, penals[0].roles);
    else client.utils.setRoles(member, guildData.unregisterRoles);
}

export default underworldHandler;
