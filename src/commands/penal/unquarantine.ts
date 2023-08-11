import { PenalFlags } from '@/enums';
import { PenalModel, UserModel } from '@/models';
import { bold, EmbedBuilder, inlineCode, PermissionFlagsBits, TextChannel } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unquarantine', 'unkarantina', 'kkarantina', 'uncezalı', 'unjail', 'cezalıaf', 'af'],
    description: 'Cezalı olan kullanıcının cezasını kaldırırsınız.',
    examples: ['af @kullanıcı', 'af 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
    execute: async ({ client, message, args, guildData }) => {
        if (!message.guild.roles.cache.has(guildData.quarantineRole))
            return message.channel.send('Cezalı rolü ayarlanmamış.');

        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (!member.roles.cache.has(guildData.quarantineRole)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const document = await UserModel.findOne({ guild: message.guildId, id: member.id }).select('lastRoles');
        if (!document || !document.lastRoles) {
            if (!guildData.unregisterRoles?.some((r) => message.guild.roles.cache.has(r))) {
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
                    type: PenalFlags.Quarantine,
                },
                { $set: { activity: false, remover: message.author.id, removeTime: Date.now(), removeReason: reason } },
            );
            client.utils.setRoles(member, document.lastRoles);
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} kullanıcısının başarıyla cezası kaldırıldı.`,
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'quarantine-log') as TextChannel;
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
