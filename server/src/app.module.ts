/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig } from './configs/database.config';
import { UsersModule } from './users/users.module';
import { InngestModule } from './inngest/inngest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configuración de MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    UsersModule,
    InngestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
