import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Message,
    bold,
    inlineCode,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unbanall', 'unban-all'],
    description: 'Belirtilen isimleri veya sunucudaki yasakların hepsini kaldırır.',
    examples: ['unbanall <kullanıcı adı> veya unbanall butonlardan işleminizi seçin.'],
    checkPermission: ({ message }) => message.author.id === message.guild.ownerId,
    execute: async ({ client, message, args }) => {
        const bans = await message.guild.bans.fetch();
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const penalBans = await PenalModel.find({
            guild: message.guildId,
            activity: true,
            $or: [{ type: PenalFlags.ForceBan }, { type: PenalFlags.Ban }],
        }).select('user');

        const filter = args.join(' ');
        if (filter.length && filter.trim().length > 0) {
            const filteredBans = bans.filter(
                (b) =>
                    !penalBans.some((p) => p.user === b.user.id) &&
                    b.user.username.toLowerCase().includes(filter.toLowerCase()),
            );
            if (!filteredBans.size) {
                return client.utils.sendTimedMessage(
                    message,
                    `Kullanıcını adında ${inlineCode(filter)} içeren yasaklı üye bulunmuyor`,
                );
            }

            const waitingMessage = await removeApproval(
                message,
                `Kullanıcı adında ${inlineCode(filter)} içeren kullanıcıların yasağı kaldırılsın mı? (${bold(
                    `${filteredBans.size} üye`,
                )})`,
                embed,
            );
            if (!waitingMessage) return;

            waitingMessage.edit({
                embeds: [
                    embed.setDescription(
                        `Kullanıcı adında ${inlineCode(
                            filter,
                        )} içeren kullanıcıların yasağı kaldırılıyor ${client.utils.getEmoji('loading')}`,
                    ),
                ],
                components: [],
            });
            for (const [, ban] of filteredBans) message.guild.members.unban(ban.user);
            waitingMessage.edit({
                embeds: [
                    embed.setDescription(
                        `Kullanıcı adında ${inlineCode(
                            filter,
                        )} içeren kullanıcıların yasağı kaldırıldı. ${client.utils.getEmoji('greentick')}`,
                    ),
                ],
            });
            return;
        }

        const filteredBans = bans.filter((b) => !penalBans.some((p) => p.user === b.user.id));
        if (!filteredBans.size) {
            return client.utils.sendTimedMessage(message, 'Sunucuda yasaklı üye bulunmuyor.');
        }

        const waitingMessage = await removeApproval(
            message,
            `Sunucudaki bütün yasaklar kaldırılsın mı? (${bold(`${filteredBans.size} üye`)})`,
            embed,
        );
        if (!waitingMessage) return;

        waitingMessage.edit({
            embeds: [
                embed.setDescription(`Sunucudaki bütün yasaklar kaldırılıyor ${client.utils.getEmoji('loading')}`),
            ],
            components: [],
        });
        for (const [, ban] of filteredBans) message.guild.members.unban(ban.user);
        waitingMessage.edit({
            embeds: [
                embed.setDescription(`Sunucudaki bütün yasaklar kaldırıldı. ${client.utils.getEmoji('greentick')}`),
            ],
        });
    },
};

export default Command;

async function removeApproval(message: Message, content: string, embed: EmbedBuilder) {
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
        embeds: [embed.setDescription(content)],
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
            return null;
        }

        return question;
    }

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
    question.edit({
        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
        components: [timeFinished],
    });
    return null;
}
