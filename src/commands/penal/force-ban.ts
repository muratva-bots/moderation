import { DEFAULTS } from '@/assets';
import { PenalFlags } from '@/enums';
import { PenalModel, UserModel } from '@/models';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['yargı', 'açılmazban', 'açılmaz-ban', 'forceban', 'force-ban'],
    description: 'Belirttiğiniz kullanıcının banını açılmaz olarak işaretlersiniz.',
    examples: ['yargı @kullanıcı', 'yargı 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getUser(args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const member = await client.utils.getMember(message.guild, user.id);
        if (member) {
            if (client.utils.checkUser(message, member)) return;

            const ban = await message.guild.bans.fetch({ user: user.id });
            if (ban) {
                client.utils.sendTimedMessage(message, 'Belirttiğin kişi zaten cezalı?');
                return;
            }
        }

        const reason = args.slice(reference ? 0 : 1).join(' ') || 'Sebep belirtilmemiş';
        message.guild.members.ban(user.id, { reason: `${message.author.username} - ${reason}` });

        await PenalModel.updateMany({ user: user.id, guild: message.guild.id }, { $set: { activity: false } });

        const roles = member
            ? member.roles.cache.filter((r) => !r.managed && r.id !== message.guildId).map((r) => r.id)
            : [];
        if (roles.length) {
            await UserModel.updateOne(
                { id: user.id, guild: message.guildId },
                { $set: { lastRoles: roles } },
                { upsert: true }
            );
        }

        const newID = (await PenalModel.countDocuments({ guild: message.guildId })) + 1;
        await PenalModel.create({
            id: newID,
            guild: message.guildId,
            admin: message.author.id,
            user: user.id,
            type: PenalFlags.ForceBan,
            reason: reason,
            finish: undefined,
            start: Date.now(),
        });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                    color: client.utils.getRandomColor(),
                    description: `${user} adlı orospu çocuğu sunucudan siktir edildi.`,
                    image: {
                        url: DEFAULTS.underworld.image,
                    },
                }),
            ],
        });
    },
};

export default Command;
