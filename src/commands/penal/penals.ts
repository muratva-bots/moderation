import { PenalFlags, SpecialCommandFlags } from '@/enums';
import { PenalModel } from '@/models';
import {
    ActionRowBuilder,
    time,
    bold,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    inlineCode,
    Interaction,
    StringSelectMenuBuilder,
    userMention,
} from 'discord.js';
import { PENAL_TITLES } from '@/assets';

const Command: Moderation.ICommand = {
    usages: ['penals', 'cezalar', 'sicil'],
    description: 'Kullanıcının cezalarını gösterir.',
    examples: ['sicil @kullanıcı', 'sicil 123456789123456789'],
    execute: async ({ client, message, args, guildData }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirtmelisin!');

        const penals = await PenalModel.find({
            user: user.id,
            guild: message.guildId,
            visible: true,
        });
        if (!penals.length) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının ceza verisi yok!');

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'penals',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                    options: penals
                        .slice(0, 25)
                        .filter((p) => p.type !== PenalFlags.ForceBan)
                        .map((penal) => {
                            let type = PENAL_TITLES[penal.type];
                            if (!type) {
                                const specialCommand = guildData.specialCommands.find(
                                    (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                                );
                                if (specialCommand) type = specialCommand.punishName;
                            }
                            return {
                                label: `${type} (#${penal.id})`,
                                description: 'Daha fazla bilgi için tıkla!',
                                value: penal.id,
                            };
                        }),
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        let components: ActionRowBuilder<any>[] = [row];
        const totalData = Math.ceil(penals.length / 25);
        let page = 1;
        if (penals.length > 25) components.push(paginationButtons(page, totalData));

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(`${user} (${inlineCode(user.id)}) adlı kullanıcının cezaları.`).setFields([
                    {
                        name: 'Ses Susturması',
                        value: penals.filter((p) => p.type === PenalFlags.VoiceMute).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Yazı Susturması',
                        value: penals.filter((p) => p.type === PenalFlags.ChatMute).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Diğer Cezalar',
                        value: penals
                            .filter(
                                (p) =>
                                    ![
                                        PenalFlags.VoiceMute,
                                        PenalFlags.Quarantine,
                                        PenalFlags.Ban,
                                        PenalFlags.Ads,
                                        PenalFlags.ChatMute,
                                        PenalFlags.ForceBan,
                                    ].includes(p.type),
                            )
                            .length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Cezalı',
                        value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Yasaklama',
                        value: penals.filter((p) => p.type === PenalFlags.Ban).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Karantina/Reklam',
                        value: penals
                            .filter((p) => p.type === PenalFlags.Quarantine || p.type === PenalFlags.Ads)
                            .length.toString(),
                        inline: true,
                    },
                ]),
            ],
            components: components,
        });

        const filter = (i: Interaction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

        collector.on('collect', (i: Interaction) => {
            if (i.isStringSelectMenu()) {
                const penal = penals.find((p) => p.id === i.values[0]);
                const image = client.utils.getImage(penal.reason);

                i.reply({
                    embeds: [
                        embed
                            .setFields([])
                            .setDescription(
                                [
                                    `${inlineCode('>')} ${bold('Cezalandırılan Yetkili:')} ${userMention(
                                        penal.admin,
                                    )} (${inlineCode(penal.admin)})`,
                                    `${inlineCode('>')} ${bold('Cezalandırılan Üye:')} ${userMention(
                                        penal.user,
                                    )} (${inlineCode(penal.user)})`,
                                    `${inlineCode('>')} ${bold('Ceza Türü:')} ${PENAL_TITLES[penal.type]}`,
                                    `${inlineCode('>')} ${bold('Ceza Sebebi:')} ${
                                        penal.type === PenalFlags.Ads ? 'Görüntü aşağıdadır.' : penal.reason
                                    }`,
                                    `${inlineCode('>')} ${bold('Ceza Atılma Tarihi:')} ${time(
                                        Math.floor(penal.start.valueOf() / 1000),
                                        'D',
                                    )}`,
                                    penal.finish
                                        ? `${inlineCode('>')} ${bold('Ceza Bitiş Tarihi:')} ${time(
                                              Math.floor(penal.finish.valueOf() / 1000),
                                              'D',
                                          )}`
                                        : '',
                                    penal.remover
                                        ? `${inlineCode('>')} **Cezayı Kaldıran Yetkili:** ${userMention(
                                              penal.remover,
                                          )} ${inlineCode(penal.remover)}`
                                        : '',
                                    penal.removeTime
                                        ? `${inlineCode('>')} **Cezayı Kaldırma Tarihi:** $ ${time(
                                              Math.floor(penal.removeTime.valueOf() / 1000),
                                              'D',
                                          )}`
                                        : '',
                                ].join('\n'),
                            )
                            .setImage(image ? image : undefined),
                    ],
                    ephemeral: true,
                });
                return;
            }

            if (i.isButton()) {
                i.deferUpdate();

                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                question.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'penals',
                                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                                    options: penals.slice(page === 1 ? 0 : page * 25 - 25, page * 25).map((penal) => {
                                        let type = PENAL_TITLES[penal.type];
                                        if (!type) {
                                            const specialCommand = guildData.specialCommands.find(
                                                (s) =>
                                                    s.punishType === penal.type &&
                                                    s.type === SpecialCommandFlags.Punishment,
                                            );
                                            if (specialCommand) type = specialCommand.punishName;
                                        }
                                        return {
                                            label: `${type} (#${penal.id})`,
                                            description: 'Daha fazla bilgi için tıkla!',
                                            value: `${penal.id}`,
                                        };
                                    }),
                                }),
                            ],
                        }),
                        paginationButtons(page, totalData),
                    ],
                });
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                const row = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'button-end',
                            label: 'Mesajın Geçerlilik Süresi Doldu.',
                            emoji: { name: '⏱️' },
                            style: ButtonStyle.Danger,
                            disabled: true,
                        }),
                    ],
                });

                question.edit({ components: [row] });
            }
        });
    },
};

export default Command;

function paginationButtons(page: number, totalData: number) {
    return new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'first',
                emoji: {
                    id: '1070037431690211359',
                },
                style: ButtonStyle.Secondary,
                disabled: page === 1,
            }),
            new ButtonBuilder({
                custom_id: 'previous',
                emoji: {
                    id: '1061272577332498442',
                },
                style: ButtonStyle.Secondary,
                disabled: page === 1,
            }),
            new ButtonBuilder({
                custom_id: 'count',
                label: `${page}/${totalData}`,
                style: ButtonStyle.Secondary,
                disabled: true,
            }),
            new ButtonBuilder({
                custom_id: 'next',
                emoji: {
                    id: '1061272499670745229',
                },
                style: ButtonStyle.Secondary,
                disabled: totalData === page,
            }),
            new ButtonBuilder({
                custom_id: 'last',
                emoji: {
                    id: '1070037622820458617',
                },
                style: ButtonStyle.Secondary,
                disabled: page === totalData,
            }),
        ],
    });
}
