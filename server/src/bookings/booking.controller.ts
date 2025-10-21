import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    @Post('create')
    async createBooking(
        @Body() createBookingDto: CreateBookingDto,
        @Request() req: any
    ) {
        const userId = req.user?.id || 'temp-user-id';
        return this.bookingService.createBooking(userId, createBookingDto);
    }

    @Get('seats/:showId')
    async getOccupiedSeats(@Param('showId') showId: string) {
        return this.bookingService.getOccupiedSeats(showId);
    }
}
