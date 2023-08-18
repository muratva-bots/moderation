import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { ButtonInteraction } from 'discord.js';

async function checkRealAcc(client: Client, interaction: ButtonInteraction, guildData: ModerationClass) {
    if (interaction.customId === 'fastlogin') {
        const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
        if (!interactionMember) return;

        if (guildData.invasionProtection) {
            interaction.reply({
                content:
                    'Bu sistem yalnızca sunucuya fake hesap istilası olduğunda devreye girer, eğer bu saçma mesajı alıyorsan üzerine otorol verilmemiş demektir sunucudan çıkıp tekrardan girmen gerekiyor.',
                ephemeral: true,
            });
            return;
        }

        if (!interaction.guild.roles.cache.has(guildData.suspectedRole)) {
            interaction.reply({
                content: 'Şüpheli rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (!interaction.guild.roles.cache.has(guildData.unregisterRoles[0])) {
            interaction.reply({
                content: 'Şüpheli rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (Date.now() - interaction.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7) {
            if (!interactionMember.roles.cache.has(guildData.suspectedRole))
                client.utils.setRoles(interactionMember, guildData.suspectedRole);
            interaction.reply({
                content: 'Sahte bir hesaba sahip olduğunuz için cezalıya atıldınız.',
                ephemeral: true,
            });
        } else {
            if (guildData.changeName) interactionMember.setNickname("İsim | Yaş");
            await interactionMember.roles.add(guildData.unregisterRoles);

            interaction.reply({
                content: 'Doğrulama başarılı teyit kanallarına yönlendiriliyorsunuz.',
                ephemeral: true,
            });
        }
    }
}

export default checkRealAcc;
