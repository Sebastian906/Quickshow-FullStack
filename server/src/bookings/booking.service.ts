import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Model, Types } from 'mongoose';
import { Show, ShowDocument } from 'src/shows/schema/show.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { StripeService } from 'src/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { BookingResponseDto } from './dto/booking-response.dto';
import { inngest } from 'src/configs/inngest.config';

@Injectable()
export class BookingService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
        private stripeService: StripeService,
        private configService: ConfigService,
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
            return false;
        }
    }

    async createBooking(
        clerkUserId: string,
        createBookingDto: CreateBookingDto,
        origin?: string
    ): Promise<BookingResponseDto> {
        try {
            let { showId, selectedSeats } = createBookingDto;

            showId = showId.trim();

            if (!Types.ObjectId.isValid(showId)) {
                console.error('Invalid showId');
                throw new BadRequestException(`Invalid show ID format`);
            }

            const showObjectId = new Types.ObjectId(showId);

            const isAvailable = await this.checkSeatsAvailability(showId, selectedSeats);
            if (!isAvailable) {
                throw new BadRequestException('Selected seats are not available.');
            }

            const showData = await this.showModel
                .findById(showObjectId)
                .populate<{ movie: any }>('movie');

            if (!showData) {
                throw new NotFoundException('Show not found.');
            }

            const bookingData = {
                user: clerkUserId,
                show: showObjectId,
                amount: showData.showPrice * selectedSeats.length,
                bookedSeats: selectedSeats,
                isPaid: false,
            };

            const booking = await this.bookingModel.create(bookingData);

            selectedSeats.forEach((seat) => {
                showData.occupiedSeats[seat] = clerkUserId;
            });

            showData.markModified('occupiedSeats');
            await showData.save();

            const checkoutOrigin = origin || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

            const session = await this.stripeService.createCheckoutSession({
                movieTitle: showData.movie.title,
                amount: booking.amount,
                bookingId: (booking._id as Types.ObjectId).toString(),
                origin: checkoutOrigin,
            });

            if (!session.url) {
                throw new BadRequestException('Failed to create payment session');
            }

            booking.paymentLink = session.url;
            booking.stripeSessionId = session.id;
            await booking.save();

            // Run Inngest Scheduler Function to check payment status after 10 minutes
            await inngest.send({
                name: "app/checkpayment",
                data: {
                    bookingId: (booking._id as Types.ObjectId).toString()
                }
            });

            return {
                success: true,
                message: 'Booking created successfully',
                url: session.url,
                bookingId: (booking._id as Types.ObjectId).toString(),
            };

        } catch (error) {
            console.error('Error creating booking:', error.message);
            console.error('Error name:', error.name);

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new BadRequestException('Failed to create booking');
        }
    }

    async getOccupiedSeats(showId: string): Promise<{ success: boolean; message?: string; occupiedSeats?: string[] }> {
        try {
            showId = showId.trim();
            if (!Types.ObjectId.isValid(showId)) {
                console.error('Invalid showId format');
                throw new BadRequestException('Invalid show ID format');
            }
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

    async updatePaymentStatus(bookingId: string, isPaid: boolean, paymentIntentId?: string): Promise<void> {
        const booking = await this.bookingModel.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        booking.isPaid = isPaid;
        if (paymentIntentId) {
            booking.stripePaymentIntentId = paymentIntentId;
        }
        await booking.save();

        console.log(`Payment status updated for booking ${bookingId}: isPaid=${isPaid}`);
    }

    async updatePaymentStatusFromWebhook(
        bookingId: string,
        isPaid: boolean,
        paymentIntentId: string,
    ): Promise<void> {
        await this.bookingModel.findByIdAndUpdate(
            bookingId,
            {
                isPaid: isPaid,
                paymentLink: '',
                stripePaymentIntentId: paymentIntentId,
            },
            { new: true }
        );
    }
}
