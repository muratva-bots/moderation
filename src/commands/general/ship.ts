import { createCanvas, loadImage } from 'canvas';
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    bold,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['ship'],
    description: 'Belirttiğiniz kullanıcı ile ilişinizi ölçersiniz.',
    examples: ['ship', 'ship @kullanıcı', 'ship 123456789123456789'],
    execute: async ({ client, message, args, guildData }) => {
        let mention = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (mention && mention.user.bot) {
            client.utils.sendTimedMessage(message, 'Botlarla olan ilişkini ölçemezsin!');
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'accepted',
                    label: 'Çay iç',
                    emoji: { name: '🍵' },
                    style: ButtonStyle.Danger,
                }),
            ],
        });

        if (!mention) {
            if (
                (!guildData.manRoles?.some((r) => message.guild.roles.cache.has(r)) &&
                    !guildData.womanRoles?.some((r) => message.guild.roles.cache.has(r))) ||
                (guildData.registeredRole && !message.guild.roles.cache.has(guildData.registeredRole))
            ) {
                message.channel.send(
                    'Kız, erkek rolleri ayarlanmadığı için bu komutu birisini etiketleyerek kullanabilirsin.',
                );
                return;
            }

            if (guildData.manRoles.some((x) => message.member.roles.cache.has(x))) {
                mention = message.guild.members.cache
                    .filter((member) => guildData.womanRoles.some((x) => member.roles.cache.has(x)) && !member.user.bot)
                    .random();
            } else if (guildData.womanRoles.some((x) => message.member.roles.cache.has(x))) {
                mention = message.guild.members.cache
                    .filter((member) => guildData.manRoles.some((x) => member.roles.cache.has(x)) && !member.user.bot)
                    .random();
            }
        }

        const canvas = createCanvas(700, 250);
        const context = canvas.getContext('2d');

        const heart = await loadImage(
            'https://cdn.discordapp.com/attachments/1131694447210545222/1137029346985529544/pngaaa.com-3645785.png',
        );
        const broken = await loadImage(
            'https://cdn.discordapp.com/attachments/927571230134009856/975157787678093342/zadekirikkalp.png',
        );
        const think = await loadImage(
            'https://cdn.discordapp.com/attachments/731112308134248469/949237394736037938/thnk.png',
        );

        const background = await loadImage(
            'https://cdn.discordapp.com/attachments/731112308134248469/949078364445081620/hearts.png',
        );
        const messageMember = await loadImage(message.author.displayAvatarURL({ extension: 'png' }));
        const mentionMember = await loadImage(mention.displayAvatarURL({ extension: 'png' }));
        const lovePercentage = Math.floor(Math.random() * 100);

        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.drawImage(messageMember, 100, 25, 200, 200);
        context.drawImage(mentionMember, 400, 25, 200, 200);

        if (lovePercentage > 75 && lovePercentage < 100) {
            context.drawImage(heart, 275, 60, 150, 150);
        }
        if (lovePercentage > 55 && lovePercentage < 75) {
            context.drawImage(think, 275, 60, 150, 150);
        }
        if (lovePercentage > 0 && lovePercentage < 55) {
            row.components[0].setDisabled(true);
            context.drawImage(broken, 275, 60, 150, 150);
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), {
            name: 'ship.png',
        });

        const question = await message.reply({
            content: `[ ${bold(`• ${mention.displayName}`)} & ${bold(
                `• ${message.author.displayName}`,
            )} ]\n Ne kadar uyumlusun? ${bold(`%${lovePercentage} Uyumlu`)}`,
            files: [attachment],
            components: [row],
        });

        const filter = (i: ButtonInteraction) =>  (i.isButton() && i.user.id === message.author.id) || i.user.id === mention.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });
        collector.on("collect", async(i:ButtonInteraction) => {
            if(i.customId=== "accepted") {
                row.components[0].setDisabled(true);
                question.edit({ components: [row] });
                i.reply({
                    content: `${
                        i.user.id == message.author.id
                            ? `${bold(mention.user.username)} selam! ${bold(message.author.username)}`
                            : `${bold(message.author.username)} selam! ${bold(mention.user.username)}`
                    } seninle çay içmek istiyor, bu fırsatı kaçırma derim.`,
                });
            }
        }) 


            collector.on('end', (_, reason) => {
                if (reason === 'time') {
                    const timeFinished = new ActionRowBuilder<ButtonBuilder>({
                        components: [
                            new ButtonBuilder({
                                custom_id: 'timefinished',
                                disabled: true,
                                emoji: { name: '⏱️' },
                                style: ButtonStyle.Danger,
                            }),
                        ],
                    });
    
                    question.edit({ 
                    components: [timeFinished] });
                }
            })


    },
};

export default Command;
