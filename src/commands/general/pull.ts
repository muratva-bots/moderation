import {
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    inlineCode,
} from 'discord.js';

const waitings = new Set();

const Command: Moderation.ICommand = {
    usages: ['pull', 'çek'],
    description: 'Belirttiğiniz kullanıcıyı odanıza çekersiniz.',
    examples: ['çek @kullanıcı', 'çek 123456789123456789'],
    execute: async ({ client, message, args, guildData }) => {
        if (waitings.has(message.author.id)) {
            client.utils.sendTimedMessage(message, 'Yapmış olduğun bir işlem var. lütfen biraz bekle.');
            return;
        }

        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Komutu kullanmak için ses kanalında bulunmalısın.');
            return;
        }

        const member =
            (await client.utils.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (member.id === message.author.id) {
            client.utils.sendTimedMessage(message, 'Bu komutu kendi üzerinde kullanamazsın!');
            return;
        }

        if (!member.voice.channelId) {
            client.utils.sendTimedMessage(message, `Belirttiğin kullanıcı adlı kullanıcı seste bulunmuyor!`);
            return;
        }

        if (member.voice.channelId === message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı ile aynı kanaldasın.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });
        if (
            message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            (guildData.moveAuth && guildData.moveAuth.some((r) => message.member.roles.cache.has(r)))
        ) {
            member.voice.setChannel(message.member.voice.channelId);
            message.channel.send({
                embeds: [
                    embed.setDescription(
                        `Başarıyla ${member} adlı üyeyi ${inlineCode(
                            message.member.voice.channel.name,
                        )} adlı kanala taşıdınız.`,
                    ),
                ],
            });
        } else {
            waitings.add(message.author.id);

            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'accept',
                        label: 'Onaylıyorum',
                        style: ButtonStyle.Success,
                        emoji: {
                            id: '1054856853814788216',
                        },
                    }),
                    new ButtonBuilder({
                        custom_id: 'cancel',
                        label: 'Onaylamıyorum',
                        style: ButtonStyle.Danger,
                        emoji: {
                            id: '1057679211021746186',
                        },
                    }),
                ],
            });
            const question = await message.reply({
                content: member.toString(),
                embeds: [
                    embed.setDescription(
                        [
                            `${message.author} adlı üye seni ${inlineCode(
                                member.voice.channel.name,
                            )} kanalına çekmek istiyor. Onaylıyor musun?`,
                            `${bold('NOT:')} İşlem 30 saniye sonra iptal edilecektir.`,
                        ].join('\n'),
                    ),
                ],
                components: [row],
            });

            const filter = (i) => i.user.id === member.id;
            const collected = await question.awaitMessageComponent({
                filter,
                time: 1000 * 30,
                componentType: ComponentType.Button,
            });
            if (collected) {
                if (collected.customId === 'accept') {
                    if (message.member.voice.channelId && member.voice.channelId)
                        member.voice.setChannel(message.member.voice.channelId);
                    question.edit({
                        content: ``,
                        embeds: [
                            embed.setDescription(
                                `${member} adlı kullanıcı ${message.author} adlı kullanıcının yanına taşındı.`,
                            ),
                        ],
                        components: [],
                    });
                } else {
                    question.edit({
                        content: ``,
                        embeds: [
                            embed.setDescription(
                                `${member} adlı kullanıcı ${message.author} adlı kullanıcının isteğini onaylamadığı için işlem iptal edildi.`,
                            ),
                        ],
                        components: [],
                    });
                }
            } else {
                question.edit({
                    content: ``,
                    embeds: [
                        embed.setDescription(
                            `${member} adlı kullanıcı ${message.author} adlı kullanıcının isteğine cevap vermediği için işlem iptal edildi.`,
                        ),
                    ],
                    components: [],
                });
                waitings.delete(message.author.id);
            }
        }
    },
};

export default Command;
