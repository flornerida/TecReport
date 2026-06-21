/*
  Warnings:

  - Made the column `urlFoto` on table `Evidencia` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Evidencia` MODIFY `urlFoto` LONGTEXT NOT NULL;
