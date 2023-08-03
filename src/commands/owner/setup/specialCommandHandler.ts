import { GuildModel, IReason, ISpecialCommand, ModerationClass } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ComponentType,
    Interaction,
    MentionableSelectMenuBuilder,
    MentionableSelectMenuInteraction,
    Message,
    ModalBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    bold,
    inlineCode,
} from 'discord.js';
import mainHandler from './mainHandler';
import { Client } from '@/structures';
import { NeedFlags, SpecialCommandFlags } from '@/enums';
import ms from 'ms';

const types = {
    [SpecialCommandFlags.Message]: 'Mesaj',
    [SpecialCommandFlags.Punishment]: 'Ceza',
    [SpecialCommandFlags.Role]: 'Rol',
};

export async function specialCommandHandler(
    authorId: string,
    client: Client,
    message: Message,
    question: Message,
    guildData: ModerationClass,
) {
    const timeFinished = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'timefinished',
                disabled: true,
                emoji: { name: '⏱️' },
                style: ButtonStyle.Danger,
            }),
        ],
    });

    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'back',
                label: 'Geri',
                style: ButtonStyle.Danger,
            }),
            new ButtonBuilder({
                custom_id: 'add',
                label: 'Ekle',
                style: ButtonStyle.Success,
            }),
        ],
    });

    await question.edit({
        content: 'Özel komut ayarlarını yapmak için menüyü kullanın.',
        components: [createList(guildData.specialCommands), row],
    });

    const filter = (i: Interaction) => i.user.id === authorId;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i: Interaction) => {
        if (i.isButton() && i.customId === 'back') {
            collector.stop('FINISH');
            i.deferUpdate();
            mainHandler(client, message, guildData, question);
            return;
        }

        if (i.isButton() && i.customId === 'add') {
            const typeRow = new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        custom_id: 'type',
                        placeholder: 'Komut türünü seç!',
                        options: Object.keys(types).map((r) => ({ label: types[r], value: `${r}` })),
                    }),
                ],
            });

            i.reply({
                ephemeral: true,
                components: [typeRow],
            });

            const interactionMessage = await i.fetchReply();
            const typeCollected = await interactionMessage.awaitMessageComponent({
                time: 1000 * 60 * 10,
                componentType: ComponentType.StringSelect,
            });
            if (typeCollected) {
                typeCollected.deferUpdate();

                const userAndRoleRow = new ActionRowBuilder<MentionableSelectMenuBuilder>({
                    components: [
                        new MentionableSelectMenuBuilder({
                            custom_id: 'auth',
                            maxValues: 25,
                            placeholder: 'Kullanıcı veya rol ara...',
                        }),
                    ],
                });

                i.editReply({
                    content: 'Komutu kimlerin kullanabileceğin belirt.',
                    components: [userAndRoleRow],
                });

                const authCollected = await interactionMessage.awaitMessageComponent({
                    time: 1000 * 60 * 10,
                    componentType: ComponentType.MentionableSelect,
                });
                if (authCollected) {
                    if (typeCollected.values[0] === `${SpecialCommandFlags.Message}`) {
                        const usagesRow = new ActionRowBuilder<TextInputBuilder>({
                            components: [
                                new TextInputBuilder({
                                    custom_id: 'usages',
                                    placeholder: 'deneme, deneme2',
                                    label: 'Kullanımlar:',
                                    required: true,
                                    style: TextInputStyle.Short,
                                }),
                            ],
                        });

                        const descriptionRow = new ActionRowBuilder<TextInputBuilder>({
                            components: [
                                new TextInputBuilder({
                                    custom_id: 'description',
                                    placeholder: 'Komutu kullandığınızda canzadeye oç der',
                                    label: 'Açıklama:',
                                    required: true,
                                    style: TextInputStyle.Short,
                                }),
                            ],
                        });

                        const contentRow = new ActionRowBuilder<TextInputBuilder>({
                            components: [
                                new TextInputBuilder({
                                    custom_id: 'content',
                                    placeholder: '<@331846231514939392>, oçtur.',
                                    label: 'İçerik:',
                                    required: true,
                                    style: TextInputStyle.Short,
                                }),
                            ],
                        });

                        const modal = new ModalBuilder({
                            custom_id: 'modal',
                            title: 'Komut Ayarları',
                            components: [usagesRow, descriptionRow, contentRow],
                        });

                        await authCollected.showModal(modal);

                        const modalCollected = await authCollected.awaitModalSubmit({ time: 1000 * 60 * 10 });
                        if (modalCollected) {
                            modalCollected.deferUpdate();

                            const content = modalCollected.fields.getTextInputValue('content');
                            const usages = modalCollected.fields
                                .getTextInputValue('usages')
                                .trim()
                                .toLowerCase()
                                .split(',');
                            const description = modalCollected.fields.getTextInputValue('description');

                            if (
                                usages.some((u) =>
                                    (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                ) ||
                                client.commands.some((cc) =>
                                    cc.usages.some((u) =>
                                        (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                    ),
                                )
                            ) {
                                client.utils.sendTimedMessage(message, 'Belirttiğin isimde komut bulunuyor.');
                                return;
                            }

                            guildData.specialCommands = [
                                ...(guildData.specialCommands || []),
                                {
                                    auth: authCollected.values,
                                    description: description,
                                    type: SpecialCommandFlags.Message,
                                    usages: usages,
                                    content: content,
                                },
                            ];
                            i.editReply({
                                content: `${bold(usages[0])} adlı komut başarıyla oluşturuldu.`,
                                components: [],
                            });
                        } else authCollected.deleteReply();
                    }

                    if (typeCollected.values[0] === `${SpecialCommandFlags.Punishment}`) {
                        const roleRow = new ActionRowBuilder<RoleSelectMenuBuilder>({
                            components: [
                                new RoleSelectMenuBuilder({
                                    custom_id: 'role',
                                    maxValues: 25,
                                    placeholder: 'Rol ara...',
                                }),
                            ],
                        });

                        i.deleteReply();
                        authCollected.reply({
                            content: 'Komutu kullanınca verilecek rolü belirt.',
                            components: [roleRow],
                            ephemeral: true,
                        });

                        const roleMessage = await authCollected.fetchReply();
                        const roleCollected = await roleMessage.awaitMessageComponent({
                            time: 1000 * 60 * 10,
                            componentType: ComponentType.RoleSelect,
                        });
                        if (roleCollected) {
                            authCollected.deleteReply();

                            const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>({
                                components: [
                                    new ChannelSelectMenuBuilder({
                                        custom_id: 'channel',
                                        placeholder: 'Kanal ara...',
                                        channel_types: [ChannelType.GuildText],
                                    }),
                                ],
                            });
                            roleCollected.reply({
                                content: 'Log kanalını belirt.',
                                components: [channelRow],
                                ephemeral: true,
                            });

                            const channelMessage = await roleCollected.fetchReply();
                            const channelCollected = await channelMessage.awaitMessageComponent({
                                time: 1000 * 60 * 10,
                                componentType: ComponentType.ChannelSelect,
                            });
                            if (channelCollected) {
                                const usagesRow = new ActionRowBuilder<TextInputBuilder>({
                                    components: [
                                        new TextInputBuilder({
                                            custom_id: 'usages',
                                            label: 'Kullanımlar:',
                                            style: TextInputStyle.Short,
                                            required: true,
                                            placeholder: 'a, a1',
                                        }),
                                    ],
                                });

                                const descriptionRow = new ActionRowBuilder<TextInputBuilder>({
                                    components: [
                                        new TextInputBuilder({
                                            custom_id: 'description',
                                            label: 'Açıklama:',
                                            style: TextInputStyle.Short,
                                            required: true,
                                            placeholder: 'bla rolünü verir',
                                        }),
                                    ],
                                });

                                const nameRow = new ActionRowBuilder<TextInputBuilder>({
                                    components: [
                                        new TextInputBuilder({
                                            custom_id: 'name',
                                            label: 'Ceza Adı:',
                                            style: TextInputStyle.Short,
                                            required: true,
                                            placeholder: 'Terapi Kanallarında Ceza',
                                        }),
                                    ],
                                });

                                const modal = new ModalBuilder({
                                    custom_id: 'modal',
                                    title: 'Kullanım Ekle',
                                    components: [usagesRow, descriptionRow, nameRow],
                                });

                                await channelCollected.showModal(modal);

                                const modalCollected = await channelCollected.awaitModalSubmit({
                                    time: 1000 * 60 * 10,
                                });
                                if (modalCollected) {
                                    const usages = modalCollected.fields
                                        .getTextInputValue('usages')
                                        .trim()
                                        .toLowerCase()
                                        .split(',');
                                    if (
                                        usages.some((u) =>
                                            (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                        ) ||
                                        client.commands.some((cc) =>
                                            cc.usages.some((u) =>
                                                (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                            ),
                                        )
                                    ) {
                                        client.utils.sendTimedMessage(message, 'Belirttiğin isimde komut bulunuyor.');
                                        return;
                                    }

                                    const punishName = modalCollected.fields.getTextInputValue('name');

                                    const createPunishCommand = async (reasons?: IReason[]) => {
                                        const punishType = Math.floor(Math.random() * 10) + 200;
                                        guildData.specialCommands = [
                                            ...(guildData.specialCommands || []),
                                            {
                                                auth: authCollected.values,
                                                description: modalCollected.fields.getTextInputValue('description'),
                                                type: SpecialCommandFlags.Punishment,
                                                usages: usages,
                                                isUn: false,
                                                quickReasons: reasons || [],
                                                logChannel: channelCollected.values[0],
                                                punishName: punishName,
                                                punishRole: roleCollected.values[0],
                                                punishType,
                                            },
                                            {
                                                auth: authCollected.values,
                                                description: modalCollected.fields.getTextInputValue('description'),
                                                type: SpecialCommandFlags.Punishment,
                                                usages: usages.map((u) => `un${u}`),
                                                isUn: true,
                                                logChannel: channelCollected.values[0],
                                                punishName: modalCollected.fields.getTextInputValue('name'),
                                                punishRole: roleCollected.values[0],
                                                punishType,
                                            },
                                        ];

                                        await GuildModel.updateOne(
                                            { id: message.guildId },
                                            { $set: { 'moderation.specialCommands': guildData.specialCommands } },
                                            { upsert: true },
                                        );
                                    };

                                    const reasonRow = new ActionRowBuilder<ButtonBuilder>({
                                        components: [
                                            new ButtonBuilder({
                                                custom_id: 'accept',
                                                label: 'Evet',
                                                emoji: {
                                                    id: '1136280634562719824',
                                                },
                                                style: ButtonStyle.Secondary,
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'deaccept',
                                                label: 'Hayır',
                                                emoji: {
                                                    id: '1136280637507108874',
                                                },
                                                style: ButtonStyle.Secondary,
                                            }),
                                        ],
                                    });

                                    modalCollected.deferUpdate();
                                    channelCollected.editReply({
                                        content: 'Komut menülü mü olsun?',
                                        components: [reasonRow],
                                    });

                                    const reasonCollected = await channelMessage.awaitMessageComponent({
                                        time: 1000 * 60 * 10,
                                        componentType: ComponentType.Button,
                                    });
                                    if (reasonCollected) {
                                        if (reasonCollected.customId === 'deaccept') {
                                            createPunishCommand();
                                            reasonCollected.deferUpdate();
                                            channelCollected.editReply({
                                                content: `${bold(usages[0])} adlı komut oluşturuldu.`,
                                                components: [],
                                            });
                                        } else {
                                            let reasons: IReason[] = [];
                                            reasonCollected.deferUpdate();
                                            channelCollected.editReply({
                                                content: '',
                                                components: createRow('Menü İçin Sebep Ekleme', reasons),
                                            });
                                            const reasonCollector =
                                                await channelMessage.createMessageComponentCollector({
                                                    time: 1000 * 60 * 10,
                                                });

                                            reasonCollector.on('collect', async (int: Interaction) => {
                                                if (int.isStringSelectMenu()) {
                                                    reasons = reasons.filter((d) => !int.values.includes(d.value));

                                                    int.reply({
                                                        content: `Başarıyla sebep kaldırıldı.`,
                                                        ephemeral: true,
                                                    });

                                                    channelCollected.editReply({
                                                        components: createRow('Menü İçin Sebep Ekleme', reasons),
                                                    });
                                                }

                                                if (int.isButton() && int.customId === 'add') {
                                                    const rowOne = new ActionRowBuilder<TextInputBuilder>({
                                                        components: [
                                                            new TextInputBuilder({
                                                                customId: 'name',
                                                                label: 'İsim:',
                                                                placeholder: 'Mikrofon-kulaklık hatasını kullanmak',
                                                                max_length: 60,
                                                                required: true,
                                                                style: TextInputStyle.Short,
                                                            }),
                                                        ],
                                                    });

                                                    const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                                                        components: [
                                                            new TextInputBuilder({
                                                                customId: 'time',
                                                                label: 'Süre:',
                                                                placeholder: '1d',
                                                                max_length: 60,
                                                                required: true,
                                                                style: TextInputStyle.Short,
                                                            }),
                                                        ],
                                                    });

                                                    const rowThree = new ActionRowBuilder<TextInputBuilder>({
                                                        components: [
                                                            new TextInputBuilder({
                                                                customId: 'description',
                                                                label: 'Açıklama:',
                                                                placeholder: 'Ceza Süresi: 1 gün',
                                                                max_length: 60,
                                                                required: true,
                                                                style: TextInputStyle.Short,
                                                            }),
                                                        ],
                                                    });

                                                    const rowFour = new ActionRowBuilder<TextInputBuilder>({
                                                        components: [
                                                            new TextInputBuilder({
                                                                customId: 'need-type',
                                                                label: 'Özel:',
                                                                placeholder: 'Resim, Kullanıcı veya Yok',
                                                                max_length: 60,
                                                                required: true,
                                                                style: TextInputStyle.Short,
                                                            }),
                                                        ],
                                                    });

                                                    const modal = new ModalBuilder({
                                                        title: `${punishName} Sebep Ekleme`,
                                                        custom_id: 'modal',
                                                        components: [rowOne, rowTwo, rowThree, rowFour],
                                                    });

                                                    await int.showModal(modal);

                                                    const reasonModalCollector = await int.awaitModalSubmit({
                                                        time: 1000 * 60 * 3,
                                                    });
                                                    if (reasonModalCollector) {
                                                        const timing = ms(
                                                            reasonModalCollector.fields.getTextInputValue('time'),
                                                        );
                                                        if (!timing) {
                                                            int.reply({
                                                                content: 'Geçerli bir süre belirt!',
                                                                ephemeral: true,
                                                            });
                                                            return;
                                                        }

                                                        if (timing < ms('30s') || ms('1y') < timing) {
                                                            reasonModalCollector.reply({
                                                                content:
                                                                    'En fazla 1 yıl veya en az 30 saniye girebilirsin.',
                                                                ephemeral: true,
                                                            });
                                                            return;
                                                        }

                                                        const needType = reasonModalCollector.fields
                                                            .getTextInputValue('need-type')
                                                            .toLowerCase();
                                                        if (!['kullanıcı', 'yok', 'resim'].includes(needType)) {
                                                            reasonModalCollector.reply({
                                                                content: 'Geçerli bir tür belirt!',
                                                                ephemeral: true,
                                                            });
                                                            return;
                                                        }

                                                        reasons.push({
                                                            name: reasonModalCollector.fields.getTextInputValue('name'),
                                                            needType: types[needType]
                                                                ? types[needType]
                                                                : NeedFlags.Disable,
                                                            placeholder:
                                                                reasonModalCollector.fields.getTextInputValue(
                                                                    'description',
                                                                ),
                                                            time: timing,
                                                            value: `${Math.floor(Math.random() * 1000)}`,
                                                        });

                                                        reasonModalCollector.reply({
                                                            content: 'Başarıyla yeni sebep eklendi!',
                                                            ephemeral: true,
                                                        });

                                                        channelCollected.editReply({
                                                            components: createRow('Menü İçin Sebep Ekleme', reasons),
                                                        });
                                                    }
                                                }

                                                if (int.isButton() && int.customId === 'finish') {
                                                    collector.stop('FINISH');
                                                    createPunishCommand(reasons);
                                                    channelCollected.editReply({
                                                        content: `${bold(usages[0])} adlı komut oluşturuldu.`,
                                                        components: [],
                                                    });
                                                }
                                            });

                                            reasonCollector.on('end', (_, reason) => {
                                                if (reason === 'time') channelCollected.deleteReply();
                                            });
                                        }
                                    } else modalCollected.deleteReply();
                                } else channelCollected.deleteReply();
                            } else roleCollected.deleteReply();
                        }
                    }

                    if (typeCollected.values[0] === `${SpecialCommandFlags.Role}`) {
                        const roleRow = new ActionRowBuilder<RoleSelectMenuBuilder>({
                            components: [
                                new RoleSelectMenuBuilder({
                                    custom_id: 'role',
                                    maxValues: 25,
                                    placeholder: 'Rol ara...',
                                }),
                            ],
                        });

                        i.deleteReply();
                        authCollected.reply({
                            content: 'Komutu kullanınca verilecek rolü belirt.',
                            components: [roleRow],
                            ephemeral: true,
                        });

                        const roleMessage = await authCollected.fetchReply();
                        const roleCollected = await roleMessage.awaitMessageComponent({
                            time: 1000 * 60 * 10,
                            componentType: ComponentType.RoleSelect,
                        });
                        if (roleCollected) {
                            const usagesRow = new ActionRowBuilder<TextInputBuilder>({
                                components: [
                                    new TextInputBuilder({
                                        custom_id: 'usages',
                                        label: 'Kullanımlar:',
                                        style: TextInputStyle.Short,
                                        required: true,
                                        placeholder: 'a, a1',
                                    }),
                                ],
                            });

                            const descriptionRow = new ActionRowBuilder<TextInputBuilder>({
                                components: [
                                    new TextInputBuilder({
                                        custom_id: 'description',
                                        label: 'Açıklama:',
                                        style: TextInputStyle.Short,
                                        required: true,
                                        placeholder: 'bla rolünü verir',
                                    }),
                                ],
                            });

                            const modal = new ModalBuilder({
                                custom_id: 'modal',
                                title: 'Kullanım Ekle',
                                components: [usagesRow, descriptionRow],
                            });

                            await roleCollected.showModal(modal);

                            const modalCollected = await roleCollected.awaitModalSubmit({ time: 1000 * 60 * 10 });
                            if (modalCollected) {
                                modalCollected.deferUpdate();

                                const usages = modalCollected.fields
                                    .getTextInputValue('usages')
                                    .trim()
                                    .toLowerCase()
                                    .split(',');
                                if (
                                    usages.some((u) =>
                                        (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                    ) ||
                                    client.commands.some((cc) =>
                                        cc.usages.some((u) =>
                                            (guildData.specialCommands || []).some((c) => c.usages.includes(u)),
                                        ),
                                    )
                                ) {
                                    client.utils.sendTimedMessage(message, 'Belirttiğin isimde komut bulunuyor.');
                                    return;
                                }

                                authCollected.editReply({
                                    content: `${bold(usages[0])} adlı komut başarıyla oluşturuldu.`,
                                    components: [],
                                });

                                //murat special command yapamıyorken

                                guildData.specialCommands = [
                                    ...(guildData.specialCommands || []),
                                    {
                                        auth: authCollected.values,
                                        description: modalCollected.fields.getTextInputValue('description'),
                                        type: SpecialCommandFlags.Role,
                                        usages: usages,
                                        roles: roleCollected.values,
                                    },
                                ];
                            } else authCollected.deleteReply();
                        } else authCollected.deleteReply();
                    }

                    await GuildModel.updateOne(
                        { id: message.guildId },
                        { $set: { 'moderation.specialCommands': guildData.specialCommands } },
                        { upsert: true },
                    );
                    question.edit({ components: [createList(guildData.specialCommands), row] });
                } else i.editReply({ components: [timeFinished] });
            } else i.editReply({ components: [timeFinished] });
        }

        if (i.isStringSelectMenu() && i.customId === 'remove-row') {
            let commands = (guildData.specialCommands || []).filter((c) => c.type !== SpecialCommandFlags.Team);
            commands = commands.filter(
                (c) => !i.values.some((cc) => c.usages.includes(cc) || c.usages.includes(`un${cc}`)),
            );
            guildData.specialCommands = commands;

            await GuildModel.updateOne(
                { id: message.guildId },
                { $set: { 'moderation.specialCommands': guildData.specialCommands } },
                { upsert: true },
            );

            question.edit({ components: [createList(guildData.specialCommands), row] });
            i.reply({
                content: `Başarıyla ${i.values.map((c) => inlineCode(c))} ${
                    i.values.length > 1 ? 'komutları' : 'komutu'
                } kaldırıldı.`,
                ephemeral: true,
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            question.edit({ components: [timeFinished] });
        }
    });
}

function createList(specialCommands: ISpecialCommand[]) {
    const commands = (specialCommands || []).filter((c) => !c.isUn && c.type !== SpecialCommandFlags.Team);
    return new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'remove-row',
                maxValues: commands.length ? commands.length : 1,
                placeholder: 'Özel Komutlar',
                disabled: !commands.length,
                options: commands.length
                    ? commands.map((c) => ({ label: `${c.usages[0]} (${types[c.type]})`, value: c.usages[0] }))
                    : [{ label: 'a', value: 'b' }],
            }),
        ],
    });
}

function createRow(name: string, quickReasons: IReason[]) {
    return [
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: !(quickReasons || []).length,
                    placeholder: name,
                    max_values: (quickReasons || []).length === 0 ? 1 : (quickReasons || []).length,
                    options: (quickReasons || []).length
                        ? quickReasons.map((r) => ({
                              label: r.name,
                              value: r.value,
                              description: r.placeholder,
                          }))
                        : [{ label: 'test', value: 'a' }],
                }),
            ],
        }),
        new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'add',
                    label: 'Ekle',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'finish',
                    label: 'Bitir',
                    disabled: !quickReasons.length,
                    style: ButtonStyle.Success,
                }),
            ],
        }),
    ];
}
