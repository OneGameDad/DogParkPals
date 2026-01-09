import cron from "node-cron";
import parkService from "../services/parkService";
import typeSafeLogger from "../utils/typeSafeLogger";
import { errorMonitor } from "stream";

// Every 15 minutes check if the user has been checked in for over an hour. If so, check them out.
cron.schedule("*/15 * * * *", async () => {
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
    }
});