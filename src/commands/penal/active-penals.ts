import { ModerationClass, PenalClass, PenalModel } from '@/models';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    codeBlock,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    Message,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    userMention,
} from 'discord.js';
import { PENAL_TITLES } from '@/assets';
import { SpecialCommandFlags } from '@/enums';

const ActivePenals: Moderation.ICommand = {
    usages: ['aktif', 'aktifcezalar', 'mb', 'cb', 'db'],
    description: 'Kullanıcının aktif ceza(ları) varsa görüntülersiniz.',
    examples: ['aktif @kullanıcı', 'aktif 123456789123456789'],
    execute: async ({ client, message, args, guildData }) => {
        const user = args[0]
            ? await client.utils.getUser(args[0])
            : message.reference
            ? (await message.fetchReference()).author
            : message.author;
        if (!user || user.bot) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const activePenals = await PenalModel.find({
            guild: message.guildId,
            user: user.id,
            activity: true,
        });
        if (!activePenals.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        const firstPenal = activePenals[0];

        let firstType = PENAL_TITLES[firstPenal.type];
        if (!firstType) {
            const specialCommand = guildData.specialCommands.find(
                (s) => s.punishType === firstPenal.type && s.type === SpecialCommandFlags.Punishment,
            );
            if (specialCommand) firstType = specialCommand.punishName;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            title: firstType,
            description: [
                `${inlineCode('>')} ${bold('Cezalandırılan Yetkili:')} ${userMention(firstPenal.admin)} (${inlineCode(
                    firstPenal.admin,
                )})`,
                `${inlineCode('>')} ${bold('Ceza Sebebi:')} ${firstPenal.reason}`,
                `${inlineCode('>')} ${bold('Ceza Süresi:')} ${numberToString(firstPenal.finish - firstPenal.start)}`,
                `${inlineCode('>')} ${bold('Ceza Kalan Süre:')} ${numberToString(firstPenal.finish - Date.now())}`,
            ].join('\n'),
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: createComponents(message, guildData, firstPenal, activePenals.length, 0),
        });

        let page = 0;
        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            const penal = activePenals[page];

            if (i.customId.startsWith('remove-note')) {
                const row = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'notes',
                            placeholder: 'Kaldırılacak raporu seçin!',
                            options: penal.notes.map((n, i) => ({ label: `${i + 1} numaralı not.`, value: n.admin })),
                        }),
                    ],
                });

                i.deferUpdate();
                collector.stop('FINISH');
                question.edit({
                    embeds: [
                        embed.setDescription(
                            penal.notes
                                .map(
                                    (n, i) =>
                                        `${i + 1}. ${userMention(n.admin)} (${inlineCode(n.admin)})\n${codeBlock(
                                            n.description,
                                        )}`,
                                )
                                .join('\n'),
                        ),
                    ],
                    components: [row],
                });

                const selectCollector = await question.awaitMessageComponent({
                    filter,
                    time: 1000 * 60 * 5,
                    componentType: ComponentType.StringSelect,
                });
                if (selectCollector) {
                    penal.notes = penal.notes.filter((n) => n.admin !== selectCollector.values[0]);
                    penal.save();
                    selectCollector.reply({
                        content: 'Başarıyla kaldırıldı..',
                        ephemeral: true,
                    });
                    question.edit({
                        embeds: [
                            embed.setDescription(
                                penal.notes
                                    .map(
                                        (n, i) =>
                                            `${i + 1}. ${userMention(n.admin)} (${inlineCode(n.admin)})\n${codeBlock(
                                                n.description,
                                            )}`,
                                    )
                                    .join('\n'),
                            ),
                        ],
                        components: [],
                    });
                } else {
                    question.edit({
                        embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                        components: [],
                    });
                }
                return;
            }

            if (i.customId.startsWith('see-notes')) {
                question.edit({ components: [] });
                i.reply({
                    content: penal.notes
                        .map(
                            (n, i) =>
                                `${i + 1}. ${userMention(n.admin)} (${inlineCode(n.admin)})\n${codeBlock(
                                    n.description,
                                )}`,
                        )
                        .join('\n'),
                    ephemeral: true,
                });
                return;
            }

            if (i.customId.startsWith('add-note')) {
                if (penal.notes.length === 3) {
                    question.edit({ components: [] });
                    i.reply({
                        content: 'Eklenebilecek maksimum rapora ulaşmış.',
                        ephemeral: true,
                    });
                    return;
                }

                if (penal.notes.some((n) => n.admin === message.author.id)) {
                    question.edit({ components: [] });
                    i.reply({
                        content: 'Zaten eklenmiş raporun bulunuyor.',
                        ephemeral: true,
                    });
                    return;
                }

                const row = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'note',
                            label: 'Not:',
                            placeholder: 'Troll olduğu çok belli.',
                            max_length: 60,
                            required: true,
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'add-note-modal',
                    title: 'Eklenecek notu giriniz.',
                    components: [row],
                });

                await i.showModal(modal);

                const modalCollector = await i.awaitModalSubmit({
                    filter,
                    time: 1000 * 60 * 4,
                });
                if (modalCollector) {
                    const note = modalCollector.fields.getTextInputValue('note');
                    penal.notes.push({ admin: message.author.id, description: note });
                    penal.save();
                    modalCollector.reply({
                        content: 'Rapor başarıyla eklendi.',
                        ephemeral: true,
                    });
                    question.edit({ components: [] });
                } else {
                    question.edit({ components: [] });
                }
                return;
            }

            i.deferUpdate();
            if (i.customId === 'first') page = 0;
            if (i.customId === 'last') page = activePenals.length - 1;
            if (i.customId === 'next') page++;
            if (i.customId === 'back') page--;

            let type = PENAL_TITLES[penal.type];
            if (!type) {
                const specialCommand = guildData.specialCommands.find(
                    (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                );
                if (specialCommand) type = specialCommand.punishName;
            }

            embed.setTitle(type);
            embed.setDescription(
                [
                    `${inlineCode('>')} ${bold('Cezalandırılan Yetkili:')} ${userMention(penal.admin)} (${inlineCode(
                        penal.admin,
                    )})`,
                    `${inlineCode('>')} ${bold('Ceza Sebebi:')} ${penal.reason}`,
                    `${inlineCode('>')} ${bold('Ceza Süresi:')} ${numberToString(penal.finish - penal.start)}`,
                    `${inlineCode('>')} ${bold('Ceza Kalan Süre:')} ${numberToString(penal.finish - Date.now())}`,
                ].join('\n'),
            );
            question.edit({
                embeds: [embed],
                components: createComponents(message, guildData, penal, activePenals.length, page),
            });
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

export default ActivePenals;

function createComponents(
    message: Message,
    guildData: ModerationClass,
    penal: PenalClass,
    penalsSize: number,
    currentPage: number,
) {
    const minStaffRole = message.guild.roles.cache.get(guildData.minStaffRole);
    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (minStaffRole && message.member.roles.highest.position >= minStaffRole.position) {
        components.push(
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        customId: `add-note-${penal.id}`,
                        label: 'Rapor Ekle',
                        emoji: {
                            id: '1134147890185515058',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: `remove-note-${penal.id}`,
                        label: 'Rapor Kaldır',
                        emoji: {
                            id: '1134147892978917477',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: `see-notes-${penal.id}`,
                        label: `${penal.notes.length === 1 ? 'Rapora' : 'Raporlara'} Bak`,
                        disabled: !(penal.notes && penal.notes.length),
                        emoji: {
                            id: '1134147894836998275',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                ],
            }),
        );
    }

    if (penalsSize > 1) {
        components.push(
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        customId: 'first',
                        emoji: {
                            id: '1061272577332498442',
                        },
                        disabled: currentPage === 0,
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: 'back',
                        emoji: {
                            id: '1061272577332498442',
                        },
                        disabled: currentPage === 0,
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: 'next',
                        emoji: {
                            id: '1061272499670745229',
                        },
                        disabled: currentPage === penalsSize - 1,
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: 'last',
                        emoji: {
                            id: '1061272577332498442',
                        },
                        disabled: currentPage === penalsSize - 1,
                        style: ButtonStyle.Secondary,
                    }),
                ],
            }),
        );
    }

    return components;
}

function numberToString(seconds: number) {
    seconds = seconds / 1000;
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor((seconds % (3600 * 24)) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + ' gün ' : '';
    var hDisplay = h > 0 ? h + ' saat ' : '';
    var mDisplay = d === 0 && m > 0 ? m + ' dakika ' : '';
    var sDisplay = h === 0 && s > 0 ? s + ' saniye' : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
}
