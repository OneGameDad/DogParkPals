import cron from "node-cron";
import parkService from "../services/parkService";
import typeSafeLogger from "../utils/typeSafeLogger";
import { PrismaClient } from '@prisma/client';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';

const prisma = new PrismaClient();

// Every 15 minutes check if the user has been checked in for over an hour. If so, check them out.
export async function runAutoCheckOutJob () {
    typeSafeLogger.info("Running 15-minute auto-checkout job");
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const checkInsToCheckOut = await parkService.getStaleCheckIns(oneHourAgo);
        for (const checkIn of checkInsToCheckOut) {
            await parkService.autoCheckOut(checkIn.id);
            typeSafeLogger.logUserAction("Auto-checked out user", { checkInId: checkIn.id });
        }
        typeSafeLogger.info("15-minute auto-checkout job completed", { count: checkInsToCheckOut.length });
    } catch (error) {
        typeSafeLogger.logError("15-minute auto-checkout job failed", error);
        const message = error instanceof Error ? error.message : 'Unknown auto-checkout error';
        const domainEvent = createDomainEvent(EventTypes.JobFailed, {
            jobName: 'autoCheckoutJob.run',
            errorMessage: message,
            errorStack: error instanceof Error ? error.stack : undefined,
            context: { schedule: '*/15 * * * *' },
        });
        await addOutboxEvent(prisma, domainEvent);
    }
};

if (process.env.NODE_ENV !== "test") {
    cron.schedule("*/15 * * * *", runAutoCheckOutJob);
}