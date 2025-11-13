/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clerkMiddleware } from '@clerk/express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, 
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  // Habilitar CORS
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [configService.get('FRONTEND_URL')] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173']; 

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  app.setGlobalPrefix('api');

  const clerkSecret = configService.get('CLERK_SECRET_KEY');
  const clerkPublishable = configService.get('CLERK_PUBLISHABLE_KEY');

  if (!clerkSecret || !clerkPublishable) {
    console.error('ERROR: Clerk keys are missing! Authentication will fail.');
  }

  app.use(clerkMiddleware({
    secretKey: clerkSecret,
    publishableKey: clerkPublishable,
    debug: process.env.NODE_ENV !== 'production',
  }));

  const port = configService.get<number>('PORT') || 3000;
  const host = '0.0.0.0'; 

  await app.listen(port, host);
  
  console.log(`Server running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at http://${host}:${port}/api`);
  console.log(`Allowed origins:`, allowedOrigins);
}

bootstrap().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
