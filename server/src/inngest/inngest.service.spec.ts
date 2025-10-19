import { Test, TestingModule } from '@nestjs/testing';
import { InngestService } from './inngest.service';

describe('InngestService', () => {
    let service: InngestService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InngestService],
        }).compile();

        service = module.get<InngestService>(InngestService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
