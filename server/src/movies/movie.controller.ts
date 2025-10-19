import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
export class MovieController {
    constructor(private readonly movieService: MovieService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createMovieDto: CreateMovieDto) {
        return this.movieService.create(createMovieDto);
    }

    @Get()
    findAll(
        @Query('title') title?: string,
        @Query('genre') genre?: string,
        @Query('language') language?: string,
        @Query('topRated') topRated?: string,
        @Query('recent') recent?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 10;

        if (title) {
            return this.movieService.searchByTitle(title);
        }
        if (genre) {
            return this.movieService.findByGenre(genre);
        }
        if (language) {
            return this.movieService.findByLanguage(language);
        }
        if (topRated === 'true') {
            return this.movieService.findTopRated(limitNum);
        }
        if (recent === 'true') {
            return this.movieService.findRecent(limitNum);
        }
        return this.movieService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.movieService.findOne(id)
    }

    @Get(':id/exists')
    exists(@Param('id') id: string) {
        return this.movieService.exists(id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
        return this.movieService.update(id, updateMovieDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.movieService.remove(id);
    }
}
