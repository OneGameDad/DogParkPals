-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "actorId" INTEGER,
    "version" INTEGER NOT NULL,
    "traceId" TEXT,
    "publishedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_occurredAt_idx" ON "OutboxEvent"("publishedAt", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_eventId_handler_key" ON "ProcessedEvent"("eventId", "handler");
