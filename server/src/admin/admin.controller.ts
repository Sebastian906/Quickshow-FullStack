import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin/admin.guard';
import { AdminService } from './admin.service';
import { AdminCheckResponseDto } from './dto/admin-check-response.dto';
import { DashboardResponseDto } from './dto/dashboard-data.dto';
import { ShowsResponseDto } from './dto/shows-response.dto';
import { BookingsResponseDto } from './dto/bookings-response.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('is-admin')
    isAdmin(): AdminCheckResponseDto {
        console.log('isAdmin endpoint called - confirming admin access');
        // Si llegamos aquí, significa que el AdminGuard permitió el acceso
        // por lo tanto el usuario es admin
        return { success: true, isAdmin: true }
    }

    @Get('dashboard')
    async getDashboardData(): Promise<DashboardResponseDto> {
        return this.adminService.getDashboardData();
    }

    @Get('all-shows')
    async getAllShows(): Promise<ShowsResponseDto> {
        return this.adminService.getAllShows();
    }

    @Get('all-bookings')
    async getAllBookings(): Promise<BookingsResponseDto> {
        return this.adminService.getAllBookings();
    }
}
