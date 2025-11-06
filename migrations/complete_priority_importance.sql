-- ============================================
-- MIGRACIÓN COMPLETA: Prioridad e Importancia
-- ============================================

-- 1. Cambiar valores por defecto a 'baja'
ALTER TABLE `tareas` 
MODIFY COLUMN `prioridad` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
COMMENT 'Prioridad de la tarea (urgencia)';

ALTER TABLE `tareas` 
MODIFY COLUMN `importancia` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
COMMENT 'Importancia de la tarea para Matriz de Eisenhower (impacto)';

-- 2. Actualizar tareas existentes sin valores
UPDATE `tareas` 
SET `prioridad` = 'baja' 
WHERE `prioridad` IS NULL;

UPDATE `tareas` 
SET `importancia` = 'baja' 
WHERE `importancia` IS NULL;
