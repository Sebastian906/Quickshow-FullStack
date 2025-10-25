/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { AdminGuard } from 'src/guards/admin/admin.guard';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Controller('user')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() userData: Partial<User>) {
        return this.usersService.create(userData);
    }

    @Get('all')
    async findAll() {
        return this.usersService.findAll()
    }

    @Get('bookings')
    async getUserBookings(@Request() req: any) {
        const auth = await req.auth();
        const userId = auth?.userId;
        if (!userId) throw new UnauthorizedException('User not authenticated');
        return this.usersService.getUserBookings(userId);
    }

    @Get('favorites')
    async getFavorites(@Request() req: any) {
        const auth = await req.auth();
        const userId = auth?.userId;
        if (!userId) throw new UnauthorizedException('User not authenticated');
        return this.usersService.getFavorites(userId);
    }

    @Post('update-favorite')
    async updateFavorite(
        @Body() updateFavoriteDto: UpdateFavoriteDto,
        @Request() req: any,
    ) {
        const auth = await req.auth();
        const userId = auth?.userId;
        if (!userId) throw new UnauthorizedException('User not authenticated');
        return this.usersService.updateFavorite(userId, updateFavoriteDto.movieId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() userData: Partial<User>) {
        return this.usersService.update(id, userData);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
