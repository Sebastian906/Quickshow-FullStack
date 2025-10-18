import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { inngest } from '../configs/inngest.config';
import { InngestService } from './inngest.service';

@Controller('api/inngest')
export class InngestController {
    private inngestServe;

    constructor(private readonly inngestService: InngestService) {
        const functions = this.inngestService.getFunctions();

        this.inngestServe = serve({
            client: inngest,
            functions,
        });
    }

    @All('*')
    async handleInngest(@Req() req: Request, @Res() res: Response) {
        return this.inngestServe(req, res);
    }
}