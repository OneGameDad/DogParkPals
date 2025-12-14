/*
  Warnings:

  - You are about to drop the `_UserFavoriteParks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ownerId` on the `Dog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_UserFavoriteParks_B_index";

-- DropIndex
DROP INDEX "_UserFavoriteParks_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_UserFavoriteParks";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DogOwner" (
    "userId" INTEGER NOT NULL,
    "dogId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "dogId"),
    CONSTRAINT "DogOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DogOwner_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFavoritePark" (
    "userId" INTEGER NOT NULL,
    "parkId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "parkId"),
    CONSTRAINT "UserFavoritePark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserFavoritePark_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "currentLocationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dog_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Park" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Dog" ("breed", "createdAt", "currentLocationId", "dateOfBirth", "description", "fixed", "gender", "id", "name", "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl") SELECT "breed", "createdAt", "currentLocationId", "dateOfBirth", "description", "fixed", "gender", "id", "name", "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl" FROM "Dog";
DROP TABLE "Dog";
ALTER TABLE "new_Dog" RENAME TO "Dog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
