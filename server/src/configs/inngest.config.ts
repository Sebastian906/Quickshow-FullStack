import { Inngest } from 'inngest';

export const inngest = new Inngest({
    id: 'Quickshow',
    eventKey: process.env.INGEST_EVENT_KEY,
});