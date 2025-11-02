import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type BookingDocument = Booking & Document

@Schema({ timestamps: true })
export class Booking {
    @Prop({ type: String, required: true }) 
    user: string;

    @Prop({ type: Types.ObjectId, required: true, ref: 'Show' })
    show: Types.ObjectId;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: [{ type: String }], required: true })
    bookedSeats: string[];

    @Prop({ type: Boolean, default: false })
    isPaid: Boolean;

    @Prop({ type: String })
    paymentLink?: string;

    @Prop({ type: String })
    stripeSessionId?: string;

    @Prop({ type: String })
    stripePaymentIntentId?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);