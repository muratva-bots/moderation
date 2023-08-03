import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { bold, EmbedBuilder, inlineCode, PermissionFlagsBits, TextChannel } from 'discord.js';
import banHandler from './banHandler';
import underworldHandler from './underworldHandler';

const Command: Moderation.ICommand = {
    usages: ['unban', 'ununderworld'],
    description: 'Yasaklı kullanıcının banını kaldırırsın.',
    examples: ['unban 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.BanMembers),
    execute: async ({ client, message, args, guildData }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getUser(args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı velirt!');
            return;
        }

        const penals = await PenalModel.find({
            guild: message.guildId,
            activity: true,
            user: user.id,
            type: PenalFlags.Ban,
        });
        await PenalModel.updateMany(
            {
                guild: message.guildId,
                activity: true,
                user: user.id,
                type: PenalFlags.Ban,
            },
            { activity: false, remover: message.author.id },
        );

        const member = await client.utils.getMember(message.guild, user.id);
        const underworldRole = message.guild.roles.cache.get(guildData.underworldRole);
        if (underworldRole && member) underworldHandler(client, message, member, underworldRole, guildData, penals);
        else if (!underworldRole) banHandler(client, message, user, penals);

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
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
