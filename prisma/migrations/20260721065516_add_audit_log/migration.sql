-- CreateEnum
CREATE TYPE "PostAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "PostAuditLog" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "postTitle" TEXT NOT NULL,
    "action" "PostAuditAction" NOT NULL,
    "actorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostAuditLog" ADD CONSTRAINT "PostAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
