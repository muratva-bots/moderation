import { GuildModel } from '@/models';
import { Client } from '@/structures';
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
    inlineCode,
} from 'discord.js';
import ms from 'ms';
import createMenu from './createMenu';

export interface ILimitOption {
    name: string;
    value: string;
    description: string;
    type: string;
}

export async function limitHandler(
    client: Client,
    message: Message,
    option: ILimitOption,
    guildData: Moderation.IGuildData,
    question: Message,
    menuType: 'general' | 'register' | 'penal',
    authorId: string,
) {
    await question.edit({
        content: '',
        components: createRow(
            option.name,
            guildData[`${option.value}LimitTime`],
            guildData[`${option.value}LimitCount`],
        ),
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

        if (i.isButton() && i.customId === 'change') {
            const rowOne = new ActionRowBuilder<TextInputBuilder>({
                components: [
                    new TextInputBuilder({
                        customId: 'time',
                        value: guildData[`${option.value}LimitTime`]
                            ? ms(guildData[`${option.value}LimitTime`])
                            : undefined,
                        label: 'Süre:',
                        max_length: 60,
                        required: true,
                        style: TextInputStyle.Short,
                    }),
                ],
            });

            const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                components: [
                    new TextInputBuilder({
                        customId: 'count',
                        value: guildData[`${option.value}LimitCount`] || undefined,
                        label: 'Sayı:',
                        max_length: 60,
                        required: true,
                        style: TextInputStyle.Short,
                    }),
                ],
            });

            const modal = new ModalBuilder({
                title: `${option.name} Ayarını Değiştirme`,
                custom_id: 'modal',
                components: [rowOne, rowTwo],
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

                guildData[`${option.value}LimitTime`] = timing;
                guildData[`${option.value}LimitCount`] = modalCollector.fields.getTextInputValue('count');

                await GuildModel.updateOne(
                    { id: message.guildId },
                    {
                        $set: {
                            [`moderation.${option.value}LimitCount`]: guildData[`${option.value}LimitCount`],
                            [`moderation.${option.value}LimitTime`]: guildData[`${option.value}LimitTime`],
                        },
                    },
                    { upsert: true },
                );

                modalCollector.reply({
                    content: `Başarıyla ${bold(option.name)} adlı ayar ${inlineCode(
                        ms(guildData[`${option.value}LimitCount`]),
                    )} sayıda bir ${inlineCode(ms(guildData[`${option.value}LimitTime`]))} şeklinde ayarlandı.`,
                    ephemeral: true,
                });

                question.edit({
                    components: createRow(
                        option.name,
                        guildData[`${option.value}LimitTime`],
                        guildData[`${option.value}LimitCount`],
                    ),
                });
            }
        }

        if (i.isButton() && i.customId === 'reset') {
            guildData[`${option.value}LimitCount`] = undefined;
            guildData[`${option.value}LimitTime`] = undefined;

            await GuildModel.updateOne(
                { id: message.guildId },
                {
                    $unset: {
                        [`moderation.${option.value}LimitCount`]: 1,
                        [`moderation.${option.value}LimitTime`]: 1,
                    },
                },
                { upsert: true },
            );

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayar sıfırlandı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(
                    option.name,
                    guildData[`${option.value}LimitTime`],
                    guildData[`${option.value}LimitCount`],
                ),
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

function createRow(name: string, time: number, count: number) {
    return [
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data',
                    disabled: true,
                    placeholder: `${name} Zaman: ${time ? ms(time) : 'Ayarlanmamış!'}`,
                    options: [{ label: 'test', value: 'a' }],
                }),
            ],
        }),
        new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'data2',
                    disabled: true,
                    placeholder: `${name} Sayı: ${count || 'Ayarlanmamış!'}`,
                    options: [{ label: 'test', value: 'a' }],
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
                    custom_id: 'change',
                    label: 'Değiştir',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'reset',
                    label: 'Sıfırla',
                    style: ButtonStyle.Success,
                }),
            ],
        }),
    ];
}
