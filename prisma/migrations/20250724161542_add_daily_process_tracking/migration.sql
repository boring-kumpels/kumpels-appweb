/*
  Warnings:

  - A unique constraint covering the columns `[patientId,step,dailyProcessId]` on the table `medication_processes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "medication_processes_patientId_step_key";

-- AlterTable
ALTER TABLE "medication_processes" ADD COLUMN     "dailyProcessId" TEXT;

-- CreateTable
CREATE TABLE "daily_processes" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_processes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_processes_date_idx" ON "daily_processes"("date");

-- CreateIndex
CREATE INDEX "daily_processes_startedBy_idx" ON "daily_processes"("startedBy");

-- CreateIndex
CREATE UNIQUE INDEX "daily_processes_date_key" ON "daily_processes"("date");

-- CreateIndex
CREATE INDEX "medication_processes_dailyProcessId_idx" ON "medication_processes"("dailyProcessId");

-- CreateIndex
CREATE UNIQUE INDEX "medication_processes_patientId_step_dailyProcessId_key" ON "medication_processes"("patientId", "step", "dailyProcessId");

-- AddForeignKey
ALTER TABLE "medication_processes" ADD CONSTRAINT "medication_processes_dailyProcessId_fkey" FOREIGN KEY ("dailyProcessId") REFERENCES "daily_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
