import { IsString, IsArray, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateBookingDto {
    @IsString()
    @IsNotEmpty()
    showId: string;

    @IsArray()
    @IsNotEmpty()
    selectedSeats: string[];
}