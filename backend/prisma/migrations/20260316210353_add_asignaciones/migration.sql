/*
  Warnings:

  - A unique constraint covering the columns `[reporteId,tecnicoId]` on the table `Asignacion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `EstadoReporte` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Asignacion_reporteId_tecnicoId_key` ON `Asignacion`(`reporteId`, `tecnicoId`);

-- CreateIndex
CREATE UNIQUE INDEX `EstadoReporte_nombre_key` ON `EstadoReporte`(`nombre`);
