import { Inngest } from 'inngest';

export const inngest = new Inngest({
    id: 'Quickshow',
    eventKey: process.env.INGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
});