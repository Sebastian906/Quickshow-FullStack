import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TheatersService } from './theaters.service';
import { TheaterResponseDto } from './dto/theater-response.dto';
import { AdminGuard } from 'src/guards/admin/admin.guard';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';

@Controller('theaters')
export class TheatersController {
    constructor(private readonly theatersService: TheatersService) {}

    // Obtener todos los teatros activos
    @Get()
    async findAll(
        @Query('active') active?: string,
        @Query('search') search?: string,
        @Query('amenity') amenity?: string,
    ): Promise<TheaterResponseDto> {
        if (search) {
            return this.theatersService.search(search);
        }
        
        if (amenity) {
            return this.theatersService.findByAmenity(amenity);
        }

        const activeOnly = active === 'true';
        return this.theatersService.findAll(activeOnly);
    }

    // Obtener teatro por ID
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<TheaterResponseDto> {
        return this.theatersService.findOne(id);
    }

    // Obtener teatro por estadísticas (Para admin)
    @Get('admin/stats')
    @UseGuards(AdminGuard)
    async getStats() {
        return this.theatersService.getStats();
    }

    // Crear teatro (Para admin)
    @Post()
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createTheaterDto: CreateTheaterDto,
    ): Promise<TheaterResponseDto> {
        return this.theatersService.create(createTheaterDto);
    }

    // Actualizar teatro (Para admin)
    @Put(':id')
    @UseGuards(AdminGuard)
    async update(
        @Param('id') id: string,
        @Body() updateTheaterDto: UpdateTheaterDto,
    ): Promise<TheaterResponseDto> {
        return this.theatersService.update(id, updateTheaterDto);
    }

    // Activar/Desactivar teatro (Para admin)
    @Put(':id/toggle-active')
    @UseGuards(AdminGuard)
    async toggleActive(@Param('id') id: string): Promise<TheaterResponseDto> {
        return this.theatersService.toggleActive(id);
    }

    // Eliminar teatro (Para admin)
    @Delete(':id')
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<TheaterResponseDto> {
        return this.theatersService.remove(id);
    }
}
