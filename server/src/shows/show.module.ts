import { Module } from '@nestjs/common';
import { ShowService } from './show.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Show, ShowSchema } from './schema/show.schema';
import { ShowController } from './show.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Show.name, schema: ShowSchema },
    ])
  ],
  controllers: [ShowController],
  providers: [ShowService],
  exports: [ShowService],
})
export class ShowModule {}
