import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ShowDocument = Show & Document

@Schema({ minimize: false, timestamps: true })
export class Show {
    @Prop({ type: String, required: true, ref: 'Movie' })
    movie: String;

    @Prop({ type: Date, required: true })
    showDateTime: Date;

    @Prop({ type: Number, required: true })
    showPrice: number;

    @Prop({ type: Object, default: {} })
    occupiedSeats: Record<string, any>;
}

export const ShowSchema = SchemaFactory.createForClass(Show);