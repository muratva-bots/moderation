import { Client as Core, GatewayIntentBits, ActivityType, Collection } from 'discord.js';
import { connect } from 'mongoose';

import { Utils } from './Utils';
import config from '../../config.json';

export class Client extends Core {
    commands = new Collection<string, Moderation.ICommand>();
    servers = new Collection<string, Moderation.IGuildData>();
    afkUsers = new Collection<string, Moderation.IAFK>();
    limits = new Collection<string, Moderation.ILimit>();
    snipes = {
        updated: new Collection<string, Moderation.ISnipe[]>(),
        deleted: new Collection<string, Moderation.ISnipe[]>(),
    };
    utils = new Utils(this);
    config = config;


    constructor() {
     
        super({
            intents: Object.keys(GatewayIntentBits).map((intent) => GatewayIntentBits[intent]),
            presence: {
                activities: [{ name: config.STATUS, type: ActivityType.Watching }],
            },
        });
    }

    async connect() {
        console.log('Loading bot commands...');
        await this.utils.loadCommands();

        console.log('Loading bot events...');
        await this.utils.loadEvents();

        console.log('Connecting mongo...');
        await connect(this.config.MONGO_URL);

        await this.login(this.config.TOKEN);
    }
}
