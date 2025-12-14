/*
  Warnings:

  - You are about to drop the column `memberRoles` on the `Organization` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Achievements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BADGE',
    "description" TEXT,
    "badgeUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Achievements" ("badgeUrl", "createdAt", "description", "id", "name", "updatedAt") SELECT "badgeUrl", "createdAt", "description", "id", "name", "updatedAt" FROM "Achievements";
DROP TABLE "Achievements";
ALTER TABLE "new_Achievements" RENAME TO "Achievements";
CREATE TABLE "new_Dog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "fixed" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATETIME NOT NULL,
    "size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "ownerId" INTEGER NOT NULL,
    "profilePictureUrl" TEXT,
    "vaccinationRecordUrl" TEXT,
    "playstyle" TEXT NOT NULL DEFAULT 'SOCIAL',
    "description" TEXT,
    "currentLocationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dog_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Park" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Dog" ("breed", "createdAt", "currentLocationId", "dateOfBirth", "description", "fixed", "gender", "id", "name", "ownerId", "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl") SELECT "breed", "createdAt", "currentLocationId", "dateOfBirth", "description", "fixed", "gender", "id", "name", "ownerId", coalesce("playstyle", 'SOCIAL') AS "playstyle", "profilePictureUrl", "size", "updatedAt", "vaccinationRecordUrl" FROM "Dog";
DROP TABLE "Dog";
ALTER TABLE "new_Dog" RENAME TO "Dog";
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "private" TEXT NOT NULL DEFAULT 'PUBLIC',
    "date" DATETIME NOT NULL,
    "parkId" INTEGER NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "date", "description", "id", "organizerId", "parkId", "private", "title", "updatedAt") SELECT "createdAt", "date", "description", "id", "organizerId", "parkId", "private", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_Friendship" (
    "requesterId" INTEGER NOT NULL,
    "addresseeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("requesterId", "addresseeId"),
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("addresseeId", "requesterId", "status") SELECT "addresseeId", "requesterId", "status" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "ownerId" INTEGER NOT NULL,
    "memberRole" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Organization" ("createdAt", "description", "id", "name", "ownerId", "profilePictureUrl", "updatedAt", "websiteUrl") SELECT "createdAt", "description", "id", "name", "ownerId", "profilePictureUrl", "updatedAt", "websiteUrl" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE TABLE "new_OrganizationMember" (
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "organizationId"),
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrganizationMember" ("organizationId", "role", "userId") SELECT "organizationId", "role", "userId" FROM "OrganizationMember";
DROP TABLE "OrganizationMember";
ALTER TABLE "new_OrganizationMember" RENAME TO "OrganizationMember";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "profilePictureUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "ExpPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("ExpPoints", "createdAt", "email", "first_name", "id", "last_name", "password_hash", "profilePictureUrl", "updatedAt", "username") SELECT "ExpPoints", "createdAt", "email", "first_name", "id", "last_name", "password_hash", "profilePictureUrl", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
