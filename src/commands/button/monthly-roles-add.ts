import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Team, bold, italic } from 'discord.js';
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
                    emoji: { name: '✔️' },
                    label: 'Evet (Varsayılan)',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'monthlyroles-no',
                    emoji: { name: '❌' },
                    label: 'Hayır',
                    style: ButtonStyle.Secondary,
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
