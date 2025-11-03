import { forwardRef, Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Show, ShowSchema } from 'src/shows/schema/show.schema';
import { ClerkAuthGuard } from 'src/guards/clerk-auth/clerk-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from 'src/stripe/stripe.module';
import { StripeWebhookController } from 'src/stripe/stripe-webhook.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Show.name, schema: ShowSchema },
    ]),
    ConfigModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [BookingController, StripeWebhookController],
  providers: [BookingService, ClerkAuthGuard],
  exports: [BookingService, ClerkAuthGuard],
})
export class BookingModule {}
