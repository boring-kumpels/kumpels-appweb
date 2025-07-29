/*
  Warnings:

  - You are about to drop the column `lineName` on the `beds` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lineId,number]` on the table `beds` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lineId` to the `beds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "ManualReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "beds_lineName_number_key";

-- AlterTable
ALTER TABLE "beds" DROP COLUMN "lineName",
ADD COLUMN     "lineId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "serviceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "lines" (
    "id" TEXT NOT NULL,
    "name" "LineName" NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_error_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationProcessId" TEXT,
    "step" "MedicationProcessStep",
    "logType" "LogType" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedByRole" "UserRole" NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_returns" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "status" "ManualReturnStatus" NOT NULL DEFAULT 'PENDING',
    "approvalDate" TIMESTAMP(3),
    "cause" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_return_supplies" (
    "id" TEXT NOT NULL,
    "manualReturnId" TEXT NOT NULL,
    "supplyCode" TEXT NOT NULL,
    "supplyName" TEXT NOT NULL,
    "quantityReturned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_return_supplies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lines_name_key" ON "lines"("name");

-- CreateIndex
CREATE INDEX "services_lineId_idx" ON "services"("lineId");

-- CreateIndex
CREATE INDEX "process_error_logs_patientId_idx" ON "process_error_logs"("patientId");

-- CreateIndex
CREATE INDEX "process_error_logs_medicationProcessId_idx" ON "process_error_logs"("medicationProcessId");

-- CreateIndex
CREATE INDEX "process_error_logs_logType_idx" ON "process_error_logs"("logType");

-- CreateIndex
CREATE INDEX "process_error_logs_createdAt_idx" ON "process_error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "manual_returns_patientId_idx" ON "manual_returns"("patientId");

-- CreateIndex
CREATE INDEX "manual_returns_status_idx" ON "manual_returns"("status");

-- CreateIndex
CREATE INDEX "manual_returns_createdAt_idx" ON "manual_returns"("createdAt");

-- CreateIndex
CREATE INDEX "manual_return_supplies_manualReturnId_idx" ON "manual_return_supplies"("manualReturnId");

-- CreateIndex
CREATE INDEX "beds_lineId_idx" ON "beds"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "beds_lineId_number_key" ON "beds"("lineId", "number");

-- CreateIndex
CREATE INDEX "patients_serviceId_idx" ON "patients"("serviceId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_error_logs" ADD CONSTRAINT "process_error_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_error_logs" ADD CONSTRAINT "process_error_logs_medicationProcessId_fkey" FOREIGN KEY ("medicationProcessId") REFERENCES "medication_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_returns" ADD CONSTRAINT "manual_returns_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_return_supplies" ADD CONSTRAINT "manual_return_supplies_manualReturnId_fkey" FOREIGN KEY ("manualReturnId") REFERENCES "manual_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
