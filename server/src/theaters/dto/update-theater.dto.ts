import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Matches } from "class-validator";

export class UpdateTheaterDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
        message: 'Opening time must be in format HH:MM AM/PM'
    })
    openingTime?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
        message: 'Closing time must be in format HH:MM AM/PM'
    })
    closingTime?: string;

    @IsArray()
    @IsOptional()
    amenities?: string[];

    @IsNumber()
    @IsOptional()
    totalScreens?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    description?: string;
}