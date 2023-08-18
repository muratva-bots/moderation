import { ActionRowBuilder, Team, ButtonBuilder, channelMention, EmbedBuilder, ButtonStyle, bold } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['fastlogin'],
    description: 'Doğrulama mesajını attırırsınız.',
    examples: ['fastlogin'],
    checkPermission: ({ client, message }) => {
        return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);

    },
    execute: async ({ client, message, guildData }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });
        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'fastlogin',
                    label: 'Doğrula',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        message.channel.send({
            content: [
                `${bold('Merhaba Kullanıcı;')}`,

                `Sunucumuz şuan çok hızlı giriş işlemi yapıldığı için rol dağıtımı durduruldu. Aşağıdaki butona tıklayarak bot hesap olmadığını doğrulayıp sunucuda gerekli rollerini alabilirsin. Eğer yanlış bir durum olduğunu düşünüyorsan sağ taraftaki yetkililere yazmaktan çekinme!`,

                `_Eğer bu kanalı anlık olarak gördüysen kayıt işlemine ${channelMention(
                    guildData.registerChannel,
                )} bu kanaldan devam edebilirsin_`,

                `İyi günler dileriz.`,

                `${bold(message.guild.name)}`,
            ].join('\n\n'),
            components: [row],
        });
    },
};

export default Command;
