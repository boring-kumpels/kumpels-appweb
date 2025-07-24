-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED');

-- CreateEnum
CREATE TYPE "LineName" AS ENUM ('LINE_A', 'LINE_B', 'LINE_C', 'LINE_D', 'LINE_E');

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "lineName" "LineName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "bedId" TEXT NOT NULL,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "medical_record" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beds_lineName_number_key" ON "beds"("lineName", "number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_externalId_key" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "patients_externalId_idx" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "patients_bedId_idx" ON "patients"("bedId");

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "patients"("status");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "beds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
