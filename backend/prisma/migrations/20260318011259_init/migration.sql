/*
  Warnings:

  - You are about to drop the column `reporteId` on the `Asignacion` table. All the data in the column will be lost.
  - You are about to drop the column `comentario` on the `Comentario` table. All the data in the column will be lost.
  - You are about to drop the column `reporteId` on the `Comentario` table. All the data in the column will be lost.
  - You are about to drop the column `reporteId` on the `Notificacion` table. All the data in the column will be lost.
  - You are about to drop the `EstadoReporte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FotoReporte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HistorialEstado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NivelGravedad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reporte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TipoProblema` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ubicacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[incidenciaId,tecnicoId]` on the table `Asignacion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `incidenciaId` to the `Asignacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contenido` to the `Comentario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incidenciaId` to the `Comentario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Asignacion` DROP FOREIGN KEY `Asignacion_reporteId_fkey`;

-- DropForeignKey
ALTER TABLE `Asignacion` DROP FOREIGN KEY `Asignacion_tecnicoId_fkey`;

-- DropForeignKey
ALTER TABLE `Comentario` DROP FOREIGN KEY `Comentario_reporteId_fkey`;

-- DropForeignKey
ALTER TABLE `Comentario` DROP FOREIGN KEY `Comentario_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `FotoReporte` DROP FOREIGN KEY `FotoReporte_reporteId_fkey`;

-- DropForeignKey
ALTER TABLE `HistorialEstado` DROP FOREIGN KEY `HistorialEstado_reporteId_fkey`;

-- DropForeignKey
ALTER TABLE `Notificacion` DROP FOREIGN KEY `Notificacion_reporteId_fkey`;

-- DropForeignKey
ALTER TABLE `Notificacion` DROP FOREIGN KEY `Notificacion_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_areaId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_entidadId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_estadoId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_gravedadId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_tipoProblemaId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_ubicacionId_fkey`;

-- DropForeignKey
ALTER TABLE `Reporte` DROP FOREIGN KEY `Reporte_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_areaId_fkey`;

-- DropIndex
DROP INDEX `Asignacion_reporteId_tecnicoId_key` ON `Asignacion`;

-- DropIndex
DROP INDEX `Asignacion_tecnicoId_fkey` ON `Asignacion`;

-- DropIndex
DROP INDEX `Comentario_reporteId_fkey` ON `Comentario`;

-- DropIndex
DROP INDEX `Comentario_usuarioId_fkey` ON `Comentario`;

-- DropIndex
DROP INDEX `Notificacion_reporteId_fkey` ON `Notificacion`;

-- DropIndex
DROP INDEX `Notificacion_usuarioId_fkey` ON `Notificacion`;

-- AlterTable
ALTER TABLE `Asignacion` DROP COLUMN `reporteId`,
    ADD COLUMN `incidenciaId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Comentario` DROP COLUMN `comentario`,
    DROP COLUMN `reporteId`,
    ADD COLUMN `contenido` VARCHAR(191) NOT NULL,
    ADD COLUMN `incidenciaId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Notificacion` DROP COLUMN `reporteId`,
    ADD COLUMN `incidenciaId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `EstadoReporte`;

-- DropTable
DROP TABLE `FotoReporte`;

-- DropTable
DROP TABLE `HistorialEstado`;

-- DropTable
DROP TABLE `NivelGravedad`;

-- DropTable
DROP TABLE `Reporte`;

-- DropTable
DROP TABLE `TipoProblema`;

-- DropTable
DROP TABLE `Ubicacion`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `rol` ENUM('ADMIN', 'TECNICO', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `areaId` VARCHAR(191) NULL,

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incidencia` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaResolucion` DATETIME(3) NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tecnicoAsignadoId` VARCHAR(191) NULL,
    `categoria` ENUM('HARDWARE', 'SOFTWARE', 'RED', 'OTRO') NOT NULL DEFAULT 'OTRO',
    `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA',
    `estado` ENUM('REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO') NOT NULL DEFAULT 'REPORTADO',
    `ubicacion` VARCHAR(191) NULL,
    `equipo` VARCHAR(191) NULL,
    `entidadId` VARCHAR(191) NULL,
    `areaId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evidencia` (
    `id` VARCHAR(191) NOT NULL,
    `incidenciaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PROBLEMA', 'SOLUCION') NOT NULL DEFAULT 'PROBLEMA',
    `urlFoto` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fechaSubida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seguimiento` (
    `id` VARCHAR(191) NOT NULL,
    `incidenciaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `estadoAnterior` ENUM('REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO') NULL,
    `estadoNuevo` ENUM('REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO') NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Asignacion_incidenciaId_tecnicoId_key` ON `Asignacion`(`incidenciaId`, `tecnicoId`);

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_tecnicoAsignadoId_fkey` FOREIGN KEY (`tecnicoAsignadoId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_entidadId_fkey` FOREIGN KEY (`entidadId`) REFERENCES `Entidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evidencia` ADD CONSTRAINT `Evidencia_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `Incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evidencia` ADD CONSTRAINT `Evidencia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `Incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `Incidencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `Incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asignacion` ADD CONSTRAINT `Asignacion_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `Incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asignacion` ADD CONSTRAINT `Asignacion_tecnicoId_fkey` FOREIGN KEY (`tecnicoId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
