-- CreateIndex
CREATE INDEX "Messages_receiverId_status_sentAt_idx" ON "Messages"("receiverId", "status", "sentAt");

-- CreateIndex
CREATE INDEX "Messages_senderId_idx" ON "Messages"("senderId");

-- CreateIndex
CREATE INDEX "Messages_senderId_receiverId_sentAt_idx" ON "Messages"("senderId", "receiverId", "sentAt");
