import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Model, Types } from 'mongoose';
import { Show, ShowDocument } from 'src/shows/schema/show.schema';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
    ) { }

    private async checkSeatsAvailability(showId: string, selectedSeats: string[]): Promise<boolean> {
        try {
            const showData = await this.showModel.findById(showId);
            if (!showData) {
                return false;
            }
            const occupiedSeats = showData.occupiedSeats;
            const isAnySeatTaken = selectedSeats.some(
                (seat) => occupiedSeats[seat]
            );
            return !isAnySeatTaken;
        } catch (error) {
            console.error('Error checking seats availability:', error.message);
            return false;
        }
    }

    async createBooking(userId: string, createBookingDto: CreateBookingDto): Promise<{ success: boolean; message: string }> {
        try {
            const { showId, selectedSeats } = createBookingDto;
            // Check if the seat is available for the selected show
            const isAvailable = await this.checkSeatsAvailability(showId, selectedSeats);
            if (!isAvailable) {
                throw new BadRequestException('Selected seats are not available.');
            }
            // GGet the show details
            const showData = await this.showModel
                .findById(showId)
                .populate('movie');
            if (!showData) {
                throw new NotFoundException('Show not found.');
            }
            // Create a new booking
            const bookingData: {
                user: Types.ObjectId;
                show: Types.ObjectId;
                amount: number;
                bookedSeats: string[];
                isPaid: boolean;
            } = {
                user: new Types.ObjectId(userId),
                show: new Types.ObjectId(showId),
                amount: showData.showPrice * selectedSeats.length,
                bookedSeats: selectedSeats,
                isPaid: false,
            };
            const booking = await this.bookingModel.create(bookingData);
            selectedSeats.forEach((seat) => {
                showData.occupiedSeats[seat] = userId;
            });
            showData.markModified('occupiedSeats');
            await showData.save();
            return { success: true, message: 'Booked successfully' };
        } catch (error) {
            console.error('Error creating booking:', error.message);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to create booking');
        }
    }

    async getOccupiedSeats(showId: string): Promise<{ success: boolean; message?: string; occupiedSeats?: string[] }> {
        try {
            const showData = await this.showModel.findById(showId);
            if (!showData) {
                throw new NotFoundException('Show not found.');
            }
            const occupiedSeats = Object.keys(showData.occupiedSeats);
            return { success: true, occupiedSeats }
        } catch (error) {
            console.error('Error getting occupied seats:', error.message);
            if (error instanceof NotFoundException) {
                throw error;
            }
            return { success: false, message: error.message }
        }
    }
}
