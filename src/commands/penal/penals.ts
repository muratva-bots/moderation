import { PenalFlags, SpecialCommandFlags } from '@/enums';
import { PenalModel } from '@/models';
import {
    ActionRowBuilder,
    time,
    bold,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    inlineCode,
    Interaction,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    userMention,
    APIEmbedField,
} from 'discord.js';
import { PENAL_TITLES } from '@/assets';

const Command: Moderation.ICommand = {
    usages: ['penals', 'cezalar', 'sicil'],
    description: 'Kullanıcının cezalarını gösterir.',
    examples: ['sicil @kullanıcı', 'sicil 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.botCommandAuth && guildData.botCommandAuth.some(r => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirtmelisin!');

        const penals = await PenalModel.find({
            user: user.id,
            guild: message.guildId,
            visible: true,
        });
        if (!penals.length) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının ceza verisi yok!');

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'penals',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                    options: penals
                        .slice(0, 25)
                        .filter((p) => p.type !== PenalFlags.ForceBan)
                        .map((penal) => {
                            let type = PENAL_TITLES[penal.type];
                            if (!type) {
                                const specialCommand = guildData.specialCommands.find(
                                    (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                                );
                                if (specialCommand) type = specialCommand.punishName;
                            }
                            return {
                                label: `${type} (#${penal.id})`,
                                description: 'Daha fazla bilgi için tıkla!',
                                value: penal.id,
                            };
                        }),
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        let components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [row];
        const totalData = Math.ceil(penals.length / 25);
        let page = 1;
        if (penals.length > 25) components.push(client.utils.paginationButtons(page, totalData));

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(`${user} (${inlineCode(user.id)}) adlı kullanıcının cezaları.`).setFields([
                    {
                        name: 'Ses Susturması',
                        value: penals.filter((p) => p.type === PenalFlags.VoiceMute).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Yazı Susturması',
                        value: penals.filter((p) => p.type === PenalFlags.ChatMute).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Diğer Cezalar',
                        value: penals
                            .filter(
                                (p) =>
                                    ![
                                        PenalFlags.VoiceMute,
                                        PenalFlags.Quarantine,
                                        PenalFlags.Ban,
                                        PenalFlags.Ads,
                                        PenalFlags.ChatMute,
                                        PenalFlags.ForceBan,
                                    ].includes(p.type),
                            )
                            .length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Cezalı',
                        value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Yasaklama',
                        value: penals.filter((p) => p.type === PenalFlags.Ban).length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Karantina/Reklam',
                        value: penals
                            .filter((p) => p.type === PenalFlags.Quarantine || p.type === PenalFlags.Ads)
                            .length.toString(),
                        inline: true,
                    },
                ]),
            ],
            components: components,
        });

        const filter = (i: Interaction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

        collector.on('collect', (i: Interaction) => {
            if (i.isStringSelectMenu()) {
                const penal = penals.find((p) => p.id === i.values[0]);
                const image = client.utils.getImage(penal.reason);

                let type = PENAL_TITLES[penal.type];
                if (!type) {
                    const specialCommand = guildData.specialCommands.find(
                        (s) => s.punishType === penal.type && s.type === SpecialCommandFlags.Punishment,
                    );
                    if (specialCommand) type = specialCommand.punishName;
                }

                const fields: APIEmbedField[] = [];
                fields.push({
                    name: `Ceza Detayı (${type})`,
                    value: [
                        `${inlineCode('>')} Üye Bilgisi: ${userMention(penal.user)} (${inlineCode(penal.user)})`,
                        `${inlineCode('>')} Yetkili Bilgisi: ${userMention(penal.admin)} (${inlineCode(penal.admin)})`,
                        `${inlineCode('>')} Ceza Tarihi: ${time(Math.floor(penal.start.valueOf() / 1000), 'D')}`,
                        `${inlineCode('>')} Ceza Süresi: ${
                            penal.finish ? client.utils.numberToString(penal.finish - penal.start) : 'Süresiz.'
                        }`,
                        `${inlineCode('>')} Ceza Durumu: ${inlineCode(penal.activity ? 'Aktif ✔' : 'Aktif Değil ❌')}`,
                    ].join('\n'),
                    inline: false,
                });

                if (penal.remover && penal.removeTime) {
                    fields.push({
                        name: 'Ceza Kaldırılma Detayı',
                        value: [
                            `${inlineCode('>')} Kaldıran Yetkili: (${userMention(penal.remover)} ${inlineCode(
                                penal.remover,
                            )})`,
                            `${inlineCode('>')} Kaldırma Tarihi: ${time(
                                Math.floor(penal.removeTime.valueOf() / 1000),
                                'D',
                            )}`,
                            `${inlineCode('>')} Kaldırılma Sebebi: ${inlineCode(
                                penal.removeReason || 'Sebep belirtilmemiş.',
                            )}`,
                        ].join('\n'),
                        inline: false,
                    });
                }

                const replacedReason = penal.reason.replace(client.utils.reasonImage, '');
                if (replacedReason.length) {
                    fields.push({
                        name: 'Ceza Sebebi',
                        value: inlineCode(replacedReason),
                        inline: false,
                    });
                }

                i.reply({
                    embeds: [
                        embed
                            .setFields(fields)
                            .setDescription(null)
                            .setImage(image ? image : undefined),
                    ],
                    ephemeral: true,
                });
                return;
            }

            if (i.isButton()) {
                i.deferUpdate();

                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                question.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'penals',
                                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                                    options: penals.slice(page === 1 ? 0 : page * 25 - 25, page * 25).map((penal) => {
                                        let type = PENAL_TITLES[penal.type];
                                        if (!type) {
                                            const specialCommand = guildData.specialCommands.find(
                                                (s) =>
                                                    s.punishType === penal.type &&
                                                    s.type === SpecialCommandFlags.Punishment,
                                            );
                                            if (specialCommand) type = specialCommand.punishName;
                                        }
                                        return {
                                            label: `${type} (#${penal.id})`,
                                            description: 'Daha fazla bilgi için tıkla!',
                                            value: `${penal.id}`,
                                        };
                                    }),
                                }),
                            ],
                        }),
                        client.utils.paginationButtons(page, totalData),
                    ],
                });
            }
        });

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
        });
    },
};

export default Command;
