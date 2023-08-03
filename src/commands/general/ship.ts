import { AttachmentBuilder, EmbedBuilder, bold } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';

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

        if (!mention) {
            if (
                ((!guildData.manRoles ||
                    !guildData.manRoles.length ||
                    !guildData.manRoles.some((r) => message.guild.roles.cache.has(r))) &&
                    (!guildData.womanRoles ||
                        !guildData.womanRoles.length ||
                        !guildData.womanRoles.some((r) => message.guild.roles.cache.has(r)))) ||
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
            'https://cdn.discordapp.com/attachments/927571230134009856/975157787002826762/zadekalp.png',
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
        context.drawImage(messageMember, 55, 25, 200, 200);
        context.drawImage(mentionMember, 445, 25, 200, 200);

        let shipMessage;
        if (lovePercentage > 75 && lovePercentage < 100) {
            context.drawImage(heart, 275, 60, 150, 150);
            shipMessage = `Çok iyi oldunuz sanki 😍❤️ (${bold(`%${lovePercentage}`)})`;
        }
        if (lovePercentage > 55 && lovePercentage < 75) {
            context.drawImage(think, 275, 60, 150, 150);
            shipMessage = `Olabilir.. 🤔🥰 (${bold(`%${lovePercentage}`)})`;
        }
        if (lovePercentage > 0 && lovePercentage < 55) {
            context.drawImage(broken, 275, 60, 150, 150);
            shipMessage = `Nextle 🤮 (${bold(`%${lovePercentage}`)})`;
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), {
            name: 'ship.png',
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
            description: `${message.author}, ${mention} seni ne kadar seviyor?\n${shipMessage}`,
            image: {
                url: 'attachment://ship.png',
            },
        });

        message.reply({
            embeds: [embed],
            files: [attachment],
        });
    },
};

export default Command;
