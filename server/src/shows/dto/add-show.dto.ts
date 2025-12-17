export class ShowInputDto {
    date: string;
    time: string[];
}

export class AddShowDto {
    movieId: string;
    theaterId: string;
    showsInput: ShowInputDto[];
    showPrice: number;
}