export class ShowResponseDto {
    _id: string;
    movie: string;
    showDateTime: Date;
    showPrice: number;
    occupiedSeats: Record<string, any>
    createdAt?: Date;
    updatedAt?: Date;
}