/*
  Warnings:

  - You are about to drop the column `currentLocationId` on the `Dog` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Park` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "latitude" REAL;
ALTER TABLE "User" ADD COLUMN "longitude" REAL;

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "dogId" INTEGER,
    "parkId" INTEGER NOT NULL,
    "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" DATETIME,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "fixed" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATETIME NOT NULL,
    "size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "profilePictureUrl" TEXT,
    "vaccinationRecordUrl" TEXT,
    "playstyle" TEXT NOT NULL DEFAULT 'SOCIAL',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dog" ("breed", "createdAt", "dateOfBirth", "description", "fixed", "gender", "id", "name", "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl") SELECT "breed", "createdAt", "dateOfBirth", "description", "fixed", "gender", "id", "name", "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl" FROM "Dog";
DROP TABLE "Dog";
ALTER TABLE "new_Dog" RENAME TO "Dog";
CREATE TABLE "new_Park" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL DEFAULT 0.0,
    "longitude" REAL NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "separateSmallDogArea" BOOLEAN NOT NULL DEFAULT false,
    "amenities" JSONB,
    "profilePictureUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Park" ("amenities", "createdAt", "description", "id", "name", "profilePictureUrl", "separateSmallDogArea", "updatedAt") SELECT "amenities", "createdAt", "description", "id", "name", "profilePictureUrl", "separateSmallDogArea", "updatedAt" FROM "Park";
DROP TABLE "Park";
ALTER TABLE "new_Park" RENAME TO "Park";
CREATE INDEX "Park_latitude_longitude_idx" ON "Park"("latitude", "longitude");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CheckIn_parkId_checkedInAt_idx" ON "CheckIn"("parkId", "checkedInAt");

-- CreateIndex
CREATE INDEX "CheckIn_userId_idx" ON "CheckIn"("userId");

-- CreateIndex
CREATE INDEX "CheckIn_dogId_idx" ON "CheckIn"("dogId");
