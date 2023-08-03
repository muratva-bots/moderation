import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['yargı', 'açılmazban', 'açılmaz-ban'],
    description: 'Belirttiğiniz kullanıcının banını açılmaz olarak işaretlersiniz.',
    examples: ['yargı @kullanıcı', 'yargı 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
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
                    color: client.utils.getRandomColor(),
                    description: `${user} adlı orospu çocuğu sunucudan siktir edildi.`,
                    image: {
                        url: guildData.banImage && guildData.banImage.length ? guildData.banImage : undefined,
                    },
                }),
            ],
        });
    },
};

export default Command;
