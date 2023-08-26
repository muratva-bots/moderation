import { IRank, ModerationClass } from '@/models';
import { Client } from '@/structures';
import { Collection, Attachment, ClientEvents, Message, User } from 'discord.js';

export {};

declare global {
    namespace Moderation {
        export type EventKeys = keyof ClientEvents;

        export type IGuildData = ModerationClass & { ranks: IRank[], registerPoints: number };

        export interface ISnipe {
            id: string;
            content?: string;
            author: User;
            attachments?: Collection<string, Attachment>;
            timestamp: number;
        }

        export interface ILimit {
            count: number;
            lastUsage: number;
        }

        export interface IEvent<K extends EventKeys> {
            name: EventKeys;
            execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
        }

        export interface ICheckPermission {
            client: Client;
            message: Message;
            guildData: IGuildData;
        }

        export interface ICommand {
            usages: string[];
            description: string;
            chatUsable?: boolean;
            examples: string[];
            isDisabled?: boolean;
            category?: string;
            checkPermission?: ({ client, message }: ICheckPermission) => boolean;
            execute: (commandArgs: CommandArgs) => Promise<unknown> | unknown;
        }

        export interface CommandArgs {
            client: Client;
            message: Message;
            args: string[];
            guildData: IGuildData;
        }

        export interface IMention {
            user: string;
            time: number;
        }

        export interface IAFK {
            date: number;
            reason: string;
            mentions: IMention[];
        }
    }
}
