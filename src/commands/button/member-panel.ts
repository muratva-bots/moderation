import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Team } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['kullanıcı-panel', 'kullanıcıpanel'],
    description: 'Kullanıcı panel mesajını attırırsınız.',
    examples: ['kullanıcıpanel'],
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
                    custom_id: 'memberJoinedServer',
                    label: '1',
                    style: ButtonStyle.Success,
                }),
                   new ButtonBuilder({
                    custom_id: 'historyName',
                    label: '2',
                    style: ButtonStyle.Success,
                }),
                   new ButtonBuilder({
                    custom_id: 'activePenalties',
                    label: '3',
                    style: ButtonStyle.Success,
                }),
                   new ButtonBuilder({
                    custom_id: 'historyPenalties',
                    label: '4',
                    style: ButtonStyle.Success,
                }),
            ],
        });
         const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'penaltiesNumber',
                    label: '5',
                    style: ButtonStyle.Success,
                }),
                   new ButtonBuilder({
                    custom_id: 'memberRoles',
                    label: '6',
                    style: ButtonStyle.Success,
                }),
                   new ButtonBuilder({
                    custom_id: 'createdAt',
                    label: '7',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        message.channel.send({
            content: `
Aşağıdaki menüden kendinize bir işlem seçip sunucu içi depolanan verilerinizi sorgulayabilirsiniz. Verileriniz sadece sizin görebileceğiniz şekilde gönderilir.
• 1: Sunucuya giriş tarihinizi öğrenin.
• 2: Kayıt olmuş olduğunuz isimleri öğrenin.
• 3: Devam eden cezanız (varsa) hakkında bilgi alın.
• 4: Geçmiş cezalarınızı öğrenin.

• 5: Ceza sayınız öğrenin.
• 6: Üzerinizdeki rolleri sıralayın.
• 7: Hesabınızın açılış tarihini öğrenin.`,
            components: [row, row2],
        });
    },
};

export default Command;
