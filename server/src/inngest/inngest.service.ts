import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Booking, BookingDocument } from "src/bookings/schemas/booking.schema";
import { inngest } from "src/configs/inngest.config";
import { Show, ShowDocument } from "src/shows/schema/show.schema";
import { UsersService } from "src/users/users.service";

@Injectable()
export class InngestService {
    constructor(
        private readonly usersService: UsersService,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
    ) { }

    getFunctions() {
        // Inngest function to save user data to a database
        const syncUserCreation = inngest.createFunction(
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
        const syncUserDeletion = inngest.createFunction(
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
        const syncUserUpdate = inngest.createFunction(
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
        const releaseSeatsAndDeleteBooking = inngest.createFunction(
            { id: 'release-seats-delete-booking' },
            { event: "app/checkpayment" },
            async ({ event, step }) => {
                const tenMinutesLater = new Date(Date.now() * 10 * 60 * 1000);
                await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

                await step.run('check-payment-status', async () => {
                    const bookingId = event.data.bookingId;
                    try {
                        const booking = await this.bookingModel.findById(bookingId);

                        if (!booking) {
                            console.log(`Booking ${bookingId} not found`);
                            return { success: false, message: 'Booking not found' };
                        }
    
                        // If payment is not made, release seats and delete booking
                        if (!booking.isPaid) {
                            const show = await this.showModel.findById(booking.show);

                            if (!show) {
                                console.log(`Show not found for booking ${bookingId}`);
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

        return [syncUserCreation, syncUserDeletion, syncUserUpdate, releaseSeatsAndDeleteBooking];
    }
}