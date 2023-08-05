// name: string;
// value: string;
// placeholder: string;
// time: number;
// needType: NeedFlags;

import { GuildModel, IMaxMuteOperations, IReason, ModerationClass } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Interaction,
    Message,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    bold,
} from 'discord.js';
import { Client } from '@/structures';
import createMenu from './createMenu';
import ms from 'ms';
import { NeedFlags } from '@/enums';

const types = {
    resim: NeedFlags.Image,
    kullanıcı: NeedFlags.User,
};

export interface IQuickReasonOption {
    name: string;
    value: string;
    description: string;
    type: string;
}

export async function reasonHandler(
    client: Client,
    message: Message,
    option: IQuickReasonOption,
    guildData: ModerationClass,
    question: Message,
    menuType: 'general' | 'register' | 'penal',
    authorId: string,
) {
    await question.edit({
        content: '',
        components: createRow(option.name, guildData[option.value]),
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
                        customId: 'clear',
                        label: 'Önceki Cezaları Silinsin Mi:',
                        placeholder: 'Evet veya Hayır',
                        required: true,
                        style: TextInputStyle.Short,
                    }),
                ],
            });

            const modal = new ModalBuilder({
                title: `${option.name} Ayara Yeni Sebep Ekleme`,
                custom_id: 'modal',
                components: [rowOne, rowTwo, rowThree],
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

                const clear = modalCollector.fields.getTextInputValue('clear').toLowerCase();
                if (!['evet', 'hayır'].includes(clear)) {
                    i.reply({
                        content: 'Önceki cezaları için durum belirt!',
                        ephemeral: true,
                    });
                    return;
                }

                const count = Number(modalCollector.fields.getTextInputValue('count'));
                if (!count) {
                    modalCollector.reply({
                        content: 'Geçerli bir sayı belirt!',
                        ephemeral: true,
                    });
                    return;
                }

                const newData = (guildData[option.value] || []) as IMaxMuteOperations[];
                newData.push({
                    clear: clear === 'evet',
                    count: count,
                    time: timing,
                });
                guildData[option.name] = newData;

                await GuildModel.updateOne(
                    { id: message.guildId },
                    {
                        $set: {
                            [`moderation.${option.value}`]: guildData[option.value],
                        },
                    },
                );

                modalCollector.reply({
                    content: `Başarıyla ${bold(count.toString())} adet susturmaya ulaşan kullanıcılar ${bold(
                        ms(timing),
                    )} süre boyunca ceza yiyecek${clear ? ' ve cezaları silinecek' : ''}.`,
                    ephemeral: true,
                });

                question.edit({
                    components: createRow(option.name, guildData[option.value]),
                });
            }
        }

        if (i.isStringSelectMenu()) {
            const newData = (guildData[option.value] || []) as IReason[];
            guildData[option.value] = newData.filter((d) => !i.values.includes(d.value));

            await GuildModel.updateOne(
                { id: message.guildId },
                {
                    $set: {
                        [`moderation.${option.value}`]: guildData[option.value],
                    },
                },
            );

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayardan kaldırıldı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(option.name, guildData[option.value]),
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

function createRow(name: string, maxMute: IMaxMuteOperations[]) {
    return [
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: !(maxMute || []).length,
                    placeholder: name,
                    max_values: (maxMute || []).length === 0 ? 1 : (maxMute || []).length,
                    options: (maxMute || []).length
                        ? maxMute.map((r) => ({
                              label: `${r.count}`,
                              value: `${r.count}`,
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
