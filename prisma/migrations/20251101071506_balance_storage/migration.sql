-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "balanceUpdatedAt" TIMESTAMP(3);
