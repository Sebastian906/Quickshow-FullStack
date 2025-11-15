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

        // Inngest function to send show reminders every 8 hours
        const sendShowReminders = this.inngest.createFunction(
            { id: 'send-show-reminders' },
            { cron: '0 */8 * * *' }, // Every 8 hours
            async ({ step }) => {
                interface ReminderTask {
                    userEmail: string;
                    userName: string;
                    movieTitle: string;
                    showTime: string;
                }

                // Prepare reminder tasks
                const reminderTasks = await step.run('prepare-reminder-tasks', async (): Promise<ReminderTask[]> => {
                    const now = new Date();
                    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
                    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

                    try {
                        const shows = await this.showModel
                            .find({
                                showDateTime: { $gte: windowStart, $lte: in8Hours }
                            })
                            .populate('movie')
                            .exec();

                        const tasks: ReminderTask[] = [];

                        for (const show of shows) {
                            if (!show.movie || !show.occupiedSeats) continue;

                            // Get unique user IDs from occupiedSeats
                            const userIds = [...new Set(Object.values(show.occupiedSeats))] as string[];
                            
                            if (userIds.length === 0) continue;

                            // Get users by IDs
                            const users = await this.usersService.findByIds(userIds);

                            for (const user of users) {
                                tasks.push({
                                    userEmail: user.email,
                                    userName: user.name,
                                    movieTitle: (show.movie as any).title,
                                    showTime: show.showDateTime.toISOString(), // Convertir a string
                                });
                            }
                        }

                        return tasks;
                    } catch (error) {
                        console.error('Error preparing reminder tasks:', error);
                        throw error;
                    }
                });

                if (!reminderTasks || reminderTasks.length === 0) {
                    console.log('No reminders to send');
                    return { sent: 0, failed: 0, message: 'No reminders to send.' };
                }

                // Send reminder emails
                const results = await step.run('send-all-reminders', async () => {
                    const emailPromises = reminderTasks.map(async (task: ReminderTask) => {
                        try {
                            const showDate = new Date(task.showTime);
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
                                to: task.userEmail,
                                subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
                                body: `
                                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                                        <h2>Hello ${task.userName},</h2>
                                        <p>This is a quick reminder that your movie:</p>
                                        <h3 style="color: #F84565;">${task.movieTitle}</h3>
                                        <p>
                                            is scheduled for <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong>.
                                        </p>
                                        <p>It starts in approximately <strong>8 hours</strong> - make sure you're ready!</p>
                                        <br/>
                                        <p>Enjoy the show!<br/>Quickshow Team</p>
                                    </div>
                                `
                            });

                            return { status: 'fulfilled' };
                        } catch (error) {
                            console.error(`Failed to send reminder to ${task.userEmail}:`, error);
                            return { status: 'rejected', error };
                        }
                    });

                    const results = await Promise.allSettled(emailPromises);
                    const sent = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.length - sent;

                    console.log(`Sent ${sent} reminder(s), ${failed} failed.`);
                    
                    return {
                        sent,
                        failed,
                        message: `Sent ${sent} reminder(s), ${failed} failed.`
                    };
                });

                return results;
            }
        );

        // Inngest function to send notifications when a new show is added
        const sendNewShowNotifications = this.inngest.createFunction(
            { id: 'send-new-show-notifications' },
            { event: 'app/show.added' },
            async ({ event, step }) => {
                await step.run('send-new-show-notifications', async () => {
                    const { movieTitle } = event.data;

                    try {
                        // Get all users
                        const users = await this.usersService.findAll();

                        if (!users || users.length === 0) {
                            console.log('No users found to notify');
                            return { success: true, message: 'No users to notify', sent: 0 };
                        }

                        // Send email to each user
                        const emailPromises = users.map(async (user) => {
                            try {
                                await this.emailService.sendEmail({
                                    to: user.email,
                                    subject: `New Show Added: ${movieTitle}`,
                                    body: `
                                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                                            <h2>Hi ${user.name},</h2>
                                            <p>We've just added a new show to our library:</p>
                                            <h3 style="color: #F84565;">"${movieTitle}"</h3>
                                            <p>Visit our website to book your tickets now!</p>
                                            <br/>
                                            <p>Thanks,<br/>QuickShow Team</p>
                                        </div>
                                    `
                                });

                                return { status: 'fulfilled' };
                            } catch (error) {
                                console.error(`Failed to send notification to ${user.email}:`, error);
                                return { status: 'rejected', error };
                            }
                        });

                        const results = await Promise.allSettled(emailPromises);
                        const sent = results.filter(r => r.status === 'fulfilled').length;
                        const failed = results.length - sent;

                        console.log(`New show notifications: sent ${sent}, failed ${failed}`);

                        return {
                            success: true,
                            message: `Notifications sent for "${movieTitle}"`,
                            sent,
                            failed,
                        };
                    } catch (error) {
                        console.error('Error sending new show notifications:', error);
                        throw error;
                    }
                });
            }
        );

        return [
            syncUserCreation, 
            syncUserDeletion, 
            syncUserUpdate, 
            releaseSeatsAndDeleteBooking, 
            sendBookingConfirmationEmail, 
            sendShowReminders,
            sendNewShowNotifications
        ];
    }
}