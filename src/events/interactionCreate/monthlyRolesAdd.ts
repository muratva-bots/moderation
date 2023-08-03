import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { ButtonInteraction } from 'discord.js';

async function monthlyRolesAdd(client: Client, interaction: ButtonInteraction, guildData: ModerationClass) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    if (interaction.customId === 'monthlyroles-yes') {
        interaction.reply({ content: `Artık aylık üye rolleri üzerinize verilecek.`, ephemeral: true });
    }
    if (interaction.customId === 'monthlyroles-no') {
        interaction.reply({ content: `Artık aylık üye rolleri üzerinize verilmeyecek.`, ephemeral: true });
    }
}

export default monthlyRolesAdd;
