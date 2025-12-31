-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "rideId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_rideId_idx" ON "Notification"("rideId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
