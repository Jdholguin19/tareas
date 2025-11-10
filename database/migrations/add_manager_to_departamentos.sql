-- ============================================
-- Migración: Agregar manager_id a departamentos
-- Fecha: 2025-11-07
-- Descripción: Agregar campo manager_id a la tabla departamentos 
--              e insertar departamentos iniciales
-- ============================================

USE `portalao_ReunionesCS`;

-- Paso 1: Agregar columna manager_id a la tabla departamentos
ALTER TABLE `departamentos` 
ADD COLUMN `manager_id` INT(11) DEFAULT NULL COMMENT 'ID del manager/jefe del departamento' AFTER `nombre`;

-- Paso 2: Crear clave foránea para manager_id
ALTER TABLE `departamentos`
ADD CONSTRAINT `fk_departamentos_manager` 
FOREIGN KEY (`manager_id`) REFERENCES `usuarios` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Paso 3: Crear índices para mejorar rendimiento
ALTER TABLE `departamentos`
ADD INDEX `idx_manager_id` (`manager_id`);

-- Paso 4: Insertar departamentos iniciales (sin manager por ahora)
INSERT INTO `departamentos` (`nombre`, `manager_id`) VALUES
('MK', NULL),
('SAC', NULL),
('Sistemas y Dev', NULL)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Verificación de la estructura
SELECT 'Estructura actualizada correctamente' AS mensaje;
DESCRIBE `departamentos`;

-- Verificación de los datos insertados
SELECT * FROM `departamentos`;
