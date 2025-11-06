-- Cambiar el valor por defecto de importancia a 'baja'
ALTER TABLE `tareas` 
MODIFY COLUMN `importancia` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
COMMENT 'Importancia de la tarea para Matriz de Eisenhower';

-- Cambiar el valor por defecto de prioridad a 'baja' si no lo está ya
ALTER TABLE `tareas` 
MODIFY COLUMN `prioridad` ENUM('baja', 'media', 'alta') DEFAULT 'baja' 
COMMENT 'Prioridad de la tarea';
