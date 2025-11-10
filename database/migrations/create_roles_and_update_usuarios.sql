-- ============================================
-- Migración: Crear tabla roles y actualizar usuarios
-- Fecha: 2025-11-07
-- Descripción: Crear tabla de roles (usuario, admin) y agregar rol_id a usuarios
-- ============================================

USE `portalao_ReunionesCS`;

-- Paso 1: Crear tabla de roles
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permisos` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON con permisos específicos del rol',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_activo` (`activo`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de roles de usuario';

-- Paso 2: Insertar roles iniciales
INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `permisos`, `activo`) VALUES
(1, 'usuario', 'Usuario estándar con permisos básicos', '{"ver_tareas": true, "crear_tareas": true, "editar_propias": true}', 1),
(2, 'admin', 'Administrador con acceso completo al sistema', '{"ver_tareas": true, "crear_tareas": true, "editar_todas": true, "gestionar_usuarios": true, "gestionar_departamentos": true, "gestionar_proyectos": true}', 1);

-- Paso 3: Agregar columna rol_id a la tabla usuarios
ALTER TABLE `usuarios` 
ADD COLUMN `rol_id` INT(11) DEFAULT 1 COMMENT 'ID del rol del usuario (1=usuario, 2=admin)' AFTER `departamento_id`;

-- Paso 4: Crear clave foránea para rol_id
ALTER TABLE `usuarios`
ADD CONSTRAINT `fk_usuarios_rol` 
FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Paso 5: Crear índices para mejorar rendimiento
ALTER TABLE `usuarios`
ADD INDEX `idx_rol_id` (`rol_id`),
ADD INDEX `idx_rol_estado` (`rol_id`, `estado`);

-- Paso 6: Actualizar usuarios existentes (todos como usuarios normales por defecto)
UPDATE `usuarios` SET `rol_id` = 1 WHERE `rol_id` IS NULL;

-- Verificación de la estructura
SELECT 'Tabla roles creada y usuarios actualizados correctamente' AS mensaje;
DESCRIBE `roles`;
DESCRIBE `usuarios`;

-- Verificación de los datos insertados
SELECT * FROM `roles`;
SELECT id, username, email, rol_id FROM `usuarios` LIMIT 5;
