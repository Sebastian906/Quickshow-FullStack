/* eslint-disable prettier/prettier */
import { ConfigService } from "@nestjs/config";
import { MongooseModuleOptions } from "@nestjs/mongoose";
import { Connection } from 'mongoose';

export const getDatabaseConfig = (
    configService: ConfigService,
): MongooseModuleOptions => {
    return {
        uri: `${configService.get<string>('MONGODB_URI')}/quickshow`,
        connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
                console.log('Database connected');
            });
            connection.on('error', (error: Error) => {
                console.log('Database connection error:', error.message);
            });
            return connection;
        },
    };
};