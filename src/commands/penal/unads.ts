import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { bold, EmbedBuilder, inlineCode, PermissionFlagsBits, TextChannel } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unads', 'unreklam'],
    description: 'Reklam yapan kullanıcının cezasını kaldırırsınız.',
    examples: ['unads @kullanıcı', 'unads 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
    execute: async ({ client, message, args, guildData }) => {
        if (!message.guild.roles.cache.has(guildData.adsRole)) return message.channel.send('Cezalı rolü ayarlanmamış.');

        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (!member.roles.cache.has(guildData.adsRole)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const penals = await PenalModel.find({
            guild: message.guildId,
            activity: true,
            user: member.id,
            type: PenalFlags.Ads,
        });
        if (!penals.length) {
            if (!(guildData.unregisterRoles || []).some((r) => message.guild.roles.cache.has(r))) {
                client.utils.sendTimedMessage(message, 'Kayıtsız rolleri ayarlanmamış.');
                return;
            }

            client.utils.setRoles(member, guildData.unregisterRoles);
        } else {
            await PenalModel.updateMany(
                {
                    guild: message.guildId,
                    activity: true,
                    user: member.id,
                    type: PenalFlags.Ads,
                },
                { $set: { activity: false, remover: message.author.id, removeTime: Date.now(), removeReason: reason } },
            );
            client.utils.setRoles(member, penals[0].roles);
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} kullanıcısının başarıyla cezası kaldırıldı.`,
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'ads-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                        message.author
                    } (${inlineCode(message.author.id)}) tarafından ${bold(
                        reason,
                    )} sebebiyle süresi dolmadan kaldırıldı.`,
                }),
            ],
        });
    },
};

export default Command;
