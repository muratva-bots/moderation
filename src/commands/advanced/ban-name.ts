import {
    bold,
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['banisim', 'isimyasakla', 'isim-ban', 'isimban'],
    description: 'Kullanıcı adında belirtilen karakterleri barındıran kullanıcıları sunucudan yasaklar.',
    examples: ['isimyasakla <banlanacak karakterler>'],
    checkPermission: ({ message }) => message.author.id === message.guild.ownerId,
    execute: async ({ client, message, args }) => {
        const name = args.join(' ');
        if (!name.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcı adında ne bulunan kullanıcıları banlamak istiyorsunuz?');
            return;
        }

        const members = await message.guild.members.fetch();
        const nameMembers = members.filter((m) => m.user.username.toLowerCase().includes(name.toLowerCase()));

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'accepted',
                    emoji: { id: '1118109828926144573' },
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'cancel',
                    emoji: { id: '1118109825386160198' },
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `Kullanıcı adında ${inlineCode(name)} içeren kullanıcılar yasaklansın mı? (${bold(
                        `${nameMembers.size} üye`,
                    )})`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.isButton() && i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });
        if (collected) {
            if (collected.customId === 'cancel') {
                question.edit({
                    embeds: [embed.setDescription('İşlem iptal edildi.')],
                    components: [],
                });
                return;
            }
        } else {
            question.edit({
                embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                components: [],
            });
            return;
        }

        question.edit({
            embeds: [
                embed.setDescription(
                    `Kullanıcı adında ${inlineCode(name)} içeren kullanıcılar yasaklanıyor ${client.utils.getEmoji(
                        'loading',
                    )}`,
                ),
            ],
            components: [],
        });

        for (const [id] of nameMembers) message.guild.members.ban(id);

        question.edit({
            embeds: [
                embed.setDescription(
                    `${inlineCode(name)} ismine sahip kullanıcılar yasaklandı ${client.utils.getEmoji('greentick')}`,
                ),
            ],
        });
    },
};

export default Command;
