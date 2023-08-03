import { bold } from 'discord.js';
import { DEFAULTS } from '@/assets';
import { LimitFlags } from '@/enums';

const inviteRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

const Command: Moderation.ICommand = {
    usages: ['bisim', 'booster', 'b', 'zengin'],
    description: 'Boost basan üyeler nicklerini değiştirir.',
    examples: ['booster <yeni nick>'],
    checkPermission: ({ message }) => !!message.member.premiumSinceTimestamp,
    execute: ({ client, message, args, guildData }) => {
        const name = args.join(' ');
        if (!name.length) return client.utils.sendTimedMessage(message, 'Geçerli bir isim belirt!');

        if (name.match(adsRegex)) {
            client.utils.sendTimedMessage(
                message,
                'Belirttiğin kullanıcı adında özel harflerin bulunmaması gerekiyor!',
            );
            return;
        }

        if (inviteRegex.test(name)) {
            message.delete();
            client.utils.sendTimedMessage(message, 'Reklam yapmasak mı?');
            return;
        }

        const tags = guildData.tags || [];
        if (tags.length && !guildData.secondTag) {
            client.utils.sendTimedMessage(message, 'Tagsızların tagı ayarlanmamış.');
            return;
        }
        const limit = client.utils.checkLimit(
            message.author.id,
            LimitFlags.Booster,
            DEFAULTS.booster.limit.count,
            DEFAULTS.booster.limit.time,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum kayıtsız limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const hasTag = tags.some((t) => message.author.username.includes(t));
        const newName = tags.length ? `${hasTag ? tags[0] : guildData.secondTag} ${name}` : name;
        if (newName.length > 30)
            return client.utils.sendTimedMessage(message, '30 karakteri geçmeyecek bir isim belirt.');

        if (!message.member.manageable)
            return client.utils.sendTimedMessage(message, 'Yetkim yetmediği için kullanıcı adını değiştiremiyorum!');
        message.member.setNickname(newName);

        message.reply(`ismin "${bold(newName)}" olarak değiştirildi.`);
    },
};

export default Command;
