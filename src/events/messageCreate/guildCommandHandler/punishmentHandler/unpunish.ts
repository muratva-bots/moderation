import { bold, EmbedBuilder, inlineCode, Message, TextChannel } from 'discord.js';
import { Client } from '@/structures';
import { ISpecialCommand, PenalModel } from '@/models';

async function unpunish(client: Client, message: Message, command: ISpecialCommand, args: string[]) {
    if (!message.guild.roles.cache.has(command.punishRole)) return message.channel.send('Rolü silinmiş.');

    const reference = message.reference ? (await message.fetchReference()).member : undefined;
    const member = (await client.utils.getMember(message.guild, args[0])) || reference;
    if (!member) {
        client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        return;
    }

    if (!member.roles.cache.has(command.punishRole)) {
        client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
        return;
    }

    const reason = args.slice(reference ? 0 : 1).join(' ');
    if (!reason.length) {
        client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
        return;
    }

    await PenalModel.updateMany(
        {
            guild: message.guildId,
            activity: true,
            user: member.id,
            type: command.punishType,
        },
        { $set: { activity: false, remover: message.author.id } },
    );
    member.roles.remove(command.punishRole);

    message.channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} kullanıcısının başarıyla cezası kaldırıldı.`,
            }),
        ],
    });

    const channel = message.guild.channels.cache.find((c) => c.id === command.logChannel) as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                    message.author
                } (${inlineCode(message.author.id)}) tarafından ${bold(reason)} sebebiyle süresi dolmadan kaldırıldı.`,
            }),
        ],
    });
}

export default unpunish;
