import { PermissionFlagsBits } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['staffsay', 'yetkilisay', 'yetkili-say', 'ytsay', 'ysay', 'y-say'],
    description: 'Sunucudaki yetkililerin seste olmayanlarını sayar.',
    examples: ['staffsay @rol', 'staffsay 123456789123456789'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ManageRoles) ||
        (guildData.ownerRoles && guildData.ownerRoles.some((r) => message.member.roles.cache.has(r))),
    execute: async ({ client, message, args, guildData }) => {
        const minStaffRole = message.guild.roles.cache.get(guildData.minStaffRole);
        if (!minStaffRole) return message.channel.send('En alt yetkili rolü ayarlanmamış.');

        const role = message.guild.roles.cache.get(args[0]);
        if (role && role.id === message.guild?.roles.everyone.id) {
            client.utils.sendTimedMessage(message, 'Neden herkesi etiketlemek isteyesin ki?');
            return;
        }

        let members = message.guild?.members.cache.filter(
            (member) => !member.user.bot && member.presence?.status !== 'offline' && !member.voice.channelId,
        );
        if (role) members = members.filter((member) => member.roles.cache.has(role.id));
        else {
            members = members.filter((member) => member.roles.highest.comparePositionTo(minStaffRole) >= 0);
        }

        const [firstContent, ...arr] = client.utils.splitMessage(members.map((member) => member).join(', '), {
            maxLength: 2000,
            char: ',',
        });
        message.channel.send({ content: members.size > 0 ? firstContent : 'Mükkemmel! Seste olmayan yetkili yok.' });
        for (const newText of arr) message.channel.send({ content: newText });
    },
};

export default Command;
