/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig } from './configs/database.config';
import { UsersModule } from './users/users.module';
import { InngestModule } from './inngest/inngest.module';
import { MovieController } from './movies/movie.controller';
import { MovieModule } from './movies/movie.module';
import { ShowController } from './shows/show.controller';
import { ShowModule } from './shows/show.module';
import { env } from 'process';
import { BookingModule } from './bookings/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Configuración de MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    UsersModule,
    InngestModule,
    MovieModule,
    ShowModule,
    BookingModule,
  ],
  controllers: [AppController, MovieController, ShowController],
  providers: [AppService],
})
export class AppModule {}
