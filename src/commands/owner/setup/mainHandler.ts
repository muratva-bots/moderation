import { GuildModel } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ComponentType,
    Message,
    StringSelectMenuInteraction,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import createMenu from './createMenu';
import { specialCommandHandler } from './specialCommandHandler';
import { canExecuteHandler } from './canExecuteHandler';

async function mainHandler(client: Client, message: Message, guildData: Moderation.IGuildData, botMessage?: Message) {
    const defaultRow = new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'setup',
                placeholder: 'Ayarlayacağınız ayarı seçin!',
                options: [
                    {
                        label: 'Genel Ayarlar',
                        value: 'general',
                        description: 'Sunucunun genel ayarlarını değiştirirsiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Kayıt Ayarları',
                        value: 'register',
                        description: 'Sunucunun kayıt ayarlarını değiştirirsiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Ceza Ayarları',
                        value: 'penal',
                        description: 'Sunucunun ceza ayarlarını değiştirirsiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Özel Komut Ayarları',
                        value: 'special-command',
                        description: 'Sunucunun özel komut ayarlarını değiştirirsiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Komuta Özel Ayarlar',
                        value: 'can-execute',
                        description: 'Komuta özel ayar ayarlarsınız.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Ayarları Sıfırla',
                        value: 'reset',
                        description: 'Sunucunun ayarlanmış bütün ayarlarını sıfırlar.',
                        emoji: {
                            id: '1134953250748117082',
                        },
                    },
                ],
            }),
        ],
    });

    const question = await (botMessage
        ? botMessage.edit({
              content: 'Aşağıdaki menüden düzenleyeceğiniz ayarı seçiniz.',
              embeds: [],
              components: [defaultRow],
          })
        : message.channel.send({
              content: 'Aşağıdaki menüden düzenleyeceğiniz ayarı seçiniz.',
              embeds: [],
              components: [defaultRow],
          }));

    const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
    const collector = await (question as Message).createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
        max: 1,
        componentType: ComponentType.StringSelect,
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
        i.deferUpdate();
        collector.stop('FINISH');

        const value = i.values[0];
        if (value === 'reset') {
            await GuildModel.deleteOne({ id: message.guildId });
            const newDocument = await GuildModel.create({ id: message.guildId });
            client.servers.set(message.guildId, { ...newDocument.moderation, registerPoints: 70, ranks: [] });
            guildData = client.servers.get(message.guildId);

            question.edit({ content: 'Sunucunun ayarları varsayalına çevirildi.', components: [] });
        }

        if (value === 'general') createMenu(client, message, message.author.id, question, 'general', guildData);
        if (value === 'register') createMenu(client, message, message.author.id, question, 'register', guildData);
        if (value === 'penal') createMenu(client, message, message.author.id, question, 'penal', guildData);
        if (value === 'special-command') specialCommandHandler(message.author.id, client, message, question, guildData);
        if (value === 'can-execute') canExecuteHandler(client, message, guildData, question);
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
