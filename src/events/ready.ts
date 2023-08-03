import { GuildModel, GuildClass } from '@/models';
import { Events } from 'discord.js';

const Ready: Moderation.IEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    execute: async (client) => {
        const guild = client.guilds.cache.get('1130942265020383373');
        if (!guild) {
            console.log('Guild is undefined.');
            return;
        }

        await guild.members.fetch();
        await guild.fetchOwner();

        console.log(`${client.user.tag} is online!`);

        await client.application.fetch();
        const document = (await GuildModel.findOne({ id: guild.id })) || (await GuildModel.create({ id: guild.id }));
        client.servers.set(guild.id, { ...document.moderation });

        client.commands.get('register').isDisabled = document.moderation.menuRegister;
        client.commands.get('woman').isDisabled = !document.moderation.menuRegister;
        client.commands.get('erkek').isDisabled = !document.moderation.menuRegister;

        const guildEventEmitter = GuildModel.watch([{ $match: { 'fullDocument.id': guild.id } }], {
            fullDocument: 'updateLookup',
        });
        guildEventEmitter.on('change', ({ fullDocument }: { fullDocument: GuildClass }) =>
            client.servers.set(guild.id, { ...fullDocument.moderation }),
        );

        setInterval(() => {
            const now = Date.now();
            client.utils.limits
                .filter((v) => 1000 * 60 * 60 >= now - v.lastUsage)
                .forEach((_, k) => client.limits.delete(k));
        }, 1000 * 10);
    },
};

export default Ready;
