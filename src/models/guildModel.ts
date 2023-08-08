import { SpecialCommandFlags } from '@/enums';
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { NeedFlags } from '@/enums';

export interface ITeam {
    name: string;
    owners: string[];
    role: string;
    tags: string[];
}

export interface IReason {
    name: string;
    value: string;
    placeholder: string;
    time: number;
    needType: NeedFlags;
}

export interface IMaxMuteOperations {
    count: number;
    time: number;
    clear: boolean;
}

export interface IWarnRoles {
    count: number;
    role: string;
}

export interface ISpecialCommand {
    usages: string[];
    description: string;
    auth: string[];
    type: SpecialCommandFlags;
    content?: string;
    roles?: string[];
    quickReasons?: IReason[];
    isUn?: boolean;
    punishType?: number;
    punishName?: string;
    punishRole?: string;
    logChannel?: string;
    tags?: string[];
}

export interface ICanExecute {
    name: string;
    specialPass: string[];
}

export interface IMonthlyRole {
    role: string;
    time: number;
}

export class ModerationClass {
    tags: string[];
    minStaffRole: string;
    teams: ITeam[];
    registerParent: string;
    unregisterRoles: string[];
    unregisteredLimitCount: number;
    unregisteredLimitTime: number;
    maxRoleAddRole: string;
    ownerRoles: string[];
    publicParent: string;
    secondTag: string;
    moveAuth: string[];
    underworldRole: string;
    adsRole: string;
    chatMuteRole: string;
    muteLimitCount: number;
    muteLimitTime: number;
    extraMuteTime: number;
    extraMute: boolean;
    maxMuteOperations: IMaxMuteOperations[];
    maxMuteSystem: boolean;
    voiceMuteReasons: IReason[];
    chatMuteReasons: IReason[];
    quarantineRole: string;
    suspectedRole: string;
    quarantineLimitTime: number;
    quarantineLimitCount: number;
    quarantineReasons: IReason[];
    underworldReasons: IReason[];
    voiceMuteRole: string;
    warnRoles: IWarnRoles[];
    removeWarnRole: boolean;
    meetingRole: string;
    underworldLimitCount: number;
    underworldLimitTime: number;
    afkRoom: string;
    specialCommands: ISpecialCommand[];
    compliment: boolean;
    chatChannel: string;
    canExecutes: ICanExecute[];
    manRoles: string[];
    womanRoles: string[];
    registeredRole: string;
    taggedMode: boolean;
    vipRole: string;
    changeName: boolean;
    needAge: boolean;
    minAge: number;
    minAgePunish: boolean;
    needName: boolean;
    menuRegister: boolean;
    registerSystem: boolean;
    registerChannel: string;
    invasionProtection: boolean;
    loveRoles: string[];
    gameRoles: string[];
    colorRoles: string[];
    zodiacRoles: string[];
    giveawayRole: string;
    eventRole: string;
    familyRole: string;
    solvingAuth: string;
    solvingParent: string;
    solvingLog: string;
    monthlyRoles: IMonthlyRole[];
    monthlyRolesSystem: boolean;
    banAuth: string[];
    jailAuth: string[];
    voiceMuteAuth: string[];
    chatMuteAuth: string[];
    registerAuth: string[];
    bannedTags: string[];
    bannedTagRole: string;
    autoRegister: boolean;
    staffChat: string;
}

@modelOptions({ options: { customName: 'Guilds', allowMixed: 0 } })
export class GuildClass {
    @prop({ type: () => String, required: true })
    public id!: string;

    @prop({
        type: Object,
        default: {
            needName: true,
            registerSystem: true,
            invasionProtection: true,
            needAge: true,
            removeWarnRole: true,
            compliment: true,
            changeName: true,
            minAgePunish: true,
            maxMuteSystem: true,
            extraMute: true,
        },
    })
    public moderation: ModerationClass;

    @prop({ type: Object, default: {} })
    public guard: object;

    @prop({ type: Object, default: {} })
    public point: object;
}

export const GuildModel = getModelForClass(GuildClass);
