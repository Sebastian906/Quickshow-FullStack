import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TheaterDocument = Theater & Document;

@Schema({ timestamps: true })
export class Theater {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    image: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    openingTime: string;

    @Prop({ required: true })
    closingTime: string;

    @Prop({ type: [String], default: [] })
    amenities: string[];

    @Prop({ type: Number, default: 0 })
    totalScreens: number;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop({ type: String })
    phoneNumber?: string;

    @Prop({ type: String })
    description?: string;
}

export const TheaterSchema = SchemaFactory.createForClass(Theater);