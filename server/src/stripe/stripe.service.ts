import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2025-11-17.clover',
        });
    }

    async createCheckoutSession(params: {
        movieTitle: string;
        amount: number;
        bookingId: string;
        origin: string;
    }): Promise<Stripe.Checkout.Session> {
        const { movieTitle, amount, bookingId, origin } = params;

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: movieTitle,
                        description: 'Movie ticket booking',
                    },
                    unit_amount: Math.floor(amount) * 100, 
                },
                quantity: 1,
            },
        ];

        const session = await this.stripe.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                bookingId: bookingId,
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, 
        });

        return session;
    }

    async constructWebhookEvent(
        payload: Buffer,
        signature: string,
    ): Promise<Stripe.Event> {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
        }

        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

    getStripe(): Stripe {
        return this.stripe;
    }
}
