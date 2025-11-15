import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Show, ShowDocument } from './schema/show.schema';
import { Model } from 'mongoose';
import { UpdateShowDto } from './dto/update-show.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AddShowDto } from './dto/add-show.dto';
import { Movie, MovieDocument } from 'src/movies/schemas/movie.schema';
import { Inngest } from 'inngest';

@Injectable()
export class ShowService {

    private readonly tmdbApiKey: string;
    private readonly tmdbBaseUrl: string = 'https://api.themoviedb.org/3';
    private inngest: Inngest;

    constructor(
        @InjectModel(Show.name) private showModel: Model<ShowDocument>,
        @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { 
        this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY') || '';;
        if (!this.tmdbApiKey) {
            console.warn('Warning: TMDB_API_KEY is not set in environment variables');
        }

        this.inngest = new Inngest({
            id: 'Quickshow',
            eventKey: this.configService.get<string>('INNGEST_EVENT_KEY'),
        });
    }

    // API to get now playing movies from TMDB API
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

    // API to add a new show to the database
    async addShow(addShowDto: AddShowDto): Promise<{ success: boolean; message: string }> {
        try {
            const { movieId, showsInput, showPrice } = addShowDto;
            let movie = await this.movieModel.findById(movieId).exec();
            if (!movie) {
                // Fetch movie details and credits from TMDB API
                if (!this.tmdbApiKey) {
                    throw new Error('TMDB_API_KEY is not configured');
                }
                const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                    firstValueFrom(
                        this.httpService.get(`${this.tmdbBaseUrl}/movie/${movieId}`, {
                            headers: {
                                Authorization: `Bearer ${this.tmdbApiKey}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                        })
                    ),
                    firstValueFrom(
                        this.httpService.get(`${this.tmdbBaseUrl}/movie/${movieId}/credits`, {
                            headers: {
                                Authorization: `Bearer ${this.tmdbApiKey}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                        })
                    ),
                ]);
                const movieApiData = movieDetailsResponse.data;
                const movieCreditsData = movieCreditsResponse.data;
                const movieDetails = {
                    _id: movieId,
                    title: movieApiData.title,
                    overview: movieApiData.overview,
                    poster_path: movieApiData.poster_path,
                    backdrop_path: movieApiData.backdrop_path,
                    genres: movieApiData.genres || [],
                    casts: movieCreditsData.cast || [],
                    release_date: movieApiData.release_date,
                    original_language: movieApiData.original_language,
                    tagline: movieApiData.tagline || "",
                    vote_average: movieApiData.vote_average,
                    runtime: movieApiData.runtime,
                };
                // Add movie to the database
                movie = await this.movieModel.create(movieDetails);
            }

            const showsToCreate: Array<{
                movie: string;
                showDateTime: Date;
                showPrice: number;
                occupiedSeats: Record<string, any>;
            }> = [];
            
            showsInput.forEach(show => {
                const showDate = show.date;
                show.time.forEach((time) => {
                    const dateTimeString = `${showDate}T${time}`;
                    showsToCreate.push({
                        movie: movieId,
                        showDateTime: new Date(dateTimeString),
                        showPrice,
                        occupiedSeats: {}
                    });
                });
            });

            if (showsToCreate.length > 0) {
                await this.showModel.insertMany(showsToCreate);

                // Trigger Inngest event for new show notifications
                try {
                    await this.inngest.send({
                        name: 'app/show.added',
                        data: {
                            movieTitle: movie.title,
                            movieId: movie._id
                        }
                    });
                    console.log(`Inngest event triggered for new show: ${movie.title}`);
                } catch (inngestError) {
                    // Log error but don't fail the entire operation
                    console.error('Error triggering Inngest event:', inngestError);
                }
            }

            return { success: true, message: 'Show added successfully.' };
        } catch (error) {
            console.error('Error adding show:', error);
            throw new BadRequestException(
                error.response?.data?.status_message || error.message || 'Failed to add show'
            );
        }
    }

    // API to get all shows from the database
    async getShows(): Promise<{ success: boolean; shows: any[] }> {
        try {
            const shows = await this.showModel
                .find({ showDateTime: { $gte: new Date() } })
                .populate('movie')
                .sort({ showDateTime: 1 })
                .exec();
            
            // Filter unique shows by movie
            const uniqueMovieMap = new Map();
            shows.forEach(show => {
                const movieId = show.movie['_id'] || show.movie;
                if (!uniqueMovieMap.has(movieId.toString())) {
                    uniqueMovieMap.set(movieId.toString(), show.movie);
                }
            });
            return {
                success: true,
                shows: Array.from(uniqueMovieMap.values())
            };
        } catch (error) {
            console.error('Error getting shows:', error);
            throw new BadRequestException(error.message || 'Failed to get shows');
        }
    }

    // API to get a single show from the database
    async getShow(movieId: string): Promise<{ success: boolean; movie: any; dateTime: Record<string, any[]> }> {
        try {
            // Get all upcoming shows for the movie
            const shows = await this.showModel
                .find({ movie: movieId, showDateTime: { $gte: new Date() } })
                .sort({ showDateTime: 1 })
                .exec();
            const movie = await this.movieModel.findById(movieId).exec();
            if (!movie) {
                throw new NotFoundException(`Movie with ID ${movieId} not found`);
            }
            const dateTime: Record<string, any[]> = {};
            shows.forEach((show) => {
                const date = show.showDateTime.toISOString().split("T")[0];
                if (!dateTime[date]) {
                    dateTime[date] = [];
                }
                dateTime[date].push({ 
                    time: show.showDateTime, 
                    showId: show._id 
                });
            });
            return { 
                success: true, 
                movie, 
                dateTime 
            };
        } catch (error) {
            console.error('Error getting show:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Failed to get show');
        }
    } 

    async findAll(): Promise<Show[]> {
        return this.showModel.find().populate('movie').exec()
    }

    async findOne(id: string): Promise<Show> {
        const show = await this.showModel.findOne({ movie: id }).populate('movie').exec();
        
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
            .findOneAndUpdate({ movie: id }, updateShowDto, { new: true })
            .populate('movie')
            .exec();

        if (!updatedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return updatedShow;
    }

    async bookSeats(id: string, seats: string[], userId: string): Promise<Show> {
        const show = await this.showModel.findOne({ movie: id }).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const unavailableSeats = seats.filter(
            (seat) => show.occupiedSeats[seat] !== undefined && show.occupiedSeats[seat] !== null,
        );

        if (unavailableSeats.length > 0) {
            throw new BadRequestException(
                `Seats ${unavailableSeats.join(', ')} are already occupied`,
            );
        }

        const updatedSeats = { ...show.occupiedSeats };
        seats.forEach((seat) => {
            updatedSeats[seat] = userId;
        });

        const updatedShow = await this.showModel
            .findOneAndUpdate(
                { movie: id },
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
        const show = await this.showModel.findOne({ movie: id }).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const updatedSeats = { ...show.occupiedSeats };
        seats.forEach((seat) => {
            delete updatedSeats[seat];
        });

        const updatedShow = await this.showModel
            .findOneAndUpdate(
                { movie: id },
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
        const show = await this.showModel.findOne({ movie: id }).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        const unavailableSeats = seats.filter(
            (seat) => show.occupiedSeats[seat] !== undefined && show.occupiedSeats[seat] !== null,
        );

        return {
            available: unavailableSeats.length === 0,
            unavailableSeats,
        };
    }

    async getOccupiedSeatsCount(id: string): Promise<number> {
        const show = await this.showModel.findOne({ movie: id }).exec();

        if (!show) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return Object.keys(show.occupiedSeats).filter(
            (key) => show.occupiedSeats[key] !== undefined && show.occupiedSeats[key] !== null,
        ).length;
    }

    async remove(id: string): Promise<Show> {
        const deletedShow = await this.showModel.findOneAndDelete({ movie: id }).exec();

        if (!deletedShow) {
            throw new NotFoundException(`Show with ID ${id} not found`);
        }

        return deletedShow;
    }
}
