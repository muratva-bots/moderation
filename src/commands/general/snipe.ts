import {
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextChannel,
    hyperlink,
    messageLink,
} from 'discord.js';

const formatSnipe = (snipe: Moderation.ISnipe) =>
    `${snipe.author.username}: ${
        snipe.content.length
            ? snipe.content.length > 50
                ? snipe.content.slice(0, 50) + '...'
                : snipe.content
            : 'Resim bulunuyor.'
    }`;

const Snipe: Moderation.ICommand = {
    usages: ['snipe'],
    description: 'Kanalda silinen en son mesajı/resmi görüntülersiniz.',
    examples: ['snipe'],
    chatUsable: true,
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.ManageMessages),
    execute: async ({ client, message, args }) => {
        const channel = (message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel) as TextChannel;
        if (!channel.isTextBased()) return client.utils.sendTimedMessage(message, 'Yazı kanalı belirtmelisin.');

        const deletedSnipes = client.snipes.deleted.get(channel.id) || [];
        const updatedSnipes = client.snipes.updated.get(channel.id) || [];
        if (!deletedSnipes.length && !updatedSnipes.length) {
            client.utils.sendTimedMessage(message, 'Kanalda herhangi bir işlem yapılmamış.');
            return;
        }

        const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
        if (deletedSnipes.length) {
            components.push(
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            customId: 'deleted',
                            options: deletedSnipes.map((snipe) => ({ label: formatSnipe(snipe), value: snipe.id })),
                            placeholder: 'Silinen mesajları görmek için tıkla!',
                        }),
                    ],
                }),
            );
        }

        if (updatedSnipes.length) {
            components.push(
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            customId: 'updated',
                            options: updatedSnipes.map((snipe) => ({ label: formatSnipe(snipe), value: snipe.id })),
                            placeholder: 'Düzenlenen mesajları görmek için tıkla!',
                        }),
                    ],
                }),
            );
        }

        const question = await message.channel.send({
            content: 'Hangi işlemi görmek istediğini seç.',
            components: components,
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            let snipe: Moderation.ISnipe;
            if (i.customId === 'updated') snipe = updatedSnipes.find((snipe) => snipe.id === i.values[0]);
            if (i.customId === 'deleted') snipe = deletedSnipes.find((snipe) => snipe.id === i.values[0]);

            if (!snipe) {
                i.reply({ content: 'Bir aksilik oluştu...', ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder({
                color: client.utils.getRandomColor(),
                timestamp: snipe.timestamp,
                description: snipe.content || 'Mesaj içeriği bulunmuyor.',
                author: {
                    name: snipe.author.username,
                    iconURL: snipe.author.displayAvatarURL({ forceStatic: true, size: 4096 }),
                },
            });

            if (snipe.attachments.size > 1) {
                embed.addFields([
                    {
                        name: 'Resimler',
                        value: snipe.attachments.map((snipe) => `${hyperlink('Resim', snipe.proxyURL)}`).join(', '),
                    },
                ]);
            }

            if (snipe.attachments.size === 1) embed.setImage(snipe.attachments.first().proxyURL);

            if (i.customId === 'updated') {
                embed.addFields([
                    {
                        name: 'Mesaj Linki',
                        value: messageLink(channel.id, snipe.id),
                    },
                ]);
            }

            i.reply({ embeds: [embed], ephemeral: true });
        });

        collector.on('end', () => {
            question.delete();
        });
    },
};

export default Snipe;
