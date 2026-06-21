/*
  Warnings:

  - You are about to drop the column `entidadId` on the `incidencia` table. All the data in the column will be lost.
  - You are about to drop the `entidad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `incidencia` DROP FOREIGN KEY `incidencia_entidadId_fkey`;

-- DropIndex
DROP INDEX `incidencia_entidadId_fkey` ON `incidencia`;

-- AlterTable
ALTER TABLE `incidencia` DROP COLUMN `entidadId`;

-- DropTable
DROP TABLE `entidad`;
