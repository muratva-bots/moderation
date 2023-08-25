import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, PermissionFlagsBits, bold, codeBlock, inlineCode } from 'discord.js';


const Command: Moderation.ICommand = {
    usages: ['rolsüz', 'rolsuz'],
    description: 'Rolü bulunmayan kullanıcılara kayıtsız rolü verir.',
    examples: ['rolsüz'],
    checkPermission: ({ message, client }) => {        
    return message.guild.ownerId === message.author.id || client.config.BOT_OWNERS.includes(message.author.id);
    },
    execute: async ({ message, args, client, guildData }) => {

        let nonRole = message.guild.members.cache.filter(
			(m) =>
				m.roles.cache.filter((r) => r.id !== message.guild.id).size ==
				0,
		);
        
        if(nonRole.size < 1) {
            client.utils.sendTimedMessage(message, `Rolü bulunmayan üye bulunmuyor.`)
            return
        }
      
        const embed = new EmbedBuilder({ 
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true })
            },
         })

         const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'accept',
                    emoji: { id: '1118109828926144573' },
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

       let question = await message.channel.send({ embeds: [embed.addFields([{ name: "Rolü Olmayan" , value: `${codeBlock('fix', `${nonRole.size} kişi bulunuyor.`)}`  }])], components: [row] })

       const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
       const collector = question.createMessageComponentCollector({
           filter,
           time: 1000 * 60,
           componentType: ComponentType.Button,
       });


         collector.on("collect", async(i: ButtonInteraction) => {
            if(i.customId === "accept") {

                nonRole.forEach((r) => {
					r.roles.add(guildData.unregisterRoles);
				});
                
                i.reply({ content: `Başarıyla ${bold(`${nonRole.size}`)} adet kullanıcıya kayıtsız rolü verildi.`, components: [] })
               
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

                question.edit({ components: [timeFinished] });
            }
        })
    },
};

export default Command;
