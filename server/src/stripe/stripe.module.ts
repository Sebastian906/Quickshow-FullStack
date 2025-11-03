import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { BookingModule } from 'src/bookings/booking.module';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
    imports: [
        ConfigModule, 
        forwardRef(() => BookingModule),
    ],
    controllers: [StripeWebhookController],
    providers: [StripeService],
    exports: [StripeService],
})
export class StripeModule {}
