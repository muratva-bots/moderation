import { PenalModel } from '@/models';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['sicilaktar', 'cezaaktar', 'penaltransfer'],
    description: 'Hesap değişmiş yada yanlış ceza uygulanmış kullanıcının cezalarını başka bir kullanıcıya aktarır.',
    examples: ['sicilaktar 1234567890 1234567890', 'sicilaktar @kullanıcı @kullanıcı'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const user = await client.utils.getUser(args[0]);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const transferUser = await client.utils.getUser(args[1]);
        if (!transferUser) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        await PenalModel.updateMany({ user: user.id }, { $set: { user: transferUser.id } });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${user} adlı kullanıcının cezaları ${transferUser} adlı kullanıcıya aktarıldı.`,
                }),
            ],
        });
    },
};

export default Command;
