-- AlterTable
ALTER TABLE "ProdeRoom" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserProde" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ProdeRoom_deletedAt_idx" ON "ProdeRoom"("deletedAt");

-- CreateIndex
CREATE INDEX "UserProde_deletedAt_idx" ON "UserProde"("deletedAt");
