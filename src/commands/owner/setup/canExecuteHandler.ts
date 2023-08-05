import { GuildModel, ICanExecute, ModerationClass } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Interaction,
    MentionableSelectMenuBuilder,
    Message,
    StringSelectMenuBuilder,
    bold,
    inlineCode,
} from 'discord.js';
import mainHandler from './mainHandler';

export async function canExecuteHandler(
    client: Client,
    message: Message,
    guildData: ModerationClass,
    question: Message,
) {
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
        content: '',
        components: [createList(guildData.canExecutes), row],
    });

    const filter = (i: Interaction) => i.user.id === message.author.id;
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
            const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
            const splitedCommands = client.utils.chunkArray(
                client.commands
                    .filter((c) => !c.isDisabled)
                    .map((c) => ({ name: c.usages[0], description: c.description })),
                25,
            );
            for (const commands of splitedCommands) {
                components.push(
                    new ActionRowBuilder<StringSelectMenuBuilder>({
                        components: [
                            new StringSelectMenuBuilder({
                                custom_id: `type-${Math.random()}`,
                                placeholder: 'Komutu seç!',
                                options: commands.map((c) => ({
                                    label: c.name,
                                    description:
                                        c.description.length > 100 ? `${c.description.slice(0, 97)}...` : c.description,
                                    value: c.name,
                                })),
                            }),
                        ],
                    }),
                );
            }

            i.reply({
                ephemeral: true,
                components,
            });

            const interactionMessage = await i.fetchReply();
            const commandCollected = await interactionMessage.awaitMessageComponent({
                time: 1000 * 60 * 10,
                componentType: ComponentType.StringSelect,
            });
            if (commandCollected) {
                const specialPassRow = new ActionRowBuilder<MentionableSelectMenuBuilder>({
                    components: [
                        new MentionableSelectMenuBuilder({
                            custom_id: 'mentionable',
                            max_values: 25,
                            placeholder: 'Kullanıcı veya rol ara...',
                        }),
                    ],
                });

                commandCollected.deferUpdate();
                i.editReply({
                    content: 'Komutu kimlerin kullanabileceğini seç.',
                    components: [specialPassRow],
                });

                const specialPassCollected = await interactionMessage.awaitMessageComponent({
                    time: 1000 * 60 * 10,
                    componentType: ComponentType.MentionableSelect,
                });
                if (specialPassCollected) {
                    guildData.canExecutes = [
                        ...(guildData.canExecutes || []),
                        { name: commandCollected.values[0], specialPass: specialPassCollected.values },
                    ];

                    await GuildModel.updateOne(
                        { id: message.guildId },
                        { $set: { 'moderation.canExecutes': guildData.canExecutes } },
                        { upsert: true },
                    );

                    specialPassCollected.deferUpdate();
                    i.editReply({
                        content: `${bold(commandCollected.values[0])} adlı komuta özel ayar oluşturuldu.`,
                        components: [],
                    });
                } else i.deleteReply();
            } else i.deleteReply();
        }

        if (i.isStringSelectMenu() && i.customId === 'remove-row') {
            guildData.canExecutes = (guildData.canExecutes || []).filter((c) => !i.values.some((cc) => c.name === cc));

            await GuildModel.updateOne(
                { id: message.guildId },
                { $set: { 'moderation.canExecutes': guildData.canExecutes } },
                { upsert: true },
            );

            question.edit({ components: [createList(guildData.canExecutes), row] });
            i.reply({
                content: `Başarıyla ${i.values.map((c) => inlineCode(c))} ${
                    i.values.length > 1 ? 'komutları' : 'komutu'
                } kaldırıldı.`,
                ephemeral: true,
            });
        }
    });
}

function createList(canExecutes: ICanExecute[]) {
    const commands = canExecutes || [];
    return new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'remove-row',
                maxValues: commands.length ? commands.length : 1,
                placeholder: 'Komuta Özel Ayarlar',
                disabled: !commands.length,
                options: commands.length
                    ? commands.map((c) => ({ label: c.name, value: c.name }))
                    : [{ label: 'a', value: 'b' }],
            }),
        ],
    });
}
