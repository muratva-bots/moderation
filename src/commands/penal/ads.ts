import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { EmbedBuilder, inlineCode, Message, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['ads', 'reklam'],
    description: 'Reklam yapan kullanıcıyı cezalıya atarsınız.',
    examples: ['ads @kullanıcı', 'ads 123456789123456789'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers),
    execute: async ({ client, message, args, guildData }) => {
        const adsRole = message.guild.roles.cache.get(guildData.adsRole);
        if (!adsRole) return message.channel.send('Reklam rolü ayarlanmamış.');

        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const member = await client.utils.getMember(message.guild, user.id);
        if (member && client.utils.checkUser(message, member)) return;

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const question = await message.reply({
            embeds: [
                embed.setDescription(
                    'Kanıt için ekran görüntüsünü atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.',
                ),
            ],
        });
        const filter = (msg: Message) => msg.author.id === message.author.id && msg.attachments.size > 0;
        const collected = await message.channel.awaitMessages({
            filter,
            time: 1000 * 60 * 60,
            max: 1,
        });
        if (collected) {
            const attachment = collected.first().attachments.first().proxyURL;

            await PenalModel.updateMany({ user: user.id, guild: message.guild.id }, { $set: { activity: false } });

            const roles = member
                ? member.roles.cache.filter((r) => !r.managed && r.id !== message.guildId).map((r) => r.id)
                : [];
            if (member) {
                if (member.voice.channelId) member.voice.disconnect();
                client.utils.setRoles(member, adsRole.id);
            }

            const now = Date.now();
            const newID = (await PenalModel.countDocuments({ guild: message.guildId })) + 1;
            const penal = await PenalModel.create({
                id: newID,
                guild: message.guildId,
                admin: message.author.id,
                user: user.id,
                type: PenalFlags.Ads,
                reason: attachment,
                start: now,
                roles: roles,
            });

            message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${user} kullanıcısı reklam yaptığından dolayı cezalandırıldı. (Ceza Numarası: ${inlineCode(
                            `#${newID}`,
                        )})`,
                    ),
                ],
            });

            await client.utils.sendLog({
                guild: message.guild,
                admin: message.author,
                channel: 'ads-log',
                penal: penal,
                user: user,
                attachment: attachment,
            });
        } else {
            question.edit({
                embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
            });
        }
    },
};

export default Command;
