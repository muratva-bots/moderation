import { bold, codeBlock, inlineCode, PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['rolbilgi', 'rol-bilgi', 'roleinfo', 'role-info', 'rolinfo'],
    description: 'Belirtilen rolün detaylarını gösterir.',
    examples: ['rolbilgi @rol', 'rolbilgi 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ManageRoles) ||
        (guildData.ownerRoles && guildData.ownerRoles.some(r => message.member.roles.cache.has(r))),
    execute: ({ client, message, args }) => {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild.id) {
            client.utils.sendTimedMessage(message, 'Geçerli bir rol belirtmelisin!');
            return;
        }

        const text = role.members.map((member) => `${member.displayName} (${member.id})`).join('\n');
        const arr = client.utils.splitMessage(text, { maxLength: 2000, char: '\n' });
        for (let i = 0; arr.length > i; i++) {
            const newText = arr[i];
            message.channel.send({
                content:
                    i === 0
                        ? `${codeBlock('md', `# ${role.name} (${role.id}) | ${role.members.size} Üye`)}${codeBlock(
                              'fix',
                              newText,
                          )}`
                        : codeBlock('fix', newText),
            });
        }
    },
};

export default Command;
