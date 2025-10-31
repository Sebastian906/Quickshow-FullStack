import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Show, ShowSchema } from 'src/shows/schema/show.schema';
import { ClerkAuthGuard } from 'src/guards/clerk-auth/clerk-auth.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Show.name, schema: ShowSchema },
    ]),
    ConfigModule
  ],
  controllers: [BookingController],
  providers: [BookingService, ClerkAuthGuard],
  exports: [BookingService, ClerkAuthGuard],
})
export class BookingModule {}
