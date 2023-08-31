import { ISpecialCommand, UserModel } from '@/models';
import { Client } from '@/structures';
import { Colors, EmbedBuilder, Message, TextChannel, inlineCode, roleMention, time } from 'discord.js';
import { RoleLogFlags } from '@/enums';
export async function teamHandler(client: Client, message: Message, command: ISpecialCommand, args: string[]) {
    if (!command.roles.some((r) => message.guild.roles.cache.has(r))) {
        client.utils.sendTimedMessage(message, 'Rol silinmiş :/');
        return;
    }
    const member = await client.utils.getMember(message.guild, args[0]);
    if (!member) {
        client.utils.sendTimedMessage(message, 'Lütfen bir kullanıcı etiketleyiniz!');
        return;
    }

    if (client.utils.checkUser(message, member)) return;

    const hasRole = command.roles.some((r) => member.roles.cache.has(r));
    if (hasRole) await member.roles.remove(command.roles);
    else await member.roles.add(command.roles);

    await UserModel.updateOne(
        { id: member.id, guild: message.guildId },
        {
            $push: {
                roleLogs: {
                    type: hasRole ? RoleLogFlags.Remove : RoleLogFlags.Add,
                    roles: command.roles,
                    time: Date.now(),
                    admin: message.author.id,
                },
            },
        },
        { upsert: true },
    );

    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
        author: {
            name: message.author.username,
            icon_url: message.author.displayAvatarURL({ forceStatic: true, size: 4096 }),
        },
    });

    const defaultText =
        command.roles.length === 1
            ? hasRole
                ? 'kullanıcıdan {roles} rolü alındı.'
                : 'kullanıcıya {roles} rolü verildi.'
            : hasRole
            ? 'kullanıcıdan {roles} rolleri alındı.'
            : 'kullanıcıya {roles} rolleri verildi.';
    const roles = command.roles.map((r) => roleMention(r));

    message.channel.send({
        embeds: [embed.setDescription(`${member} adlı ${defaultText.replace('{roles}', roles.join(', '))}`)],
    });

    const channel = message.guild!.channels.cache.find((c) => c.isTextBased() && c.name === 'role-log') as TextChannel;
    if (channel) {
        channel.send({
            embeds: [
                embed
                    .setColor(hasRole ? Colors.Red : Colors.Green)
                    .setTitle(hasRole ? 'Rol Çıkarıldı' : 'Rol Eklendi')
                    .setDescription(null)
                    .setAuthor({ name: null, iconURL: null })
                    .setFields([
                        { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                        {
                            name: 'Yetkili',
                            value: `${message.author} (${inlineCode(message.author.id)})`,
                            inline: true,
                        },
                        { name: 'Tarih', value: time(Math.floor(Date.now() / 1000)), inline: true },
                        {
                            name: `İşlem Yapılan ${roles.length > 1 ? 'Roller' : 'Rol'}`,
                            value: roles.join(', '),
                            inline: false,
                        },
                    ]),
            ],
        });
    }
}
