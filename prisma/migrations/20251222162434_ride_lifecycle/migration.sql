/*
  Warnings:

  - The `status` column on the `Ride` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `canDrive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `canRide` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveMode` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "status",
ADD COLUMN     "status" "RideStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "canDrive",
DROP COLUMN "canRide",
DROP COLUMN "lastActiveMode";
