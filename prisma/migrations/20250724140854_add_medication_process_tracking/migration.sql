-- CreateEnum
CREATE TYPE "MedicationProcessStep" AS ENUM ('PREDESPACHO', 'ALISTAMIENTO', 'VALIDACION', 'ENTREGA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "medication_processes" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "step" "MedicationProcessStep" NOT NULL,
    "status" "ProcessStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "startedBy" TEXT,
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_processes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_processes_patientId_idx" ON "medication_processes"("patientId");

-- CreateIndex
CREATE INDEX "medication_processes_step_idx" ON "medication_processes"("step");

-- CreateIndex
CREATE INDEX "medication_processes_status_idx" ON "medication_processes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medication_processes_patientId_step_key" ON "medication_processes"("patientId", "step");

-- AddForeignKey
ALTER TABLE "medication_processes" ADD CONSTRAINT "medication_processes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
