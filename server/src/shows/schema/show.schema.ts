import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ShowDocument = Show & Document

@Schema({ minimize: false, timestamps: true })
export class Show {
    @Prop({ type: String, required: true, ref: 'Movie' })
    movie: string;

    @Prop({ type: Types.ObjectId, required: true, ref: 'Theater' })
    theater: Types.ObjectId;

    @Prop({ type: Date, required: true })
    showDateTime: Date;

    @Prop({ type: Number, required: true })
    showPrice: number;

    @Prop({ type: Object, default: {} })
    occupiedSeats: Record<string, string>;

    @Prop({ type: Number })
    screenNumber?: number;

    @Prop({ type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'VIP'], default: '2D' })
    format?: string; 

    @Prop({ type: String, enum: ['Spanish', 'English', 'Subtitled', 'Dubbed'] })
    language?: string; 
}

export const ShowSchema = SchemaFactory.createForClass(Show);