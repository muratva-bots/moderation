import { GuildModel } from '@/models';
import {
    ActionRowBuilder,
    Team,
    ButtonStyle,
    ButtonBuilder,
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    codeBlock,
    PermissionsBitField,
    bold,
    userMention,
    time,
    Guild,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['svkontrol', 'serverkontrol'],
    description: 'Sunucu bilgilerini görüntülersiniz.',
    examples: ['svkontrol <menüden işlem seçin>'],
    checkPermission: ({ client, message }) => {
        return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);

    },
    execute: async ({ client, message, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true }),
            },
            footer: {
                text: client.config.STATUS,
            },
        });

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'role-members',
                    label: 'Roldeki Kişiler',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'guild-login',
                    label: 'Sunucuya Giriş',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const Administrator = message.guild.roles.cache.filter(
			(rol) =>
				rol.permissions.has(
					PermissionsBitField.Flags.Administrator,
				) && !rol.managed,
		);
		const GuildManage = message.guild.roles.cache.filter(
			(rol) =>
				rol.permissions.has(
					PermissionsBitField.Flags.ManageGuild,
				) && !rol.managed,
		);
		const RoleManage = message.guild.roles.cache.filter(
			(rol) =>
				rol.permissions.has(
					PermissionsBitField.Flags.ManageRoles,
				) && !rol.managed,
		);
		const ChannelManage = message.guild.roles.cache.filter(
			(rol) =>
				rol.permissions.has(
					PermissionsBitField.Flags.ManageChannels,
				) && !rol.managed,
		);


        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    [
                        `${bold("Sunucu Bilgileri")}`,
                        `Taç Sahibi: ${userMention(message.guild.ownerId)}`,
                        `Özel URL: ${message.guild.vanityURLCode
                            ? `${message.guild.vanityURLCode} / (${(await (await message.guild.fetchVanityData()).uses)})`
                            : "Özel URL Yok"}`,
                            `Sunucu Kurulma Tarihi: ${time(Math.floor(message.guild.createdTimestamp / 1000), 'R')}`,
                            `Rol/Kanal Sayısı: ${bold(`${message.guild.roles.cache.size}/${message.guild.channels.cache.size}`)}\n`,
                            `${bold("Rol Bilgileri")}`,
                            `Yöneticisi olan: ${bold(`${Administrator.size} kişi`)}`,
                            `Sunucuyu yöneti olan: ${bold(`${GuildManage.size} kişi`)}`,
                            `Rol yöneti olan: ${bold(`${RoleManage.size} kişi`)}`,
                            `Kanal yöneti olan: ${bold(`${ChannelManage.size} kişi`)}`
                    ].join('\n'),
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            i.deferUpdate()
            if(i.customId === "role-members") {
         question.edit({ embeds: [embed.setDescription([
            `${codeBlock("fix", `Yönetici: ${Administrator.size} kişi`)}`,
            `${message.guild.members.cache
                .filter(
                    (m) =>
                        m.permissions.has(
                            PermissionsBitField.Flags.Administrator,
                        ) && !m.user.bot,
                )
                .map((member) => member)
                .join(",")}`,
                `${codeBlock("fix", `Sunucuyu Yönet: ${GuildManage.size} kişi`)}`,
                `${message.guild.members.cache
                    .filter(
                        (m) =>
                            m.permissions.has(
                                PermissionsBitField.Flags.ManageGuild,
                            ) && !m.user.bot,
                    )
                    .map((member) => member)
                    .join(",")}`,
                  `${codeBlock("fix", `Rol Yönet: ${RoleManage.size} kişi`)}`,
                  `${message.guild.members.cache
                    .filter(
                        (m) =>
                            m.permissions.has(
                                PermissionsBitField.Flags.ManageGuild,
                            ) && !m.user.bot,
                    )
                    .map((member) => member)
                    .join(",")}`,
                    `${codeBlock("fix", `Kanal Yönet: ${ChannelManage.size} kişi`)}`,
                    `${message.guild.members.cache
                        .filter(
                            (m) =>
                                m.permissions.has(
                                    PermissionsBitField.Flags.ManageGuild,
                                ) && !m.user.bot,
                        )
                        .map((member) => member)
                        .join(",")}`

        ].join("\n"))], components: [row] })
    } if(i.customId === "guild-login") {
        question.edit({ embeds: [embed.setDescription(`${codeBlock("fix", 
        [
            `Günlük Giriş: ${
                message.guild.members.cache.filter(
                    (member) =>
                        Date.now() - member.joinedTimestamp < 86400000,
                ).size
            } kişi`,
            `Haftalık Giriş: ${
                message.guild.members.cache.filter(
                    (member) =>
                        Date.now() - member.joinedTimestamp < 604800000,
                ).size
            } kişi`,
            `15 Günlük Giriş: ${
                message.guild.members.cache.filter(
                    (member) =>
                        Date.now() - member.joinedTimestamp < 1296000000,
                ).size
            } kişi`,
            `1 Aylık Giriş: ${
                message.guild.members.cache.filter(
                    (member) =>
                        Date.now() - member.joinedTimestamp < 2592000000,
                ).size
            } kişi`
        ]
        .join("\n"))}`)], components: [row] })
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
