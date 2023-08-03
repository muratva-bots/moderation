import {
    APISelectMenuOption,
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    Message,
    ModalBuilder,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle,
    User,
    bold,
    inlineCode,
    time,
} from 'discord.js';
import { ISpecialCommand, PenalModel } from '@/models';
import { Client } from '@/structures';
import { DEFAULTS } from '@/assets';
import ms from 'ms';
import { NeedFlags } from '@/enums';

async function punish(client: Client, message: Message, command: ISpecialCommand, args: string[]) {
    if (!message.guild.roles.cache.has(command.punishRole)) {
        client.utils.sendTimedMessage(message, 'Rol silinmiş.');
        return;
    }

    const reference = message.reference ? (await message.fetchReference()).author : undefined;
    const user = (await client.utils.getUser(args[0])) || reference;
    if (!user) {
        client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        return;
    }

    const limit = client.utils.checkLimit(
        message.author.id,
        command.punishType,
        DEFAULTS.quarantine.limit.count,
        DEFAULTS.quarantine.limit.time,
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
        if (member.roles.cache.has(command.punishRole)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası bulunuyor.');
            return;
        }
    }

    if (!(command.quickReasons || []).length) {
        const arg = args[reference ? 0 : 1];
        const timing = arg ? ms(arg) : undefined;
        if (!timing) {
            client.utils.sendTimedMessage(message, 'Geçerli bir süre belirt!');
            return;
        }
        if (timing < ms('30s') || ms('1y') < timing) {
            client.utils.sendTimedMessage(message, 'En fazla 1 yıl veya en az 30 saniye girebilirsin.');
            return;
        }

        const reason = args.slice(reference ? 1 : 2).join(' ') || 'Sebep belirtilmemiş.';
        punishUser(client, message, user, member, command, timing, reason);
        return;
    }

    const options: APISelectMenuOption[] = [
        ...command.quickReasons.map((l) => ({
            label: l.name,
            description: l.placeholder,
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
                custom_id: 'special-command',
                placeholder: 'Sebep seçilmemiş!',
                options,
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
        content: `${user} kullanıcısına ${command.punishName} cezası işlemi uygulamak için aşağıdaki menüden sebep seçiniz!`,
        components: [row],
    });
    const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
    const collected = await question.awaitMessageComponent({
        filter,
        time: 1000 * 60 * 3,
        componentType: ComponentType.StringSelect,
    });

    if (collected) {
        collected.deferUpdate();

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
                custom_id: 'quarantine-modal',
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

                punishUser(client, message, user, member, command, timing, reason, question);
            } else {
                question.edit({
                    embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                });
            }
            return;
        }

        const reason = command.quickReasons.find((r) => r.value === collected.values[0]);
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
                punishUser(client, message, user, member, command, reason.time, reason.name, question, attachment);
            } else {
                question.edit({
                    embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
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
                punishUser(
                    client,
                    message,
                    user,
                    member,
                    command,
                    reason.time,
                    `${reason.name}\nHesap: ${user.username} (${user.id})`,
                    question,
                );
            } else {
                question.edit({
                    embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                });
            }
            return;
        }

        punishUser(client, message, user, member, command, reason.time, reason.name, question);
    } else {
        question.edit({
            embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
        });
    }
}

export default punish;

export async function punishUser(
    client: Client,
    message: Message,
    user: User,
    member: GuildMember,
    command: ISpecialCommand,
    timing: number,
    reason: string,
    question?: Message,
    image?: string,
) {
    if (member && !member.roles.cache.has(command.punishRole)) member.roles.add(command.punishRole);

    const now = Date.now();
    const newID = (await PenalModel.countDocuments({ guild: message.guildId })) + 1;
    const penal = await PenalModel.create({
        id: newID,
        guild: message.guildId,
        admin: message.author.id,
        user: user.id,
        type: command.punishType,
        reason: reason,
        finish: now + timing,
        start: now,
    });

    if (command.logChannel) {
        await client.utils.sendLog({
            guild: message.guild,
            channel: command.logChannel,
            penal,
            user: user,
            admin: message.author,
            attachment: image,
            specialType: command.punishName,
        });
    }

    const query = {
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${user} (${inlineCode(user.id)}) adlı kullanıcı "${bold(reason)}" sebebiyle ${time(
                    Math.floor(penal.finish / 1000),
                    'R',
                )} karantina cezası aldı. (Ceza Numarası: ${inlineCode(`#${newID}`)})`,
            }),
        ],
        components: [],
    };
    question ? question.edit(query) : message.channel.send(query);
}
