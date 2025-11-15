/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from 'src/bookings/schemas/booking.schema';
import { Movie, MovieDocument } from 'src/movies/schemas/movie.schema';
import { UserBookingsResponseDto } from './dto/bookings-response.dto';
import { UpdateFavoriteResponseDto } from './dto/update-favorite-response.dto';
import { clerkClient } from '@clerk/express';
import { FavoritesResponseDto } from './dto/favorites-response.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        const newUser = new this.userModel(userData);
        return newUser.save();
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().exec();
    }

    async findById(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByIds(ids: string[]): Promise<User[]> {
        return this.userModel
            .find({ _id: { $in: ids } })
            .select('name email')
            .exec();
    }

    async update(id: string, userData: Partial<User>): Promise<User> {
        const user = await this.userModel.findByIdAndUpdate(id, userData, { new: true }).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async delete(id: string): Promise<User> {
        const user = await this.userModel.findByIdAndDelete(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    // API to get user bookings
    async getUserBookings(userId: string): Promise<UserBookingsResponseDto> {
        try {
            const bookings = await this.bookingModel
                .find({ user: userId })
                .populate({ path: 'show', populate: { path: 'movie' } })
                .sort({ createdAt: -1 });
            return { success: true, bookings };
        } catch (error) {
            console.error('Error getting user bookings: ', error.message)
            return { success: false, message: error.message };
        }
    }

    // API to update favorite movie in clerk user metadata
    async updateFavorite(userId: string, movieId: string): Promise<UpdateFavoriteResponseDto> {
        try {
            const user = await clerkClient.users.getUser(userId);
            if (!user.privateMetadata.favorites) {
                user.privateMetadata.favorites = [];
            }
            if (!user.privateMetadata.favorites.includes(movieId)) {
                user.privateMetadata.favorites.push(movieId);
            } else {
                user.privateMetadata.favorites = user.privateMetadata.favorites.filter((item) => item !== movieId);
            }
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: user.privateMetadata,
            })
            return { success: true, message: 'Favorite movies updated.' };
        } catch (error) {
            console.error('Error updating favorites: ', error.message)
            return { success: false, message: error.message }
        }
    }

    // API to get all movies in favorite
    async getFavorites(userId: string): Promise<FavoritesResponseDto> {
        try {
            const user = await clerkClient.users.getUser(userId);
            const favorites = user.privateMetadata.favorites || [];
            const movies = await this.movieModel.find({
                _id: { $in: favorites },
            });
            return { success: true, movies };
        } catch (error) {
            console.error('Error getting favorites: ', error.message)
            return { success: false, message: error.message }
        }
    }
}
