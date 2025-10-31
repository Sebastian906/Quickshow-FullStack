import { BadRequestException, Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ClerkAuthGuard } from 'src/guards/clerk-auth/clerk-auth.guard';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post('create')
    @UseGuards(ClerkAuthGuard)
    async createBooking(
        @Body() createBookingDto: CreateBookingDto,
        @Request() req: any
    ) {
        const userId = req.auth?.userId || req.user?.id || req.user?.sub;

        if (!userId) {
            console.error('Authentication failed - no userId found');
            throw new BadRequestException('User not authenticated. Please login.');
        }
        
        return this.bookingService.createBooking(userId, createBookingDto);
    }

    @Get('seats/:showId')
    async getOccupiedSeats(@Param('showId') showId: string) {
        return this.bookingService.getOccupiedSeats(showId);
    }
}
