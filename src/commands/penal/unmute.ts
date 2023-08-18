import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    inlineCode,
    Message,
    PermissionFlagsBits,
    TextChannel,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['unmute'],
    description: 'Muteli bir kullanıcının mutesini kaldırırsınız.',
    examples: ['unmute @kullanıcı <menüden ceza türü seçin>', 'unmute 123456789123456789 <menüden ceza türü seçin>'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.MuteMembers) ||
    (guildData.chatMuteAuth && guildData.chatMuteAuth.some((r) => message.member.roles.cache.has(r))) ||  (guildData.voiceMuteAuth && guildData.voiceMuteAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await client.utils.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const hasVoiceMute = message.guild.roles.cache.has(guildData.voiceMuteRole)
            ? member.roles.cache.has(guildData.voiceMuteRole)
            : member.voice?.serverMute;
        if (!hasVoiceMute && !member.roles.cache.has(guildData.chatMuteRole)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        if (hasVoiceMute && member.roles.cache.has(guildData.chatMuteRole)) {
            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'voice_mute',
                        style: ButtonStyle.Secondary,
                        emoji: {
                            id: '848034896948494367',
                        },
                    }),
                    new ButtonBuilder({
                        custom_id: 'chat_mute',
                        style: ButtonStyle.Secondary,
                        emoji: {
                            id: '848035393471381504',
                        },
                    }),
                ],
            });
            const question = await message.reply({
                content: member.toString(),
                embeds: [
                    embed.setDescription(
                        'Kullanıcının iki tür susturmadan cezası bulunuyor, aşağıdaki düğmelerden hangisini kaldıracağınızı seçin.',
                    ),
                ],
                components: [row],
            });

            const filter = (i) => i.user.id === message.author.id;
            const collected = await question.awaitMessageComponent({
                filter,
                time: 15000,
                componentType: ComponentType.Button,
            });
            if (collected) {
                collected.deferUpdate();

                let text;
                if (collected.customId === 'chat_mute') {
                    text = 'yazılı susturması';
                    member.roles.remove(guildData.chatMuteRole);
                    await PenalModel.updateMany(
                        { user: member.id, activity: true, guild: message.guildId, type: PenalFlags.ChatMute },
                        {
                            $set: {
                                activity: false,
                                remover: message.author.id,
                                removeTime: Date.now(),
                                removeReason: reason,
                            },
                        },
                    );
                } else {
                    text = 'ses susturması';
                    if (
                        message.guild.roles.cache.has(guildData.voiceMuteRole) &&
                        !member.roles.cache.has(guildData.voiceMuteRole)
                    )
                        member.roles.remove(guildData.voiceMuteRole);
                    if (member.voice.channelId) member.voice.setMute(false);

                    await PenalModel.updateMany(
                        { user: member.id, activity: true, guild: message.guildId, type: PenalFlags.VoiceMute },
                        {
                            $set: {
                                activity: false,
                                remover: message.author.id,
                                removeTime: Date.now(),
                                removeReason: reason,
                            },
                        },
                    );
                }

                question.edit({
                    components: [],
                    embeds: [
                        embed.setDescription(
                            `${client.utils.getEmoji('unvoice')} ${member} (${inlineCode(
                                member.id,
                            )}) adlı kullanıcının ${bold(text)} kaldırıldı.`,
                        ),
                    ],
                });

                sendLog(
                    client,
                    message,
                    member,
                    collected.customId === 'chat_mute' ? 'chat-mute-log' : 'voice-mute-log',
                    reason,
                );
            } else {
            }
            return;
        }

        await PenalModel.updateMany(
            {
                user: member.id,
                guild: message.guildId,
                activity: true,
                $or: [{ type: PenalFlags.VoiceMute }, { type: PenalFlags.ChatMute }],
            },
            {
                $set: {
                    activity: false,
                    remover: message.author.id,
                    removeTime: Date.now(),
                    removeReason: reason,
                },
            },
        );

        message.channel.send({
            embeds: [
                embed.setDescription(
                    `${client.utils.getEmoji('unmute')} ${member} kullanıcısının başarıyla cezası kaldırıldı.`,
                ),
            ],
        });

        sendLog(
            client,
            message,
            member,
            message.member.roles.cache.has(guildData.chatMuteRole) ? 'chat-mute-log' : 'voice-mute-log',
            reason,
        );

        if (member.voice.channelId) member.voice.setMute(false);
        member.roles.remove(
            [guildData.chatMuteRole, guildData.voiceMuteRole].filter((r) => message.guild.roles.cache.has(r)),
        );
    },
};

export default Command;

async function sendLog(client: Client, message: Message, member: GuildMember, channelName: string, reason: string) {
    const channel = message.guild.channels.cache.get(channelName) as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                    message.author
                } (${inlineCode(message.author.id)}) tarafından ${bold(reason)} sebebiyle süresi dolmadan kaldırıldı.`,
            }),
        ],
    });
}
