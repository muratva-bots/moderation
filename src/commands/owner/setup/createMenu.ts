import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Interaction,
    Message,
    StringSelectMenuBuilder,
} from 'discord.js';
import mainHandler from './mainHandler';
import { Client } from '@/structures';
import { IRoleOption, roleHandler } from './roleHandler';
import { SETTINGS } from '@/assets';
import { IChannelOption, channelHandler } from './channelHandler';
import { IBooleanOption, booleanHandler } from './booleanHandler';
import { IStringOption, stringHandler } from './stringHandler';
import { ILimitOption, limitHandler } from './limitHandler';
import { IQuickReasonOption, reasonHandler } from './quickReasonHandler';
import { IWarnRoleOption, warnRolesHandler } from './warnRolesHandler';
import { IMonthlyOption, monthlyRolesHandler } from './monthlyRolesHandler';

const titles = {
    general: 'genel ayarı',
    register: 'kayıt ayarını',
    penal: 'ceza ayarını',
};

async function createMenu(
    client: Client,
    message: Message,
    authorId: string,
    question: Message,
    type: 'general' | 'register' | 'penal',
    guildData: Moderation.IGuildData,
) {
    const settingOptions = SETTINGS[type];

    const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    const optionsChunkArray = client.utils.chunkArray(settingOptions, 25);
    for (let i = 0; optionsChunkArray.length > i; i++) {
        const options = optionsChunkArray[i];
        rows.push(
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        customId: `change-setting-${i}`,
                        placeholder: `Değişilecek ${titles[type]} seçiniz!`,
                        options: options.map((o) => ({
                            label: o.name as string,
                            description: o.description as string,
                            value: o.value as string,
                            emoji: {
                                id: '1134954912543944835',
                            },
                        })),
                    }),
                ],
            }),
        );
    }

    const backRow = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'back',
                label: 'Geri',
                style: ButtonStyle.Danger,
            }),
        ],
    });

    question.edit({
        content: 'Aşağıdaki menüden düzenleyeceğiniz ayarı seçiniz.',
        embeds: [],
        components: [...rows, backRow],
    });

    const filter = (i: Interaction) => i.user.id === authorId;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
        max: 1,
    });

    collector.on('collect', async (i: Interaction) => {
        collector.stop('FINISH');

        if (i.isButton() && i.customId === 'back') {
            i.deferUpdate();
            mainHandler(client, message, guildData, question);
            return;
        }

        if (i.isStringSelectMenu()) {
            i.deferUpdate();

            const option = settingOptions.find((o) => o.value === i.values[0]);
            if (option.type === 'role')
                roleHandler(client, message, option as IRoleOption, guildData, question, type, authorId);
            if (option.type === 'channel')
                channelHandler(client, message, option as IChannelOption, guildData, question, type, authorId);
            if (option.type === 'boolean')
                booleanHandler(client, message, option as IBooleanOption, guildData, question, type, authorId);
            if (option.type === 'string')
                stringHandler(client, message, option as IStringOption, guildData, question, type, authorId);
            if (option.type === 'limit')
                limitHandler(client, message, option as ILimitOption, guildData, question, type, authorId);
            if (option.type === 'reason')
                reasonHandler(client, message, option as IQuickReasonOption, guildData, question, type, authorId);
            if (option.type === 'warn-roles')
                warnRolesHandler(client, message, option as IWarnRoleOption, guildData, question, type, authorId);
            if (option.type === 'monthly-roles')
                monthlyRolesHandler(client, message, option as IMonthlyOption, guildData, question, type, authorId);
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
}

export default createMenu;
