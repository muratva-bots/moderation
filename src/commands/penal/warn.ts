import { UserModel } from '@/models';
import {
    ButtonInteraction,
    ComponentType,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    inlineCode,
    PermissionFlagsBits,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    userMention,
    codeBlock,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['warn', 'uyarı', 'uyarılar'],
    description: 'Belirttiğiniz kullanıcıya uyarı verir, uyarısını siler, uyarılarını görüntülersiniz.',
    examples: ['uyarı @kullanıcı', 'uyarı 123456789123456789'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.chatMuteAuth && guildData.chatMuteAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const document =
            (await UserModel.findOne({ id: member.id, guild: message.guildId })) ||
            new UserModel({ id: member.id, guild: message.guildId });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL(),
            },
        });

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'add',
                    emoji: { id: '1136280646701043783' },
                    label: 'Ekle',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'remove',
                    emoji: { id: '1136280643580465193' },
                    label: 'Çıkar',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'list',
                    emoji: { id: '1137495100335861810' },
                    label: 'Uyarılar',
                    disabled: !document.warns.length,
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const timeFinished = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'timefinished',
                    label: 'Mesajın Geçerlilik Süresi Doldu.',
                    emoji: { name: '⏱️' },
                    style: ButtonStyle.Danger,
                    disabled: true,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${member} kullanıcısına uyarı vermek, yarı kaldırmak veya uyarılarını listelemek için aşağıdaki buttonları kullanın!`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (collected: ButtonInteraction) => {
            if (collected.customId.startsWith('remove')) {
                const row = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'notes',
                            placeholder: 'Kaldırılacak raporu seçin!',
                            options: document.warns.map((w, i) => ({
                                label: `${i + 1} numaralı uyarı.`,
                                value: `${w.admin}-${w.description.slice(0, 2)}`,
                            })),
                        }),
                    ],
                });

                collector.stop('FINISH');
                collected.deferUpdate();
                question.edit({
                    embeds: [
                        embed.setDescription(
                            document.warns
                                .map(
                                    (w, i) =>
                                        `${i + 1}. ${userMention(w.admin)} (${inlineCode(w.admin)})\n${codeBlock(
                                            w.description,
                                        )}`,
                                )
                                .join('\n'),
                        ),
                    ],
                    components: [row],
                });

                const filter = (i: StringSelectMenuInteraction) =>
                    i.user.id === message.author.id && i.isStringSelectMenu();
                const selectCollector = await question.awaitMessageComponent({
                    filter,
                    time: 1000 * 60 * 5,
                    componentType: ComponentType.StringSelect,
                });
                if (selectCollector) {
                    document.warns = document.warns.filter(
                        (w) => selectCollector.values[0] !== `${w.admin}-${w.description.slice(0, 2)}`,
                    );
                    document.save();
                    selectCollector.reply({
                        content: 'Başarıyla kaldırıldı..',
                        ephemeral: true,
                    });
                    question.edit({
                        embeds: [
                            embed.setDescription(
                                document.warns.length
                                    ? document.warns
                                          .map(
                                              (w, i) =>
                                                  `${i + 1}. ${userMention(w.admin)} (${inlineCode(
                                                      w.admin,
                                                  )})\n${codeBlock(w.description)}`,
                                          )
                                          .join('\n')
                                    : 'Bulunmuyor.',
                            ),
                        ],
                        components: [],
                    });
                } else {
                    question.edit({
                        embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                        components: [timeFinished],
                    });
                }
                return;
            }

            if (collected.customId.startsWith('list')) {
                question.edit({ components: [] });
                collector.stop('FINISH');
                collected.reply({
                    content: document.warns.length
                        ? document.warns
                              .map(
                                  (w, i) =>
                                      `${i + 1}. ${userMention(w.admin)} (${inlineCode(w.admin)})\n${codeBlock(
                                          w.description,
                                      )}`,
                              )
                              .join('\n')
                        : 'Bulunmuyor.',
                    ephemeral: true,
                });
                return;
            }

            if (collected.customId === 'add') {
                const modalRow = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'description',
                            label: 'Sebep:',
                            maxLength: 50,
                            required: true,
                            placeholder: 'Troll.',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'modal',
                    title: 'Eklenecek notu yazın.',
                    components: [modalRow],
                });

                await collected.showModal(modal);

                const filter = (i: ModalSubmitInteraction) => i.user.id === message.author.id && i.isModalSubmit();
                const modalCollector = await collected.awaitModalSubmit({
                    filter,
                    time: 1000 * 60 * 3,
                });
                if (modalCollector) {
                    if (document.warns.filter((w) => w.admin === message.author.id).length >= 3) {
                        client.utils.sendTimedMessage(message, 'Maksimum 3 tane uyarı ekleyebilirsin.');
                        return;
                    }

                    const description = modalCollector.fields.getTextInputValue('description');
                    document.warns.push({ admin: message.author.id, description: description });

                    const warnRoles = guildData.warnRoles
                        ?.sort((a, b) => b.count - a.count)
                        .filter((w) => document.warns.length >= w.count && message.guild.roles.cache.has(w.role));
                    if (warnRoles) {
                        if (guildData.removeWarnRole) {
                            const lastWarn = warnRoles[warnRoles.length - 1];
                            member.roles.remove(warnRoles.filter((w) => w.count !== lastWarn.count).map((w) => w.role));
                        } else member.roles.add(warnRoles.map((w) => w.role));
                    }

                    document.save();
                    question.edit({ components: [] });
                    modalCollector.reply({
                        content: 'Başarıyla eklendi.',
                        ephemeral: true,
                    });
                } else {
                    question.edit({
                        embeds: [embed.setDescription(`İşlem süresi dolduğu için işlem kapatıldı.`)],
                        components: [timeFinished],
                    });
                }
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [timeFinished] });
            }
        });
    },
};

export default Command;
