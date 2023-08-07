import { UserModel } from '@/models';
import { DEFAULTS } from '@/assets';
import { LimitFlags, NameFlags } from '@/enums';
import { EmbedBuilder, PermissionFlagsBits, TextChannel, inlineCode, roleMention } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['kayıtsız', 'kayitsiz', 'unreg', 'unregister', 'unregistered'],
    description: 'Belirttiğiniz kullanıcıyı kayıtsıza atarsınız.',
    examples: ['kayıtsız @kullanıcı', 'kayıtsız 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        if (
            !guildData.unregisterRoles ||
            !guildData.unregisterRoles.length ||
            !guildData.unregisterRoles.some((i) => message.guild.roles.cache.has(i))
        ) {
            client.utils.sendTimedMessage(message, 'Kayıtsız rolü ayarlanmamış.');
            return;
        }

        const limit = client.utils.checkLimit(
            message.author.id,
            LimitFlags.Unregistered,
            guildData.unregisteredLimitCount
                ? Number(guildData.unregisteredLimitCount)
                : DEFAULTS.unregistered.limit.count,
            guildData.unregisteredLimitCount || DEFAULTS.unregistered.limit.time,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum kayıtsız limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (client.utils.checkUser(message, member)) return;

        const document = await UserModel.findOne({ id: member.id, guild: message.guildId });
        if (document && document.names.length) {
            document.names = [{ admin: message.author.id, type: NameFlags.Unregister, time: Date.now() }];
            document.save();
        }

        client.utils.setRoles(member, guildData.unregisterRoles);
        if (guildData.changeName) member.setNickname('İsim | Yaş');

        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} (${inlineCode(member.id)}) kullanıcısına ${roleMention(
                        guildData.unregisterRoles[0],
                    )} verildi!`,
                ),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'unregistered-log') as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili tarafından ${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcı kayıtısıza atıldı.`,
                    ),
                ],
            });
        }
    },
};

export default Command;
