import { ActionRowBuilder, Team, ButtonBuilder, codeBlock, EmbedBuilder, ButtonStyle, bold } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['solvingauthcall', 'solvingcall'],
    description: 'Sorun çözücü çağır mesajını attırırsınız.',
    examples: ['solvingauthcall'],
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
                    custom_id: 'solvingauth-call',
                    label: 'Sorun çözücü çağır',
                    style: ButtonStyle.Danger,
                }),
            ],
        });

        message.channel.send({
            content: ' ㅤ',
            components: [row],
        });
    },
};

export default Command;
