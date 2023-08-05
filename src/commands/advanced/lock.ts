import { GuildModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    Interaction,
    PermissionFlagsBits,
    Role,
    TextChannel,
    bold,
    channelMention,
    inlineCode,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['lock', 'kilit', 'kanal'],
    description: 'Belirttiğiniz kanalın mesaj gönderme iznini açar/kapatırsınız.',
    examples: ['kilit <kilit menü panelinden işleminizi seçin.>'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
        execute: async ({ client, message, guildData }) => {
        const rowOne = new ActionRowBuilder<ChannelSelectMenuBuilder>({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'spesific-channel',
                    placeholder: 'Kanal ara..',
                    maxValues: message.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size,
                    channel_types: [ChannelType.GuildText],
                }),
            ],
        });
        const rowTwo = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    label: 'Kayıt Kanallarını Kapat',
                    style: ButtonStyle.Secondary,
                    custom_id: 'register',
                    disabled:
                        !guildData.registerParent && !guildData.unregisterRoles && !guildData.unregisterRoles.length,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });
        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    [
                        'İlk menüde seçtiğiniz kanalı kilitlemenize-açmanıza yarar.',
                        'İkinci menü ise register ses kanallarına bağlanma yetkisini, metin kanallarına mesaj gönderme yetkisini kilitler-açar.',
                    ].join('\n'),
                ),
            ],
            components: [rowOne, rowTwo],
        });

        const filter = (i: Interaction) => i.user.id === message.author.id && (i.isButton() || i.isChannelSelectMenu());
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 5,
        });
        if (collected) {
            if (collected.isChannelSelectMenu()) {
                collected.deferUpdate();

                const channels = [];
                collected.values.forEach((v) => {
                    const channel = message.guild.channels.cache.get(v) as TextChannel;
                    if (!channel) return;

                    const everyoneRole = message.guild.roles.everyone as Role;
                    const hasPermission = !channel.permissionsFor(everyoneRole).has(PermissionFlagsBits.SendMessages);
                    channel.permissionOverwrites.edit(everyoneRole.id, {
                        SendMessages: hasPermission,
                    });
                    channels.push({ id: v, operation: hasPermission });
                });

                question.edit({
                    embeds: [
                        embed.setDescription(
                            channels.length > 0
                                ? channels
                                      .map(
                                          (c) =>
                                              `${channelMention(c.id)} (${inlineCode(c.id)}): ${bold(
                                                  c.operation ? 'Kilit açıldı!' : 'Kilit kapatıldı!',
                                              )}`,
                                      )
                                      .join('\n')
                                : `${channelMention(channels[0].id)} (${inlineCode(
                                      channels[0].id,
                                  )}) adlı kanalın kilidi ${bold(channels[0].operation ? 'açıldı' : 'kapatıldı')}.`,
                        ),
                    ],
                    components: [],
                });

                return;
            }

            if (collected.isButton()) {
                collected.deferUpdate();

                if (!(guildData.guildOwner || []).some((r) => message.member.roles.cache.has(r))) {
                    collected.reply({
                        content: 'Bu işlemi gerçekleştirmek için yeterli yetkin yok.',
                    });
                    return;
                }
                const channels = message.guild.channels.cache.filter((c) => c.parentId === guildData.registerParent);
                const unregisterRole = message.guild.roles.cache.get(guildData.unregisterRoles[0]);
                if (!unregisterRole) {
                    collected.reply({
                        content: 'Kayıtsız rolü silinmiş.',
                        ephemeral: true,
                    });
                    return;
                }

                let status = false;
                channels.forEach((c) => {
                    if (c.type === ChannelType.GuildText) {
                        const hasPermission = !c.permissionsFor(unregisterRole).has(PermissionFlagsBits.SendMessages);
                        if (hasPermission === true) status = true;
                        c.permissionOverwrites.edit(unregisterRole.id, { SendMessages: hasPermission });
                    } else if (c.type === ChannelType.GuildVoice) {
                        const hasPermission = !c.permissionsFor(unregisterRole).has(PermissionFlagsBits.Connect);
                        if (hasPermission === true) status = true;
                        c.permissionOverwrites.edit(unregisterRole.id, { Connect: hasPermission });
                    }
                });

                guildData.registerSystem = status;
                await GuildModel.updateOne({ id: message.guildId }, { $set: { 'moderation.registerSystem': status } });

                question.edit({
                    embeds: [embed.setDescription('Başarıyla kayıt kanalları kapatıldı.')],
                    components: [],
                });
                return;
            }
        } else {
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
                embeds: [embed.setDescription('İşlem süresi dolduğu için işlem kapatıldı.')],
                components: [timeFinished],
            });
        }
    },
};

export default Command;
