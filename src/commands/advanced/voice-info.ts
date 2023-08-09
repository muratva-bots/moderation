import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    VoiceBasedChannel,
    codeBlock,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['sesli'],
    description: 'Sunucunun ses aktifliği detaylarını gösterir.',
    examples: ['sesli'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ViewAuditLog) ||
        (guildData.minStaffRole && message.member.roles.cache.has(guildData.minStaffRole)),
    execute: async ({ client, message, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const members = await message.guild.members.fetch();

        const publicUsers = members.filter(
            (m) => m.voice.channelId && m.voice.channel.parentId && m.voice.channel.parentId === guildData.publicParent,
        );
        const totalPublicMembers = publicUsers.filter((m) => !m.user.bot).size;

        const totalMemberVoices = members.filter((m) => m.voice.channelId && !m.user.bot).size;
        const totalBotVoices = members.filter((m) => m.voice.channelId && m.user.bot).size;

        const taggedVoices = members.filter(
            (m) => m.voice.channelId && guildData.tags?.some((r) => m.user.displayName.toLowerCase().includes(r)),
        ).size;
        const untaggedVoices = members.filter(
            (m) => m.voice.channelId && !guildData.tags?.some((r) => m.user.displayName.toLowerCase().includes(r)),
        ).size;

        const minStaffRole = message.guild.roles.cache.get(guildData.minStaffRole);
        const staffVoices = minStaffRole
            ? members.filter((m) => m.voice.channelId && m.roles.highest.position >= minStaffRole.position)
            : 0;

        const ownerVoices = members.filter(
            (m) => m.voice.channelId && guildData.ownerRoles?.some((r) => m.roles.cache.has(r)),
        ).size;

        const streamVoices = members.filter((m) => m.voice.channelId && m.voice.streaming).size;
        const cameraVoices = members.filter((m) => m.voice.channelId && m.voice.selfVideo).size;
        const mutedVoices = members.filter((m) => m.voice.channelId && m.voice.mute).size;
        const deafedVoices = members.filter((m) => m.voice.channelId && m.voice.deaf).size;

        let index = 0;
        const topCategories = message.guild.channels.cache
            .filter((c) => c.type === ChannelType.GuildCategory)
            .sort(
                (a, b) =>
                    members.filter((x) => x.voice.channel && x.voice.channel.parentId === b.id).size -
                    members.filter((x) => x.voice.channel && x.voice.channel.parentId === a.id).size,
            )
            .map(
                (c) =>
                    `${index + 1}. ${c.name} (${c.id}): ${
                        (c as VoiceBasedChannel).members.filter(
                            (s) => s.voice.channel && s.voice.channel.parentId === c.id,
                        ).size
                    }`,
            )
            .splice(0, 3)
            .join('\n');

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'basic',
                    label: 'Basit',
                    style: ButtonStyle.Secondary,
                    disabled: true,
                }),
                new ButtonBuilder({
                    custom_id: 'detailed',
                    label: 'Detaylı',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    codeBlock(
                        'fix',
                        [
                            `Sesli kanallarda toplam ${totalMemberVoices} (+${totalBotVoices}) adet kişi var!`,
                            guildData.publicParent ? `Public odalarda ${totalPublicMembers} adet kişi var!` : undefined,
                            guildData.tags?.length
                                ? `Ses kanallarında ${untaggedVoices} tagsız kullanıcı var!`
                                : undefined,
                            guildData.tags?.length
                                ? `Ses kanallarında ${taggedVoices} taglı kullanıcı var!`
                                : undefined,
                            minStaffRole ? `Ses kanallarında toplam ${staffVoices} yetkili var!` : undefined,
                            guildData.ownerRoles?.length
                                ? `Ses kanallarında toplam ${ownerVoices} kurucu var!`
                                : undefined,
                        ]
                            .filter(Boolean)
                            .join('\n'),
                    ),
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

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'basic') {
                embed.setDescription(
                    codeBlock(
                        'fix',
                        [
                            `Sesli kanallarda toplam ${totalMemberVoices} (+${totalBotVoices}) adet kişi var!`,
                            guildData.publicParent ? `Public odalarda ${totalPublicMembers} adet kişi var!` : undefined,
                            guildData.tags?.length
                                ? `Ses kanallarında ${untaggedVoices} tagsız kullanıcı var!`
                                : undefined,
                            guildData.tags?.length
                                ? `Ses kanallarında ${taggedVoices} taglı kullanıcı var!`
                                : undefined,
                            minStaffRole ? `Ses kanallarında toplam ${staffVoices} yetkili var!` : undefined,
                            guildData.ownerRoles?.length
                                ? `Ses kanallarında toplam ${ownerVoices} kurucu var!`
                                : undefined,
                        ]
                            .filter(Boolean)
                            .join('\n'),
                    ),
                );

                row.components[0].setDisabled(true);
                row.components[1].setDisabled(false);
                question.edit({
                    embeds: [embed],
                    components: [row],
                });
            } else {
                embed.setDescription(
                    [
                        codeBlock(
                            'md',
                            [
                                `# Sesli kanallarda toplam ${totalMemberVoices} (+${totalBotVoices}) adet kişi var!`,
                                guildData.publicParent
                                    ? `# Public odalarda ${totalPublicMembers} adet kişi var!`
                                    : undefined,
                                guildData.tags?.length
                                    ? `# Ses kanallarında ${untaggedVoices} tagsız kullanıcı var!`
                                    : undefined,
                                guildData.tags?.length
                                    ? `# Ses kanallarında ${taggedVoices} taglı kullanıcı var!`
                                    : undefined,
                                minStaffRole ? `# Ses kanallarında toplam ${staffVoices} yetkili var!` : undefined,
                                guildData.ownerRoles?.length
                                    ? `# Ses kanallarında toplam ${ownerVoices} kurucu var!`
                                    : undefined,
                            ]
                                .filter(Boolean)
                                .join('\n'),
                        ),
                        codeBlock(
                            'fix',
                            [
                                `Ses kanallarında ${streamVoices} kişi yayın yapıyor.`,
                                `Mikrofonu Kapalı: ${mutedVoices}`,
                                `Kulaklığı Kapalı: ${deafedVoices}`,
                                `Kamerası Açık: ${cameraVoices}`,
                                `Bot: ${totalBotVoices}`,
                            ]
                                .filter(Boolean)
                                .join('\n'),
                        ),
                        codeBlock('fix', `En Fazla Sese Sahip 3 Kategori\n${topCategories}`),
                    ]
                        .filter(Boolean)
                        .join(''),
                );

                row.components[0].setDisabled(false);
                row.components[1].setDisabled(true);
                question.edit({
                    embeds: [embed],
                    components: [row],
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
