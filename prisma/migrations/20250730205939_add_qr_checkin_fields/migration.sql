-- CreateEnum
CREATE TYPE "QRType" AS ENUM ('PHARMACY_DISPATCH', 'SERVICE_ARRIVAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProcessStatus" ADD VALUE 'DISPATCHED_FROM_PHARMACY';
ALTER TYPE "ProcessStatus" ADD VALUE 'DELIVERED_TO_SERVICE';

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" TEXT NOT NULL,
    "qrId" TEXT NOT NULL,
    "type" "QRType" NOT NULL DEFAULT 'PHARMACY_DISPATCH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "qrDataURL" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_scan_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyProcessId" TEXT,
    "temperature" DOUBLE PRECISION,
    "destinationLineId" TEXT,
    "transactionType" TEXT,

    CONSTRAINT "qr_scan_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_qrId_key" ON "qr_codes"("qrId");

-- CreateIndex
CREATE INDEX "qr_codes_isActive_idx" ON "qr_codes"("isActive");

-- CreateIndex
CREATE INDEX "qr_codes_type_idx" ON "qr_codes"("type");

-- CreateIndex
CREATE INDEX "qr_codes_serviceId_idx" ON "qr_codes"("serviceId");

-- CreateIndex
CREATE INDEX "qr_codes_createdAt_idx" ON "qr_codes"("createdAt");

-- CreateIndex
CREATE INDEX "qr_scan_records_patientId_idx" ON "qr_scan_records"("patientId");

-- CreateIndex
CREATE INDEX "qr_scan_records_qrCodeId_idx" ON "qr_scan_records"("qrCodeId");

-- CreateIndex
CREATE INDEX "qr_scan_records_dailyProcessId_idx" ON "qr_scan_records"("dailyProcessId");

-- CreateIndex
CREATE INDEX "qr_scan_records_scannedAt_idx" ON "qr_scan_records"("scannedAt");

-- CreateIndex
CREATE INDEX "qr_scan_records_destinationLineId_idx" ON "qr_scan_records"("destinationLineId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_scan_records_patientId_qrCodeId_dailyProcessId_key" ON "qr_scan_records"("patientId", "qrCodeId", "dailyProcessId");

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_records" ADD CONSTRAINT "qr_scan_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_records" ADD CONSTRAINT "qr_scan_records_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_records" ADD CONSTRAINT "qr_scan_records_dailyProcessId_fkey" FOREIGN KEY ("dailyProcessId") REFERENCES "daily_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_records" ADD CONSTRAINT "qr_scan_records_destinationLineId_fkey" FOREIGN KEY ("destinationLineId") REFERENCES "lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
