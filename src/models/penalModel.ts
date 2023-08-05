import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { PenalFlags } from '@/enums';

export interface INote {
    admin: string;
    description: string;
}

@modelOptions({ options: { customName: 'Penals', allowMixed: 0 } })
export class PenalClass {
    @prop({ type: () => String, required: true, unique: true })
    public id!: string;

    @prop({ type: () => String, required: true })
    public guild!: string;

    @prop({ type: () => Boolean, default: true })
    public activity: boolean;

    @prop({ type: () => Boolean, default: false })
    public completed: boolean;

    @prop({ type: () => String, required: true })
    public admin: string;

    @prop({ type: () => String, required: true })
    public user: string;

    @prop({ type: () => Number, required: true })
    public type: PenalFlags;

    @prop({ type: () => String, required: true })
    public reason: string;

    @prop({ type: () => Number })
    public finish?: number;

    @prop({ type: () => Number, default: () => Date.now() })
    public start: number;

    @prop({ type: () => String, default: undefined })
    public remover?: string;

    @prop({ type: () => Number, default: undefined })
    public removeTime?: number;

    @prop({ type: () => String, default: undefined })
    public removeReason?: string;

    @prop({ type: () => [Object], default: [] })
    public notes: INote[];

    @prop({ type: () => [String], default: true })
    public roles?: string[];

    @prop({ type: () => Boolean, default: true })
    public visible?: boolean;
}

export const PenalModel = getModelForClass(PenalClass);
