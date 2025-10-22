export class DashboardDataDto {
    totalBookings: number;
    totalRevenue: number;
    activeShows: any[];
    totalUser: number;
}

export class DashboardResponseDto {
    success: boolean;
    dashboardData?: DashboardDataDto;
    message?: string;
}