-- Agregar campo importancia a la tabla tareas
ALTER TABLE `tareas` 
ADD COLUMN `importancia` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
AFTER `prioridad`;

-- Índice para mejorar consultas por importancia
ALTER TABLE `tareas` 
ADD INDEX `idx_importancia` (`importancia`);

-- Índice compuesto para consultas de Matriz de Eisenhower
ALTER TABLE `tareas` 
ADD INDEX `idx_eisenhower` (`importancia`, `prioridad`, `estado`);

-- Comentario descriptivo
ALTER TABLE `tareas` 
MODIFY COLUMN `importancia` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
COMMENT 'Importancia de la tarea para Matriz de Eisenhower';

-- Script para migrar datos existentes (opcional)
-- Puedes copiar el valor de prioridad a importancia si deseas
-- UPDATE `tareas` SET `importancia` = `prioridad` WHERE `importancia` IS NULL;
