import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import infoHandler from './infoHandler';
import { ModerationClass } from '@/models';

async function listHandler(client: Client, message: Message, guildData: ModerationClass, botMessage?: Message) {
    const members = await message.guild.members.fetch();

    const teams = (guildData.teams || []).filter((t) => message.guild.roles.cache.has(t.role));
    const row = new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'list',
                placeholder: `Ekip seçilmemiş (${teams.length} ekip)`,
                disabled: !teams.length,
                options: teams.length
                    ? teams.map((team) => ({
                          label: `${client.utils.titleCase(team.name)} (${
                              members.filter((m) => m.roles.cache.has(team.role)).size
                          } üye)`,
                          value: team.name.toLowerCase(),
                      }))
                    : [{ label: 'a', value: 'b' }],
            }),
        ],
    });

    const query = {
        content: 'Aşağı menüden bakacağınız ekibi seçin.',
        components: [row],
    };
    const question = await (botMessage ? botMessage.edit(query) : message.channel.send(query));

    const filter = (i) => i.user.id === message.author.id;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 5,
    });

    collector.on('collect', (i: StringSelectMenuInteraction) => {
        i.deferUpdate();

        const team = guildData.teams.find((team) => team.name.toLowerCase() === i.values[0]);
        infoHandler(client, message, team, guildData, members, question, row);
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'button-end',
                        label: 'Mesajın Geçerlilik Süresi Doldu.',
                        emoji: { name: '⏱️' },
                        style: ButtonStyle.Danger,
                        disabled: true,
                    }),
                ],
            });

            question.edit({ components: [row] });
        }
    });
}

export default listHandler;
