import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    ModalBuilder,
    ModalSubmitInteraction,
    RoleSelectMenuBuilder,
    Team,
    TextInputBuilder,
    TextInputStyle,
    bold,
    roleMention,
} from 'discord.js';

import listHandler from './listHandler';
import { GuildModel } from '@/models';
import { SpecialCommandFlags } from '@/enums';

const Command: Moderation.ICommand = {
    usages: ['team', 'ekip'],
    description: 'Sunucudaki ekip sistemini yönetir.',
    examples: ['team <buttonlar ile yönetim>'],
    checkPermission: ({ client, message }) => {
        return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);

    },
    execute: async ({ client, message, guildData }) => {
      
        if (!client.config.BOT_OWNERS.includes(message.author.id)) {
            listHandler(client, message, guildData);
            return;
        }

        const teams = (guildData.teams || [])
                        .filter((t) => message.guild.roles.cache.has(t.role))

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'create-team',
                    label: 'Ekle',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    custom_id: 'list',
                    label: 'Liste',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        const question = await message.channel.send({
            content: 'Aşağı taraftan yapacağın işlemi seç.',
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === 'create-team') {
                if (teams.length === 25) {
                    i.reply({
                        content: 'Ekip mi alıyorsunuz kurbanlık danaya mı giriyorsunuz bi siktirin gidin mk.',
                        ephemeral: true,
                    });
                    return;
                }

                const rowOne = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'name',
                            label: 'Ekip Adı',
                            min_length: 4,
                            placeholder: 'Canzade',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'owners',
                            label: 'Ekip Sahipleri',
                            min_length: 4,
                            placeholder: '331846231514939392, 331846231514939392',
                            style: TextInputStyle.Paragraph,
                        }),
                    ],
                });

                const rowThree = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'tags',
                            label: 'Ekip Tagları',
                            min_length: 1,
                            placeholder: 'a, b',
                            style: TextInputStyle.Paragraph,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'team-modal',
                    title: 'Yeni Ekip Ekle',
                    components: [rowOne, rowTwo, rowThree],
                });
                await i.showModal(modal);

                const modalCollected = await i.awaitModalSubmit({
                    filter: (i: ModalSubmitInteraction) => i.user.id === message.author.id,
                    time: 1000 * 60 * 5,
                });
                if (modalCollected) {
                    const teamName = modalCollected.fields.getTextInputValue('name');
                    const hasTeam = teams.find((team) => team.name === teamName.toLowerCase());
                    if (hasTeam) {
                        modalCollected.reply({
                            content: 'Belirttiğin isime sahip ekip zaten mevcut.',
                            ephemeral: true,
                        });
                        return;
                    }

                    const teamTags = modalCollected.fields
                        .getTextInputValue('tags')
                        .trim()
                        .split(',')
                        .map((t) => t.toLowerCase());
                    const hasTag = teams.find((team) => team.tags.some((t) => teamTags.includes(t.toLowerCase())));
                    if (hasTag) {
                        modalCollected.reply({
                            content: 'Belirttiğin taga sahip ekip zaten mevcut.',
                            ephemeral: true,
                        });
                        return;
                    }

                    const teamOwners = modalCollected.fields
                        .getTextInputValue('owners')
                        .trim()
                        .split(',')
                        .filter((o) => modalCollected.guild.members.cache.get(o));
                    if (!teamOwners.length) {
                        modalCollected.reply({
                            content: 'Belirttiğin kurucular sunucuda bulunmuyor veya öyle bir hesap yok.',
                            ephemeral: true,
                        });
                        return;
                    }

                    const roleSelect = new ActionRowBuilder<RoleSelectMenuBuilder>({
                        components: [
                            new RoleSelectMenuBuilder({
                                custom_id: 'role',
                                placeholder: 'Rol ara...',
                            }),
                        ],
                    });

                    await modalCollected.reply({
                        content: `${bold(client.utils.titleCase(teamName))} adlı ekibin rolünü seç.`,
                        ephemeral: true,
                        components: [roleSelect],
                    });

                    const roleQuestion = await modalCollected.fetchReply();
                    const roleCollected = await roleQuestion.awaitMessageComponent({
                        time: 1000 * 60 * 3,
                        componentType: ComponentType.RoleSelect,
                    });
                    if (roleCollected) {
                        const hasTeam = teams.find((team) => team.role === roleCollected.values[0]);
                        if (hasTeam) {
                            roleCollected.reply({
                                content: 'Belirttiğin role sahip ekip zaten mevcut.',
                                ephemeral: true,
                            });
                            return;
                        }

                        guildData.teams = [
                            ...teams,
                            { name: teamName, owners: teamOwners, role: roleCollected.values[0], tags: teamTags },
                        ];
                        guildData.specialCommands = [
                            ...(guildData.specialCommands || []),
                            {
                                usages: [teamName.toLowerCase().split(' ').join('-')],
                                description: `${client.utils.titleCase(teamName)} adlı ekibin rolünü verir-alırsınız.`,
                                auth: [message.author.id, ...teamOwners],
                                type: SpecialCommandFlags.Team,
                                roles: [roleCollected.values[0]],
                                tags: teamTags,
                            },
                        ];
                        await GuildModel.updateOne(
                            { id: modalCollected.guildId },
                            {
                                $set: {
                                    'moderation.teams': guildData.teams,
                                    'moderation.specialCommands': guildData.specialCommands,
                                },
                            },
                            { upsert: true },
                        );

                        question.edit({ content: 'Yeni ekip eklendi.', components: [] });
                        roleCollected.deferUpdate();
                        modalCollected.editReply({
                            content: `Başarıyla ${bold(client.utils.titleCase(teamName))} (${roleMention(
                                roleCollected.values[0],
                            )}) ekibi eklendi.`,
                            components: [],
                        });
                    } else {
                        modalCollected.deleteReply();
                    }
                }
            }

            if (i.customId === 'list') {
                i.deferUpdate();
                collector.stop('FINISH');
                listHandler(client, message, guildData, question);
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
