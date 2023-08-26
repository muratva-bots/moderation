import { ISpecialCommand } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, Message } from 'discord.js';

export async function teamHandler(client: Client, message: Message, command: ISpecialCommand) {
    if (!command.roles.some((r) => message.guild.roles.cache.has(r))) {
        client.utils.sendTimedMessage(message, 'Rol silinmiş :/');
        return;
    }

    const members = await message.guild.members.fetch();

    members
        .filter(
            (m) =>
                command.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())) &&
                !command.roles.some((r) => m.roles.cache.has(r)),
        )
        .forEach((m) => m.roles.add(command.roles));

    members
        .filter(
            (m) =>
                !command.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())) &&
                command.roles.some((r) => m.roles.cache.has(r)),
        )
        .forEach((m) => m.roles.remove(command.roles));

    message.channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: 'Başarıyla rol dağıtıldı.',
            }),
        ],
    });
}
