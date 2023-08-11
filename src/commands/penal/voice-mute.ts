import { DEFAULTS } from '@/assets';
import { LimitFlags, PenalFlags } from '@/enums';
import { ModerationClass, PenalModel } from '@/models';
import { Client } from '@/structures';
import {
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    inlineCode,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    APISelectMenuOption,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
    GuildMember,
    Message,
    User,
    time,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import ms from 'ms';
import { quarantineUser } from './quarantine';
import { NeedFlags } from '@/enums';

const Command: Moderation.ICommand = {
    usages: ['voicemute', 'voice-mute', 'vmute', 'v-mute'],
    description: 'Ses kanallarında kurallara uymayan kullanıcıları susturmanızı sağlar.',
    examples: ['vmute 1234567890 <menüden sebep>', 'vmute @kullanıcı <menüden sebep>'],
    chatUsable: true,
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.MuteMembers) ||
        (guildData.voiceMuteAuth && guildData.voiceMuteAuth.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const limit = client.utils.checkLimit(
            message.author.id,
            LimitFlags.Mute,
            guildData.muteLimitCount ? Number(guildData.muteLimitCount) : DEFAULTS.mute.limit.count,
            guildData.muteLimitTime || DEFAULTS.mute.limit.time,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum susturma limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const member = await client.utils.getMember(message.guild, user.id);
        if (member) {
            if (client.utils.checkUser(message, member)) return;
            if (member.roles.cache.has(guildData.voiceMuteRole) || member.voice.serverMute) {
                client.utils.sendTimedMessage(message, 'Kullanıcı susturulmuş.');
                return;
            }
        }

        const reasons =
            guildData.voiceMuteReasons && guildData.voiceMuteReasons.length
                ? guildData.voiceMuteReasons
                : DEFAULTS.mute.reasons;

        const options: APISelectMenuOption[] = [
            ...reasons.map((l) => ({
                label: l.name,
                placeholder: l.placeholder,
                value: l.value,
                emoji: {
                    id: '1135792463425056838',
                },
            })),
            {
                label: 'Başka Bir Sebep Varsa Seçiniz.',
                value: 'other',
                emoji: {
                    id: '1135792274161274991',
                },
            },
        ];

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'voice-mute',
                    placeholder: 'Sebep seçilmemiş!',
                    options,
                }),
            ],
        });

        const timeFinished = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'timefinished',
                    label: 'Mesajın Geçerlilik Süresi Doldu.',
                    emoji: { name: '⏱️' },
                    style: ButtonStyle.Danger,
                    disabled: true,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const question = await message.reply({
            content: `${user} kullanıcısına ses susturması işlemi uygulamak için aşağıdaki menüden sebep seçiniz!`,
            components: [row],
        });
        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 3,
            componentType: ComponentType.StringSelect,
        });

        if (collected) {
            if (collected.values[0] === 'other') {
                const rowOne = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'time',
                            max_length: 3,
                            label: 'Süre',
                            required: true,
                            placeholder: '5m',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });
                const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'reason',
                            max_length: 50,
                            required: true,
                            label: 'Sebep',
                            placeholder: 'Rahatsızlık vermek.',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'voice-mute-modal',
                    title: 'Ses Susturması',
                    components: [rowOne, rowTwo],
                });

                await collected.showModal(modal);

                const modalCollector = await collected.awaitModalSubmit({
                    filter: (i: ModalSubmitInteraction) => i.user.id === message.author.id,
                    time: 1000 * 60 * 5,
                });
                if (modalCollector) {
                    modalCollector.deferUpdate();

                    const timing = ms(modalCollector.fields.getTextInputValue('time'));
                    const reason = modalCollector.fields.getTextInputValue('reason');

                    if (!timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'Geçerli bir süre belirt!');
                        return;
                    }
                    if (timing < ms('30s') || ms('1y') < timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'En fazla 1 yıl veya en az 30 saniye girebilirsin.');
                        return;
                    }

                    muteUser(client, message, question, user, member, guildData, timing, reason);
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                    });
                }
                return;
            }

            collected.deferUpdate();

            const reason = reasons.find((r) => r.value === collected.values[0]);
            if (reason.needType === NeedFlags.Image) {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            'Kanıt için ekran görüntüsünü atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.',
                        ),
                    ],
                    components: [],
                });
                const filter = (msg: Message) => msg.author.id === message.author.id && msg.attachments.size > 0;
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const attachment = collected.first().attachments.first().proxyURL;
                    muteUser(client, message, question, user, member, guildData, reason.time, reason.name, attachment);
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                        components: [timeFinished],
                    });
                }
                return;
            }

            if (reason.needType === NeedFlags.User) {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            "Kullanıcının ID'sini atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.",
                        ),
                    ],
                    components: [],
                });
                const filter = async (msg: Message) => {
                    if (msg.author.id !== message.author.id) return false;
                    return !!(await client.utils.getUser(msg.content));
                };
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const user = await client.utils.getUser(collected.first().content);
                    muteUser(
                        client,
                        message,
                        question,
                        user,
                        member,
                        guildData,
                        reason.time,
                        `${reason.name}\nHesap: ${user.username} (${user.id})`,
                    );
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                        components: [timeFinished],
                    });
                }
                return;
            }

            muteUser(client, message, question, user, member, guildData, reason.time, reason.name);
        } else {
            question.edit({
                embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                components: [timeFinished],
            });
        }
    },
};

export default Command;

async function muteUser(
    client: Client,
    message: Message,
    question: Message,
    user: User,
    member: GuildMember,
    guildData: ModerationClass,
    timing: number,
    reason: string,
    image?: string,
) {
    if (guildData.maxMuteSystem) {
        const operations = guildData.maxMuteOperations || DEFAULTS.mute.max;
        const userPenals = await PenalModel.countDocuments({
            $or: [{ type: PenalFlags.VoiceMute }, { type: PenalFlags.ChatMute }],
            visible: true,
        });

        const operation = operations.find((o) => o.count === userPenals);
        if (operation) {
            if (operation.clear) await PenalModel.updateMany({ user: user.id }, { visible: false });
            quarantineUser(
                client,
                message,
                user,
                member,
                guildData,
                operation.time,
                `${operation.clear ? 'kullanıcının sicili sıfırlandı ve' : 'kullanıcı'} ${bold(
                    userPenals.toString(),
                )} adet cezaya ulaştığı için`,
                true,
            );
            return;
        }
    }

    if (member) {
        if (guildData.voiceMuteRole && message.guild.roles.cache.has(guildData.voiceMuteRole)) {
            if (!member.roles.cache.has(guildData.voiceMuteRole)) member.roles.add(guildData.voiceMuteRole);
            if (member.voice.channelId) member.voice.setChannel(null);
        } else if (member.voice.channelId) member.voice.setMute(true);
    }

    let extra = 0;
    if (guildData.extraMute) {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 24);
        const userPenals = await PenalModel.countDocuments({ start: { $gte: startTime } });
        if (userPenals >= 2) extra = userPenals * (guildData.extraMuteTime || DEFAULTS.extraMuteTime);
    }

    const now = Date.now();
    const newID = (await PenalModel.countDocuments({ guild: message.guildId })) + 1;
    const penal = await PenalModel.create({
        id: newID,
        guild: message.guildId,
        admin: message.author.id,
        user: user.id,
        type: PenalFlags.VoiceMute,
        reason: reason,
        finish: now + timing + extra,
        start: now,
    });

    await client.utils.sendLog({
        guild: message.guild,
        channel: 'voice-mute-log',
        penal,
        user: user,
        admin: message.author,
        attachment: image,
    });

    question.edit({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${client.utils.getEmoji('voicemute')} ${user} (${inlineCode(
                    user.id,
                )}) adlı kullanıcı "${bold(reason)}" sebebiyle ${time(Math.floor(penal.finish / 1000), 'R')} ${
                    extra !== 0 ? `(${inlineCode(`+${ms(extra)}`)}) ` : ''
                }ses susturması cezası aldı. (Ceza Numarası: ${inlineCode(`#${newID}`)})`,
            }),
        ],
        content: '',
        components: [],
    });
}
