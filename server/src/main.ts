/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, 
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

  await app.listen(port, '0.0.0.0');
  console.log(`Server listening at http://localhost:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
}
bootstrap();
