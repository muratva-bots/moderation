import {
    ActionRowBuilder,
    Team,
    ButtonBuilder,
    channelMention,
    EmbedBuilder,
    ButtonStyle,
    bold,
    italic,
} from 'discord.js';
import ms from 'ms';

const Command: Moderation.ICommand = {
    usages: ['monthlyrole', 'monthlyroles', 'monthly-role', 'monthly-roles'],
    description: 'Aylık üye mesajını attırırsınız.',
    examples: ['monthlyrole'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return message.guild.ownerId === message.author.id || ownerID === message.author.id;
    },
    execute: async ({ client, message, guildData }) => {
        if (guildData.monthlyRolesSystem === false) {
            client.utils.sendTimedMessage(message, 'Aylık üye sistemi kapalı olduğu için bu mesajı attıramazsın.');
            return;
        }
        if (!guildData.monthlyRoles || !guildData.monthlyRoles.length) {
            client.utils.sendTimedMessage(message, 'Aylık üye rolleri ayarlanmamış.');
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'monthlyroles-yes',
                    emoji: { id: '✔️' },
                    label: 'Evet (Varsayılan)',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'monthlyroles-no',
                    emoji: { id: '❌' },
                    label: 'Hayır',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        message.channel.send({
            content: [
                bold(
                    `${guildData.monthlyRoles
                        .map(
                            (r, i) =>
                                `${i === guildData.monthlyRoles.length - 1 ? ' ve' : ''}${ms(r.time)}${
                                    i === guildData.monthlyRoles.length - 1 ? '' : ', '
                                }`,
                        )
                        .join('')} aylık üye rollerinin üstünüzde görünmesini istiyor musunuz?`,
                ),
                italic(`(Bu roller sunucuya en son giriş tarihiniz baz alınarak üstünüze verilmektedir.)`),
            ].join('\n'),
            components: [row],
        });
    },
};

export default Command;
