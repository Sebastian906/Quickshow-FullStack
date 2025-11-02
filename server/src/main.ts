/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, 
    logger: ['error', 'warn', 'log'],
  });

  // Habilitar CORS
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173']; 

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api')

  app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    debug: process.env.NODE_ENV !== 'production',
  }));

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0'; // CRÍTICO para Render

  await app.listen(port, host);
  
  console.log(`Server running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at http://${host}:${port}/api`);
}

bootstrap().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
