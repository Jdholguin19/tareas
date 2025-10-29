-- =====================================================
-- MODIFICACIONES A LA BASE DE DATOS
-- Implementación de tabla tipos_tareas y modificación de tabla tareas
-- =====================================================

USE `portalao_ReunionesCS`;

-- =====================================================
-- 1. CREAR TABLA tipos_tareas
-- =====================================================

DROP TABLE IF EXISTS `tipos_tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color hexadecimal para la UI',
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del icono para la UI',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_activo` (`activo`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para clasificar los diferentes tipos de tareas';
/*!40101 SET character_set_client = @saved_cs_client */;

-- =====================================================
-- 2. INSERTAR DATOS INICIALES EN tipos_tareas
-- =====================================================

INSERT INTO `tipos_tareas` (`nombre`, `descripcion`, `color`, `icono`, `activo`) VALUES
('tareas', 'Tareas generales del sistema', '#3498db', 'task', 1),
('obras', 'Tareas relacionadas con obras y construcción', '#e67e22', 'construction', 1),
('notas', 'Notas y recordatorios', '#f39c12', 'note', 1);

-- =====================================================
-- 3. MODIFICAR TABLA tareas - AGREGAR COLUMNA tipos_tareas_id
-- =====================================================

-- Agregar la nueva columna tipos_tareas_id
ALTER TABLE `tareas` 
ADD COLUMN `tipos_tareas_id` int(11) DEFAULT NULL COMMENT 'Referencia al tipo de tarea' 
AFTER `tarea_padre_id`;

-- =====================================================
-- 4. CREAR FOREIGN KEY CONSTRAINT
-- =====================================================

-- Agregar la foreign key constraint
ALTER TABLE `tareas` 
ADD CONSTRAINT `tareas_ibfk_6` 
FOREIGN KEY (`tipos_tareas_id`) REFERENCES `tipos_tareas` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- =====================================================
-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Crear índice para la nueva columna
ALTER TABLE `tareas` 
ADD INDEX `idx_tipos_tareas_id` (`tipos_tareas_id`);

-- Crear índice compuesto para consultas frecuentes
ALTER TABLE `tareas` 
ADD INDEX `idx_tipo_estado` (`tipos_tareas_id`, `estado`);

-- =====================================================
-- 6. ACTUALIZAR DATOS EXISTENTES (OPCIONAL)
-- =====================================================

-- Asignar tipo 'tareas' por defecto a todas las tareas existentes
-- Esto es opcional, puedes comentar esta línea si prefieres mantener NULL
UPDATE `tareas` 
SET `tipos_tareas_id` = (SELECT id FROM `tipos_tareas` WHERE nombre = 'tareas') 
WHERE `tipos_tareas_id` IS NULL;

-- =====================================================
-- 7. VERIFICACIÓN DE LA IMPLEMENTACIÓN
-- =====================================================

-- Consulta para verificar la estructura de la tabla tipos_tareas
-- SELECT * FROM tipos_tareas;

-- Consulta para verificar que la columna se agregó correctamente
-- DESCRIBE tareas;

-- Consulta para verificar las foreign keys
-- SELECT 
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_SCHEMA = 'portalao_ReunionesCS'
--   AND TABLE_NAME = 'tareas'
--   AND COLUMN_NAME = 'tipos_tareas_id';

-- =====================================================
-- 8. CREAR TABLA tipos_proyectos
-- =====================================================

DROP TABLE IF EXISTS `tipos_proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_proyectos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color hexadecimal para la UI',
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del icono para la UI',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_activo` (`activo`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para clasificar los diferentes tipos de proyectos';
/*!40101 SET character_set_client = @saved_cs_client */;

-- =====================================================
-- 9. INSERTAR DATOS INICIALES EN tipos_proyectos
-- =====================================================

INSERT INTO `tipos_proyectos` (`nombre`, `descripcion`, `color`, `icono`, `activo`) VALUES
('desarrollo', 'Proyectos de desarrollo de software', '#3498db', 'code', 1),
('construccion', 'Proyectos de construcción y obras', '#e67e22', 'construction', 1),
('marketing', 'Proyectos de marketing y publicidad', '#9b59b6', 'megaphone', 1),
('investigacion', 'Proyectos de investigación y desarrollo', '#2ecc71', 'search', 1),
('mantenimiento', 'Proyectos de mantenimiento y soporte', '#f39c12', 'wrench', 1);

-- =====================================================
-- 10. MODIFICAR TABLA proyectos - AGREGAR COLUMNA tipos_proyectos_id
-- =====================================================

-- Agregar la nueva columna tipos_proyectos_id
ALTER TABLE `proyectos` 
ADD COLUMN `tipos_proyectos_id` int(11) DEFAULT NULL COMMENT 'Referencia al tipo de proyecto' 
AFTER `descripcion`;

-- =====================================================
-- 11. CREAR FOREIGN KEY CONSTRAINT PARA PROYECTOS
-- =====================================================

-- Agregar la foreign key constraint
ALTER TABLE `proyectos` 
ADD CONSTRAINT `proyectos_ibfk_2` 
FOREIGN KEY (`tipos_proyectos_id`) REFERENCES `tipos_proyectos` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- =====================================================
-- 12. CREAR ÍNDICES PARA PROYECTOS
-- =====================================================

-- Crear índice para la nueva columna
ALTER TABLE `proyectos` 
ADD INDEX `idx_tipos_proyectos_id` (`tipos_proyectos_id`);

-- Crear índice compuesto para consultas frecuentes
ALTER TABLE `proyectos` 
ADD INDEX `idx_tipo_estado` (`tipos_proyectos_id`, `estado`);

-- =====================================================
-- 13. AGREGAR COLUMNA nivel_esquema A TABLA tareas
-- =====================================================

-- Agregar la nueva columna nivel_esquema
ALTER TABLE `tareas` 
ADD COLUMN `nivel_esquema` int(11) DEFAULT 1 COMMENT 'Nivel jerárquico en el esquema de tareas (1=principal, 2=subtarea, etc.)' 
AFTER `tipos_tareas_id`;

-- Crear índice para la nueva columna nivel_esquema
ALTER TABLE `tareas` 
ADD INDEX `idx_nivel_esquema` (`nivel_esquema`);

-- Crear índice compuesto para consultas de jerarquía
ALTER TABLE `tareas` 
ADD INDEX `idx_padre_nivel` (`tarea_padre_id`, `nivel_esquema`);

-- =====================================================
-- 14. ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Asignar tipo 'desarrollo' por defecto a todos los proyectos existentes
UPDATE `proyectos` 
SET `tipos_proyectos_id` = (SELECT id FROM `tipos_proyectos` WHERE nombre = 'desarrollo') 
WHERE `tipos_proyectos_id` IS NULL;

-- Actualizar nivel_esquema basado en la jerarquía existente
-- Tareas principales (sin padre) = nivel 1
UPDATE `tareas` 
SET `nivel_esquema` = 1 
WHERE `tarea_padre_id` IS NULL AND `nivel_esquema` IS NULL;

-- Subtareas (con padre) = nivel 2
UPDATE `tareas` 
SET `nivel_esquema` = 2 
WHERE `tarea_padre_id` IS NOT NULL AND `nivel_esquema` IS NULL;

-- =====================================================
-- 15. CONSULTAS DE VERIFICACIÓN ADICIONALES
-- =====================================================

-- Verificar la estructura de la tabla tipos_proyectos
-- SELECT * FROM tipos_proyectos;

-- Verificar que las columnas se agregaron correctamente
-- DESCRIBE proyectos;
-- DESCRIBE tareas;

-- Verificar las foreign keys de proyectos
-- SELECT 
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_SCHEMA = 'portalao_ReunionesCS'
--   AND TABLE_NAME = 'proyectos'
--   AND COLUMN_NAME = 'tipos_proyectos_id';

-- Verificar la jerarquía de tareas por nivel
-- SELECT 
--     nivel_esquema,
--     COUNT(*) as cantidad_tareas,
--     AVG(progreso) as progreso_promedio
-- FROM tareas 
-- GROUP BY nivel_esquema 
-- ORDER BY nivel_esquema;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Las columnas tipos_tareas_id y tipos_proyectos_id permiten NULL para mantener compatibilidad
-- 2. Se incluye ON DELETE SET NULL para evitar errores si se elimina un tipo
-- 3. Se agregaron índices para optimizar las consultas
-- 4. Los datos iniciales incluyen tipos variados para tareas y proyectos
-- 5. Se incluyen campos adicionales (color, icono) para futuras mejoras en la UI
-- 6. La columna nivel_esquema facilita la gestión jerárquica de tareas
-- 7. Se actualizan automáticamente los datos existentes con valores por defecto
-- 8. Los índices compuestos optimizan consultas frecuentes por tipo y estado
-- =====================================================