import { IRegister, UserModel } from '@/models';
import { Client } from '@/structures';
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction,
    PermissionFlagsBits,
    Message,
    codeBlock,
} from 'discord.js';

const Command: Moderation.ICommand = {
    usages: [
        'top-register',
        'topteyit',
        'top-teyit',
        'topt',
        'top-registers',
        'topregister',
        'topregisters',
        'tregister',
        'toprank',
    ],
    description: 'Sunucu kayıt top listesini görüntülersiniz.',
    examples: ['topteyit'],
    checkPermission: ({ message, guildData }) => message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        (guildData.registerAuth && guildData.registerAuth.some(r => message.member.roles.cache.has(r))), 
    execute: async ({ client, message }) => {
        const datas = await UserModel.find({
            $or: [{ 'registers.man': { $gt: 0 } }, { 'registers.woman': { $gt: 0 } }],
        }).lean();
        if (!datas.length)
            return client.utils.sendTimedMessage(
                message,
                'sunucuda kayıt yapan adam yok kayıt yapan adam alın oçlar..',
            );

        const mappedDatas = datas
            .map((d) => ({
                id: d.id,
                man: d.registers.man || 0,
                woman: d.registers.woman || 0,
                normal: d.registers.normal || 0,
            }))
            .sort((a, b) => b.man + b.woman - (a.man + a.woman));
        const totalData = Math.ceil(datas.length / 10);

        const userRank = mappedDatas.findIndex((m) => m.id === message.author.id) + 1;
        const userData = (
            datas.find((m) => m.id === message.author.id) || { registers: { man: 0, woman: 0, normal: 0 } }
        ).registers;

        let page = 1;
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: await createContent(client, message, userData, userRank, mappedDatas, page),
            footer: {
                text: `${page}/${totalData}`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [client.utils.paginationButtons(page, totalData)],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            await question.edit({
                embeds: [
                    embed
                        .setDescription(
                            await createContent(
                                client,
                                message,
                                userData,
                                userRank,
                                mappedDatas.slice(page === 1 ? 0 : page * 10 - 10, page * 10),
                                page,
                            ),
                        )
                        .setFooter({
                            text: `${page}/${totalData}`,
                        }),
                ],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
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

                question.edit({ components: [timeFinished] });
            }
        });
    },
};

export default Command;
//29.07.2023 02:10 canzade-muratva

async function createContent(
    client: Client,
    message: Message,
    userData: IRegister,
    userRank: number,
    datas: IRegister[] & { id: string }[],
    page: number,
) {
    let content = [
        `< ${message.guild.name} Sunucusunun Kayıt Sıralaması >`,
        `> Senin sıralaman: ${userRank === 0 ? 'henüz kayıdın bulunmuyor' : userRank}`,
        `> ${' '.repeat(6)} ${
            userData.normal
                ? `${userData.normal || 0} kayıt`
                : `${userData.man || 0} erkek, ${userData.woman || 0} kadın, ${
                      (userData.man || 0) + (userData.woman || 0)
                  } toplam`
        }\n`,
    ];
    for (let i = 0; datas.length > i; i++) {
        const data = datas[i];

        let name = '';
        let user = await client.utils.getUser(data.id);
        if (!user) name = 'Silinmiş Hesap';
        else name = `@${user.displayName.replace('discord.gg', '**').replace('.gg/', '**')}`;

        content.push(
            `# ${i + (page - 1) * 10 + 1} ${name}`,
            `${' '.repeat(8)} ${data.man} erkek, ${data.woman} kadın, ${data.man + data.woman} toplam`,
        );
    }

    return codeBlock(
        'md',
        [
            ...content,
            new Date().toLocaleString('tr-TR', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            }),
        ].join('\n'),
    );
}
