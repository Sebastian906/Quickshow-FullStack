import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
    to: string;
    subject: string;
    body: string;
}

export class EmailService {
    private transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASSWORD'),
            },
        });
    }

    async sendEmail({ to, subject, body }: SendEmailOptions): Promise<any> {
        try {
            const response = await this.transporter.sendMail({
                from: this.configService.get<string>('SENDER_EMAIL'),
                to,
                subject,
                html: body,
            });
            console.log('Email sent successfully:', response.messageId);
            return response;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}