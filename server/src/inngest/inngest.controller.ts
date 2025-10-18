import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { inngest } from '../configs/inngest.config';
import { functions } from './functions';

@Controller('api/inngest')
export class InngestController {
    private inngestService = serve({
        client: inngest,
        functions,
    });

    @All('*')
    async handleInngest(@Req() req: Request, @Res() res: Response) {
        return this.inngestService(req, res);
    }
}