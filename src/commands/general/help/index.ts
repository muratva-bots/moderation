import mainHandler from './mainHandler';

const Command: Moderation.ICommand = {
    usages: ['yardım', 'help', 'komutlar'],
    description: 'Komutları listeler.',
    examples: ['help'],
    execute: async ({ client, message, args, guildData }) => {
        mainHandler(client, message, guildData);
    },
};

export default Command;
