import { PENAL_TITLES } from '@/assets';
import { SpecialCommandFlags } from '@/enums';
import { ModerationClass, PenalClass, PenalModel } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Message,
    ModalBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    bold,
    codeBlock,
    inlineCode,
    userMention,
} from 'discord.js';

const ActivePenals: Moderation.ICommand = {
    usages: ['aktifceza', 'aktifcezalar', 'mb', 'cb', 'db'],
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
            visible: true,
        });
        if (!activePenals.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        const firstPenal = activePenals[0];
        const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });

        const question = await message.channel.send({
            embeds: [createContent(client, firstPenal, embed, guildData)],
            components: createComponents(client, message, guildData, firstPenal, activePenals.length, 1),
        });

        let page = 1;
        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });
        const timeFinished = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'timefinished',
                    label: 'Mesajın Geçerlilik Süresi Doldu.',
                    emoji: { name: '⏱️' },
                    style: ButtonStyle.Danger,
                    disabled: true,
                }),
            ],
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            const penal = activePenals[page - 1];

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
                        components: [timeFinished],
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
            if (i.customId === 'first') page = 1;
            if (i.customId === 'last') page = activePenals.length;
            if (i.customId === 'next') page++;
            if (i.customId === 'back') page--;

            question.edit({
                embeds: [createContent(client, penal, embed, guildData)],
                components: createComponents(client, message, guildData, penal, activePenals.length, page),
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [timeFinished] });
            }
        });
    },
};

export default ActivePenals;

function createContent(client: Client, penal: PenalClass, embed: EmbedBuilder, guildData: ModerationClass) {
    let type = PENAL_TITLES[penal.type];
    if (!type) {
        const specialCommand = guildData.specialCommands.find(
            (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
        );
        if (specialCommand) type = specialCommand.punishName;
    }

    const image = client.utils.getImage(penal.reason);
    const replacedReason = penal.reason.replace(client.utils.reasonImage, '');
    embed
        .setImage(image ? image : undefined)
        .setTitle(type)
        .setDescription(
            [
                `${inlineCode('>')} ${bold('Cezalandırılan Yetkili:')} ${userMention(penal.admin)} (${inlineCode(
                    penal.admin,
                )})`,
                `${inlineCode('>')} ${bold('Ceza Sebebi:')} ${replacedReason || 'Sebep belirtilmemiş.'}`,
                `${inlineCode('>')} ${bold('Ceza Süresi:')} ${
                    penal.finish ? client.utils.numberToString(penal.finish - penal.start) : 'Süresiz.'
                }`,
                penal.finish
                    ? `${inlineCode('>')} ${bold('Ceza Kalan Süre:')} ${client.utils.numberToString(
                          penal.finish - Date.now(),
                      )}`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
        );
    return embed;
}

function createComponents(
    client: Client,
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
                            id: '1137495869495722054',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: `remove-note-${penal.id}`,
                        label: 'Rapor Kaldır',
                        emoji: {
                            id: '1137495873182498816',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                    new ButtonBuilder({
                        customId: `see-notes-${penal.id}`,
                        label: `${penal.notes.length === 1 ? 'Rapora' : 'Raporlara'} Bak`,
                        disabled: !(penal.notes && penal.notes.length),
                        emoji: {
                            id: '1137495100335861810',
                        },
                        style: ButtonStyle.Secondary,
                    }),
                ],
            }),
        );
    }

    if (penalsSize > 1) components.push(client.utils.paginationButtons(currentPage, penalsSize));

    return components;
}
