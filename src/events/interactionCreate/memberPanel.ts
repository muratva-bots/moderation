import { ModerationClass, UserModel, PenalModel } from '@/models';
import { Client } from '@/structures';
import { ButtonInteraction, time, inlineCode, roleMention, bold, EmbedBuilder } from 'discord.js';
import { PENAL_TITLES } from '@/assets';
import { PenalFlags, SpecialCommandFlags } from '@/enums';

async function memberPanel(client: Client, interaction: ButtonInteraction, guildData: ModerationClass) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
        author: {
            name: interactionMember.user.username,
            icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
        },
        footer: {
            text: client.config.STATUS,
        },
    });

    if (interaction.customId === 'memberJoinedServer') {
        const limit = client.utils.checkLimit(interaction.user.id, 1012, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        interaction.reply({
            content: `Sunucuya katılma tarihiniz: ${time(Math.floor(interactionMember.joinedTimestamp / 1000))} (${time(
                Math.floor(interactionMember.joinedTimestamp / 1000),
                'R',
            )})`,
            ephemeral: true,
        });
    }

    if (interaction.customId === 'historyName') {
        const limit = client.utils.checkLimit(interaction.user.id, 1013, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        const document = await UserModel.findOne({ id: interactionMember.id, guild: interaction.guild.id });
        if (!document || !document.names.length) {
            interaction.reply({ content: 'Hiç isim veriniz bulunmuyor', ephemeral: true });
            return;
        }

        interaction.reply({
            embeds: [
                embed.setDescription(
                    [
                        `Toplam da ${document.names.length} isim kayıtınız bulundu:`,
                        `${document.names.map((n) =>
                            [
                                inlineCode(`•`),
                                `${time(Math.floor(n.time / 1000), 'D')}:`,
                                n.name ? n.name : undefined,
                                n.role ? roleMention(n.role) : undefined,
                                n.role ? bold(`(${n.type})`) : bold(n.type),
                            ]
                                .filter(Boolean)
                                .join(' '),
                        )}`,
                    ].join('\n'),
                ),
            ],
            ephemeral: true,
        });
    }

    if (interaction.customId === 'activePenalties') {
        const limit = client.utils.checkLimit(interaction.user.id, 1014, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        const activePenals = await PenalModel.find({
            guild: interaction.guildId,
            user: interactionMember.id,
            activity: true,
        });
        if (!activePenals.length) {
            interaction.reply({ content: 'Hiç ceza veriniz bulunmuyor', ephemeral: true });
            return;
        }

        interaction.reply({
            embeds: [
                embed.setDescription(
                    activePenals
                        .map((r) => {
                            const title = PENAL_TITLES[r.type];
                            if (title) return `${title} (${time(Math.floor(r.finish / 1000))})`;

                            const specialCommand = guildData.specialCommands.find(
                                (s) => s.punishType === r.type && s.type === SpecialCommandFlags.Punishment,
                            );
                            if (specialCommand)
                                return `${specialCommand.punishName} (${time(Math.floor(r.finish / 1000))})`;
                        })
                        .join('\n'),
                ),
            ],
            ephemeral: true,
        });
    }

    if (interaction.customId === 'historyPenalties') {
        const limit = client.utils.checkLimit(interaction.user.id, 1015, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        const penals = await PenalModel.find({
            user: interactionMember.id,
            guild: interaction.guildId,
            visible: true,
        });
        if (!penals.length) {
            interaction.reply({ content: 'Ceza veriniz yok!', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        await interaction.reply({
            embeds: [
                embed
                    .setDescription(
                        `${interactionMember} (${inlineCode(interactionMember.id)}) adlı kullanıcının cezaları.`,
                    )
                    .setFields([
                        {
                            name: 'Ses Susturması',
                            value: penals.filter((p) => p.type === PenalFlags.VoiceMute).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Yazı Susturması',
                            value: penals.filter((p) => p.type === PenalFlags.ChatMute).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Diğer Cezalar',
                            value: penals
                                .filter(
                                    (p) =>
                                        ![
                                            PenalFlags.VoiceMute,
                                            PenalFlags.Quarantine,
                                            PenalFlags.Ban,
                                            PenalFlags.Ads,
                                            PenalFlags.ChatMute,
                                            PenalFlags.ForceBan,
                                        ].includes(p.type),
                                )
                                .length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Cezalı',
                            value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Yasaklama',
                            value: penals.filter((p) => p.type === PenalFlags.Ban).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Karantina',
                            value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Reklam',
                            value: penals.filter((p) => p.type === PenalFlags.Ads).length.toString(),
                            inline: true,
                        },
                    ]),
            ],
            ephemeral: true,
        });
    }

    if (interaction.customId === 'penaltiesNumber') {
        const limit = client.utils.checkLimit(interaction.user.id, 1016, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        const userPenals = await PenalModel.countDocuments();

        interaction.reply({
            embeds: [embed.setDescription(`${userPenals} cezan bulunuyor.`)],
            ephemeral: true,
        });
    }

    if (interaction.customId === 'memberRoles') {
        const limit = client.utils.checkLimit(interaction.user.id, 1017, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        const memberRoles = interactionMember.roles.cache
            .filter((role) => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((role) => role.toString());

        interaction.reply({
            embeds: [
                embed.setDescription(
                    `${inlineCode('•')} Rolleri(${memberRoles.length}): ${
                        memberRoles.length
                            ? memberRoles.length > 6
                                ? `${memberRoles.slice(0, 6).join(', ')} ${memberRoles.slice(0, 6).length} daha...`
                                : memberRoles.join(', ')
                            : 'Rolü bulunmuyor.'
                    }`,
                ),
            ],
            ephemeral: true,
        });
    }

    if (interaction.customId === 'createdAt') {
        const limit = client.utils.checkLimit(interaction.user.id, 1018, 1, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return;
        }
        interaction.reply({
            content: `Hesap oluşturma tarihiniz: ${time(
                Math.floor(interactionMember.user.createdTimestamp / 1000),
            )} (${time(Math.floor(interactionMember.user.createdTimestamp / 1000), 'R')})`,
            ephemeral: true,
        });
    }
}

export default memberPanel;
