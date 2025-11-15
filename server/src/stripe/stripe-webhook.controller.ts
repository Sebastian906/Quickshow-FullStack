import { BadRequestException, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BookingService } from 'src/bookings/booking.service';
import { ConfigService } from '@nestjs/config';
import { Inngest } from 'inngest';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeWebhookController {
    private inngest: Inngest;
    constructor(
        private stripeService: StripeService,
        private bookingService: BookingService,
        private configService: ConfigService,
    ) { 
        this.inngest = new Inngest({
            id: 'Quickshow',
            eventKey: this.configService.get<string>('INNGEST_EVENT_KEY'),
        });
    }

    @Post('webhook') 
    async handleWebhook(
        @Req() request: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        let event: Stripe.Event;

        try {
            const rawBody = request.rawBody;

            if (!rawBody) {
                throw new BadRequestException('No raw body available');
            }

            event = await this.stripeService.constructWebhookEvent(rawBody, signature);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        try {
            console.log(`Received webhook event: ${event.type}`);

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (err) {
            console.error('Error processing webhook:', err);
            throw new BadRequestException('Error processing webhook');
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
            console.error('No bookingId in session metadata');
            return;
        }

        console.log(`Checkout session completed for booking: ${bookingId}`);
        console.log(`Payment status: ${session.payment_status}`);

        if (session.payment_status === 'paid') {
            try {
                await this.bookingService.updatePaymentStatusFromWebhook(
                    bookingId,
                    true,
                    session.payment_intent as string,
                );

                await this.inngest.send({
                    name: 'app/show.booked',
                    data: { bookingId }
                });
                
                console.log(`Booking ${bookingId} marked as paid and confirmation email queued`);
            } catch (error) {
                console.error(`Error updating booking ${bookingId}:`, error);
                throw error;
            }
        } else {
            console.log(`Payment not completed yet for booking ${bookingId}, status: ${session.payment_status}`);
        }
    }

    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
        console.error(`PaymentIntent failed: ${paymentIntent.id}`);
        
        try {
            const stripe = this.stripeService.getStripe();
            const sessionList = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
                limit: 1,
            });

            const session = sessionList.data[0];
            const bookingId = session?.metadata?.bookingId;

            if (bookingId) {
                console.log(`Payment failed for booking ${bookingId}`);
            }
        } catch (error) {
            console.error('Error handling failed payment:', error);
        }
    }
}
