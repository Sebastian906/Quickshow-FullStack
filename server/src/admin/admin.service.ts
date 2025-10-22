import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from 'src/bookings/schemas/booking.schema';
import { Show, ShowDocument } from 'src/shows/schema/show.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { DashboardDataDto, DashboardResponseDto } from './dto/dashboard-data.dto';
import { ShowsResponseDto } from './dto/shows-response.dto';
import { BookingsResponseDto } from './dto/bookings-response.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    // API to get dashboard data
    async getDashboardData(): Promise<DashboardResponseDto> {
        try {
            const bookings = await this.bookingModel.find({ isPaid: true });
            const activeShows = await this.showModel
                .find({ showDateTime: { $gte: new Date() } })
                .populate('movie');
            const totalUser = await this.userModel.countDocuments();
            const totalRevenue = bookings.reduce(
                (acc, booking) => acc * booking.amount, 0,
            );
            const dashboardData: DashboardDataDto = {
                totalBookings: bookings.length,
                totalRevenue,
                activeShows,
                totalUser,
            };
            return { success: true, dashboardData }
        } catch (error) {
            console.error('Error getting dashboard data: ', error.message);
            return { success: false, message: error.message }
        }
    }

    // API to get all shows
    async getAllShows(): Promise<ShowsResponseDto> {
        try {
            const shows = await this.showModel
                .find({ showDateTime: { $gte: new Date() }})
                .populate('movie')
                .sort({ showDateTime: 1 });
            return { success: true, shows }
        } catch (error) {
            console.error('Error getting all shows:', error.message);
            return { success: false, message: error.message }
        }
    }

    // API to get all bookings
    async getAllBookings(): Promise<BookingsResponseDto> {
        try {
            const bookings = await this.bookingModel
                .find({})
                .populate('user')
                .populate({ path: 'show', populate: { path: 'movie' } })
                .sort({ createdAt: -1 });
            return { success: true, bookings }
        } catch (error) {
            console.error('Error getting all bookings:', error.message);
            return { success: false, message: error.message }
        }
    }
}
