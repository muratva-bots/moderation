import { Client } from "@/structures";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, Message, StringSelectMenuBuilder, codeBlock } from "discord.js";
import mainHandler from "./mainHandler";
import { ModerationClass } from "@/models";
import { SpecialCommandFlags } from "@/enums";

const types = {
    [SpecialCommandFlags.Message]: 'Mesaj',
    [SpecialCommandFlags.Punishment]: 'Ceza',
    [SpecialCommandFlags.Role]: 'Rol',
};

async function categoryHandler(client: Client, message: Message, question: Message, type: string, guildData: ModerationClass) {
    const splitedCommands = client.utils.chunkArray(
        type === "special-commands" ?
            guildData.specialCommands.map(c => ({ name: c.usages[0], description: c.description })) :
            client.commands
                .filter((c) => !c.isDisabled && c.category === type)
                .map((c) => ({ name: c.usages[0], description: c.description })),
        25,
    );

    const backButton = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: "back",
                label: "Geri",
                style: ButtonStyle.Danger
            })
        ]
    });

    console.log(splitedCommands.length)

    const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
    for (const commands of splitedCommands) {
        components.push(
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        custom_id: `commands-${Math.random()}`,
                        placeholder: 'Komutu seç!',
                        options: commands.map((c) => ({
                            label: c.name,
                            description:
                                c.description.length > 100 ? `${c.description.slice(0, 97)}...` : c.description,
                            value: c.name,
                        })),
                    }),
                ],
            }),
        );
    }

    await question.edit({ content: "Bakacağınız komutu seçin.", components: [...components, backButton] });

    const filter = (i: Interaction) => i.user.id === message.author.id;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i: Interaction) => {
        if (i.isButton() && i.customId === "back") {
            i.deferUpdate();
            collector.stop("FINISH");
            mainHandler(client, message, guildData, question);
            return;
        }

        if (i.isStringSelectMenu()) {
            if (type === "special-commands") {
                const command = guildData.specialCommands.find(c => c.usages.includes(i.values[0]));
                if (!command) {
                    i.reply({
                        content: "Komut silinmiş.",
                        ephemeral: true
                    });
                    return;
                }

                i.reply({
                    content: codeBlock("fix", [
                        `Komut Kullanımları: ${command.usages.map(u => u.trim()).join(", ")}`,
                        `Komut Açıklaması: ${command.description}`,
                        `Komut Türü: ${types[command.type]}`
                    ].join("\n")),
                    ephemeral: true
                });
                return;
            } 

            const command = client.commands.get(i.values[0]);
            i.reply({
                content: codeBlock("fix", [
                    `Komut Kullanımları: ${command.usages.join(", ")}`,
                    `Komut Açıklaması: ${command.description}`,
                    `Komut Örnekleri:\n${command.examples.map((e) => `→ ${client.config.PREFIXES[0]}${e}`).join("\n")}`,
                ].join("\n")),
                ephemeral: true
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
}

export default categoryHandler;
