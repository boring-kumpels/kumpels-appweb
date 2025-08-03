-- CreateEnum
CREATE TYPE "ManualReturnType" AS ENUM ('STANDALONE', 'DEVOLUTION_PROCESS');

-- AlterTable
ALTER TABLE "manual_returns" ADD COLUMN     "devolutionCauseId" TEXT,
ADD COLUMN     "medicationProcessId" TEXT,
ADD COLUMN     "type" "ManualReturnType" NOT NULL DEFAULT 'STANDALONE';

-- CreateTable
CREATE TABLE "devolution_causes" (
    "id" TEXT NOT NULL,
    "causeId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devolution_causes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devolution_causes_causeId_key" ON "devolution_causes"("causeId");

-- CreateIndex
CREATE INDEX "devolution_causes_causeId_idx" ON "devolution_causes"("causeId");

-- CreateIndex
CREATE INDEX "devolution_causes_active_idx" ON "devolution_causes"("active");

-- CreateIndex
CREATE INDEX "manual_returns_medicationProcessId_idx" ON "manual_returns"("medicationProcessId");

-- CreateIndex
CREATE INDEX "manual_returns_devolutionCauseId_idx" ON "manual_returns"("devolutionCauseId");

-- CreateIndex
CREATE INDEX "manual_returns_type_idx" ON "manual_returns"("type");

-- AddForeignKey
ALTER TABLE "manual_returns" ADD CONSTRAINT "manual_returns_medicationProcessId_fkey" FOREIGN KEY ("medicationProcessId") REFERENCES "medication_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_returns" ADD CONSTRAINT "manual_returns_devolutionCauseId_fkey" FOREIGN KEY ("devolutionCauseId") REFERENCES "devolution_causes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
