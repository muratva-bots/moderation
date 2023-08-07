import { UserModel } from '@/models';
import { ButtonInteraction } from 'discord.js';

async function monthlyRolesAdd(interaction: ButtonInteraction) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    const query = { guild: interaction.guildId, id: interaction.user.id };
    const document = (await UserModel.findOne(query)) || new UserModel(query);

    if (interaction.customId === 'monthlyroles-yes') {
        if (document.monthlyRole) {
            interaction.reply({
                content: 'Zaten aylık rol veriliyor.',
                ephemeral: true,
            });
            return;
        }

        interaction.reply({ content: `Artık aylık üye rolleri üzerinize verilecek.`, ephemeral: true });
        document.monthlyRole = true;
        document.save();
        return;
    }

    if (interaction.customId === 'monthlyroles-no') {
        if (!document.monthlyRole) {
            interaction.reply({
                content: 'Zaten aylık rol verilmiyor.',
                ephemeral: true,
            });
            return;
        }

        interaction.reply({ content: `Artık aylık üye rolleri üzerinize verilmeyecek.`, ephemeral: true });
        document.monthlyRole = false;
        document.save();
        return;
    }
}

export default monthlyRolesAdd;
