import { PENAL_TITLES } from '@/assets';
import { SpecialCommandFlags } from '@/enums';
import { PenalModel } from '@/models';
import {
    ActionRowBuilder,
    bold,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextChannel,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unpenal', 'unsicil'],
    description: 'Kullanıcının belirtilen cezasını silersiniz.',
    examples: ['unpenal @kullanıcı <menüden ceza seçin>', 'unpenal 123456789123456789 <menüden ceza seçin>'],
    checkPermission: ({ message }) => message.member.permissions.has(PermissionFlagsBits.Administrator),
    execute: async ({ client, message, args, guildData }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirtmelisin!');
            return;
        }

        const penals = await PenalModel.find({
            user: user.id,
            guild: message.guildId,
            visible: true,
        });
        if (!penals.length) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının ceza verisi yok!');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'unpenal',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                    options: penals.map((penal) => {
                        let type = PENAL_TITLES[penal.type];
                        if (!type) {
                            const specialCommand = guildData.specialCommands.find(
                                (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                            );
                            if (specialCommand) type = specialCommand.punishName;
                        }

                        return {
                            label: `${type} (#${penal.id})`,
                            description: 'Kaldırmak için tıkla!',
                            value: `${penal.id}`,
                        };
                    }),
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${user} (${inlineCode(user.id)}) adlı kullanıcının kaldıralacak cezasını belirtiniz.`,
                ),
            ],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });
        if (collected) {
            const penal = penals.find((p) => p.id === collected.values[0]);
            if (!penal) {
                question.edit({ content: 'Ceza zaten kaldırılmış.', embeds: [], components: [] });
                return;
            }

            await PenalModel.updateOne({ id: collected.values[0] }, { visible: false });

            let type = PENAL_TITLES[penal.type];
            if (!type) {
                const specialCommand = guildData.specialCommands.find(
                    (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                );
                if (specialCommand) type = specialCommand.punishName;
            }

            const channel = message.guild.channels.cache.find((c) => c.name === 'penal-log') as TextChannel;
            if (channel) {
                channel.send({
                    embeds: [
                        embed.setDescription(
                            `${message.author} (${inlineCode(
                                message.author.id,
                            )}) adlı yetkili tarafından ${user} (${inlineCode(
                                user.id,
                            )}) adlı kullanıcısının ${inlineCode(penal.id)} ID'li cezası kaldırıldı.`,
                        ),
                    ],
                });
            }

            question.edit({
                content: `${user} (${inlineCode(user.id)}) adlı kullanıcının ${inlineCode(penal.id)} ID'li ${bold(
                    type,
                )} cezası kaldırıldı.`,
                components: [],
                embeds: [],
            });
        } else {
            question.edit({
                embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                components: [],
            });
        }
    },
};

export default Command;
