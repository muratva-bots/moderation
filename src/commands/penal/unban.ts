import { PenalFlags } from '@/enums';
import { PenalModel, UserModel } from '@/models';
import { bold, EmbedBuilder, inlineCode, PermissionFlagsBits, TextChannel } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unban', 'ununderworld'],
    description: 'Yasaklı kullanıcının banını kaldırırsın.',
    examples: ['unban 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.BanMembers) ||
        (guildData.banAuth && guildData.banAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getUser(args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı velirt!');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const document = await UserModel.findOne({ guild: message.guildId, id: user.id }).select('lastRoles');
        await PenalModel.updateMany(
            {
                guild: message.guildId,
                activity: true,
                user: user.id,
                type: PenalFlags.Ban,
            },
            { $set: { activity: false, remover: message.author.id, removeTime: Date.now(), removeReason: reason } },
        );

        const member = await client.utils.getMember(message.guild, user.id);
        const underworldRole = message.guild.roles.cache.get(guildData.underworldRole);
        if (underworldRole && member) {
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

            if (document && document.lastRoles.length) client.utils.setRoles(member, document.lastRoles);
            else client.utils.setRoles(member, guildData.unregisterRoles);
        } else if (!underworldRole) {
            const ban = message.guild.bans.cache.get(user.id);
            if (!ban) {
                client.utils.sendTimedMessage(message, 'Kullanıcının yasaklaması yok.');
                return;
            }
            message.guild.members.unban(user.id);
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        message.channel.send({
            embeds: [
                embed.setDescription(`${user} ${inlineCode(user.id)} kullanıcısının başarıyla cezası kaldırıldı.`),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'ban-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                embed.setDescription(
                    `${user} (${inlineCode(user.id)}) adlı kullanıcının cezası ${message.author} (${inlineCode(
                        message.author.id,
                    )}) tarafından ${bold(reason)} sebebiyle süresi dolmadan kaldırıldı.`,
                ),
            ],
        });
    },
};

export default Command;
