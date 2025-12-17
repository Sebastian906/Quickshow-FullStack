import { Module } from '@nestjs/common';
import { TheatersController } from './theaters.controller';
import { TheatersService } from './theaters.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Theater, TheaterSchema } from './schema/theater.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Theater.name, schema: TheaterSchema },
    ])
  ],
  controllers: [TheatersController],
  providers: [TheatersService],
  exports: [TheatersService],
})
export class TheatersModule {}
