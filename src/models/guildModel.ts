import { SpecialCommandFlags } from '@/enums';
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { NeedFlags } from '@/enums';

export interface IRank {
    point: number;
    role: string;
    taskCount?: number;
    roleTime?: number;
    extraRole?: string;
    maxSleep: number;
}

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
    minAdminRole: string;
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
            extraMute: false,
        },
    })
    public moderation: ModerationClass;

    @prop({ type: Object, default: {} })
    public guard: object;

    @prop({
        type: Object,
        default: {
            messagePoint: 1,
            messageStaffPoint: 2,
            invitePoint: 70,
            sleepPoint: 4,
            publicPoint: 8,
            meetingPoint: 500,
            noMute: true,
            eventFinishTimestamp: Date.now(),
            staffTakePoints: 70,
            taggedPoints: 70
        },
    })
    public point: object;

    @prop({
        type: Object,
        default: {
            removeOldRank: false,
            dailyPublic: 0,
            lastPublic: 0,
            dailyStream: 0,
            lastStream: 0,
            dailyCam: 0,
            lastCam: 0,
            dailyStreamOpen: 0,
            lastStreamOpen: 0,
            dailyCamOpen: 0,
            lastCamOpen: 0,
            dailyGeneral: 0,
            lastGeneral: 0,
            dailyMessage: 0,
            lastMessage: 0,
            dailyAfk: 0,
            lastAfk: 0,
            dailyJoin: 0,
            lastJoin: 0,
            dailyLeave: 0,
            lastLeave: 0,
            camChannels: [],
            dailyVoice: 0,
            lastVoice: 0,
            lastDay: new Date().setHours(0, 0, 0, 0),
            days: 1,
            owneredStreams: []
        },
    })
    public stat: object;
}

export const GuildModel = getModelForClass(GuildClass);
