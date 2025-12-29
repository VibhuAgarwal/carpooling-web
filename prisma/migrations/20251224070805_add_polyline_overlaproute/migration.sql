/*
  Warnings:

  - A unique constraint covering the columns `[rideId,userId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Booking"
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

ALTER TABLE "Booking"
ALTER COLUMN "updatedAt" SET NOT NULL;


-- AlterTable
ALTER TABLE "Notification"
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Notification"
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

ALTER TABLE "Notification"
ALTER COLUMN "updatedAt" SET NOT NULL;


-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "routePolyline" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_rideId_userId_key" ON "Booking"("rideId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Ride_fromLat_fromLng_idx" ON "Ride"("fromLat", "fromLng");

-- CreateIndex
CREATE INDEX "Ride_toLat_toLng_idx" ON "Ride"("toLat", "toLng");

-- CreateIndex
CREATE INDEX "Ride_startTime_idx" ON "Ride"("startTime");
