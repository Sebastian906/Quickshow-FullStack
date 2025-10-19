import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MovieDocument = Movie & Document;

@Schema({ timestamps: true })
export class Movie {
    @Prop({ required: true })
    _id: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    overview: string;

    @Prop({ required: true })
    poster_path: string;

    @Prop({ required: true })
    backdrop_path: string;

    @Prop({ required: true })
    release_date: string;

    @Prop({ required: true })
    original_language: string;

    @Prop({ required: true })
    tagline: string;

    @Prop({ required: true })
    genres: string;

    @Prop({ required: true })
    casts: string;

    @Prop({ required: true })
    vote_average: string;

    @Prop({ required: true })
    runtime: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);