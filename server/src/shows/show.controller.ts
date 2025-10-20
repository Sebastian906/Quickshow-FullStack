import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';
import { UpdateSeatsDto } from './dto/update-seats.dto';
import { AddShowDto } from './dto/add-show.dto';
import { AdminGuard } from 'src/guards/admin/admin.guard';

@Controller('shows')
export class ShowController {
    constructor(private readonly showService: ShowService) { }

    @Get('now-playing')
    getNowPlayingMovies() {
        return this.showService.getNowPlayingMovies();
    }

    @Post('add')
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.OK)
    addShow(@Body() addShowDto: AddShowDto) {
        return this.showService.addShow(addShowDto);
    }

    @Get('all')
    getAllShows() {
        return this.showService.getShows();
    }

    @Get('movie/:movieId')
    getShowByMovie(@Param('movieId') movieId: string) {
        return this.showService.getShow(movieId);
    }

    @Get()
    findAll(
        @Query('movieId') movieId?: string,
        @Query('date') date?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('upcoming') upcoming?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 10;

        if (movieId) {
            return this.showService.findByMovie(movieId);
        }
        if (date) {
            return this.showService.findByDate(new Date(date));
        }
        if (startDate && endDate) {
            return this.showService.findByDateRange(
                new Date(startDate),
                new Date(endDate),
            );
        }
        if (upcoming === 'true') {
            return this.showService.findUpcoming(limitNum);
        }
        return this.showService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.showService.findOne(id);
    }

    @Get(':id/occupied-count')
    getOccupiedCount(@Param('id') id: string) {
        return this.showService.getOccupiedSeatsCount(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateShowDto: UpdateShowDto) {
        return this.showService.update(id, updateShowDto);
    }

    @Post(':id/book-seats')
    bookSeats(@Param('id') id: string, @Body('seats') seats: string[]) {
        return this.showService.bookSeats(id, seats);
    }

    @Post(':id/release-seats')
    releaseSeats(@Param('id') id: string, @Body('seats') seats: string[]) {
        return this.showService.releaseSeats(id, seats);
    }

    @Post(':id/check-availability')
    checkAvailability(
        @Param('id') id: string,
        @Body('seats') seats: string[],
    ) {
        return this.showService.checkSeatAvailability(id, seats);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.showService.remove(id);
    }
}
