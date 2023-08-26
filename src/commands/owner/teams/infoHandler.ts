import { GuildModel, ITeam } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    GuildMember,
    Message,
    StringSelectMenuBuilder,
    Team,
    codeBlock,
} from 'discord.js';

async function infoHandler(
    client: Client,
    message: Message,
    team: ITeam,
    guildData:Moderation.IGuildData,
    members: Collection<string, GuildMember>,
    botMessage: Message,
    previousRow: ActionRowBuilder<StringSelectMenuBuilder>,
) {
    const minStaffRole = message.guild.roles.cache.get(guildData.minStaffRole);
    if (!minStaffRole) return message.channel.send('En alt yetkili rolü ayarlanmamış.');

    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'remove',
                label: 'Kaldır',
                style: ButtonStyle.Danger,
            }),
        ],
    });

    const teamMembers = members.filter((m) => m.roles.cache.has(team.role));
    const ownerID = message.author.id;

    previousRow.components[0].options.find((o) => o.data.value === team.name.toLowerCase()).setDefault(true);

    const question = await botMessage.edit({
        content: '',
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: codeBlock(
                    'yaml',
                    [
                        `# ${client.utils.titleCase(team.name)}`,
                        `→ ${team.owners.length === 1 ? 'Kurucu' : 'Kurucular'}: ${team.owners
                            .filter((o) => client.users.cache.has(o))
                            .map((o) => client.users.cache.get(o).globalName)
                            .join(', ')}`,
                        `→ Ekip Taglı Üye Sayısı: ${teamMembers.size}`,
                        `→ Sunucu Taglı Üye Sayısı: ${
                            teamMembers.filter((m) =>
                                guildData.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
                            ).size
                        }`,
                        `→ Yetkili Sayısı: ${
                            teamMembers.filter((m) => m.roles.highest.position >= minStaffRole.position).size
                        }`,
                        `→ Seste Olan Üye Sayısı: ${teamMembers.filter((m) => m.voice.channelId).size}`,
                    ].join('\n'),
                ),
            }),
        ],
        components: message.author.id === ownerID ? [previousRow, row] : [previousRow],
    });

    if (message.author.id !== ownerID) return;

    const filter = (i) => i.user.id === message.author.id;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 2,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
        i.reply({
            content: 'Başarıyla ekip silindi.',
            ephemeral: true,
        });

        botMessage.edit({ components: [] });
        guildData.teams = guildData.teams.filter((t) => t.name !== team.name);
        guildData.specialCommands = guildData.specialCommands?.filter(
            (s) => !s.usages.includes(team.name.toLowerCase().split(' ').join('-')),
        );
        await GuildModel.updateOne(
            { id: message.guildId },
            { $set: { 'moderation.teams': guildData.teams, 'moderation.specialCommands': guildData.specialCommands } },
            { upsert: true },
        );
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
}

export default infoHandler;
