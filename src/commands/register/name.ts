import { EmbedBuilder, inlineCode, TextChannel, bold, PermissionFlagsBits } from 'discord.js';
import { quarantineUser } from '../penal/quarantine';
import { UserModel } from '@/models';
import { NameFlags } from '@/enums';

const Command: Moderation.ICommand = {
    usages: ['name', 'isim'],
    description: 'Belirtilen kullanıcının ismini değiştirirsiniz!',
    examples: ['isim @kullanıcı isim yaş', 'isim 123456789123456789 isim yaş'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        if (guildData.registerSystem == false) {
            message.channel.send({
                content: `🔒 Kayıtlar bir yönetici tarafından __geçici bir süreliğine kapatılmıştır.__ Lütfen bu süreçte beklemede kalın. Anlayışla karşıladığınız için teşekkürler!`,
            });
            return;
        }

        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (client.utils.checkUser(message, member)) return;

        const hasTag = guildData.tags?.some((t) => member.user.displayName.includes(t));

        args = args.splice(1);
        let name = args
            .filter((arg) => isNaN(parseInt(arg)))
            .map((arg) => arg[0].toUpperCase() + arg.slice(1).toLowerCase())
            .join(' ');
        if (!name || name.length > 15) {
            client.utils.sendTimedMessage(message, '15 karakteri geçmeyecek isim girmelisin.');
            return;
        }

        if (guildData.tags.length && guildData.secondTag) {
            name = `${hasTag ? guildData.tags[0] : guildData.secondTag} ${name}`;
        }

        if (guildData.needAge) {
            const age = args.filter((arg) => !isNaN(parseInt(arg)))[0] || undefined;
            if (!age || age.length > 2) {
                client.utils.sendTimedMessage(message, '2 karakteri geçmeyecek yaş girmelisin.');
                return;
            }

            const numAge = Number(age);
            if (guildData.minAge && guildData.minAge > numAge) {
                client.utils.sendTimedMessage(
                    message,
                    `Sunucuya ${inlineCode(guildData.minAge.toString())} yaşının altındaki üyeleri kaydedemezsin.`,
                );

                if (guildData.minAgePunish) {
                    quarantineUser(
                        client,
                        message,
                        member.user,
                        member,
                        guildData,
                        1000 * 60 * 60 * 24 * 365 * (guildData.minAge - numAge),
                        'sunucunun yaş sınırlarının altında bir üye',
                    );
                }
                return;
            }

            name = `${name} | ${age}`;
        }

        await member.setNickname(name);
        await UserModel.updateOne(
            { id: member.id, guild: message.guildId },
            { $push: { names: { admin: message.author.id, type: NameFlags.ChangeName, time: Date.now(), name } } },
            { upsert: true },
        );

        const registerLogChannel = message.guild.channels.cache.find((c) => c.name === 'register-log') as TextChannel;
        if (registerLogChannel) {
            registerLogChannel.send({
                content: `${member} (${inlineCode(member.id.toString())}) adlı kullanıcının ismi ${
                    message.author
                } (${inlineCode(message.author.username)}) tarafından değiştirildi.`,
            });
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${member} üyesinin ismi başarıyla ${bold(name)} değiştirildi.`,
                }),
            ],
        });
    },
};

export default Command;
