import { Module } from '@nestjs/common';
import { ShowService } from './show.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Show, ShowSchema } from './schema/show.schema';
import { ShowController } from './show.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Movie, MovieSchema } from 'src/movies/schemas/movie.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Show.name, schema: ShowSchema },
      { name: Movie.name, schema: MovieSchema },
    ]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [ShowController],
  providers: [ShowService],
  exports: [ShowService],
})
export class ShowModule {}
