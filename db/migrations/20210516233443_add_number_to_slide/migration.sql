/*
  Warnings:

  - Added the required column `number` to the `Slide` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Slide" ADD COLUMN     "number" INTEGER NOT NULL;
