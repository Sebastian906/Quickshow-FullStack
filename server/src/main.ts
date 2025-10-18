/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  });

  app.use(clerkMiddleware());

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Server listening at http://localhost:${port}`)
}
bootstrap();
