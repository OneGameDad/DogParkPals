/*
  Warnings:

  - The primary key for the `Friendship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friendship" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requesterId" INTEGER,
    "requesterDogId" INTEGER,
    "addresseeId" INTEGER,
    "addresseeDogId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Friendship_requesterDogId_fkey" FOREIGN KEY ("requesterDogId") REFERENCES "Dog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeDogId_fkey" FOREIGN KEY ("addresseeDogId") REFERENCES "Dog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("addresseeId", "createdAt", "requesterId", "status", "updatedAt") SELECT "addresseeId", "createdAt", "requesterId", "status", "updatedAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "ownerId" INTEGER NOT NULL,
    "memberRole" TEXT NOT NULL DEFAULT 'INVITEE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Organization" ("createdAt", "description", "id", "memberRole", "name", "ownerId", "profilePictureUrl", "updatedAt", "websiteUrl") SELECT "createdAt", "description", "id", "memberRole", "name", "ownerId", "profilePictureUrl", "updatedAt", "websiteUrl" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
