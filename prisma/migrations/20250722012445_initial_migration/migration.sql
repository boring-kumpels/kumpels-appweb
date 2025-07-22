/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'NURSE', 'PHARMACY_VALIDATOR', 'PHARMACY_REGENT');
ALTER TABLE "profiles" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "profiles" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'SUPERADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'SUPERADMIN';
