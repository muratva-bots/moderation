import { RoleLogFlags, VoiceLogFlags, NameFlags } from '@/enums';
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

export interface IWarn {
    admin: string;
    description: string;
}

export interface IName {
    admin: string;
    type: NameFlags;
    time: number;
    role?: string;
    name?: string;
}

export interface IVoiceLog {
    type: VoiceLogFlags;
    channel: string;
    time: number;
    admin?: string;
}

export interface IRoleLog {
    type: RoleLogFlags;
    roles: string[];
    time: number;
    admin?: string;
}

export interface IRegister {
    woman: number;
    man: number;
    normal: number;
}

@modelOptions({ options: { customName: 'Users', allowMixed: 0 } })
export class UserClass {
    @prop({ type: () => String, required: true, unique: true })
    public id!: string;

    @prop({ type: () => String, required: true })
    public guild!: string;

    @prop({ type: () => [Object], default: [] })
    public warns!: IWarn[];

    @prop({ type: () => [Object], default: [] })
    public names!: IName[];

    @prop({ type: () => [Object], default: [] })
    public voiceLogs!: IVoiceLog[];

    @prop({ type: () => [Object], default: [] })
    public roleLogs!: IRoleLog[];

    @prop({ type: () => Boolean, default: false })
    public monthlyRole: boolean;

    @prop({ type: () => Object, default: {} })
    public registers!: IRegister;

    @prop({ type: () => [String], default: [] })
    public lastRoles: string[];
}

export const UserModel = getModelForClass(UserClass);
