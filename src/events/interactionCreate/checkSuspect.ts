import { Client } from '@/structures';
import { ButtonInteraction, EmbedBuilder, bold, time } from 'discord.js';

async function checkSuspect(client: Client, interaction: ButtonInteraction, guildData: Moderation.IGuildData) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    if (interaction.customId === 'suspect-control') {
        if (!interaction.guild.roles.cache.has(guildData.suspectedRole)) {
            interaction.reply({
                content: 'Şüpheli rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (!interaction.guild.roles.cache.has(guildData.unregisterRoles[0])) {
            interaction.reply({
                content: 'Kayıtsız rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (!interactionMember.roles.cache.has(guildData.suspectedRole)) {
            interaction.reply({
                content: `Bu butonu kullanabilmen için üzerinde şüpheli rolü bulunması gerekiyor!`,
                ephemeral: true,
            });
            return;
        }

        if (Date.now() - interaction.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7) {
            const embed = new EmbedBuilder()
                .setTitle(`Merhaba ${interaction.user.username}`)
                .setDescription(
                    `
Hesabının kuruluş tarihi: ${time(Math.floor(interaction.user.createdTimestamp / 1000))}
Hesabın: ${time(Math.floor(interaction.user.createdTimestamp / 1000), 'R')} kurulmuş
${bold(
    'Hesabının kuruluş tarihi 7 günü geçmediği için seni şüpheliden çıkartamadım. Daha sonra tekrar kontrol edebilirsin.',
)}
`,
                )
                .setColor('Red');
            interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            if (guildData.changeName) interactionMember.setNickname("İsim | Yaş");
            await interactionMember.roles.set(guildData.unregisterRoles);

            const embed = new EmbedBuilder()
                .setTitle(`Merhaba ${interaction.user.username}`)
                .setColor('Green')
                .setDescription(
                    `
Hesabının kuruluş tarihi: ${time(Math.floor(interaction.user.createdTimestamp / 1000))}
Hesabın: ${time(Math.floor(interaction.user.createdTimestamp / 1000), 'R')} kurulmuş
${bold(
    'Hesabının kuruluş tarihi 7 günü geçtiği için seni şüpheliden çıkarttım. Teyit kanallarımıza girip kayıt olabilirsin.',
)}
					`,
                );
            interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}

export default checkSuspect;
