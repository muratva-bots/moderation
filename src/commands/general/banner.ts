import { EmbedBuilder } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['banner'],
    description: 'Belirtilen kullanıcının bannerını gösterir.',
    examples: ['banner', 'banner @kullanıcı', 'banner 123456789123456789'],
    execute: async ({ client, message, args }) => {
        const user =
            (await client.utils.getUser(args[0])) ||
            (message.reference ? (await message.fetchReference()).author : await message.author.fetch());

        if (!user.banner) {
            client.utils.sendTimedMessage(message, 'Kullanıcının bannerı bulunmuyor.');
            return;
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: user.username,
                        icon_url: user.displayAvatarURL({ forceStatic: true, size: 4096 }),
                    },
                    title: 'Discord Kullanıcı Banneri',
                    timestamp: Date.now(),
                    image: {
                        url: user.bannerURL({
                            forceStatic: true,
                            size: 4096,
                            extension: user.banner.startsWith('a_') ? 'gif' : 'png',
                        }),
                    },
                }),
            ],
        });
    },
};

export default Command;
