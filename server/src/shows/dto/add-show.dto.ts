export class ShowInputDto {
    date: string;
    time: string[];
}

export class AddShowDto {
    movieId: string;
    showsInput: ShowInputDto[];
    showPrice: number;
}