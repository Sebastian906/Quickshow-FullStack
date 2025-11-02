import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Request, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ClerkAuthGuard } from 'src/guards/clerk-auth/clerk-auth.guard';
import { BookingResponseDto } from './dto/booking-response.dto';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post('create')
    @UseGuards(ClerkAuthGuard)
    async createBooking(
        @Body() createBookingDto: CreateBookingDto,
        @Request() req: any,
        @Headers('origin') origin?: string,
    ): Promise<BookingResponseDto> {
        const userId = req.auth?.userId || req.user?.id || req.user?.sub;

        if (!userId) {
            console.error('Authentication failed - no userId found');
            throw new BadRequestException('User not authenticated. Please login.');
        }
        
        const requestOrigin = origin || req.headers.referer || 'http://localhost:5173';
        
        return this.bookingService.createBooking(userId, createBookingDto, requestOrigin);
    }

    @Get('seats/:showId')
    async getOccupiedSeats(@Param('showId') showId: string) {
        return this.bookingService.getOccupiedSeats(showId);
    }
}
