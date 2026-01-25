/*
  Warnings:

  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "profilePictureUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "ExpPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("ExpPoints", "createdAt", "email", "first_name", "id", "last_name", "latitude", "longitude", "password_hash", "profilePictureUrl", "role", "updatedAt", "username") SELECT "ExpPoints", "createdAt", "email", "first_name", "id", "last_name", "latitude", "longitude", "password_hash", "profilePictureUrl", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
