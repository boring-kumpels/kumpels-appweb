/*
  Warnings:

  - A unique constraint covering the columns `[patientId,qrCodeId,dailyProcessId,transactionType]` on the table `qr_scan_records` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "qr_scan_records_patientId_qrCodeId_dailyProcessId_key";

-- CreateIndex
CREATE UNIQUE INDEX "qr_scan_records_patientId_qrCodeId_dailyProcessId_transacti_key" ON "qr_scan_records"("patientId", "qrCodeId", "dailyProcessId", "transactionType");
