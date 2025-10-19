import { Test, TestingModule } from '@nestjs/testing';
import { InngestController } from './inngest.controller';

describe('InngestController', () => {
    let controller: InngestController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [InngestController],
        }).compile();

        controller = module.get<InngestController>(InngestController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
