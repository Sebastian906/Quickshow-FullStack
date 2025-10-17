/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors();

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Server listening at http://localhost:${port}`)
}
bootstrap();
