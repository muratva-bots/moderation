import { Events } from 'discord.js';
import checkRealAcc from './checkRealAcc';
import checkSuspect from './checkSuspect';
import memberPanel from './memberPanel';
import monthlyRolesAdd from './monthlyRolesAdd';
import roleSelect from './roleSelect';
import solvingAuthCall from './solvingAuthCall';

const InteractionCreate: Moderation.IEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    execute: async (client, interaction) => {
        const guildData = client.servers.get(interaction.guildId);
        if (!guildData) return;

        if (
            (interaction.isButton() || interaction.isStringSelectMenu()) &&
            ['fastlogin', 'suspect-control', 'monthlyroles-yes', 'monthlyroles-no'].includes(interaction.customId)
        ) {
            const limit = client.utils.checkLimit(interaction.user.id, 1011, 3, 1000 * 60 * 60);
            if (limit.hasLimit) {
                interaction.reply({
                    content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                    ephemeral: true,
                });
                return;
            }
            if (interaction.isButton() && interaction.customId === 'fastlogin')
                checkRealAcc(client, interaction, guildData);
            if (interaction.isButton() && interaction.customId === 'suspect-control')
                checkSuspect(client, interaction, guildData);
        }
        if (interaction.isButton() || interaction.isStringSelectMenu()) roleSelect(client, interaction, guildData);
        if (interaction.isButton()) monthlyRolesAdd(interaction);
        if (interaction.isButton()) memberPanel(client, interaction, guildData);
        if (interaction.isButton() && interaction.customId === 'solvingauth-call')
            solvingAuthCall(client, interaction, guildData);
    },
};

export default InteractionCreate;
