import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits,
    hideLinkEmbed,
    hyperlink,
    inlineCode,
    time,
} from 'discord.js';
import ms from 'ms';

interface IVoting {
    id: string;
    messageLink: string;
}

let onVoting: IVoting[] = [];

const Command: Moderation.ICommand = {
    usages: ['oyban', 'oyluban', 'oban'],
    description: 'Oylu şekilde kullanıcıyı banlarsınız.',
    examples: ['oyban @kullanıcı'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.ownerRoles && guildData.ownerRoles.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await client.utils.getUser(args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const voting = onVoting.find((o) => o.id === user.id);
        if (voting) {
            message.reply({
                content: hyperlink('Kullanıcının şuanda oylaması bulunuyor.', hideLinkEmbed(voting.messageLink)),
            });
            return;
        }

        const newArgs = args
            .slice(reference ? 0 : 1)
            .join(' ')
            .trim();
        const timing = newArgs.length > 0 ? ms(newArgs) : ms('1m');
        if (!timing) {
            client.utils.sendTimedMessage(message, 'Geçerli bir zaman belirt!');
            return;
        }

        if (timing > ms('5m')) {
            client.utils.sendTimedMessage(message, 'Oylama mı yapıyorsun yoksa çekiliş mi ona karar vermen lazım.');
            return;
        }

        if (ms('15s') > timing) {
            client.utils.sendTimedMessage(message, 'Kim ne ara, ne zaman, hangi sebeple, nasıl oy verebilsin?');
            return;
        }

        const buttonRow = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'accept',
                    label: 'Evet (0)',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'deaccept',
                    label: 'Hayır (0)',
                    style: ButtonStyle.Danger,
                }),
            ],
        });

        const usedVotes: string[] = [];
        const question = await message.channel.send({
            content: `${user} (${inlineCode(user.id)}) adlı kullanıcı sunucudan yasaklansın mı? (${time(
                Math.floor((Date.now() + timing) / 1000),
                'R',
            )})`,
            components: [buttonRow],
        });

        onVoting.push({ id: user.id, messageLink: question.url });

        const filter = (i: ButtonInteraction) => !i.user.bot;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: timing,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            if (usedVotes.includes(i.user.id)) {
                i.reply({
                    content: 'Zaten oy kullanmışsın.',
                    ephemeral: true,
                });
                return;
            }

            const type = i.customId === 'accept' ? 'Evet' : 'Hayır';
            i.reply({
                content: `${type} oyu kullandınız.`,
                ephemeral: true,
            });

            const index = i.customId === 'accept' ? 0 : 1;
            const current = Number(buttonRow.components[index].data.label.match(/\d+/)[0]);
            buttonRow.components[index].setLabel(`${type} (${current + 1})`);
            usedVotes.push(i.user.id);

            question.edit({ components: [buttonRow] });
        });

        collector.on('end', () => {
            onVoting = onVoting.filter((o) => o.id !== user.id);

            if (!question.deletable) return;

            const acceptCount = Number(buttonRow.components[0].data.label.match(/\d+/)[0]);
            const deacceptCount = Number(buttonRow.components[1].data.label.match(/\d+/)[0]);
            const totalCount = acceptCount + deacceptCount;
            const percentage = (acceptCount * totalCount) / 100;

            if (percentage > 50 && totalCount > 3) {
                question.edit({
                    content: `Çoğunluğun (${inlineCode(`${percentage.toFixed(2)}%`)}) oyuyla ${user} (${inlineCode(
                        user.id,
                    )}) adlı kullanıcı sunucudan yasaklandı!`,
                    components: [],
                });

                message.guild.members.ban(user.id, { reason: 'Oylama yapıldı ve yasaklandı.' });
                return;
            }

            question.edit({
                content: `Çoğunluk sağlanamadağı için oyuyla ${user} (${inlineCode(
                    user.id,
                )}) adlı kullanıcı sunucudan yasaklanmadı.`,
                components: [],
            });
        });
    },
};

export default Command;
