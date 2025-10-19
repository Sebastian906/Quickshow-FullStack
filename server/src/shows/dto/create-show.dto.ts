export class CreateShowDto {
    movie: string;
    showDateTime: Date;
    showPrice: number;
    occupiedSeats?: Record<string, any>;
}