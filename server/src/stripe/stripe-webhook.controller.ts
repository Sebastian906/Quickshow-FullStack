import { BadRequestException, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BookingService } from 'src/bookings/booking.service';
import Stripe from 'stripe';
import { inngest } from 'src/configs/inngest.config';

@Controller('stripe')
export class StripeWebhookController {
    constructor(
        private stripeService: StripeService,
        private bookingService: BookingService,
    ) { }

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
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                    break;

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

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        
        try {
            const stripe = this.stripeService.getStripe();
            const sessionList = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
                limit: 1,
            });

            if (sessionList.data.length === 0) {
                console.error(`No checkout session found for payment_intent: ${paymentIntent.id}`);
                return;
            }

            const session = sessionList.data[0];
            const bookingId = session.metadata?.bookingId;

            if (!bookingId) {
                console.error('No bookingId in session metadata');
                return;
            }

            console.log(`Updating booking ${bookingId} to paid status`);
            
            await this.bookingService.updatePaymentStatusFromWebhook(
                bookingId,
                true,
                paymentIntent.id,
            );

            console.log(`Successfully updated booking ${bookingId}`);

            await inngest.send({
                name: 'app/show.booked',
                data: { bookingId }
            });
            
            console.log(`Inngest event sent for booking confirmation: ${bookingId}`);

        } catch (error) {
            console.error('Error in handlePaymentIntentSucceeded:', error);
            throw error;
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
            console.error('No bookingId in session metadata');
            return;
        }

        console.log(`Payment completed for booking: ${bookingId}`);
        await this.bookingService.updatePaymentStatus(
            bookingId,
            true,
            session.payment_intent as string,
        );
    }

    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
        console.error(`PaymentIntent failed: ${paymentIntent.id}`);
    }
}
