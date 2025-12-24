/*
  Warnings:

  - You are about to drop the column `routePoints` on the `Ride` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "routePoints",
ADD COLUMN     "fromLat" DOUBLE PRECISION,
ADD COLUMN     "fromLng" DOUBLE PRECISION,
ADD COLUMN     "toLat" DOUBLE PRECISION,
ADD COLUMN     "toLng" DOUBLE PRECISION;
