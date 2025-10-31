import { IsString, IsArray, IsNotEmpty, Matches } from 'class-validator';

export class CreateBookingDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9a-fA-F]{24}$/, {
        message: 'showId must be a valid MongoDB ObjectId (24 character hex string)'
    })
    showId: string;

    @IsArray()
    @IsNotEmpty()
    selectedSeats: string[];
}