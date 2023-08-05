import { GuildModel, IMonthlyRole, ModerationClass } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Interaction,
    Message,
    ModalBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    bold,
    roleMention,
} from 'discord.js';
import { Client } from '@/structures';
import createMenu from './createMenu';
import ms from 'ms';

export interface IMonthlyOption {
    name: string;
    value: string;
    description: string;
    type: string;
}

export async function monthlyRolesHandler(
    client: Client,
    message: Message,
    option: IMonthlyOption,
    guildData: ModerationClass,
    question: Message,
    menuType: 'general' | 'register' | 'penal',
    authorId: string,
) {
    await question.edit({
        content: '',
        components: createRow(message, option.name, guildData.monthlyRoles || []),
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
            createMenu(client, message, authorId, question, menuType, guildData);
            return;
        }

        if (i.isButton() && i.customId === 'add') {
            const rowOne = new ActionRowBuilder<TextInputBuilder>({
                components: [
                    new TextInputBuilder({
                        customId: 'time',
                        label: 'Zaman:',
                        max_length: 60,
                        required: true,
                        style: TextInputStyle.Short,
                    }),
                ],
            });
            const modal = new ModalBuilder({
                title: `${option.name} Ayara Ekleme`,
                custom_id: 'modal',
                components: [rowOne],
            });

            await i.showModal(modal);

            const modalCollector = await i.awaitModalSubmit({
                filter,
                time: 1000 * 60 * 3,
            });
            if (modalCollector) {
                const timing = ms(modalCollector.fields.getTextInputValue('time'));
                if (!timing) {
                    modalCollector.reply({
                        content: 'Geçerli bir süre belirt!',
                        ephemeral: true,
                    });
                    return;
                }

                if (timing < ms('30s') || ms('1y') < timing) {
                    modalCollector.reply({
                        content: 'En fazla 1 yıl veya en az 30 saniye girebilirsin.',
                        ephemeral: true,
                    });
                    return;
                }

                if (
                    (guildData.monthlyRoles || [])
                        .filter((r) => message.guild.roles.cache.has(r.role))
                        .some((r) => r.time === timing)
                ) {
                    modalCollector.reply({
                        content: 'Belirtilen ay sayısına sahip ay rolü bulunuyor.',
                        ephemeral: true,
                    });
                    return;
                }

                const roleSelect = new ActionRowBuilder<RoleSelectMenuBuilder>({
                    components: [
                        new RoleSelectMenuBuilder({
                            custom_id: 'role',
                            placeholder: 'Rol ara...',
                        }),
                    ],
                });

                await modalCollector.reply({
                    content: `${bold(ms(timing))} zamanına ulaşılınca verilecek rolü seç.`,
                    ephemeral: true,
                    components: [roleSelect],
                });

                const roleQuestion = await modalCollector.fetchReply();
                const roleCollected = await roleQuestion.awaitMessageComponent({
                    time: 1000 * 60 * 3,
                    componentType: ComponentType.RoleSelect,
                });
                if (roleCollected) {
                    roleCollected.deferUpdate();
                    const newData = (guildData.monthlyRoles || []) as IMonthlyRole[];
                    newData.push({
                        time: timing,
                        role: roleCollected.values[0],
                    });
                    guildData.monthlyRoles = newData;

                    await GuildModel.updateOne(
                        { id: message.guildId },
                        {
                            $set: {
                                'moderation.monthlyRoles': guildData.monthlyRoles,
                            },
                        },
                    );

                    modalCollector.editReply({
                        content: `Başarıyla ${bold(ms(timing))} zamanına ulaşan kullanıcılar ${roleMention(
                            roleCollected.values[0],
                        )} rolünü alacak.`,
                        components: [],
                    });

                    question.edit({
                        components: createRow(message, option.name, guildData.monthlyRoles),
                    });
                } else {
                    modalCollector.deleteReply();
                }
            }
        }

        if (i.isStringSelectMenu()) {
            const newData = (guildData.monthlyRoles || []) as IMonthlyRole[];
            guildData.monthlyRoles = newData.filter((d) => !i.values.includes(d.time.toString()));

            await GuildModel.updateOne(
                { id: message.guildId },
                {
                    $set: {
                        'moderation.monthlyRoles': guildData.monthlyRoles,
                    },
                },
            );

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayardan kaldırıldı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(message, option.name, guildData.monthlyRoles),
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
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

            question.edit({ components: [timeFinished] });
        }
    });
}

function createRow(message: Message, name: string, roles: IMonthlyRole[]) {
    const warnRoles = (roles || []).filter((r) => message.guild.roles.cache.has(r.role));
    return [
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: !warnRoles.length,
                    placeholder: name,
                    max_values: roles.length === 0 ? 1 : roles.length,
                    options: roles.length
                        ? roles.map((r) => ({
                              label: message.guild.roles.cache.get(r.role).name,
                              value: `${r.time}`,
                              description: ms(r.time),
                          }))
                        : [{ label: 'test', value: 'a' }],
                }),
            ],
        }),
        new ActionRowBuilder<ButtonBuilder>({
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
        }),
    ];
}
