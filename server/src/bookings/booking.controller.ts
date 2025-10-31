import { BadRequestException, Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post('create')
    async createBooking(
        @Body() createBookingDto: CreateBookingDto,
        @Request() req: any
    ) {
        console.log('=== BOOKING CONTROLLER DEBUG ===');
        console.log('req.user:', req.user);
        console.log('userId candidates:', {
            'req.user?.id': req.user?.id,
            'req.user?._id': req.user?._id,
            'req.user?.userId': req.user?.userId,
        });
        const userId = req.user?.id || req.user?._id || req.user?.userId;
        if (!userId) {
            throw new BadRequestException('User not authenticated. Please login.');
        }
        return this.bookingService.createBooking(userId, createBookingDto);
    }

    @Get('seats/:showId')
    async getOccupiedSeats(@Param('showId') showId: string) {
        console.log('=== GET OCCUPIED SEATS DEBUG ===');
        console.log('showId:', showId);
        console.log('showId length:', showId.length);
        console.log('================================');
        return this.bookingService.getOccupiedSeats(showId);
    }
}
