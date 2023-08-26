import { GuildModel, IWarnRoles } from '@/models';
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

export interface IWarnRoleOption {
    name: string;
    value: string;
    description: string;
    type: string;
}

export async function warnRolesHandler(
    client: Client,
    message: Message,
    option: IWarnRoleOption,
    guildData:Moderation.IGuildData,
    question: Message,
    menuType: 'general' | 'register' | 'penal',
    authorId: string,
) {
    await question.edit({
        content: '',
        components: createRow(message, option.name, guildData.warnRoles),
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
                        customId: 'count',
                        label: 'Adet:',
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
                const count = Number(modalCollector.fields.getTextInputValue('count'));
                if (!count) {
                    modalCollector.reply({
                        content: 'Geçerli bir sayı belirt!',
                        ephemeral: true,
                    });
                    return;
                }

                if (
                    (guildData.warnRoles || [])
                        .filter((r) => message.guild.roles.cache.has(r.role))
                        .some((r) => r.count === count)
                ) {
                    modalCollector.reply({
                        content: 'Belirtilen uyarı sayısına sahip uyarı rolü bulunuyor.',
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
                    content: `${bold(count.toString())} adet uyarıya ulaşılınca verilecek rolü seç.`,
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
                    const newData = (guildData.warnRoles || []) as IWarnRoles[];
                    newData.push({
                        count: count,
                        role: roleCollected.values[0],
                    });
                    guildData.warnRoles = newData;

                    await GuildModel.updateOne(
                        { id: message.guildId },
                        {
                            $set: {
                                'moderation.warnRoles': guildData.warnRoles,
                            },
                        },
                    );

                    modalCollector.editReply({
                        content: `Başarıyla ${bold(count.toString())} adet susturmaya ulaşan kullanıcılar ${roleMention(
                            roleCollected.values[0],
                        )} rolünü alacak.`,
                        components: [],
                    });

                    question.edit({
                        components: createRow(message, option.name, guildData.warnRoles),
                    });
                } else {
                    modalCollector.deleteReply();
                }
            }
        }

        if (i.isStringSelectMenu()) {
            const newData = (guildData.warnRoles || []) as IWarnRoles[];
            guildData.warnRoles = newData.filter((d) => !i.values.includes(d.count.toString()));

            await GuildModel.updateOne(
                { id: message.guildId },
                {
                    $set: {
                        'moderation.warnRoles': guildData.warnRoles,
                    },
                },
            );

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayardan kaldırıldı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(message, option.name, guildData.warnRoles),
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

function createRow(message: Message, name: string, warns: IWarnRoles[]) {
    const warnRoles = (warns || []).filter((r) => message.guild.roles.cache.has(r.role));
    return [
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: !warnRoles.length,
                    placeholder: name,
                    max_values: warnRoles.length === 0 ? 1 : warnRoles.length,
                    options: warnRoles.length
                        ? warnRoles.map((r) => ({
                              label: message.guild.roles.cache.get(r.role).name,
                              value: `${r.count}`,
                              description: `${r.count}. uyarı`,
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
