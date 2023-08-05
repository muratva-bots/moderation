import { readdirSync } from 'fs';
import { resolve } from 'path';

import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    Guild,
    GuildMember,
    Message,
    Snowflake,
    TextChannel,
    User,
    bold,
    codeBlock,
    inlineCode,
    time,
} from 'discord.js';
import { PenalClass } from '@/models';
import { EMOJIS } from '@/assets';

export class Utils {
    private client: Client;
    public limits: Collection<string, Moderation.ILimit>;
    public reasonImage: RegExp =
        /((?:https?:\/\/)[a-z0-9]+(?:[-.][a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/[^ \n<>]*)\.(?:png|apng|jpg|gif))/g;
    private logReasons = {
        0: '{user} adlı kullanıcı {admin} tarafından sunucudan yasaklandı.',
        1: '{user} adlı kullanıcı {admin} tarafından yazı kanallarında susturuldu.',
        2: '{user} adlı kullanıcı {admin} tarafından ses kanallarında susturuldu.',
        3: '{user} adlı kullanıcı {admin} tarafından kullanıcıya reklam rolü verildi.',
        4: '{user} adlı kullanıcı {admin} tarafından karantina atıldı.',
        5: '{user} adlı kullanıcı {admin} tarafından reklam cezası aldı.',
    };

    constructor(client: Client) {
        this.client = client;
        this.limits = new Collection<string, Moderation.ILimit>();
    }


    paginationButtons(page: number, totalData: number) {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'first',
                    emoji: {
                        id: '1070037431690211359',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === 1,
                }),
                new ButtonBuilder({
                    custom_id: 'previous',
                    emoji: {
                        id: '1061272577332498442',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === 1,
                }),
                new ButtonBuilder({
                    custom_id: 'count',
                    label: `${page}/${totalData}`,
                    style: ButtonStyle.Secondary,
                    disabled: true,
                }),
                new ButtonBuilder({
                    custom_id: 'next',
                    emoji: {
                        id: '1061272499670745229',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: totalData === page,
                }),
                new ButtonBuilder({
                    custom_id: 'last',
                    emoji: {
                        id: '1070037622820458617',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === totalData,
                }),
            ],
        });
    }

    getEmoji(name: string) {
        const clientEmoji = this.client.emojis.cache.find((e) => e.name === name);
        return clientEmoji ? clientEmoji.toString() : EMOJIS.find((e) => e.name === name).default;
    }

    titleCase(str: string) {
        return str
            .split(' ')
            .map((arg) => arg.charAt(0).toLocaleUpperCase('tr-TR') + arg.slice(1))
            .join(' ');
    }

    isSnowflake(id: string): id is Snowflake {
        return BigInt(id).toString() === id;
    }

    getImage(str: string) {
        const images = str.match(this.reasonImage);
        return images ? images[0] : undefined;
    }

    setRoles(member: GuildMember, params: string[] | string): Promise<GuildMember> {
        if (!member.manageable) return undefined;

        const roles = member.roles.cache
            .filter((role) => role.managed)
            .map((role) => role.id)
            .concat(params);
        return member.roles.set(roles);
    }

    sendLog({
        guild,
        channel,
        user,
        penal,
        admin,
        attachment,
        specialType,
    }: {
        guild: Guild;
        channel: string;
        penal: PenalClass;
        user: User;
        admin: User;
        attachment?: string;
        specialType?: string;
    }) {
        const logChannel = guild.channels.cache.find((c) => c.name === channel || c.id === channel) as TextChannel;
        if (!logChannel) return false;

        const image = this.getImage(penal.reason);
        logChannel.send({
            embeds: [
                new EmbedBuilder({
                    description: (
                        this.logReasons[penal.type] ||
                        `{user} adlı kullanıcı {admin} tarafından sunucudan ${bold(
                            specialType.toLowerCase(),
                        )} cezası aldı.`
                    )
                        .replace(/{user}/g, bold(user.username))
                        .replace(/{admin}/g, bold(admin.username)),
                    fields: [
                        {
                            name: 'Ceza Yiyen Kullanıcı',
                            value: `${user} (${inlineCode(user.id)})`,
                            inline: true,
                        },
                        {
                            name: 'Cezalandıran Yetkili',
                            value: `${admin} (${inlineCode(admin.id)})`,
                            inline: true,
                        },
                        {
                            name: 'Başlangıç',
                            value: time(Math.floor(penal.start / 1000), 'F'),
                            inline: false,
                        },
                        penal.finish
                            ? {
                                  name: 'Bitiş',
                                  value: time(Math.floor(penal.finish / 1000), 'F'),
                                  inline: false,
                              }
                            : undefined,
                        penal.reason
                            ? {
                                  name: 'Ceza Sebebi',
                                  value: codeBlock('ansi', `[2;31m${penal.reason}`),
                              }
                            : undefined,
                    ].filter(Boolean),
                    image: {
                        url: attachment ? attachment : (image as string),
                    },
                    footer: {
                        text: `Ceza ID: ${penal.id}`,
                    },
                }),
            ],
        });

        return true;
    }

    splitMessage(text: string, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
        if (text.length <= maxLength) return [append + text + prepend];
        const splitText = text.split(char);
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter((m) => m);
    }

    async getMember(guild: Guild, id: string): Promise<GuildMember> {
        if (!id || !this.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = guild.members.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await guild.members.fetch({ user: id.replace(/\D/g, ''), force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    async getUser(id: string): Promise<User> {
        if (!id || !this.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = this.client.users.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await this.client.users.fetch(id.replace(/\D/g, ''), { force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    checkLimit(id: string, type: number, count: number = 5, minutes: number = 1000 * 60 * 15) {
        const key = `${id}-${type}`;
        const now = Date.now();

        const userLimits = this.limits.get(`${id}-${type}`);
        if (!userLimits) {
            this.limits.set(key, { count: 1, lastUsage: now });
            return { hasLimit: false };
        }

        userLimits.count = userLimits.count + 1;

        const diff = now - userLimits.lastUsage;
        if (diff < minutes && userLimits.count >= count) {
            return {
                hasLimit: true,
                time: time(Math.floor((userLimits.lastUsage + minutes) / 1000), 'R'),
            };
        }

        if (diff > minutes) this.limits.delete(id);
        else this.limits.set(id, userLimits);
        return { hasLimit: false };
    }

    numberToString(seconds: number) {
        seconds = seconds / 1000;
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor((seconds % (3600 * 24)) / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
    
        var dDisplay = d > 0 ? d + ' gün ' : '';
        var hDisplay = h > 0 ? h + ' saat ' : '';
        var mDisplay = d === 0 && m > 0 ? m + ' dakika ' : '';
        var sDisplay = h === 0 && s > 0 ? s + ' saniye' : '';
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    sendTimedMessage(message: Message, content: string, time = 1000 * 5) {
        message
            .reply({ content })
            .then((msg) => {
                setTimeout(() => msg.delete(), time);
            })
            .catch(() => undefined);
    }

    checkUser(message: Message, member: GuildMember) {
        let type;

        if (member.user.bot) type = 'Botlara işlem yapamazsın!';
        if (member.id === message.member.id) type = 'Kendinize işlem yapamazsın!';
        if (message.member.id === member.roles.highest.id)
            type = '{user} ile aynı yetkidesin! Kullanıcıya işlem yapamazsın.';
        if (member.id === this.client.user.id) type = 'Botlara işlem uygulayamazsın!';
        if (member.roles.highest.rawPosition >= message.member.roles.highest.rawPosition)
            type = '{user} senden daha üst bir yetkiye sahip.';
        if (message.guild.members.me.roles.highest.id === member.roles.highest.id)
            type = '{user} benimle aynı yetkiye sahip! Kullanıcıya işlem yapamam.';

        if (type) this.client.utils.sendTimedMessage(message, type.replace(/{user}/g, member.user.username));
        return type;
    }

    getRandomColor() {
        return Math.floor(Math.random() * (0xffffff + 1));
    }

    chunkArray(array: any[], chunkSize: number) {
        const chunkedArray = [];
        for (let i = 0; i < array.length; i += chunkSize) chunkedArray.push(array.slice(i, i + chunkSize));
        return chunkedArray;
    }

    async loadCommands() {
        const categories = readdirSync(resolve(__dirname, '..', 'commands'));
        categories.forEach((category) => {
            const files = readdirSync(resolve(__dirname, '..', 'commands', category));
            files.forEach(async (fileName) => {
                const commandFile = await import(resolve(__dirname, '..', 'commands', category, fileName));
                delete require.cache[commandFile];

                const command = commandFile.default as Moderation.ICommand;
                this.client.commands.set(command.usages[0], { ...command, category });
            });
        });
    }

    async loadEvents() {
        const files = readdirSync(resolve(__dirname, '..', 'events'));
        files.forEach(async (fileName) => {
            const eventFile = await import(resolve(__dirname, '..', 'events', fileName));
            delete require.cache[eventFile];

            const event = eventFile.default;
            this.client.on(event.name, (...args: unknown[]) => event.execute(this.client, ...args));
        });
    }
}
