import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { InngestService } from './inngest.service';
import { ConfigService } from '@nestjs/config';
import { Inngest } from 'inngest';

@Controller('inngest')
export class InngestController {
    private inngestServe;

    constructor(
        private readonly inngestService: InngestService,
        private readonly configService: ConfigService,
    ) {
        const eventKey = this.configService.get<string>('INNGEST_EVENT_KEY');
        const signingKey = this.configService.get<string>('INNGEST_SIGNING_KEY');

        const inngestClient = new Inngest({
            id: 'Quickshow',
            eventKey: eventKey,
            signingKey: signingKey,
        });

        const functions = this.inngestService.getFunctions();

        this.inngestServe = serve({
            client: inngestClient,
            functions,
        });

        console.log(`Inngest controller initialized with ${functions.length} functions`);
    }

    @All()
    async handleInngest(@Req() req: Request, @Res() res: Response) {
        return this.inngestServe(req, res);
    }
}