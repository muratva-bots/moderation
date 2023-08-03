import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { bold, EmbedBuilder, inlineCode, PermissionFlagsBits, userMention } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['ban-info', 'baninfo', 'banbilgi', 'bilgiban', 'infoban', 'info-ban', 'ban-bilgi', 'bilgi-ban'],
    description: 'Sunucuda yasaklanan bir kullanıcının yasağını kaldırmadan bilgisini gösterir.',
    examples: ['ban-info 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ViewAuditLog),
    execute: async ({ client, message, args }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const info = {
            staff: '',
            reason: '',
        };
        const ban = await message.guild.bans.fetch({ user: user.id });
        if (!ban) {
            const penal = await PenalModel.findOne({ user: user.id, type: PenalFlags.Ban });
            if (!penal) {
                client.utils.sendTimedMessage(message, 'Kullanıcı yasaklı değil.');
                return;
            }
            info.staff = penal.admin;
            info.reason = penal.reason;
        } else {
            info.staff = 'Bilinmiyor.';
            info.reason = ban.reason || 'Sebep belirtilmemiş.';
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} (${inlineCode(user.id)}) adlı kullanıcı ${
                        info.staff ? `${userMention(info.staff)} (${inlineCode(info.staff)}) tarafından ` : ''
                    } ${bold(info.reason)} sebebiyle yasaklanmış`,
                }),
            ],
        });
    },
};

export default Command;
