import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { Model } from 'mongoose';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
    constructor(
        @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    ) { }

    async create(createMovieDto: CreateMovieDto): Promise<Movie> {
        try {
            const existingMovie = await this.movieModel.findById(createMovieDto._id);
            if (existingMovie) {
                throw new ConflictException(`Movie with ID ${createMovieDto._id} already exists`);
            }

            const createdMovie = new this.movieModel(createMovieDto);
            return createdMovie.save();
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException('Error creating movie');
        }
    }

    async findAll(): Promise<Movie[]> {
        return this.movieModel.find().exec();
    }

    async findOne(id: string): Promise<Movie> {
        const movie = await this.movieModel.findById(id).exec();
        if (!movie) {
            throw new NotFoundException(`Movie with ID ${id} not found`);
        }
        return movie;
    }

    async searchByTitle(title: string): Promise<Movie[]> {
        return this.movieModel
            .find({ title: { $regex: title, $options: 'i' } })
            .exec();
    }

    async findByGenre(genre: string): Promise<Movie[]> {
        return this.movieModel
            .find({ 
                genres: { 
                    $elemMatch: { name: { $regex: genre, $options: 'i' } } 
                } 
            })
            .exec();
    }

    async findByLanguage(language: string): Promise<Movie[]> {
        return this.movieModel
            .find({ original_language: language })
            .exec();
    }

    async findTopRated(limit: number = 10): Promise<Movie[]> {
        return this.movieModel
            .find()
            .sort({ vote_average: -1 })
            .limit(limit)
            .exec();
    }

    async findRecent(limit: number = 10): Promise<Movie[]> {
        return this.movieModel
            .find()
            .sort({ release_date: -1 })
            .limit(limit)
            .exec();
    }

    async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
        const updatedMovie = await this.movieModel
            .findByIdAndUpdate(id, updateMovieDto, { new: true })
            .exec();

        if (!updatedMovie) {
            throw new NotFoundException(`Movie with ID ${id} not found`);
        }

        return updatedMovie;
    }

    async remove(id: string): Promise<Movie> {
        const deletedMovie = await this.movieModel.findByIdAndDelete(id).exec();

        if (!deletedMovie) {
            throw new NotFoundException(`Movie with ID ${id} not found`);
        }

        return deletedMovie;
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.movieModel.countDocuments({ _id: id }).exec();
        return count > 0;
    }
}
