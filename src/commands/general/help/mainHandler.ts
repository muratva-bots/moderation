import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import categoryHandler from './categoryHandler';

const titles = {
    advanced: 'Yetkili Komutları',
    general: 'Genel Komutlar',
    penal: 'Ceza Komutları',
    register: 'Kayıt Komutları',
};

async function mainHandler(client: Client, message: Message, guildData: Moderation.IGuildData, botMessage?: Message) {
    const query = {
        content: 'Bakacağınız kategoriyi seçin.',
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        custom_id: 'category',
                        placeholder: 'Kategoriyi seç!',
                        options: [
                            ...Object.keys(titles).map((c) => ({
                                label: titles[c],
                                value: c,
                                emoji: { id: '1134953137262841906' },
                            })),
                            guildData.specialCommands?.length
                                ? {
                                      label: 'Sunucuya Özel Komutlar',
                                      value: 'special-commands',
                                      emoji: { id: '1134953137262841906' },
                                  }
                                : undefined,
                        ].filter(Boolean),
                    }),
                ],
            }),
        ],
    };
    const question = botMessage ? await botMessage.edit(query) : await message.channel.send(query);

    const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
        max: 1,
        componentType: ComponentType.StringSelect,
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
        i.deferUpdate();
        categoryHandler(client, message, question, i.values[0], guildData);
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

export default mainHandler;
