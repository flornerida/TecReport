/*
  Warnings:

  - You are about to alter the column `estado` on the `incidencia` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(5))`.
  - The values [REPORTADO,EN_PROCESO,DERIVADO,RESUELTO,CERRADO] on the enum `seguimiento_estadoNuevo` will be removed. If these variants are still used in the database, this will fail.
  - The values [REPORTADO,EN_PROCESO,DERIVADO,RESUELTO,CERRADO] on the enum `seguimiento_estadoNuevo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `incidencia` MODIFY `estado` ENUM('RECIBIDO', 'EN_EVALUACION', 'EN_EJECUCION', 'FINALIZADO', 'COMPLETADO') NOT NULL DEFAULT 'RECIBIDO';

-- AlterTable
ALTER TABLE `seguimiento` MODIFY `estadoAnterior` ENUM('RECIBIDO', 'EN_EVALUACION', 'EN_EJECUCION', 'FINALIZADO', 'COMPLETADO') NULL,
    MODIFY `estadoNuevo` ENUM('RECIBIDO', 'EN_EVALUACION', 'EN_EJECUCION', 'FINALIZADO', 'COMPLETADO') NULL;
