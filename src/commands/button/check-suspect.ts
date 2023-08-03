import { ActionRowBuilder, Team, ButtonBuilder, codeBlock, EmbedBuilder, ButtonStyle, bold } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['suspectcontrol'],
    description: 'Şüpheli kontrol mesajını attırırsınız.',
    examples: ['suspectcontrol'],
    checkPermission: ({ client, message }) => {
        const ownerID =
            client.application.owner instanceof Team
                ? (client.application.owner as Team).ownerId
                : client.application.owner.id;
        return message.guild.ownerId === message.author.id || ownerID === message.author.id;
    },
    execute: async ({ client, message, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });
        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'suspect-control',
                    label: 'Doğrula',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        message.channel.send({
            content: `${codeBlock(
                'md',
                `Merhaba;
Sunucumuz 5 gün içinde kurulan hesapları hiçbir şekilde kabul etmemektedir. Lütfen "Cezalıdan çıkarır mısın?" ya da "Şüpheli hesap kaldırır mısın?" yazmayın.

Eğer hesabının kurulma süresinden en az 5 gün geçtiğini düşünüyorsan ve hala buradaysan sunucudan çıkıp tekrardan girmeyi veya aşağıdaki butona tıklayarak tekrar kayıt olabilirsin, iyi günler.

${message.guild.name}
`,
            )}`,
            components: [row],
        });
    },
};

export default Command;
