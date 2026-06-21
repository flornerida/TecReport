/*
  Warnings:

  - You are about to drop the `Area` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Asignacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comentario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Entidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evidencia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Incidencia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Seguimiento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Asignacion` DROP FOREIGN KEY `Asignacion_incidenciaId_fkey`;

-- DropForeignKey
ALTER TABLE `Asignacion` DROP FOREIGN KEY `Asignacion_tecnicoId_fkey`;

-- DropForeignKey
ALTER TABLE `Comentario` DROP FOREIGN KEY `Comentario_incidenciaId_fkey`;

-- DropForeignKey
ALTER TABLE `Comentario` DROP FOREIGN KEY `Comentario_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Evidencia` DROP FOREIGN KEY `Evidencia_incidenciaId_fkey`;

-- DropForeignKey
ALTER TABLE `Evidencia` DROP FOREIGN KEY `Evidencia_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Incidencia` DROP FOREIGN KEY `Incidencia_areaId_fkey`;

-- DropForeignKey
ALTER TABLE `Incidencia` DROP FOREIGN KEY `Incidencia_entidadId_fkey`;

-- DropForeignKey
ALTER TABLE `Incidencia` DROP FOREIGN KEY `Incidencia_tecnicoAsignadoId_fkey`;

-- DropForeignKey
ALTER TABLE `Incidencia` DROP FOREIGN KEY `Incidencia_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Notificacion` DROP FOREIGN KEY `Notificacion_incidenciaId_fkey`;

-- DropForeignKey
ALTER TABLE `Notificacion` DROP FOREIGN KEY `Notificacion_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Seguimiento` DROP FOREIGN KEY `Seguimiento_incidenciaId_fkey`;

-- DropForeignKey
ALTER TABLE `Seguimiento` DROP FOREIGN KEY `Seguimiento_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `Usuario_areaId_fkey`;

-- DropTable
DROP TABLE `Area`;

-- DropTable
DROP TABLE `Asignacion`;

-- DropTable
DROP TABLE `Comentario`;

-- DropTable
DROP TABLE `Entidad`;

-- DropTable
DROP TABLE `Evidencia`;

-- DropTable
DROP TABLE `Incidencia`;

-- DropTable
DROP TABLE `Notificacion`;

-- DropTable
DROP TABLE `Seguimiento`;

-- DropTable
DROP TABLE `Usuario`;

-- CreateTable
CREATE TABLE `area` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `rol` VARCHAR(191) NOT NULL DEFAULT 'USUARIO',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `areaId` VARCHAR(191) NULL,

    UNIQUE INDEX `usuario_correo_key`(`correo`),
    INDEX `usuario_areaId_fkey`(`areaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entidad` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidencia` (
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

    INDEX `incidencia_areaId_fkey`(`areaId`),
    INDEX `incidencia_entidadId_fkey`(`entidadId`),
    INDEX `incidencia_tecnicoAsignadoId_fkey`(`tecnicoAsignadoId`),
    INDEX `incidencia_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidencia` (
    `id` VARCHAR(191) NOT NULL,
    `incidenciaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PROBLEMA', 'SOLUCION') NOT NULL DEFAULT 'PROBLEMA',
    `urlFoto` LONGTEXT NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fechaSubida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evidencia_incidenciaId_fkey`(`incidenciaId`),
    INDEX `evidencia_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comentario` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `fechaComentario` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contenido` VARCHAR(191) NOT NULL,
    `incidenciaId` VARCHAR(191) NOT NULL,

    INDEX `comentario_incidenciaId_fkey`(`incidenciaId`),
    INDEX `comentario_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacion` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `fechaEnvio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `incidenciaId` VARCHAR(191) NULL,

    INDEX `notificacion_incidenciaId_fkey`(`incidenciaId`),
    INDEX `notificacion_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seguimiento` (
    `id` VARCHAR(191) NOT NULL,
    `incidenciaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `estadoAnterior` ENUM('REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO') NULL,
    `estadoNuevo` ENUM('REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO') NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `seguimiento_incidenciaId_fkey`(`incidenciaId`),
    INDEX `seguimiento_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignacion` (
    `id` VARCHAR(191) NOT NULL,
    `tecnicoId` VARCHAR(191) NOT NULL,
    `fechaAsignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `incidenciaId` VARCHAR(191) NOT NULL,

    INDEX `asignacion_tecnicoId_fkey`(`tecnicoId`),
    UNIQUE INDEX `asignacion_incidenciaId_tecnicoId_key`(`incidenciaId`, `tecnicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidencia` ADD CONSTRAINT `incidencia_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidencia` ADD CONSTRAINT `incidencia_entidadId_fkey` FOREIGN KEY (`entidadId`) REFERENCES `entidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidencia` ADD CONSTRAINT `incidencia_tecnicoAsignadoId_fkey` FOREIGN KEY (`tecnicoAsignadoId`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidencia` ADD CONSTRAINT `incidencia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia` ADD CONSTRAINT `evidencia_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia` ADD CONSTRAINT `evidencia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario` ADD CONSTRAINT `comentario_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario` ADD CONSTRAINT `comentario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `notificacion_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `incidencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `notificacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimiento` ADD CONSTRAINT `seguimiento_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimiento` ADD CONSTRAINT `seguimiento_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignacion` ADD CONSTRAINT `asignacion_incidenciaId_fkey` FOREIGN KEY (`incidenciaId`) REFERENCES `incidencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignacion` ADD CONSTRAINT `asignacion_tecnicoId_fkey` FOREIGN KEY (`tecnicoId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
