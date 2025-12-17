import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Theater, TheaterDocument } from './schema/theater.schema';
import { Model } from 'mongoose';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { TheaterResponseDto } from './dto/theater-response.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';

@Injectable()
export class TheatersService {
    constructor(
        @InjectModel(Theater.name) private theaterModel: Model<TheaterDocument>,
    ) {}

    // Validar horarios de apertura y cierre
    private validateHours(openingTime: string, closingTime: string): boolean {
        const convertTo24Hour = (time: string): number => {
            const [timePart, period] = time.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            
            if (period.toUpperCase() === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period.toUpperCase() === 'AM' && hours === 12) {
                hours = 0;
            }
            
            return hours * 60 + minutes;
        };

        const openMinutes = convertTo24Hour(openingTime);
        const closeMinutes = convertTo24Hour(closingTime);

        // Si cierre es menor que apertura, asumimos que cruza medianoche (ej: 10 PM a 2 AM)
        return closeMinutes >= openMinutes || closeMinutes < 360; // 360 min = 6 AM
    }

    // Crear teatro
    async create(createTheaterDto: CreateTheaterDto): Promise<TheaterResponseDto> {
        try {
            const { openingTime, closingTime } = createTheaterDto;

            if (!this.validateHours(openingTime, closingTime)) {
                throw new BadRequestException('Opening time must be before closing time');
            }

            const theater = await this.theaterModel.create(createTheaterDto);
            return {
                success: true,
                message: 'Theater created successfully',
                theater,
            };
        } catch (error) {
            console.error('Error creating theater:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create theater');
        }
    }

    // Obtener todos los teatros
    async findAll(activeOnly: boolean = false): Promise<TheaterResponseDto> {
        try {
            const query = activeOnly ? { isActive: true } : {};
            const theaters = await this.theaterModel
                .find(query)
                .sort({ createdAt: -1 })
                .exec();

            return {
                success: true,
                theaters,
            };
        } catch (error) {
            console.error('Error fetching theaters:', error);
            return {
                success: false,
                message: 'Failed to fetch theaters',
            };
        }
    }

    // Obtener teatro por ID
    async findOne(id: string): Promise<TheaterResponseDto> {
        try {
            const theater = await this.theaterModel.findById(id).exec();

            if (!theater) {
                throw new NotFoundException(`Theater with ID ${id} not found`);
            }

            return {
                success: true,
                theater,
            };
        } catch (error) {
            console.error('Error fetching theater:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to fetch theater');
        }
    }

    // Buscar teatros por nombre o dirección
    async search(query: string): Promise<TheaterResponseDto> {
        try {
            const theaters = await this.theaterModel
                .find({
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { address: { $regex: query, $options: 'i' } },
                    ],
                    isActive: true,
                })
                .exec();

            return {
                success: true,
                theaters,
            };
        } catch (error) {
            console.error('Error searching theaters:', error);
            return {
                success: false,
                message: 'Failed to search theaters',
            };
        }
    }

    // Buscar teatros por amenidad específica
    async findByAmenity(amenity: string): Promise<TheaterResponseDto> {
        try {
            const theaters = await this.theaterModel
                .find({
                    amenities: { $in: [amenity] },
                    isActive: true,
                })
                .exec();

            return {
                success: true,
                theaters,
            };
        } catch (error) {
            console.error('Error finding theaters by amenity:', error);
            return {
                success: false,
                message: 'Failed to find theaters',
            };
        }
    }

    // Actualizar teatro
    async update(
        id: string,
        updateTheaterDto: UpdateTheaterDto,
    ): Promise<TheaterResponseDto> {
        try {
            if (updateTheaterDto.openingTime && updateTheaterDto.closingTime) {
                if (!this.validateHours(updateTheaterDto.openingTime, updateTheaterDto.closingTime)) {
                    throw new BadRequestException('Opening time must be before closing time');
                }
            }

            const theater = await this.theaterModel
                .findByIdAndUpdate(id, updateTheaterDto, { new: true })
                .exec();

            if (!theater) {
                throw new NotFoundException(`Theater with ID ${id} not found`);
            }

            return {
                success: true,
                message: 'Theater updated successfully',
                theater,
            };
        } catch (error) {
            console.error('Error updating theater:', error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to update theater');
        }
    }

    // Activar/Desactivar teatro
    async toggleActive(id: string): Promise<TheaterResponseDto> {
        try {
            const theater = await this.theaterModel.findById(id).exec();

            if (!theater) {
                throw new NotFoundException(`Theater with ID ${id} not found`);
            }

            theater.isActive = !theater.isActive;
            await theater.save();

            return {
                success: true,
                message: `Theater ${theater.isActive ? 'activated' : 'deactivated'} successfully`,
                theater,
            };
        } catch (error) {
            console.error('Error toggling theater status:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to toggle theater status');
        }
    }

    // Eliminar teatro
    async remove(id: string): Promise<TheaterResponseDto> {
        try {
            const theater = await this.theaterModel.findByIdAndDelete(id).exec();

            if (!theater) {
                throw new NotFoundException(`Theater with ID ${id} not found`);
            }

            return {
                success: true,
                message: 'Theater deleted successfully',
            };
        } catch (error) {
            console.error('Error deleting theater:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to delete theater');
        }
    }

    // Obtener estadísticas de teatros
    async getStats(): Promise<any> {
        try {
            const totalTheaters = await this.theaterModel.countDocuments();
            const activeTheaters = await this.theaterModel.countDocuments({ isActive: true });
            const inactiveTheaters = totalTheaters - activeTheaters;

            const amenitiesCount = await this.theaterModel.aggregate([
                { $unwind: '$amenities' },
                { $group: { _id: '$amenities', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);

            return {
                success: true,
                stats: {
                    totalTheaters,
                    activeTheaters,
                    inactiveTheaters,
                    amenitiesCount,
                },
            };
        } catch (error) {
            console.error('Error getting theater stats:', error);
            return {
                success: false,
                message: 'Failed to get statistics',
            };
        }
    }
}
