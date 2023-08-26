import { Client } from '@/structures';
import { ButtonInteraction, channelMention, TextChannel } from 'discord.js';

async function solvingAuthCall(client: Client, interaction: ButtonInteraction, guildData: Moderation.IGuildData) {
    if (interaction.customId == 'solvingauth-call') {
        const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
        if (!interactionMember) return;

        if (!interaction.guild.roles.cache.has(guildData.solvingAuth)) {
            interaction.reply({
                content: 'Sorun çözme rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        const solvingLog = interaction.guild.channels.cache.get(guildData.solvingLog) as TextChannel;

        if (!solvingLog) {
            interaction.reply({
                content: 'Sorun çözme log ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (!interaction.guild.roles.cache.has(guildData.solvingAuth)) {
            interaction.reply({
                content: 'Sorun çözme rol ayarı yapılmamış.',
                ephemeral: true,
            });
            return;
        }

        if (!interactionMember.voice.channel) {
            interaction.reply({
                content: 'Sorun çözücü çağırmak için sorun çözme kanallarından birisinde olmalısın',
                ephemeral: true,
            });
            return;
        }
        if (interactionMember.voice.channel.parentId !== guildData.solvingParent) {
            interaction.reply({
                content: 'Sorun çözücü çağırmak için sorun çözme kanallarından birisinde olmalısın',
                ephemeral: true,
            });
            return;
        }

        const limit = client.utils.checkLimit(interaction.user.id, 1010, 1, 1000 * 60 * 60 * 12);
        if (limit.hasLimit) {
            interaction.reply({
                content: `On iki saatte saatte bir tane sorun çözücü çağırma hakkın var.`,
                ephemeral: true,
            });
            return;
        }

        let solvingAuth = [
            ...interaction.guild.members.cache
                .filter(
                    (member) =>
                        !member.user.bot &&
                        member.roles.cache.has(guildData.solvingAuth) &&
                        member.presence &&
                        member.presence.status !== 'offline',
                )
                .values(),
        ];
        if (solvingAuth.length == 0) {
            interaction.reply({
                content: 'Üzgünüm şuan aktif olan sorun çözücü bulunmamakta.',
                ephemeral: true,
            });
            return;
        }

        solvingLog.send({
            content: `
${interaction.member} => ${interactionMember.voice.channel} Kanalında sorun çözücü çağırdı.
${solvingAuth.map((x) => `${x}`).join(',')}
				`,
        });

        interaction.reply({
            content: `Sorun çözme yetkililerini ${channelMention(guildData.solvingLog)} kanalına etiketledim.`,
            ephemeral: true,
        });
    }
}

export default solvingAuthCall;
