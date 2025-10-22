import { IsNotEmpty, IsString } from "class-validator";

export class UpdateFavoriteDto {
    @IsString()
    @IsNotEmpty()
    movieId: string;
}