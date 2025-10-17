/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() private connection: Connection) { }

  getHello(): string {
    return 'Server is Live!';
  }

  getDatabaseStatus(): object {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: states[this.connection.readyState] || 'unknown',
      statusCode: this.connection.readyState,
      database: this.connection.name,
      host: this.connection.host,
    };
  }
}
