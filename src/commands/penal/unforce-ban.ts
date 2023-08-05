import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unyargı', 'yargıkaldır', 'açılmazbanaç', 'açılmaz-banaç', 'açılmazban-aç', 'açılmaz-ban-aç'],
    description: 'Banını kaldıralamaz olarak işaretlediğiniz kullanıcının işaretini kaldırırsınız.',
    examples: ['yargıkaldır 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) => 
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        await PenalModel.updateMany(
            {
                guild: message.guildId,
                activity: true,
                user: user.id,
                type: PenalFlags.ForceBan,
            },
            { $set: { activity: false, remover: message.author.id, removeTime: Date.now() } },
        );

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} kullanıcısının başarıyla cezası kaldırıldı.`,
                }),
            ],
        });
    },
};

export default Command;
