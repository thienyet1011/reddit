import mongoose from 'mongoose';
import { getModelForClass, prop } from '@typegoose/typegoose';

export class Token {
    _id!: mongoose.Types.ObjectId;

    @prop({required: true})
    userId!: string;

    @prop({required: true})
    token!: string;

    @prop({default: Date.now, expires: 5 * 60}) // expired in 5 minutes
    createdAt: Date
}

export const TokenModel = getModelForClass(Token);