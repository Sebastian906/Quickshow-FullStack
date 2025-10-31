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
            showId = showId.trim();
            if (!Types.ObjectId.isValid(showId)) {
                console.error('Invalid showId in checkSeatsAvailability:', showId);
                return false;
            }

            const objectId = new Types.ObjectId(showId);
            const showData = await this.showModel.findById(objectId);
            
            if (!showData) {
                console.error('Show not found in checkSeatsAvailability:', showId);
                return false;
            }
            
            const occupiedSeats = showData.occupiedSeats;
            const isAnySeatTaken = selectedSeats.some(
                (seat) => occupiedSeats[seat]
            );
            return !isAnySeatTaken;
        } catch (error) {
            console.error('Error checking seats availability:', error.message);
            console.error('Stack:', error.stack);
            return false;
        }
    }

    async createBooking(userId: string, createBookingDto: CreateBookingDto): Promise<{ success: boolean; message: string }> {
        try {
            let { showId, selectedSeats } = createBookingDto;
            console.log('=== CREATE BOOKING SERVICE DEBUG ===');
            console.log('Original showId:', showId);
            console.log('Original showId length:', showId?.length);

            showId = showId.trim();
            
            if (!Types.ObjectId.isValid(showId)) {
                console.error('Invalid showId');
                throw new BadRequestException(`Invalid show ID format`);
            }

            if (!Types.ObjectId.isValid(userId)) {
                console.error('Invalid userId:', userId);
                throw new BadRequestException('User not authenticated or invalid user ID');
            }

            console.log('showId and userId validation passed');

            const showObjectId = new Types.ObjectId(showId);
            const userObjectId = new Types.ObjectId(userId);
            
            const isAvailable = await this.checkSeatsAvailability(showId, selectedSeats);
            if (!isAvailable) {
                throw new BadRequestException('Selected seats are not available.');
            }
            
            const showData = await this.showModel
                .findById(showObjectId)
                .populate('movie');
            if (!showData) {
                throw new NotFoundException('Show not found.');
            }

            const bookingData: {
                user: Types.ObjectId;
                show: Types.ObjectId;
                amount: number;
                bookedSeats: string[];
                isPaid: boolean;
            } = {
                user: userObjectId,
                show: showObjectId,
                amount: showData.showPrice * selectedSeats.length,
                bookedSeats: selectedSeats,
                isPaid: false,
            };

            const booking = await this.bookingModel.create(bookingData);

            selectedSeats.forEach((seat) => {
                showData.occupiedSeats[seat] = userObjectId.toString(); 
            });

            showData.markModified('occupiedSeats');
            await showData.save();
            
            return { success: true, message: 'Booked successfully' };
        } catch (error) {
            console.error('Error creating booking:', error.message);
            console.error('Error name:', error.name);
            
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            if (error.name === 'BSONError' || error.message.includes('ObjectId')) {
                throw new BadRequestException('Invalid show ID format');
            }

            throw new BadRequestException('Failed to create booking');
        }
    }

    async getOccupiedSeats(showId: string): Promise<{ success: boolean; message?: string; occupiedSeats?: string[] }> {
        try {
            console.log('=== GET OCCUPIED SEATS SERVICE DEBUG ===');
            console.log('Original showId:', showId);
            showId = showId.trim();
            console.log('Cleaned showId:', showId);
            if (!Types.ObjectId.isValid(showId)) {
                console.error('Invalid showId format');
                throw new BadRequestException('Invalid show ID format');
            }
            console.log('showId is valid');
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
