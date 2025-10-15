-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-10-2025 a las 00:24:52
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `portalao_toolscs`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `archivos_adjuntos`
--

CREATE TABLE `archivos_adjuntos` (
  `id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_url` varchar(500) NOT NULL,
  `tipo_mime` varchar(50) DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `etiquetas`
--

CREATE TABLE `etiquetas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proyectos`
--

CREATE TABLE `proyectos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `estado` enum('activo','en_espera','finalizado') DEFAULT 'activo',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proyectos`
--

INSERT INTO `proyectos` (`id`, `nombre`, `descripcion`, `manager_id`, `estado`, `fecha_inicio`, `fecha_vencimiento`) VALUES
(1, 'General', 'Proyecto por defecto', NULL, 'activo', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas`
--

CREATE TABLE `tareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `proyecto_id` int(11) DEFAULT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `asignado_a` int(11) DEFAULT NULL,
  `creado_por` int(11) NOT NULL,
  `tarea_padre_id` int(11) DEFAULT NULL,
  `estado` enum('pendiente','en_progreso','en_revision','completada','cancelada') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','critica') DEFAULT 'media',
  `progreso` decimal(5,2) DEFAULT 0.00,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `tiempo_estimado` int(11) DEFAULT NULL,
  `tiempo_real` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `adjuntos_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tareas`
--

INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `proyecto_id`, `departamento_id`, `asignado_a`, `creado_por`, `tarea_padre_id`, `estado`, `prioridad`, `progreso`, `fecha_inicio`, `fecha_vencimiento`, `fecha_completada`, `tiempo_estimado`, `tiempo_real`, `fecha_creacion`, `fecha_actualizacion`, `adjuntos_url`) VALUES
(12, 'Tareas', NULL, NULL, NULL, NULL, 1, NULL, 'pendiente', 'media', NULL, NULL, '2025-10-31', NULL, NULL, NULL, '2025-10-14 20:44:37', '2025-10-14 21:47:22', '[]'),
(13, 'Mejoras de IA', NULL, NULL, NULL, NULL, 1, 12, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:46:08', '2025-10-14 21:03:12', '[]'),
(14, 'Agregar filtro', NULL, NULL, NULL, NULL, 1, 12, 'pendiente', 'media', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:47:00', '2025-10-14 20:58:38', '[]'),
(15, 'Filtrar por tareas de hoy o que tengo por hacer y tareas sin fechas', NULL, NULL, NULL, NULL, 1, 14, 'completada', 'media', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:47:28', '2025-10-14 22:07:30', '[]'),
(16, 'Filtrar aparte tareas vencidas', NULL, NULL, NULL, NULL, 1, 14, 'completada', 'media', 100.00, NULL, '2025-10-14', NULL, NULL, NULL, '2025-10-14 20:47:49', '2025-10-14 22:04:02', '[]'),
(17, 'Progeso', NULL, NULL, NULL, NULL, 1, 12, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:51:23', '2025-10-14 20:51:23', '[]'),
(18, 'El progreso poderle escribir porcentaje manulmente', NULL, NULL, NULL, NULL, 1, 17, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:51:49', '2025-10-14 20:51:49', '[]'),
(19, 'Agregar notificaciones de las tareas vencidas', NULL, NULL, NULL, NULL, 1, 14, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 20:58:02', '2025-10-14 20:58:37', '[]'),
(20, 'Arreglar el progreso calcula mal', NULL, NULL, NULL, NULL, 1, 17, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:01:06', '2025-10-14 21:01:06', '[]'),
(21, 'Mejorar la transcripcion para que entienda el contexto de la tarea y no transcribir informacion innecesaria', NULL, NULL, NULL, NULL, 1, 13, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:03:09', '2025-10-14 21:03:09', '[]'),
(22, 'Tareas', NULL, NULL, NULL, NULL, 1, 12, 'pendiente', 'media', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:06:30', '2025-10-14 21:27:08', '[]'),
(23, 'El progreso desde la vista principal poderlo cambiar el porcentaje moviendolo tipo progress drag', NULL, NULL, NULL, NULL, 1, 17, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:15:44', '2025-10-14 21:15:44', '[]'),
(24, 'Para el filtro de todas la tareas agregar un acordeón para cada tarea padre y subtarea por defecto aparece escondido', NULL, NULL, NULL, NULL, 1, 22, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:18:11', '2025-10-14 21:18:11', '[]'),
(25, 'Funciones', NULL, NULL, NULL, NULL, 1, 12, 'pendiente', 'media', NULL, NULL, '2025-11-09', NULL, NULL, NULL, '2025-10-14 21:24:59', '2025-10-14 22:03:47', '[]'),
(26, 'Adaptar el editar tarea para que se pueda asignar a mas de una persona esa tarea ( por defecto viene asignado al que la creo ya esta el campo en la base de datos)', NULL, NULL, NULL, NULL, 1, 25, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:26:11', '2025-10-14 21:26:11', '[]'),
(27, 'Crear tipos de tareas ( tarea, rubro, dpe), usan la misma estructura solo que para diferentes fines ', NULL, NULL, NULL, NULL, 1, 22, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:27:04', '2025-10-14 21:27:04', '[]'),
(28, 'Solo puedes ver tus mismas tareas y las tareas a las que te asignaron', NULL, NULL, NULL, NULL, 1, 25, 'pendiente', 'media', 0.00, NULL, '2025-10-13', NULL, NULL, NULL, '2025-10-14 21:28:12', '2025-10-14 22:03:47', '[]'),
(29, 'Al crear la tarea aparte de guardar la fecha en fecha_creacion tambien la guarde en fecha_inicio', NULL, NULL, NULL, NULL, 1, 22, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:36:29', '2025-10-14 21:36:29', '[]'),
(30, 'Agregar: Al Editar Tarea Modifica los detalles de tu tarea, agregar que aparescar la fecha_inicio y se pueda modificar ', NULL, NULL, NULL, NULL, 1, 29, 'pendiente', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 21:37:25', '2025-10-14 21:37:25', '[]');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas_etiquetas`
--

CREATE TABLE `tareas_etiquetas` (
  `tarea_id` int(11) NOT NULL,
  `etiqueta_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `estado` enum('activo','inactivo','suspendido') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ultimo_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `departamento_id`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `ultimo_login`) VALUES
(1, 'admin', 'admin@example.com', '$2y$10$examplehashedpassword', NULL, 'activo', '2025-10-14 18:05:49', '2025-10-14 18:05:49', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `archivos_adjuntos`
--
ALTER TABLE `archivos_adjuntos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarea_id` (`tarea_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarea_id` (`tarea_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proyecto_id` (`proyecto_id`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `asignado_a` (`asignado_a`),
  ADD KEY `creado_por` (`creado_por`),
  ADD KEY `tarea_padre_id` (`tarea_padre_id`);

--
-- Indices de la tabla `tareas_etiquetas`
--
ALTER TABLE `tareas_etiquetas`
  ADD PRIMARY KEY (`tarea_id`,`etiqueta_id`),
  ADD KEY `etiqueta_id` (`etiqueta_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `departamento_id` (`departamento_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `archivos_adjuntos`
--
ALTER TABLE `archivos_adjuntos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `archivos_adjuntos`
--
ALTER TABLE `archivos_adjuntos`
  ADD CONSTRAINT `archivos_adjuntos_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `archivos_adjuntos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_4` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `tareas_ibfk_5` FOREIGN KEY (`tarea_padre_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tareas_etiquetas`
--
ALTER TABLE `tareas_etiquetas`
  ADD CONSTRAINT `tareas_etiquetas_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_etiquetas_ibfk_2` FOREIGN KEY (`etiqueta_id`) REFERENCES `etiquetas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
