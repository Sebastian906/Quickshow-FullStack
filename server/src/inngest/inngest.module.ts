import { Module } from "@nestjs/common";
import { InngestController } from "./inngest.controller";
import { UsersModule } from "src/users/users.module";
import { InngestService } from "./inngest.service";

@Module({
    imports: [UsersModule],
    controllers: [InngestController],
    providers: [InngestService],
    exports: [InngestService]
})

export class InngestModule {}