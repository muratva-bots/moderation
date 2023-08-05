import { PENAL_TITLES } from '@/assets';
import { SpecialCommandFlags } from '@/enums';
import { PenalModel } from '@/models';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    Interaction,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextChannel,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unpenal', 'unsicil'],
    description: 'Kullanıcının belirtilen cezasını silersiniz.',
    examples: ['unpenal @kullanıcı <menüden ceza seçin>', 'unpenal 123456789123456789 <menüden ceza seçin>'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
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

        let components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [row];
        const totalData = Math.ceil(penals.length / 25);
        let page = 1;
        if (penals.length > 25) components.push(client.utils.paginationButtons(page, totalData));

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${user} (${inlineCode(user.id)}) adlı kullanıcının kaldıralacak cezasını belirtiniz.`,
                ),
            ],
            components,
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', async (i: Interaction) => {
            if (i.isStringSelectMenu()) {
                const penal = penals.find((p) => p.id === i.values[0]);
                if (!penal) {
                    question.edit({ content: 'Ceza zaten kaldırılmış.', embeds: [], components: [] });
                    return;
                }

                collector.stop('FINISH');
                await PenalModel.updateOne({ id: i.values[0] }, { visible: false });

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
            }

            if (i.isButton()) {
                i.deferUpdate();

                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                question.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'penals',
                                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                                    options: penals.slice(page === 1 ? 0 : page * 25 - 25, page * 25).map((penal) => {
                                        let type = PENAL_TITLES[penal.type];
                                        if (!type) {
                                            const specialCommand = guildData.specialCommands.find(
                                                (s) =>
                                                    s.punishType === penal.type &&
                                                    s.type === SpecialCommandFlags.Punishment,
                                            );
                                            if (specialCommand) type = specialCommand.punishName;
                                        }
                                        return {
                                            label: `${type} (#${penal.id})`,
                                            description: 'Daha fazla bilgi için tıkla!',
                                            value: `${penal.id}`,
                                        };
                                    }),
                                }),
                            ],
                        }),
                        client.utils.paginationButtons(page, totalData),
                    ],
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
    },
};

export default Command;
