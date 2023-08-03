import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { ButtonInteraction, roleMention, StringSelectMenuInteraction } from 'discord.js';

async function roleSelect(
    client: Client,
    interaction: ButtonInteraction | StringSelectMenuInteraction,
    guildData: ModerationClass,
) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    if (interaction.customId === 'giveaway-role') {
        if (!interaction.guild.roles.cache.has(guildData.giveawayRole)) {
            interaction.reply({
                content: 'Çekiliş katılımcısı rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }
        if (interactionMember.roles.cache.has(guildData.giveawayRole)) {
            await interactionMember.roles.remove(guildData.giveawayRole);
            interaction.reply({
                content: `${roleMention(guildData.giveawayRole)} rolü üzerinizden alındı.`,
                ephemeral: true,
            });
        } else await interactionMember.roles.add(guildData.giveawayRole);
        interaction.reply({
            content: `${roleMention(guildData.giveawayRole)} rolü üzerinize verildi.`,
            ephemeral: true,
        });
    }
    if (interaction.customId === 'event-role') {
        if (!interaction.guild.roles.cache.has(guildData.eventRole)) {
            interaction.reply({
                content: 'Etkinlik katılımcısı rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }
        if (interactionMember.roles.cache.has(guildData.eventRole)) {
            await interactionMember.roles.remove(guildData.eventRole);
            interaction.reply({
                content: `${roleMention(guildData.eventRole)} rolü üzerinizden alındı.`,
                ephemeral: true,
            });
        } else await interactionMember.roles.add(guildData.eventRole);
        interaction.reply({
            content: `${roleMention(guildData.eventRole)} rolü üzerinize verildi.`,
            ephemeral: true,
        });
    }

    if (interaction.customId === 'color-roles' && interaction.isStringSelectMenu()) {
        if (interaction.values[0]) {
            if (
                !interactionMember.premiumSince &&
                !interactionMember.roles.cache.some((r) => guildData.familyRole.includes(r.id))
            )
                return interaction.reply({
                    content: `Bu roller sadece ${roleMention(
                        guildData.familyRole,
                    )}> veya ${interaction.guild.roles.cache
                        .filter((r) => r.managed && r.editable)
                        .first()}rollerine özeldir.`,
                    ephemeral: true,
                });

            if (interactionMember.roles.cache.has(interaction.values[0])) {
                await interactionMember.roles.remove(interaction.values[0]);
                interaction.reply({
                    content: `${roleMention(interaction.values[0])} rolü üzerinizden alındı.`,
                    ephemeral: true,
                });
            } else
                await interactionMember.roles.set(
                    interactionMember.roles.cache.filter((role) => !guildData.colorRoles.includes(role.id)),
                );
            await interactionMember.roles.add(interaction.values[0]);
            interaction.reply({
                content: `<@&${interaction.values[0]}> rolü üzerinize verildi.`,
                ephemeral: true,
            });
        }
    }

    if (interaction.customId === 'game-roles' && interaction.isStringSelectMenu()) {
        if (interaction.values[0]) {
            if (interactionMember.roles.cache.has(interaction.values[0])) {
                await interactionMember.roles.remove(interaction.values[0]);
                interaction.reply({
                    content: `${roleMention(interaction.values[0])} rolü üzerinizden alındı.`,
                    ephemeral: true,
                });
            } else
                await interactionMember.roles.set(
                    interactionMember.roles.cache.filter((role) => !guildData.colorRoles.includes(role.id)),
                );
            await interactionMember.roles.add(interaction.values[0]);
            interaction.reply({
                content: `<@&${interaction.values[0]}> rolü üzerinize verildi.`,
                ephemeral: true,
            });
        }
    }

    if (interaction.customId === 'love-roles' && interaction.isStringSelectMenu()) {
        if (interactionMember.roles.cache.has(interaction.values[0])) {
            await interactionMember.roles.remove(interaction.values[0]);
            interaction.reply({
                content: `${roleMention(interaction.values[0])} rolü üzerinizden alındı.`,
                ephemeral: true,
            });
        } else
            await interactionMember.roles.set(
                interactionMember.roles.cache.filter((role) => !guildData.loveRoles.includes(role.id)),
            );
        await interactionMember.roles.add(interaction.values[0]);
        interaction.reply({
            content: `<@&${interaction.values[0]}> rolü üzerinize verildi.`,
            ephemeral: true,
        });
    }

    if (interaction.customId === 'zodiac-roles' && interaction.isStringSelectMenu()) {
        if (interaction.values[0]) {
            if (interactionMember.roles.cache.has(interaction.values[0])) {
                await interactionMember.roles.remove(interaction.values[0]);
                interaction.reply({
                    content: `${roleMention(interaction.values[0])} rolü üzerinizden alındı.`,
                    ephemeral: true,
                });
            } else
                await interactionMember.roles.set(
                    interactionMember.roles.cache.filter((role) => !guildData.zodiacRoles.includes(role.id)),
                );
            await interactionMember.roles.add(interaction.values[0]);
            interaction.reply({
                content: `<@&${interaction.values[0]}> rolü üzerinize verildi.`,
                ephemeral: true,
            });
        }
    }
}

export default roleSelect;
