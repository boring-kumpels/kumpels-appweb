/*
  Warnings:

  - The values [LINE_A,LINE_B,LINE_C,LINE_D,LINE_E] on the enum `LineName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LineName_new" AS ENUM ('LINE_1', 'LINE_2', 'LINE_3', 'LINE_4', 'LINE_5');
ALTER TABLE "beds" ALTER COLUMN "lineName" TYPE "LineName_new" USING ("lineName"::text::"LineName_new");
ALTER TYPE "LineName" RENAME TO "LineName_old";
ALTER TYPE "LineName_new" RENAME TO "LineName";
DROP TYPE "LineName_old";
COMMIT;
