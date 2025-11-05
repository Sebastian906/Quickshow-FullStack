import { Module } from "@nestjs/common";
import { InngestController } from "./inngest.controller";
import { UsersModule } from "src/users/users.module";
import { InngestService } from "./inngest.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Booking, BookingSchema } from "src/bookings/schemas/booking.schema";
import { Show, ShowSchema } from "src/shows/schema/show.schema";

@Module({
    imports: [
        UsersModule,
        MongooseModule.forFeature([
            { name: Booking.name, schema: BookingSchema },
            { name: Show.name, schema: ShowSchema },
        ]),
    ],
    controllers: [InngestController],
    providers: [InngestService],
    exports: [InngestService]
})

export class InngestModule {}