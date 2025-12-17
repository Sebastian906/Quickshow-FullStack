import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";

export class CreateTheaterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    image: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
        message: 'Opening time must be in format HH:MM AM/PM'
    })
    openingTime: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
        message: 'Closing time must be in format HH:MM AM/PM'
    })
    closingTime: string;

    @IsArray()
    @IsOptional()
    amenities?: string[];

    @IsNumber()
    @IsOptional()
    totalScreens?: number;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    description?: string;
}