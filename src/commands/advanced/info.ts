import { EmbedBuilder, PermissionFlagsBits, bold, inlineCode } from 'discord.js';

const Command: Moderation.ICommand = {
    usages: ['info', 'say'],
    description: 'Sunucunun anlık verisini gösterir.',
    examples: ['say'],
    checkPermission: ({ message, guildData }) =>
        message.member.permissions.has(PermissionFlagsBits.ViewAuditLog) ||
        (guildData.minStaffRole && message.member.roles.cache.has(guildData.minStaffRole)),
            execute: async ({ client, message, guildData }) => {
        const minStaffRole = await message.guild.roles.cache.get(guildData.minStaffRole);
        if (!minStaffRole) {
            client.utils.sendTimedMessage(message, 'En alt yetkili rolü ayarlanmamış.');
            return;
        }

        const members = await message.guild.members.fetch();
        const voiceMembers = members.filter((m) => m.voice.channelId).size;
        const staffVoiceMembers = members.filter((m) => m.voice.channelId && m.roles.cache.has(minStaffRole.id)).size;
        const taggedMembers = members.filter((m) =>
            (guildData.tags || []).some((t) => (m.user.displayName as string).toLowerCase().includes(t.toLowerCase())),
        ).size;

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: [
                        `${inlineCode('>')} Şuan sesli kanallarda ${bold(voiceMembers.toString())} aktif üye var.`,
                        `${inlineCode('>')} Şuan sesli kanallarda ${bold(
                            staffVoiceMembers.toString(),
                        )} aktif yetkili var.`,
                        `${inlineCode('>')} Şuan sunucuda toplam ${bold(members.size.toString())} üye var.`,
                        guildData.tags && guildData.tags.length
                            ? `${inlineCode('>')} Tagı alarak bizi destekleyen ${bold(
                                  taggedMembers.toString(),
                              )} üye var.`
                            : undefined,
                    ].join('\n'),
                }),
            ],
        });
    },
};

export default Command;
