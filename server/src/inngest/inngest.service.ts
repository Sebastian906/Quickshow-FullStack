import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Booking, BookingDocument } from "src/bookings/schemas/booking.schema";
import { EmailService } from "src/configs/nodemailer.config";
import { Show, ShowDocument } from "src/shows/schema/show.schema";
import { UsersService } from "src/users/users.service";
import { ConfigService } from "@nestjs/config";
import { Inngest } from "inngest";

@Injectable()
export class InngestService {
    private emailService: EmailService;
    private inngest: Inngest;

    constructor(
        private config: ConfigService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
    ) {
        this.emailService = new EmailService(this.configService);

        this.inngest = new Inngest({
            id: 'Quickshow',
            eventKey: this.config.get<string>('INNGEST_EVENT_KEY'),
            signingKey: this.config.get<string>('INNGEST_SIGNING_KEY'),
        });
    }

    getFunctions() {
        // Inngest function to save user data to a database
        const syncUserCreation = this.inngest.createFunction(
            { id: 'sync-user-from-clerk' },
            { event: 'clerk/user.created' },
            async ({ event }) => {
                const { id, first_name, last_name, email_addresses, image_url } = event.data;
                const userData = {
                    _id: id,
                    email: email_addresses[0].email_address,
                    name: first_name + ' ' + last_name,
                    image: image_url,
                };
                try {
                    const user = await this.usersService.create(userData);
                    console.log('User created successfully:', user);
                    return { success: true, userId: user._id };
                } catch (error) {
                    console.error('Error creating user:', error);
                    throw error;
                }
            }
        );

        // Inngest function to delete a user from database
        const syncUserDeletion = this.inngest.createFunction(
            { id: 'delete-user-with-clerk' },
            { event: 'clerk/user.deleted' },
            async ({ event }) => {
                const { id } = event.data
                try {
                    await this.usersService.delete(id);
                    console.log('User deleted successfully: ', id);
                    return { success: true, userId: id }
                } catch (error) {
                    console.error('Error deleting user: ', error);
                    throw error;
                }
            }
        );

        // Inngest function to update user in database
        const syncUserUpdate = this.inngest.createFunction(
            { id: 'update-user-with-clerk' },
            { event: 'clerk/user.updated' },
            async ({ event }) => {
                const { id, first_name, last_name, email_addresses, image_url } = event.data;
                const userData = {
                    _id: id,
                    email: email_addresses[0].email_address,
                    name: first_name + ' ' + last_name,
                    image: image_url,
                };
                try {
                    const user = await this.usersService.update(id, userData);
                    console.log('User updated successfully:', user);
                    return { success: true, userId: user._id };
                } catch (error) {
                    console.error('Error updating user:', error);
                    throw error;
                }
            }
        );

        // Inngest function to cancel booking and release seats of show after 10 minutes of booking created if payment is not made
        const releaseSeatsAndDeleteBooking = this.inngest.createFunction(
            { id: 'release-seats-delete-booking' },
            { event: "app/checkpayment" },
            async ({ event, step }) => {
                const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
                await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

                await step.run('check-payment-status', async () => {
                    const bookingId = event.data.bookingId;
                    try {
                        const booking = await this.bookingModel.findById(bookingId);

                        if (!booking) {
                            console.log(`Booking ${bookingId} not found`);
                            return { success: false, message: 'Booking not found' };
                        }

                        if (!booking.isPaid) {
                            const show = await this.showModel.findById(booking.show);

                            if (!show) {
                                return { success: false, message: 'Show not found' };
                            }

                            booking.bookedSeats.forEach((seat) => {
                                delete show.occupiedSeats[seat];
                            });

                            show.markModified('occupiedSeats');
                            await show.save();

                            await this.bookingModel.findByIdAndDelete(booking._id);

                            console.log(`Booking ${bookingId} cancelled and seats released`);
                            return {
                                success: true,
                                message: 'Booking cancelled and seats released',
                                bookingId: booking._id
                            };
                        } else {
                            console.log(`Booking ${bookingId} was paid, no action needed`);
                            return {
                                success: true,
                                message: 'Booking was paid',
                                bookingId: booking._id
                            };
                        }
                    } catch (error) {
                        console.error(`Error processing booking ${bookingId}:`, error);
                        throw error;
                    }
                });
            }
        );

        // Inngest function to send email when user books a show
        const sendBookingConfirmationEmail = this.inngest.createFunction(
            { id: 'send-booking-confirmation-email' },
            { event: 'app/show.booked' },
            async ({ event, step }) => {
                await step.run('send-confirmation-email', async () => {
                    const { bookingId } = event.data;

                    try {
                        const booking = await this.bookingModel
                            .findById(bookingId)
                            .populate({
                                path: 'show',
                                populate: { path: 'movie', model: 'Movie' }
                            })
                            .exec();

                        if (!booking) {
                            return { success: false, message: 'Booking not found' };
                        }

                        const user = await this.usersService.findById(booking.user);

                        if (!user) {
                            return { success: false, message: 'User not found' };
                        }

                        const show = booking.show as any;
                        const movie = show.movie;

                        const showDate = new Date(show.showDateTime);
                        const formattedDate = showDate.toLocaleDateString('en-US', {
                            timeZone: 'America/Bogota',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        const formattedTime = showDate.toLocaleTimeString('en-US', {
                            timeZone: 'America/Bogota',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        await this.emailService.sendEmail({
                            to: user.email,
                            subject: `Payment Confirmation: "${movie.title}" booked!`,
                            body: `
                                <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                                    <h2>Hi ${user.name},</h2>
                                    <p>Your booking for <strong style="color: #F84565;">"${movie.title}"</strong> is confirmed.</p>
                                    <p>
                                        <strong>Date:</strong> ${formattedDate}<br/>
                                        <strong>Time:</strong> ${formattedTime}<br/>
                                        <strong>Seats:</strong> ${booking.bookedSeats.join(', ')}<br/>
                                        <strong>Total:</strong> $${booking.amount.toLocaleString('en-US')}
                                    </p>
                                    <p>Enjoy the show!</p>
                                    <p>Thanks for booking with us!<br/>-- Quickshow Team</p>
                                </div>
                            `
                        });

                        console.log(`Confirmation email sent for booking ${bookingId}`);
                        return {
                            success: true,
                            message: 'Confirmation email sent',
                            bookingId: booking._id
                        };
                    } catch (error) {
                        console.error(`Error sending confirmation email for booking ${bookingId}:`, error);
                        throw error;
                    }
                });
            }
        );

        return [syncUserCreation, syncUserDeletion, syncUserUpdate, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail];
    }
}