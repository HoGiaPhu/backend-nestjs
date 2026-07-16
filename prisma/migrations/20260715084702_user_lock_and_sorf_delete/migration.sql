-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false;
