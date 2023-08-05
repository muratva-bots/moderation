import { PenalModel } from '@/models';
import { EmbedBuilder, PermissionFlagsBits, inlineCode, TextChannel } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['st', 'siciltemizle', 'sicil-temizle'],
    description: 'Kullanıcının bütün sicil verilerini sıfırlar.',
    examples: ['st @kullanıcı', 'st 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli Bir Kullanıcı Belirtmelisin!');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        await PenalModel.updateMany({ user: user.id }, { visible: false });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} adlı kullanıcının bütün sicil verileri sıfırlandı.`,
                    author: {
                        name: message.author.username,
                        iconURL: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'penal-log') as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili tarafından ${user} (${inlineCode(
                            user.id,
                        )}) adlı kullanıcısının bütün cezaları kaldırıldı.`,
                    ),
                ],
            });
        }
    },
};

export default Command;
