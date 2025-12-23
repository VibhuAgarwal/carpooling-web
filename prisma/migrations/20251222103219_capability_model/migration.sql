/*
  Warnings:

  - You are about to drop the column `riderId` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `driverId` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatsLeft` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatsTotal` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Ride" DROP CONSTRAINT "Ride_riderId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "riderId",
DROP COLUMN "seats",
ADD COLUMN     "driverId" TEXT NOT NULL,
ADD COLUMN     "routePoints" JSONB,
ADD COLUMN     "seatsLeft" INTEGER NOT NULL,
ADD COLUMN     "seatsTotal" INTEGER NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "canDrive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canRide" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActiveMode" TEXT NOT NULL DEFAULT 'PASSENGER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
