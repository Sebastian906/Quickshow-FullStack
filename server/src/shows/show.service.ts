import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Show, ShowDocument } from './schema/show.schema';
import { Model } from 'mongoose';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';
import { UpdateSeatsDto } from './dto/update-seats.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShowService {

    private readonly tmdbApiKey: string;
    private readonly tmdbBaseUrl: string = 'https://api.themoviedb.org/3';

    constructor(
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { 
        this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY') || '';;
        if (!this.tmdbApiKey) {
            console.warn('Warning: TMDB_API_KEY is not set in environment variables');
        }
    }

    async getNowPlayingMovies() {
        try {
            if (!this.tmdbApiKey) {
                throw new Error('TMDB_API_KEY is not configured');
            }
            const response = await firstValueFrom(
                this.httpService.get(`${this.tmdbBaseUrl}/movie/now_playing`, {
                    headers: {
                        Authorization: `Bearer ${this.tmdbApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }),
            );
            return {
                success: true,
                movies: response.data.results,
            }
        } catch (error) {
            console.error('Error fetching now playing movies:', error);
            return {
                success: false,
                message: error.response?.data?.status_message || error.message || 'Failed to fetch movies from TMDB',
            }
        }
    }

    async create(createShowDto: CreateShowDto): Promise<Show> {
        const createdShow = new this.showModel(createShowDto);
        return createdShow.save();
    }

    async findAll(): Promise<Show[]> {
        return this.showModel.find().populate('movie').exec()
    }

    async findOne(id: string): Promise<Show> {
        const show = await this.showModel.findById(id).populate('movie').exec()
        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }
        return show;
    }

    async findByMovie(movieId: string): Promise<Show[]> {
        return this.showModel.find({ movie: movieId }).populate('movie').exec();
    }

    async findByDate(date: Date): Promise<Show[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.showModel
            .find({
                showDateTime: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
            })
            .populate('movie')
            .exec();
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<Show[]> {
        return this.showModel
            .find({
                showDateTime: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
            .populate('movie')
            .sort({ showDateTime: 1 })
            .exec();
    }

    async findUpcoming(limit: number = 10): Promise<Show[]> {
        const now = new Date();
        return this.showModel
            .find({ showDateTime: { $gte: now } })
            .populate('movie')
            .sort({ showDateTime: 1 })
            .limit(limit)
            .exec();
    }

    async update(id: string, updateShowDto: UpdateShowDto): Promise<Show> {
        const updatedShow = await this.showModel
            .findByIdAndUpdate(id, updateShowDto, { new: true })
            .populate('movie')
            .exec();

        if (!updatedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return updatedShow;
    }

    async updateSeats(id: string, updateSeatsDto: UpdateSeatsDto): Promise<Show> {
        const show = await this.showModel.findById(id).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const updatedSeats = {
            ...show.occupiedSeats,
            ...updateSeatsDto.occupiedSeats,
        };

        const updatedShow = await this.showModel
            .findByIdAndUpdate(
                id,
                { occupiedSeats: updatedSeats },
                { new: true },
            )
            .populate('movie')
            .exec();

        if (!updatedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return updatedShow;
    }

    async bookSeats(id: string, seats: string[]): Promise<Show> {
        const show = await this.showModel.findById(id).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const unavailableSeats = seats.filter(
            (seat) => show.occupiedSeats[seat] === true,
        );

        if (unavailableSeats.length > 0) {
            throw new BadRequestException(
                `Seats ${unavailableSeats.join(', ')} are already occupied`,
            );
        }

        const updatedSeats = { ...show.occupiedSeats };
        seats.forEach((seat) => {
            updatedSeats[seat] = true;
        });

        const updatedShow = await this.showModel
            .findByIdAndUpdate(
                id,
                { occupiedSeats: updatedSeats },
                { new: true },
            )
            .populate('movie')
            .exec();

        if (!updatedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return updatedShow;
    }

    async releaseSeats(id: string, seats: string[]): Promise<Show> {
        const show = await this.showModel.findById(id).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const updatedSeats = { ...show.occupiedSeats };
        seats.forEach((seat) => {
            delete updatedSeats[seat];
        });

        const updatedShow = await this.showModel
            .findByIdAndUpdate(
                id,
                { occupiedSeats: updatedSeats },
                { new: true },
            )
            .populate('movie')
            .exec();

        if (!updatedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return updatedShow;
    }

    async checkSeatAvailability(
        id: string,
        seats: string[],
    ): Promise<{ available: boolean; unavailableSeats: string[] }> {
        const show = await this.showModel.findById(id).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const unavailableSeats = seats.filter(
            (seat) => show.occupiedSeats[seat] === true,
        );

        return {
            available: unavailableSeats.length === 0,
            unavailableSeats,
        };
    }

    async getOccupiedSeatsCount(id: string): Promise<number> {
        const show = await this.showModel.findById(id).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return Object.keys(show.occupiedSeats).filter(
            (key) => show.occupiedSeats[key] === true,
        ).length;
    }

    async remove(id: string): Promise<Show> {
        const deletedShow = await this.showModel.findByIdAndDelete(id).exec();

        if (!deletedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return deletedShow;
    }
}
