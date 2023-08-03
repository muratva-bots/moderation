import { SETTINGS } from '@/assets';
import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Team,
    StringSelectMenuInteraction,
    ComponentType,
    EmbedBuilder,
    codeBlock,
    Message,
    TextChannel,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import ms from 'ms';

const titles = {
    general: 'genel ayarları',
    register: 'kayıt ayarları',
    penal: 'ceza ayarları',
};

const Command: Moderation.ICommand = {
    usages: ['ayarlar', 'ayar', 'settings', 'settings'],
    description: 'Bot kurulumlarını görürsünüz.',
    examples: ['ayarlar <menüden işlem seçin>'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return message.guild.ownerId === message.author.id || ownerID === message.author.id;
    },
    execute: async ({ client, message, guildData }) => {
        createCollector(
            client,
            message,
            generateSettingsDescription(message, message.guild.name, titles['general'], SETTINGS['general'], guildData),
            guildData,
        );
    },
};

export default Command;

async function createCollector(client: Client, message: Message, content: string, guildData: ModerationClass) {
    const defaultRow = new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'ayarlar',
                placeholder: 'Ayar kategorilerini seç!',
                options: [
                    {
                        label: 'Genel Ayarlar',
                        value: 'general',
                        description: 'Sunucunun ayarlanmış genel ayarlarını kontrol edersiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Kayıt Ayarları',
                        value: 'register',
                        description: 'Sunucunun ayarlanmış kayıt ayarlarını kontrol edersiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                    {
                        label: 'Ceza Ayarları',
                        value: 'penal',
                        description: 'Sunucunun ayarlanmış ceza ayarlarını kontrol edersiniz.',
                        emoji: {
                            id: '1134953137262841906',
                        },
                    },
                ],
            }),
        ],
    });

    const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
    const oldMessages: string[] = [];
    const texts = client.utils.splitMessage(content);
    const lastText = texts[texts.length - 1];

    const splitedTexts = texts.slice(0, texts.length - 2);
    if (splitedTexts.length) {
        for (const text of splitedTexts) {
            const msg = await message.channel.send({ embeds: [embed.setDescription(codeBlock('yaml', text))] });
            oldMessages.push(msg.id);
        }
    }

    const question = await message.channel.send({
        embeds: [embed.setDescription(codeBlock('yaml', lastText))],
        components: [defaultRow],
    });

    const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id && i.isStringSelectMenu();
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
        max: 1,
        componentType: ComponentType.StringSelect,
    });

    collector.on('collect', (i: StringSelectMenuInteraction) => {
        i.deferUpdate();
        collector.stop('FINISH');

        question.delete();
        if (oldMessages.length) (message.channel as TextChannel).bulkDelete(oldMessages, true);

        createCollector(
            client,
            message,
            generateSettingsDescription(
                message,
                message.guild.name,
                titles[i.values[0]],
                SETTINGS[i.values[0]],
                guildData,
            ),
            guildData,
        );
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
}

function generateSettingsDescription(
    message: Message,
    guildName: string,
    title: string,
    settings,
    guildData: ModerationClass,
) {
    return [
        `# ${guildName} adlı sunucunun ${title}:`,
        settings
            .map((s) => {
                if (s.type === 'string' && !s.isMultiple)
                    return `→ ${s.name}: ${guildData[s.value] || 'Ayarlanmamış!'}`;
                if (s.type === 'string' && s.isMultiple)
                    return `→ ${s.name}: ${
                        guildData[s.value] && guildData[s.value].length
                            ? guildData[s.value].join(', ')
                            : 'Ayarlanmamış!'
                    }`;
                if (s.type === 'boolean') return `→ ${s.name}: ${guildData[s.value] ? 'Açık!' : 'Kapalı!'}`;
                if (s.type === 'reason') return `→ ${s.name}: ${(guildData[s.value] || []).length || 'Ayarlanmamış!'}`;
                if (s.type === 'channel')
                    return `→ ${s.name}: ${
                        message.guild.channels.cache.has(guildData[s.value])
                            ? message.guild.channels.cache.get(guildData[s.value]).name
                            : 'Ayarlanmamış!'
                    }`;
                if (s.type === 'limit') {
                    return [
                        `→ ${s.name} Zaman: ${
                            guildData[`${s.value}LimitTime`] ? ms(guildData[`${s.value}LimitTime`]) : 'Ayarlanmamış!'
                        }`,
                        `→ ${s.name} Sayı: ${
                            guildData[`${s.value}LimitCount`] ? guildData[`${s.value}LimitCount`] : 'Ayarlanmamış!'
                        }`,
                    ].join('\n');
                }
                if (s.type === 'number') return `→ ${s.name}: ${guildData[s.value] ? guildData[s.value] : 'Yok!'}`;
                if (s.type === 'role') {
                    const roles = [...(s.isMultiple ? guildData[s.value] || [] : [guildData[s.value]])].filter((r) =>
                        message.guild.roles.cache.has(r),
                    ) as string[];
                    return `→ ${s.name}: ${
                        roles.length
                            ? roles.map((r) => message.guild.roles.cache.get(r).name).join(', ')
                            : 'Ayarlanmamış!'
                    }`;
                }
            })
            .join('\n'),
    ].join('\n');
}
