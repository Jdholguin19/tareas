-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-12-2025 a las 16:56:05
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
-- Base de datos: `portalao_reunionescs`
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
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `author_type` enum('user','agent') DEFAULT 'user' COMMENT 'Tipo de autor del comentario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `manager_id` int(11) DEFAULT NULL COMMENT 'ID del manager/jefe del departamento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamentos`
--

INSERT INTO `departamentos` (`id`, `nombre`, `manager_id`) VALUES
(1, 'MK', NULL),
(2, 'SAC', NULL),
(3, 'Sistemas y Dev', 9),
(5, 'Diseño', NULL),
(6, 'Presupuetos', NULL),
(7, 'Proyectos', NULL),
(8, 'Obra', NULL),
(9, 'CiPS', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dependencias_tareas`
--

CREATE TABLE `dependencias_tareas` (
  `id` int(11) NOT NULL,
  `tarea_predecesora_id` int(11) NOT NULL COMMENT 'Tarea que debe completarse primero',
  `tarea_sucesora_id` int(11) NOT NULL COMMENT 'Tarea que depende de la anterior',
  `tipo_dependencia` enum('FS','SS','FF','SF') NOT NULL DEFAULT 'FS' COMMENT 'FS=Finish-Start, SS=Start-Start, FF=Finish-Finish, SF=Start-Finish',
  `retraso_dias` int(11) DEFAULT 0 COMMENT 'Días de retraso opcional entre tareas',
  `descripcion` varchar(255) DEFAULT NULL COMMENT 'Descripción opcional de la dependencia',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para manejar dependencias entre tareas en vista Gantt';

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
  `tipos_proyectos_id` int(11) DEFAULT NULL COMMENT 'Referencia al tipo de proyecto',
  `manager_id` int(11) DEFAULT NULL,
  `estado` enum('activo','en_espera','finalizado') DEFAULT 'activo',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proyectos`
--

INSERT INTO `proyectos` (`id`, `nombre`, `descripcion`, `tipos_proyectos_id`, `manager_id`, `estado`, `fecha_inicio`, `fecha_vencimiento`) VALUES
(1, 'General', 'Proyecto por defecto', NULL, NULL, 'activo', NULL, NULL),
(2, 'prueba', NULL, NULL, NULL, 'activo', NULL, NULL),
(3, 'proyecto', NULL, NULL, NULL, 'activo', NULL, NULL),
(4, 'fulanito', NULL, NULL, NULL, 'activo', NULL, NULL),
(5, 'prueba22', NULL, NULL, NULL, 'activo', NULL, NULL),
(6, 'Academics', NULL, NULL, 9, 'activo', NULL, NULL),
(7, 'Planics', NULL, NULL, NULL, 'activo', NULL, NULL),
(8, 'Proyecto Guillermo', NULL, NULL, NULL, 'activo', NULL, NULL),
(9, 'appcostasol', NULL, NULL, 2, 'activo', NULL, NULL),
(10, 'KissFlow', NULL, NULL, NULL, 'activo', NULL, NULL),
(11, 'prueba23', NULL, NULL, 12, 'activo', NULL, NULL),
(12, 'Marketing', NULL, NULL, 14, 'activo', NULL, NULL),
(13, 'PruebaProyecto', NULL, NULL, 12, 'activo', NULL, NULL),
(14, 'prueba2proyecto', NULL, NULL, 12, 'activo', NULL, NULL),
(15, 'prueba 2 proyecto', NULL, NULL, 12, 'activo', NULL, NULL),
(16, 'KissFloq', NULL, NULL, 9, 'activo', NULL, NULL),
(17, 'KF-Hoja de Ruta en Fofis', NULL, NULL, 9, 'activo', NULL, NULL),
(18, 'Meetings', NULL, NULL, 2, 'activo', NULL, NULL),
(20, 'Metrics', NULL, NULL, 2, 'activo', NULL, NULL),
(21, 'AgenteCS', NULL, NULL, 2, 'activo', NULL, NULL),
(22, 'Tareas', NULL, NULL, 19, 'activo', NULL, NULL),
(23, 'Personales', NULL, NULL, 19, 'activo', NULL, NULL),
(24, 'RAP', NULL, NULL, 19, 'activo', NULL, NULL),
(25, 'Metrica', NULL, NULL, 16, 'activo', NULL, NULL),
(26, 'MetricaCS', NULL, NULL, 16, 'activo', NULL, NULL),
(27, 'DAVOS', NULL, NULL, 19, 'activo', NULL, NULL),
(28, 'CATANIA', NULL, NULL, 19, 'activo', NULL, NULL),
(29, 'Palanca 1.1', NULL, NULL, 9, 'activo', NULL, NULL),
(30, 'Palancas', NULL, NULL, 9, 'activo', NULL, NULL),
(31, 'Compromisos RAP', NULL, NULL, 9, 'activo', NULL, NULL),
(32, 'Vía Principal', NULL, NULL, 19, 'activo', NULL, NULL),
(33, 'PENDIENTES', NULL, NULL, 22, 'activo', NULL, NULL),
(34, 'Comprimos RAP Semanal', NULL, NULL, 17, 'activo', NULL, NULL),
(35, 'Compromisos Ventaja Ganadora', NULL, NULL, 17, 'activo', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `permisos` text DEFAULT NULL COMMENT 'JSON con permisos específicos del rol',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de roles de usuario';

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `permisos`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'usuario', 'Usuario estándar con permisos básicos', '{\"ver_tareas\": true, \"crear_tareas\": true, \"editar_propias\": true}', 1, '2025-11-07 21:36:43', '2025-11-07 21:36:43'),
(2, 'admin', 'Administrador con acceso completo al sistema', '{\"ver_tareas\": true, \"crear_tareas\": true, \"editar_todas\": true, \"gestionar_usuarios\": true, \"gestionar_departamentos\": true, \"gestionar_proyectos\": true}', 1, '2025-11-07 21:36:43', '2025-11-07 21:36:43');

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
  `tipos_tareas_id` int(11) DEFAULT NULL COMMENT 'Referencia al tipo de tarea',
  `nivel_esquema` int(11) DEFAULT 1 COMMENT 'Nivel jerárquico en el esquema de tareas enfocado para rubros o bitacoras',
  `estado` enum('pendiente','en_progreso','en_espera','completada','cancelada') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','critica') DEFAULT 'baja',
  `importancia` enum('baja','media','alta') DEFAULT 'baja' COMMENT 'Importancia de la tarea para Matriz de Eisenhower (impacto)',
  `progreso` decimal(5,2) DEFAULT 0.00,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `fecha_completada` datetime DEFAULT current_timestamp(),
  `tiempo_estimado` int(11) DEFAULT NULL,
  `tiempo_real` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `adjuntos_url` varchar(500) DEFAULT NULL,
  `asignados` text DEFAULT NULL,
  `ai_level` tinyint(4) DEFAULT NULL COMMENT 'Nivel AI: 0=Baja, 1=Media, 2=Alta, 3=Crítica',
  `division` enum('TI','Desarrollo') DEFAULT NULL COMMENT 'División asignada según clasificación AI',
  `is_ticket` tinyint(1) DEFAULT 0 COMMENT 'Indica si es un ticket de soporte'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tareas`
--

INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `proyecto_id`, `departamento_id`, `asignado_a`, `creado_por`, `tarea_padre_id`, `tipos_tareas_id`, `nivel_esquema`, `estado`, `prioridad`, `importancia`, `progreso`, `fecha_inicio`, `fecha_vencimiento`, `fecha_completada`, `tiempo_estimado`, `tiempo_real`, `fecha_creacion`, `fecha_actualizacion`, `adjuntos_url`, `asignados`, `ai_level`, `division`, `is_ticket`) VALUES
(12, 'Tareas', NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-10-30', NULL, NULL, NULL, '2025-10-14 14:44:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(13, 'Mejoras de IA', NULL, NULL, NULL, NULL, 1, 12, 1, 1, 'en_progreso', 'media', 'baja', 50.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 14:46:08', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(14, 'Agregar filtro', NULL, NULL, NULL, NULL, 1, 12, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-14 14:47:00', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(15, 'Filtrar por tareas de hoy o que tengo por hacer y tareas sin fechas', NULL, NULL, NULL, NULL, 1, 14, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-14 14:47:28', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(16, 'Filtrar aparte tareas vencidas', NULL, NULL, NULL, NULL, 1, 14, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-14 14:47:49', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(17, 'Progeso', NULL, NULL, NULL, NULL, 1, 12, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 14:51:23', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(18, 'El progreso poderle escribir porcentaje manulmente', NULL, NULL, NULL, NULL, 1, 17, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 14:51:49', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(19, 'Agregar notificaciones de las tareas vencidas', NULL, NULL, NULL, NULL, 1, 14, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-14 14:58:02', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(20, 'Arreglar el progreso calcula mal', NULL, NULL, NULL, NULL, 1, 17, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:01:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(21, 'Mejorar la transcripcion para que entienda el contexto de la tarea y no transcribir informacion innecesaria', NULL, NULL, NULL, NULL, 1, 13, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:03:09', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(22, 'Tareas', NULL, 3, NULL, NULL, 1, 12, 1, 1, 'en_progreso', 'media', 'baja', 35.00, '2025-10-14', '2025-10-30', NULL, NULL, NULL, '2025-10-14 15:06:30', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(23, 'El progreso desde la vista principal poderlo cambiar el porcentaje moviendolo tipo progress drag', NULL, NULL, NULL, NULL, 1, 17, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:15:44', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(24, 'Para el filtro de todas la tareas agregar un acordeón para cada tarea padre y subtarea por defecto aparece escondido', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-14 15:18:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(25, 'Funciones', NULL, NULL, NULL, NULL, 1, 12, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:24:59', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(26, 'Adaptar el editar tarea para que se pueda asignar a mas de una persona esa tarea ( por defecto viene asignado al que la creo ya esta el campo en la base de datos)', '', NULL, NULL, NULL, 1, 25, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-16', NULL, NULL, NULL, '2025-10-14 15:26:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(27, 'Crear tipos de tareas ( tarea, rubro, dpe), usan la misma estructura solo que para diferentes fines ', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'en_progreso', 'media', 'baja', 20.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:27:04', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(28, 'Solo puedes ver tus mismas tareas y las tareas a las que te asignaron', NULL, NULL, NULL, NULL, 1, 25, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:28:12', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(29, 'Al crear la tarea aparte de guardar la fecha en fecha_creacion tambien la guarde en fecha_inicio', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:36:29', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(30, 'Agregar: Al Editar Tarea Modifica los detalles de tu tarea, agregar que aparescar la fecha_inicio y se pueda modificar ', NULL, NULL, NULL, NULL, 1, 29, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-14 15:37:25', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(32, 'Prueba adj', NULL, NULL, NULL, NULL, 1, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-16', NULL, NULL, NULL, '2025-10-15 07:30:07', '2025-11-06 11:02:03', '[\"\\/uploads\\/1760534999_file\"]', NULL, NULL, NULL, 0),
(33, 'Cambiar icono de eliminar ( X ) por tacho', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-15 07:31:36', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(35, 'Agregar nuevo filtro de tareas pendientes', NULL, NULL, NULL, NULL, 1, 14, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-15 08:48:00', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(38, 'Revisa la subida de archivos, que pasa cuando creo una tarea con una imagen, guarda la imagen? que hace con ella', NULL, NULL, NULL, NULL, 1, 25, 1, 1, 'en_progreso', 'media', 'baja', 45.00, NULL, '2025-12-01', NULL, NULL, NULL, '2025-10-15 10:01:24', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(39, 'Cambiar el icono de auto', NULL, NULL, NULL, NULL, 1, 17, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-15', NULL, NULL, NULL, '2025-10-15 10:10:08', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(42, 'Que se guarda la fecha completado', NULL, NULL, NULL, NULL, 1, 29, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-15 12:42:43', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(43, 'prueba', NULL, NULL, NULL, NULL, 1, 38, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-15', '2025-10-31', '2025-10-15 19:29:07', NULL, NULL, '2025-10-15 12:49:44', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(47, 'Crear una opcion para agregar proyectos, se debe poder filtrar con filtro buscando por el nombre del proyecto en \"tiempo real\" y se deben mostrar las opciones en un tipo de como box', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-15 16:27:53', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(48, 'Agregar opcion en el titulo de las tareas que salgan por ejemplo Tareas: Hoy: 2 y sin fecha: 5, en el otro Tareas atrasdas: 3 y asi con los otros', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-15', '2025-10-15', NULL, NULL, NULL, '2025-10-15 16:30:16', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(51, 'Sacar opcion de estado', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:00:25', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(52, 'Agregar creador por alado de asignar usuario', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:01:58', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(54, 'Agregar SSO prueba', NULL, 2, NULL, NULL, 1, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-10-20', NULL, NULL, NULL, '2025-10-16 11:55:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(59, 'Cambiarle el color a los filtros', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 22:45:04', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(60, 'Agregar auditoria', NULL, NULL, NULL, NULL, 1, 25, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 22:45:24', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(61, 'Arreglar el estilo de las notificaciones en movil', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 22:49:51', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(62, 'Arreglar el estilo en el login ', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-16 22:53:25', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(63, 'Agregar filtro de búsqueda general o por estrato ', NULL, 3, NULL, NULL, 1, 22, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-17 05:17:29', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(73, 'Agregar una opcion en academics para poder subir material de apoyo, que no sería el material para generar el curso', NULL, 6, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-17', NULL, NULL, NULL, NULL, '2025-10-17 11:08:38', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(87, 'Comprar licencia zoom pro', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-17 17:05:01', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(88, 'Pagar copiadoras', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-17', NULL, NULL, NULL, NULL, '2025-10-17 17:05:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(89, 'Hacer informe de sustento ', NULL, 1, NULL, NULL, 9, 88, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-17 17:06:16', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(90, 'En el filtro poner solo un cuadro de texto con un icono de lupa dentro', NULL, 7, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-17', NULL, NULL, NULL, NULL, '2025-10-17 17:10:35', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(91, 'Agregar un botón flotante (+) o encontrar un método para volver rápido a la caja de texto para crear nota', NULL, 7, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-17', NULL, NULL, NULL, NULL, '2025-10-17 17:16:21', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(92, 'Arreglar tareas asignadas vista general sin filtro ', NULL, 1, NULL, NULL, 1, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-17', NULL, NULL, NULL, NULL, '2025-10-17 17:42:09', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(93, 'Suspender maconcloud ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-19', '2025-10-20', '2025-10-21 10:53:52', NULL, NULL, '2025-10-19 18:46:08', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(94, 'Hacer el micrófono más visible ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 07:26:28', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(110, 'Renovar Sol WS', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:05:16', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(111, 'Revivir Sol Facebook e Instagram', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:05:42', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(112, 'Sinergics Auditoria', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:05:57', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(113, 'Sinergics Nuevo Punto Control', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:06:19', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(114, 'Sinergics Grafica de Tiempos', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:06:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(116, 'BDU - Dasboard Leads', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:06:54', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(117, 'BDU - Dasboard SAC', NULL, 2, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:07:14', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(118, 'BDU - HUBSPOT', NULL, 8, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 10:07:25', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(119, 'Bot Consultas BDU', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-14', '2025-12-02 15:56:40', NULL, NULL, '2025-10-20 10:18:36', '2025-12-02 10:56:39', '[]', NULL, NULL, NULL, 0),
(121, 'Agentics', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-11-14', NULL, NULL, NULL, '2025-10-20 10:19:28', '2025-11-07 07:27:00', '[]', NULL, NULL, NULL, 0),
(122, 'auditorIA', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, NULL, '2025-11-29', NULL, NULL, NULL, '2025-10-20 10:19:51', '2025-12-04 15:52:40', '[]', NULL, NULL, NULL, 0),
(123, 'Jardines e Implantación AI\n', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-11-29', NULL, NULL, NULL, '2025-10-20 10:20:10', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(124, 'Interfaz para subir reporte de cartera', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-11-28', NULL, NULL, NULL, '2025-10-20 10:21:02', '2025-11-24 09:16:43', '[]', NULL, NULL, NULL, 0),
(125, 'BDU-Cotizador', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, '2025-10-20', '2025-12-05', NULL, NULL, NULL, '2025-10-20 10:21:11', '2025-12-04 15:53:49', '[]', NULL, NULL, NULL, 0),
(127, 'Planics', 'Planics', 7, NULL, NULL, 2, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 11:43:28', '2025-11-07 10:23:09', '[]', NULL, NULL, NULL, 0),
(131, 'AppCostasol', NULL, 9, NULL, NULL, 2, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 14:19:24', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(132, 'Arreglar Proyectos cuando creo uno nuevo se cambie automaticamente', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:20:34', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(134, 'CTG', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'en_progreso', 'media', 'baja', 10.00, '2025-10-20', '2025-11-06', NULL, NULL, NULL, '2025-10-20 14:21:26', '2025-11-30 16:17:46', '[]', NULL, NULL, NULL, 0),
(135, 'Las subtareas deben heredar tambien el proyecto del padre', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:22:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(136, 'contingencia se debe abrir cuando este la fecha de entrega', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:23:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(137, 'contigencia y pqr verificar carga propiedades para responsables', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:23:51', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(138, 'Citas', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:26:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(139, 'en citas agregar opción a la cita de que asistio o no asistio', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:26:48', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(140, 'en cita_nueva solo las citas con consultas con crédito y cobranzas agendar con nely', 'nzuloaga@thaliavictoria.com.ec', 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 14:26:59', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(141, 'Auditoria', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'en_progreso', 'media', 'baja', 10.00, '2025-10-20', '2025-11-06', NULL, NULL, NULL, '2025-10-20 14:29:24', '2025-11-30 16:17:20', '[]', NULL, NULL, NULL, 0),
(142, 'Arreglar dashboard de auditoria CTG - ver tipos', NULL, 9, NULL, NULL, 2, 141, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:30:08', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(143, 'KissFlow', NULL, 10, NULL, NULL, 2, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 14:31:13', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(144, 'Crear chat bot es viable?', 'Chat entre personas? entre usuarios asingnados?', 7, NULL, NULL, 2, 127, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 14:50:40', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(145, 'Mejorar la busqueda o filtro \"en tiempo real\"', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:54:01', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(146, 'Mejorar la busqueda o filtro \"en tiempo real\"', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 14:54:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(147, 'ctg', NULL, 9, NULL, NULL, 2, 137, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 15:32:40', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(148, 'pqr', NULL, 9, NULL, NULL, 2, 137, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 15:32:44', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(149, 'garantias se debe abrir cuando este la fecha de entrega', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-20', NULL, NULL, NULL, NULL, '2025-10-20 15:53:48', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(150, 'Las contingencias se deben asignar con Adrián', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 16:23:16', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(151, 'PQR', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-06', '2025-11-06 16:10:15', NULL, NULL, '2025-10-20 16:23:58', '2025-11-06 11:10:15', '[]', NULL, NULL, NULL, 0),
(152, 'Los PQR se deben asignar con Adrián ', NULL, 9, NULL, NULL, 2, 151, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 16:24:21', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(153, 'Cuando se filtre por carpeta también debe aparecer la opción de limpiar ', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-20 16:27:05', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(155, 'Revisar maquina de garita arienzo ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 05:53:31', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(156, 'Preguntarle a anita cuando se activa cada modulo', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-30', '2025-11-30 21:25:20', NULL, NULL, '2025-10-21 07:39:32', '2025-11-30 16:25:20', '[]', NULL, NULL, NULL, 0),
(157, 'Revisar la duracion de cada cita', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', NULL, NULL, NULL, NULL, '2025-10-21 07:54:37', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(158, 'Menu', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-21', NULL, NULL, NULL, NULL, '2025-10-21 08:01:51', '2025-11-13 22:09:36', '[]', NULL, NULL, NULL, 0),
(159, 'Que menu va a tener credito y cobranza', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-12-30', NULL, NULL, NULL, '2025-10-21 08:02:06', '2025-11-30 16:25:54', '[]', NULL, NULL, NULL, 0),
(160, 'Cambiar firma que se envia en el correo', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-21', '2025-12-30', NULL, NULL, NULL, '2025-10-21 08:07:40', '2025-11-30 16:25:28', '[]', NULL, NULL, NULL, 0),
(161, 'Acabados', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:24:46', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(162, 'Microfono encerrar boton', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:29:10', NULL, NULL, '2025-10-21 08:25:59', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(163, 'Se habilidad 20 meses antes', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', '2025-11-13', '2025-11-13 17:33:08', NULL, NULL, '2025-10-21 08:26:29', '2025-11-13 15:33:07', '[]', NULL, NULL, NULL, 0),
(164, 'Agregar explicacion de que es cada uno ', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:32:49', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(165, 'Agregar plano actualizado de cada cocina', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:33:07', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(166, 'Hablar con jonathan sobre imagenes', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:36:39', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(167, 'Todo esto es para Davos y estanza', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', '2025-11-17', '2025-11-17 14:03:34', NULL, NULL, '2025-10-21 08:40:27', '2025-11-17 09:03:33', '[]', NULL, NULL, NULL, 0),
(168, 'Departamentos', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:42:31', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(169, 'tambien debe tener eleccion de acabados', NULL, 9, NULL, NULL, 2, 168, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-13', '2025-11-13 08:32:23', NULL, NULL, '2025-10-21 08:42:44', '2025-11-13 06:32:22', '[]', NULL, NULL, NULL, 0),
(170, 'Hay full, standar, suit', NULL, 9, NULL, NULL, 2, 168, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 08:43:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(171, 'hay paquetes que solo se hablitan para ciertos tipos de departamentos ( full )', NULL, 9, NULL, NULL, 2, 168, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-13', '2025-11-13 17:07:37', NULL, NULL, '2025-10-21 08:44:30', '2025-11-13 15:07:37', '[]', NULL, NULL, NULL, 0),
(172, 'Para citas de credito, enviar correo a catalina y a nely', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:09:58', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(173, 'Opcion de creditos y finanzas activar cuando firma y proceso\n', NULL, 9, NULL, NULL, 2, 156, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', NULL, NULL, NULL, NULL, '2025-10-21 09:11:47', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(175, 'Cuando firman la promesa el asesor debe guiar al cliente bajar la app', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-21', '2026-01-09', NULL, NULL, NULL, '2025-10-21 09:15:53', '2025-11-30 16:40:48', '[]', NULL, NULL, NULL, 0),
(176, 'Garantias', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:19:27', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(177, 'Actualizar tiempos y tipos de garantias', NULL, 9, NULL, NULL, 2, 176, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-17', '2025-11-17 21:55:10', NULL, NULL, '2025-10-21 09:19:42', '2025-11-17 16:55:09', '[]', NULL, NULL, NULL, 0),
(178, 'Hay garantias que solo se aplican ante de la entrega', NULL, 9, NULL, NULL, 2, 176, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:22:56', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(179, 'Calendario', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-06', '2025-11-06 16:10:06', NULL, NULL, '2025-10-21 09:29:12', '2025-11-06 11:10:05', '[]', NULL, NULL, NULL, 0),
(180, 'Cambiar nombre actualizar nombre Calendario SAC', NULL, 9, NULL, NULL, 2, 179, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:30:20', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(181, 'Cambiar observaciones nombre y hacerlo intuitivo agregar x', 'o cuando guarda la observacion se cierre despues de guardar', 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', NULL, NULL, NULL, NULL, '2025-10-21 09:35:23', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(182, 'Cambiar observaciones nombre y hacerlo intuitivo agregar x', 'o cuando guarda la observacion se cierre despues de guardar', 9, NULL, NULL, 2, 151, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', NULL, NULL, NULL, NULL, '2025-10-21 09:37:40', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(183, 'Quitar mensaje de guardado', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:43:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(185, 'Noticias', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'en_progreso', 'media', 'baja', 10.00, '2025-10-21', '2025-11-06', NULL, NULL, NULL, '2025-10-21 09:46:58', '2025-11-30 16:17:34', '[]', NULL, NULL, NULL, 0),
(186, 'Reportes', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:50:38', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(187, 'Arreglar menu', NULL, 9, NULL, NULL, 2, 185, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-16', '2025-10-27', NULL, NULL, NULL, '2025-10-21 09:50:52', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(189, 'Enviar correo a cliente tambien pqr, ctg y cita', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 09:52:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(190, 'Cambiar correo en citas de credito y finanzas', NULL, 9, NULL, NULL, 2, 138, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 10:34:52', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(191, 'Añadir de busqueda', NULL, 9, NULL, NULL, 2, 176, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 12:32:07', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(192, 'Actualizar auditoria con asistio o no asistio ( citas )', NULL, 9, NULL, NULL, 2, 141, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 13:06:27', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(193, 'Cambiar nombre de ctg a contingencia', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 15:10:28', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(194, 'Actualizar responsividad UIX', NULL, 9, NULL, NULL, 2, 151, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 15:24:19', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(195, 'Actualizar responsividad UIX', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 15:24:30', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(196, 'Chat', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-21', '2025-11-06', '2025-11-06 16:10:00', NULL, NULL, '2025-10-21 15:30:33', '2025-11-21 10:16:56', '[]', NULL, NULL, NULL, 0),
(197, 'Agregar chat con los clientes', NULL, 9, NULL, NULL, 2, 196, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:04:39', NULL, NULL, '2025-10-21 15:30:45', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(198, 'en users ajustar para que solo se muestren los 20 primeros con opcion a ver mas', NULL, 9, NULL, NULL, 2, 186, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 15:40:30', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(199, 'Agregar el menú con ID 4 este siempre fijo o ver más', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-21 22:38:35', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(200, 'Revisar el espacio de almacén de los correos de jjb y ca', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-22 08:11:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(201, ' Notificaciones', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-06', '2025-11-06 16:10:01', NULL, NULL, '2025-10-22 09:01:40', '2025-11-06 11:10:01', '[]', NULL, NULL, NULL, 0),
(202, 'Actualizar en notificaciones para que ya no envie ahi mismo si no a menu', NULL, 9, NULL, NULL, 2, 201, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-22 09:03:01', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(203, 'Agregar notificaciones push a noticias', NULL, 9, NULL, NULL, 2, 201, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-22 10:30:51', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(204, 'Cuando una tarea se marque como completada se ponga automáticamente la fecha de hoy en fecha_fin', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:05:00', NULL, NULL, '2025-10-22 11:45:13', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(205, 'Actualiza mcm y manual de garantias', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-22 12:13:13', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(206, 'adaptar seleccion de acabados tipo mac donals inspired', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-22 15:28:43', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(207, 'cambiar nombre a pre seleccionar', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-17', '2025-11-17 14:03:39', NULL, NULL, '2025-10-22 15:29:01', '2025-11-17 09:03:39', '[]', NULL, NULL, NULL, 0),
(208, 'Revisar el correo y los accesos de aramos@costasol.com.ec', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-10-22', '2025-11-12', '2025-11-24 14:16:28', NULL, NULL, '2025-10-22 16:25:09', '2025-11-24 09:16:28', '[]', NULL, NULL, NULL, 0),
(209, 'crea base de datos portalao_planics - bluehost', NULL, 7, NULL, NULL, 2, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-23', '2025-10-24', NULL, NULL, NULL, '2025-10-23 11:33:05', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(217, 'reorganizar secciones de tarjetas de tareas en Planics, Primero Urgente(atrasadas y sin fecha), segundo importantes(hoy), programadas (futuras), completadas', NULL, 7, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-23', '2025-10-28', '2025-10-28 22:05:30', NULL, NULL, '2025-10-23 14:24:05', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(218, 'en vista de lista mostrar maximo 2 lineas del nombre de la tarea, al final 3 puntos suspensivos', NULL, 7, NULL, NULL, 9, 217, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-23 14:25:30', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(219, 'Academics', NULL, 6, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-23', '2025-11-14', NULL, NULL, NULL, '2025-10-23 14:42:20', '2025-11-07 07:25:38', '[]', NULL, NULL, NULL, 0),
(220, 'Agregar resumen con IA del cliente en perfil', NULL, 9, NULL, NULL, 2, 196, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:04:37', NULL, NULL, '2025-10-23 15:40:26', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(221, 'revisar los procesos de fofis que me envió Adrian', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-24', '2025-11-07', '2025-11-11 07:14:10', NULL, NULL, '2025-10-24 07:09:19', '2025-11-11 05:14:08', '[]', NULL, NULL, NULL, 0),
(222, 'Mantenimiento de plotter ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-11-28', NULL, NULL, NULL, '2025-10-24 08:58:16', '2025-11-07 07:31:14', '[]', NULL, NULL, NULL, 0),
(223, 'Re-estructurar el codigo y parte de la tabla propiedades', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-13', '2025-11-13 17:07:47', NULL, NULL, '2025-10-24 16:10:11', '2025-11-13 15:07:47', '[]', NULL, NULL, NULL, 0),
(224, 'Añadir nueva tabla llamada modelo_propieda', 'esta nueva tabla debe tener los modelos de los tipos de propeidades\nva a tener relacion con el tipo de propiedad y urbanizacion', 9, NULL, NULL, 2, 223, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-24', '2025-11-13', '2025-11-13 08:31:19', NULL, NULL, '2025-10-24 16:11:08', '2025-11-13 06:31:18', '[]', NULL, NULL, NULL, 0),
(225, 'Agregar logica que detecte que tipo de propiedad es y dependiendo del tipo mostrar una informacion o otra', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-24', '2025-11-13', '2025-11-13 08:32:02', NULL, NULL, '2025-10-24 16:18:10', '2025-11-13 06:32:02', '[]', NULL, NULL, NULL, 0),
(226, 'añadir logica de que si detecta un tipo de propiedad tambien detecte que tipo de modelo es esa propiedad', NULL, 9, NULL, NULL, 2, 225, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-13', '2025-11-13 08:31:52', NULL, NULL, '2025-10-24 16:18:39', '2025-11-13 06:31:51', '[]', NULL, NULL, NULL, 0),
(227, 'Añadir que se muestra abrir la imagen en la etapa 3 ', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-13', '2025-11-13 17:07:49', NULL, NULL, '2025-10-24 16:23:19', '2025-11-13 15:07:48', '[]', NULL, NULL, NULL, 0),
(228, 'Mantener la consistencia de los precios en la etapa 3, en cado de que en la etapa 2 tenga un costo mantener ese precio en la etapa 3 y sumarle los adicionales en caso de escoger', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-11', '2025-11-11 11:50:56', NULL, NULL, '2025-10-24 16:24:02', '2025-11-11 09:50:55', '[]', NULL, NULL, NULL, 0),
(229, 'Arreglar el chat diseño para vista movil', NULL, 9, NULL, NULL, 2, 196, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:04:41', NULL, NULL, '2025-10-25 13:25:11', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(230, 'Arreglar la notificación ', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-28', '2025-10-28 17:33:14', NULL, NULL, '2025-10-25 13:26:06', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(231, 'Agregarle icono de salir puerta', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-25', '2025-10-28', '2025-10-28 17:29:09', NULL, NULL, '2025-10-25 13:26:17', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(232, 'Gantt', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-27', '2025-10-30', '2025-12-04 13:33:17', NULL, NULL, '2025-10-27 09:24:11', '2025-12-04 08:33:17', '[]', NULL, NULL, NULL, 0),
(233, 'agregar limite de ancho al nombre de las tareas', NULL, 7, NULL, NULL, 2, 232, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-27 09:25:49', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(234, 'agregar que calcule la duracion en dia cuando hay fecha inicio y fin', NULL, 7, NULL, NULL, 2, 232, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-27 09:26:18', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(235, 'Agregar acordeón a las tareas en la vista gantt para poderlas recoger', NULL, 7, NULL, NULL, 2, 232, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-27 09:27:04', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(236, 'agregar que se pueda editar una tarea presionandola o dando clic a la tarea', NULL, 7, NULL, NULL, 2, 233, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, NULL, NULL, NULL, NULL, '2025-10-27 09:31:33', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(248, '- Preparar el reporte de elección de acabados para José Javier', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-29', '2025-10-29 16:22:26', NULL, NULL, '2025-10-28 13:15:54', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(259, 'reporte de asistencia obra para jesus\n', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-29', '2025-10-29 16:29:33', NULL, NULL, '2025-10-29 09:47:41', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(260, 'agregar villas al cotizador y a kissflow (Geovanny)', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-29', '2025-10-30 15:59:09', NULL, NULL, '2025-10-29 09:48:18', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(261, 'arreglar el gant', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-30', '2025-10-30 12:36:59', NULL, NULL, '2025-10-29 10:15:40', '2025-11-06 11:02:03', '[]', NULL, NULL, NULL, 0),
(279, 'Process', NULL, 10, NULL, NULL, 2, 143, 1, 1, 'pendiente', 'media', 'media', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-10-30 10:31:11', '2025-11-06 14:06:00', '[]', NULL, NULL, NULL, 0),
(280, 'Desestimiento/Cambio ( - )', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-30', '2026-01-04', NULL, NULL, NULL, '2025-10-30 10:31:36', '2025-12-04 10:57:39', '[]', NULL, NULL, NULL, 0),
(281, 'Registro de documentacion cliente', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-10-30', '2025-10-31', '2025-10-31 15:57:12', NULL, NULL, '2025-10-30 10:31:48', '2025-10-31 10:57:11', '[]', NULL, NULL, NULL, 0),
(282, 'FOFIS para laberacion', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-31', '2025-10-31 15:57:13', NULL, NULL, '2025-10-30 10:41:00', '2025-10-31 10:57:12', '[]', NULL, NULL, NULL, 0),
(283, 'Eleccion de acabados', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-31', '2025-10-31 17:17:35', NULL, NULL, '2025-10-30 10:41:06', '2025-10-31 12:17:35', '[]', NULL, NULL, NULL, 0),
(284, 'Entrega cliente ( - )\n', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-30', '2026-01-04', NULL, NULL, NULL, '2025-10-30 10:41:20', '2025-12-04 10:57:43', '[]', NULL, NULL, NULL, 0),
(285, 'Tickets atencion ctg y pqr', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'completada', 'media', 'alta', 100.00, NULL, '2025-11-06', '2025-11-06 14:20:00', NULL, NULL, '2025-10-30 10:41:46', '2025-11-06 09:18:13', '[]', NULL, NULL, NULL, 0),
(286, 'Cambio de bien inmuable / fachada ( - )\n', NULL, 10, NULL, NULL, 2, 279, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-10-30', '2026-01-04', NULL, NULL, NULL, '2025-10-30 10:42:27', '2025-12-04 10:57:46', '[]', NULL, NULL, NULL, 0),
(287, 'revisar el comportamiento responsive en moviles', NULL, 6, NULL, NULL, 9, 219, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-10', '2025-11-11 07:14:05', NULL, NULL, '2025-10-30 11:02:05', '2025-11-11 05:14:04', '[]', NULL, NULL, NULL, 0),
(288, 'confirmar los archivos cargados', NULL, 6, NULL, NULL, 9, 219, 1, 1, 'pendiente', 'media', 'baja', 0.00, NULL, '2025-11-10', NULL, NULL, NULL, '2025-10-30 11:02:37', '2025-11-07 07:25:26', '[]', NULL, NULL, NULL, 0),
(289, 'Guarda la data en tablas separadas FK ', NULL, 10, NULL, NULL, 2, 281, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-10-31', '2025-10-31 15:57:10', NULL, NULL, '2025-10-30 18:15:57', '2025-10-31 10:57:10', '[]', NULL, NULL, NULL, 0),
(290, 'Contactar a técnico ', NULL, 1, NULL, NULL, 9, 222, 1, 1, 'en_progreso', 'media', 'alta', 85.00, '2025-11-05', '2025-11-07', NULL, NULL, NULL, '2025-11-05 04:59:19', '2025-11-07 07:22:03', '[]', NULL, NULL, NULL, 0),
(291, 'Preguntarle que ocurre con esos procesos ', NULL, 1, NULL, NULL, 9, 221, 1, 1, 'completada', 'alta', 'baja', 100.00, '2025-11-05', '2025-11-06', '2025-11-07 12:15:45', NULL, NULL, '2025-11-05 05:00:08', '2025-11-07 07:15:45', '[]', NULL, NULL, NULL, 0),
(292, 'Agregar opción pra cargar solo un link', NULL, 6, NULL, NULL, 9, 219, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-11-05', '2025-11-21', NULL, NULL, NULL, '2025-11-05 05:01:40', '2025-11-14 14:39:51', '[]', NULL, NULL, NULL, 0),
(293, 'Dar seguimiento de curso creado ', NULL, 6, NULL, NULL, 9, 219, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-05', '2025-11-10', '2025-11-11 07:13:41', NULL, NULL, '2025-11-05 05:02:04', '2025-11-11 05:13:40', '[]', NULL, NULL, NULL, 0),
(294, 'Prototipar app para cargar Excel con cronograma', 'Permir editar fechas por rol admin, debe tener solicitud y aprobación, cambiar estado de pendiente a aprobado, que guarde en tabla tareas de planics', 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-11-05', '2025-11-28', NULL, NULL, NULL, '2025-11-05 05:06:51', '2025-11-24 09:15:37', '[]', NULL, NULL, NULL, 0),
(297, 'Agregar comentarios en Hoja de ruta de fofis', NULL, 17, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-05', '2025-11-11', '2025-11-14 19:38:16', NULL, NULL, '2025-11-05 09:36:46', '2025-11-14 14:38:13', '[]', NULL, NULL, NULL, 0),
(298, 'Mapear los campos de los responsables', NULL, 1, NULL, NULL, 9, 297, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-11-05', '2025-11-07', '2025-11-14 19:38:51', NULL, NULL, '2025-11-05 09:37:39', '2025-11-14 14:38:48', '[]', NULL, NULL, NULL, 0),
(299, 'Agregar columna para check de cumplimiento ', NULL, 1, NULL, NULL, 9, 297, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-05', '2025-11-10', '2025-11-14 19:38:20', NULL, NULL, '2025-11-05 09:37:56', '2025-11-14 14:38:16', '[]', NULL, NULL, NULL, 0),
(300, 'Emision de pagos, crear integracion para envio de correo despues de aprobacion de Analisis Financiero', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-11-05', '2025-11-06', '2025-11-07 12:16:35', NULL, NULL, '2025-11-05 10:18:34', '2025-11-07 07:16:35', '[]', NULL, NULL, NULL, 0),
(301, 'Hacer la proformas para ventas y financiero ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, NULL, '2025-11-05', '2025-11-07 12:16:26', NULL, NULL, '2025-11-05 11:15:31', '2025-11-07 07:16:26', '[]', NULL, NULL, NULL, 0),
(302, 'revisar porque hay conflictos en las reservas de las salas\n', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-11-05', '2025-11-07', '2025-11-10 08:45:12', NULL, NULL, '2025-11-05 14:18:46', '2025-11-10 06:45:11', '[]', NULL, NULL, NULL, 0),
(303, 'Que la seccion se mantenga y no se cierre cada poco tiempo', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-06', '2025-11-06 15:25:13', NULL, NULL, '2025-11-06 06:38:26', '2025-11-06 10:25:13', '[]', NULL, NULL, NULL, 0),
(304, 'Agregar el filtro por tipo de tarea ', 'Vista de tarea por departamento', 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-06', '2025-11-07', '2025-11-07 11:34:54', NULL, NULL, '2025-11-06 06:38:54', '2025-11-07 06:34:53', '[]', NULL, NULL, NULL, 0),
(305, 'Agregarle departamentos', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-11', '2025-11-11 11:50:24', NULL, NULL, '2025-11-06 06:40:29', '2025-11-11 09:50:24', '[]', NULL, NULL, NULL, 0),
(306, 'Los usuarios admin \ndeben asignar departamentos ( neuva vista )\n', NULL, 7, NULL, NULL, 2, 305, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-06', '2025-11-10', '2025-11-10 15:40:44', NULL, NULL, '2025-11-06 06:42:02', '2025-11-10 13:40:43', '[]', NULL, NULL, NULL, 0),
(307, 'Vista de desinghanwer', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'alta', 'alta', 100.00, '2025-11-06', '2025-11-06', '2025-11-06 13:43:46', NULL, NULL, '2025-11-06 06:49:29', '2025-11-06 09:22:49', '[]', NULL, NULL, NULL, 0),
(308, 'Cualquier usarios tendra nueva opción en la que pueden ver departamento y al seleccionar un departamento les debe aparecer los usuarios de ese departamento y tendrá la opción de escoger mas de un usua', NULL, 7, NULL, NULL, 2, 305, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-06', '2025-11-10', '2025-11-10 15:40:48', NULL, NULL, '2025-11-06 06:54:28', '2025-11-10 13:40:47', '[]', NULL, NULL, NULL, 0),
(309, 'Identificar subtareas en la vista general', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-06', '2025-11-07', '2025-11-07 13:29:10', NULL, NULL, '2025-11-06 06:54:41', '2025-11-07 08:29:10', '[]', NULL, NULL, NULL, 0),
(310, 'identificar padre de subtarea', NULL, 7, NULL, NULL, 2, 309, 1, 1, 'completada', 'media', 'alta', 100.00, NULL, '2025-11-07', '2025-11-07 13:29:09', NULL, NULL, '2025-11-06 06:54:55', '2025-11-07 08:29:10', '[]', NULL, NULL, NULL, 0),
(311, 'Agregar estrillita ( importancia ) dentro de editar tarea a lado del icon de borrar', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-06', '2025-11-06 13:52:28', NULL, NULL, '2025-11-06 06:59:01', '2025-11-06 08:52:27', '[]', NULL, NULL, NULL, 0),
(312, 'Arreglar el bug que a veces no cargan bien los usuarios asignados pero otras veces carga normal', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-06', '2025-11-06', '2025-11-06 15:17:38', NULL, NULL, '2025-11-06 07:13:46', '2025-11-06 10:17:40', '[]', NULL, NULL, NULL, 0),
(315, 'Arreglar: cuando una tarea se marca como importante trae sus subtareas ( no deberia )', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-06', '2025-11-06 15:30:56', NULL, NULL, '2025-11-06 09:38:42', '2025-11-06 10:30:56', '[]', NULL, NULL, NULL, 0),
(316, 'Revisar que si cuando se cree una subtarea tambien la subtarea guarde el proyecto del padre', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-06', '2025-11-06 16:09:10', NULL, NULL, '2025-11-06 09:43:28', '2025-11-06 11:09:09', '[]', NULL, NULL, NULL, 0),
(319, 'Hacer seguimiento a IrmaBot de como va a ser lo de la pantalla', NULL, 1, NULL, NULL, 13, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, NULL, NULL, NULL, '2025-11-06 13:51:28', '2025-11-06 13:51:28', '[]', NULL, NULL, NULL, 0),
(320, 'Agregar Chat Bot', NULL, 9, NULL, NULL, 2, 196, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-06', NULL, NULL, NULL, '2025-11-06 14:35:54', '2025-11-06 14:35:54', '[]', NULL, NULL, NULL, 0),
(321, 'Crear Fac  de aplicacion', NULL, 9, NULL, NULL, 2, 320, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-06', NULL, NULL, NULL, '2025-11-06 14:36:40', '2025-11-06 14:36:40', '[]', NULL, NULL, NULL, 0),
(322, 'Crear Fac de servicio al cliente', NULL, 9, NULL, NULL, 2, 320, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-06', NULL, NULL, NULL, '2025-11-06 14:36:51', '2025-11-11 06:44:29', '[]', NULL, NULL, NULL, 0),
(323, 'Agregar funciones de project', 'Agregar que se puedan escoger los predecesores  ( ver alguna forma ), agregar que la fecha se actualize si tiene alguna predecesor o dependencia fs\n', 7, NULL, NULL, 2, 232, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-06', '2025-11-10', '2025-11-09 23:25:26', NULL, NULL, '2025-11-06 14:59:16', '2025-11-09 21:25:27', '[]', NULL, NULL, NULL, 0),
(324, 'RAP - vista de tareas general por departamento y usuario + buscar al padre ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-11-07', '2025-11-07', '2025-11-10 08:45:09', NULL, NULL, '2025-11-07 06:34:30', '2025-11-10 06:45:08', '[]', NULL, NULL, NULL, 0),
(325, 'RAP - mejorar grafica aprobación por fiscalizador y hacer la nueva de rechazos ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-07', '2025-11-07', '2025-11-10 08:45:07', NULL, NULL, '2025-11-07 06:37:57', '2025-11-10 06:45:06', '[]', NULL, NULL, NULL, 0),
(327, 'RAP - prototipo de project reunión con Jimmy ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-07', '2025-11-07', '2025-11-10 08:45:57', NULL, NULL, '2025-11-07 06:46:14', '2025-11-10 06:45:57', '[]', NULL, NULL, NULL, 0),
(328, 'Añadir boton de actualizar', 'awdawdadadawa', 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-07', '2025-11-07', '2025-11-25 17:41:23', NULL, NULL, '2025-11-07 06:50:22', '2025-11-25 12:41:22', '[]', NULL, NULL, NULL, 0);
INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `proyecto_id`, `departamento_id`, `asignado_a`, `creado_por`, `tarea_padre_id`, `tipos_tareas_id`, `nivel_esquema`, `estado`, `prioridad`, `importancia`, `progreso`, `fecha_inicio`, `fecha_vencimiento`, `fecha_completada`, `tiempo_estimado`, `tiempo_real`, `fecha_creacion`, `fecha_actualizacion`, `adjuntos_url`, `asignados`, `ai_level`, `division`, `is_ticket`) VALUES
(330, 'Arreglar calendairo', NULL, 7, NULL, NULL, 2, 328, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-11-07', NULL, NULL, NULL, NULL, '2025-11-07 07:28:58', '2025-11-07 07:45:37', '[]', NULL, NULL, NULL, 0),
(331, 'RAP - \n1.Mejorar graficas 2\n2. Agrupar mejor los logs en reporte sinergics\n3. Booking', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, '2025-11-10', '2025-11-10', '2025-11-14 19:38:12', NULL, NULL, '2025-11-10 06:48:34', '2025-11-14 14:38:09', '[]', NULL, NULL, NULL, 0),
(332, 'RAP - 1. Terminar departamentos planics\n 2. Empezar cronogramas con las opciones por modelo', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-10', '2025-11-10', '2025-11-14 19:38:03', NULL, NULL, '2025-11-10 06:52:27', '2025-11-14 14:38:01', '[]', NULL, NULL, NULL, 0),
(333, 'RAP - crear conexiones bd, n8n\n2 reunión con Jimmy transcripción project ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'baja', 100.00, NULL, '2025-11-10', '2025-12-02 15:55:47', NULL, NULL, '2025-11-10 06:58:19', '2025-12-02 10:55:46', '[]', NULL, NULL, NULL, 0),
(334, 'Jola', 'aaaa', 7, NULL, NULL, 12, 328, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-10', '2025-11-07', '2025-11-25 17:41:27', NULL, NULL, '2025-11-10 08:03:00', '2025-11-25 12:41:26', '[]', NULL, NULL, NULL, 0),
(335, 'prueba proyecto pp', NULL, 15, NULL, NULL, 12, NULL, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-11-10', NULL, '2025-11-10 09:01:29', NULL, NULL, '2025-11-10 09:01:29', '2025-12-09 12:34:26', '[]', NULL, NULL, NULL, 0),
(336, 'Investiga que hacen las aplicaciones inmobiliarias, cual es el alcance de su propósito', 'Si deseas apoyado en AI, busca existentes, que es lo que la gente necesita o desea de estas aplicaciones, puedes apoyarte en notebook lm', 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-10', '2025-11-10', '2025-11-24 14:15:25', NULL, NULL, '2025-11-10 09:21:25', '2025-11-24 09:15:25', '[]', NULL, NULL, NULL, 0),
(337, 'Modificar los adjuntos en KF- Registro de Proveedores', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-11', '2025-11-11 07:13:12', NULL, NULL, '2025-11-10 09:27:29', '2025-11-11 05:13:11', '[]', NULL, NULL, NULL, 0),
(339, 'prueba pp2', NULL, 15, NULL, NULL, 12, 335, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-19', '2025-11-26', '2025-12-08 14:37:07', NULL, NULL, '2025-11-10 09:37:54', '2025-12-08 09:37:07', '[]', NULL, NULL, NULL, 0),
(340, 'Arreglar que se puedan ver las tareas asignadas', NULL, 7, NULL, NULL, 2, 328, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-18', '2025-11-11 11:50:20', NULL, NULL, '2025-11-10 13:41:06', '2025-11-25 08:26:18', '[]', NULL, NULL, NULL, 0),
(341, 'KF-elección de acabados, Setear en 0 el campo de adicionales cuando el cliente NO DESEA ADICIONALES', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-11', '2025-11-13 08:38:02', NULL, NULL, '2025-11-11 05:12:41', '2025-11-13 06:38:01', '[]', NULL, NULL, NULL, 0),
(342, '723 ( TORRE D-1E ) - ALVARADO TOSCANO ELYA PRISCILA CSED235', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-11', '2025-11-13 08:13:58', NULL, NULL, '2025-11-11 05:19:09', '2025-11-13 06:13:57', '[]', NULL, NULL, NULL, 0),
(343, 'Subir pago de copiadoras', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-14', '2025-11-14 19:37:54', NULL, NULL, '2025-11-12 08:01:21', '2025-11-14 14:37:51', '[]', NULL, NULL, NULL, 0),
(345, 'Agregar seguridad que solo puedan acceder si tu eres dueño de esas propiedad o si eres admin', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-13', '2025-11-13 17:35:51', NULL, NULL, '2025-11-12 11:33:30', '2025-11-13 15:35:51', '[]', NULL, NULL, NULL, 0),
(352, 'Arreglar la uix en móvil ', 'bbbbbbbbbbb', 7, NULL, NULL, 2, 328, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-12', '2025-11-07', '2025-11-26 16:16:35', NULL, NULL, '2025-11-12 19:12:26', '2025-11-26 11:16:34', '[]', NULL, NULL, NULL, 0),
(356, 'Ver si se puede obtener la ubicación real del cliente', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'completada', 'alta', 'media', 100.00, NULL, '2025-11-14', '2025-11-14 15:03:28', NULL, NULL, '2025-11-13 22:09:12', '2025-11-14 13:03:27', '[]', NULL, NULL, NULL, 0),
(357, 'Verificar si una terminal se puede cambiar la hora en el hosting', NULL, 1, NULL, NULL, 2, NULL, 1, 1, 'completada', 'alta', 'alta', 100.00, NULL, '2025-11-17', '2025-11-17 13:47:54', NULL, NULL, '2025-11-13 22:19:15', '2025-11-17 08:47:54', '[]', NULL, NULL, NULL, 0),
(358, 'Emisión de pagos -compras verificar los valores a pagar no deben exceder el valor total a pagar ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-11-14', '2025-11-28', '2025-11-14 06:51:31', NULL, NULL, '2025-11-14 06:51:31', '2025-11-24 09:14:52', '[]', NULL, NULL, NULL, 0),
(371, 'que se cargue la vista al dar clic en el link', NULL, 6, NULL, NULL, 9, 292, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-10', '2025-11-14 14:39:49', NULL, NULL, '2025-11-14 14:39:49', '2025-11-14 14:39:49', '[]', NULL, NULL, NULL, 0),
(372, 'usar outllok clasico', NULL, 1, NULL, NULL, 9, 208, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-12', '2025-11-14 14:40:13', NULL, NULL, '2025-11-14 14:40:13', '2025-11-14 14:40:13', '[]', NULL, NULL, NULL, 0),
(373, 'crear archivo pst', NULL, 1, NULL, NULL, 9, 208, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-12', '2025-11-14 14:40:28', NULL, NULL, '2025-11-14 14:40:28', '2025-11-14 14:40:28', '[]', NULL, NULL, NULL, 0),
(374, 'mover los correos', NULL, 1, NULL, NULL, 9, 208, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-12', '2025-11-14 14:40:36', NULL, NULL, '2025-11-14 14:40:36', '2025-11-14 14:40:36', '[]', NULL, NULL, NULL, 0),
(375, 'verificar que disminuye el espacio', NULL, 1, NULL, NULL, 9, 208, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-12', '2025-11-14 14:40:48', NULL, NULL, '2025-11-14 14:40:48', '2025-11-14 14:40:48', '[]', NULL, NULL, NULL, 0),
(388, 'RAP GC: Bot ajustar al nuevo prompt', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-17', '2025-11-24', '2025-11-24 13:32:25', NULL, NULL, '2025-11-17 08:29:05', '2025-11-24 08:32:25', '[]', NULL, NULL, NULL, 0),
(389, 'RAP JH: rastreo en tiempo real de los clientes OK, cargar multimedia y textos en las opciones de acabados', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-17', '2025-11-19', '2025-11-19 13:43:48', NULL, NULL, '2025-11-17 08:31:12', '2025-11-19 08:43:46', '[]', NULL, NULL, NULL, 0),
(390, 'Revisar el reporte de edad de la cartera de Panacea\n', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-18', '2025-11-18 12:14:58', NULL, NULL, '2025-11-17 08:32:03', '2025-11-18 07:14:57', '[]', NULL, NULL, NULL, 0),
(391, 'Logica', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-17 16:03:20', NULL, NULL, '2025-11-17 16:03:20', '2025-11-17 16:03:20', '[]', NULL, NULL, NULL, 0),
(392, 'Fix', NULL, 9, NULL, NULL, 2, 391, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-17', '2025-11-17 21:55:19', NULL, NULL, '2025-11-17 16:03:59', '2025-11-17 16:55:18', '[]', NULL, NULL, NULL, 0),
(393, 'Acabados solo aparecer bajo condicion', 'Solo aparece si:\nEs rol id 1 ( cliente y si faltan 20 meses para la entrega de su vivienda o si no tiene seleccion de acabados en otra propiedad) ', 9, NULL, NULL, 2, 392, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-17', '2025-11-17', '2025-11-17 21:55:16', NULL, NULL, '2025-11-17 16:15:43', '2025-11-17 16:55:15', '[]', NULL, NULL, NULL, 0),
(394, 'RAD GC: mejorar el prompt de seguimiento - fichas con nombres - revisar mejoras de sinergics rol de viewer SAC', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-18', '2025-11-19', '2025-11-19 13:33:53', NULL, NULL, '2025-11-18 08:47:38', '2025-11-19 08:33:52', '[]', NULL, NULL, NULL, 0),
(395, 'Auditar app de costasol ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-18 08:51:27', NULL, NULL, '2025-11-18 08:51:27', '2025-11-18 08:51:27', '[]', NULL, NULL, NULL, 0),
(396, 'Agregar notificaciones y info de que ya tiene selección habilitada ( con un mensaje de advertencia de que si pasa el tiempo se le auto seleccióna )', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-07', '2025-12-07 20:36:45', NULL, NULL, '2025-11-18 15:53:02', '2025-12-07 15:36:44', '[]', NULL, NULL, NULL, 0),
(397, 'Rol', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-18 16:11:17', NULL, NULL, '2025-11-18 16:11:17', '2025-11-18 16:11:17', '[]', NULL, NULL, NULL, 0),
(398, 'Nuevo rol - Cliente Interesado ', 'El cliente con este rol debe tener solo habilitado un módulo el de cargar documentos ', 9, NULL, NULL, 2, 397, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-18', NULL, '2025-11-18 16:11:33', NULL, NULL, '2025-11-18 16:11:33', '2025-11-18 16:12:23', '[]', NULL, NULL, NULL, 0),
(399, 'Menu de Encuesta con fecha y disparador ', 'También tenga opciones de elegir calificaciones de 1 a 5 estrellas también debe tener comentario', 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-18', NULL, '2025-11-18 16:57:15', NULL, NULL, '2025-11-18 16:57:15', '2025-11-18 17:04:59', '[]', NULL, NULL, NULL, 0),
(400, 'Actualizar el chat nueva funcion', 'Está funcion va a poder el cliente calificar con estrellas y dejar comentarios ', 9, NULL, NULL, 2, 196, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-18', '2025-11-06', '2025-11-30 21:59:44', NULL, NULL, '2025-11-18 16:58:55', '2025-11-30 16:59:44', '[]', NULL, NULL, NULL, 0),
(401, 'RAP GC: revisar mejoras de sinergics rol de viewer SAC/descargar metrics a repositorio', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-19', '2025-11-24', '2025-11-24 13:32:35', NULL, NULL, '2025-11-19 08:41:40', '2025-11-24 08:32:35', '[]', NULL, NULL, NULL, 0),
(402, 'RAP JH:  cargar multimedia de elecciones/auditoria de app costasol/bajar metrics a vsc', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-19', '2025-11-27', '2025-11-27 13:41:03', NULL, NULL, '2025-11-19 08:45:02', '2025-11-27 08:41:01', '[]', NULL, NULL, NULL, 0),
(403, 'PAR ER: smi/objetivos/', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-02', '2025-12-02 15:55:20', NULL, NULL, '2025-11-19 08:47:42', '2025-12-02 10:55:19', '[]', NULL, NULL, NULL, 0),
(404, 'Cerrar contingencias de Arienzo', '- Patricio Echanique: Explicarle que ya hablamos con la Ab y le explicamos lo mismo que a él, que el trabajo se debe hacer por fuera (retirando el Flashing).\n\n- Whashintong Cume: No aplica reparación porque el trabajo inicial fue algo global que se realizó en los cerramientos, conclueido ese trabajo no se puede aplicar garantía en vista de que no se respetó la doble pared.\n\n- Lorena Sacoto: Se va a construir un pilar o pilarete para solucionar la falla de la separación en ambas paredes.\n\n- Josue Jara: Indicar que los elementos como las puertas son revisados y aprobados en el momento de la recepción de la propiedad.\n\n- ', 1, NULL, NULL, 15, NULL, 1, 1, 'en_progreso', 'baja', 'baja', 20.00, '2025-11-19', NULL, '0000-00-00 00:00:00', NULL, NULL, '2025-11-19 14:58:29', '2025-11-19 15:41:25', '[]', NULL, NULL, NULL, 0),
(405, 'RAP GC: descarga de metrics, ok / mejoras de sinergics', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 13:33:11', NULL, NULL, '2025-11-20 08:45:32', '2025-11-24 08:33:11', '[]', NULL, NULL, NULL, 0),
(406, 'RAP JH: revision de estructura metrics/ testear metrics, probar antigravity con meetics', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 13:33:18', NULL, NULL, '2025-11-20 08:47:19', '2025-11-24 08:33:18', '[]', NULL, NULL, NULL, 0),
(407, 'Revisar la generación de acta de elección de acabados ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 13:31:25', NULL, NULL, '2025-11-20 11:02:57', '2025-11-24 08:31:25', '[]', NULL, NULL, NULL, 0),
(408, 'Revisar motivo de panacea en emisión ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 13:31:18', NULL, NULL, '2025-11-20 11:03:25', '2025-11-24 08:31:18', '[]', NULL, NULL, NULL, 0),
(409, 'Meetings', NULL, 18, NULL, NULL, 2, NULL, 1, 1, 'en_progreso', 'media', 'media', 30.00, '2025-11-21', NULL, NULL, NULL, NULL, '2025-11-21 10:00:57', '2025-11-25 09:10:13', '[]', NULL, NULL, NULL, 0),
(410, 'Chat', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-11-21', NULL, '2025-11-21 10:01:18', NULL, NULL, '2025-11-21 10:01:18', '2025-11-25 09:16:46', '[]', NULL, NULL, NULL, 0),
(411, 'Añadir un chat bot con IA', 'Este chat bot va a estar en la paigna principal y en las meetings\n', 18, NULL, NULL, 2, 410, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-21', '2025-11-22', '2025-11-22 18:44:17', NULL, NULL, '2025-11-21 10:02:11', '2025-11-22 13:44:17', '[]', NULL, NULL, NULL, 0),
(412, 'Añadir a las tareas tipo de tarea \"proyecto\"', 'esto va a servir para saber el contexto de la reunion el chat bot debe tener el conexto completo\n', 18, NULL, NULL, 2, 410, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-21', '2025-11-22', '2025-11-22 18:44:29', NULL, NULL, '2025-11-21 10:03:42', '2025-11-22 13:44:29', '[]', NULL, NULL, NULL, 0),
(414, 'Añadir en actividasd recien ultimo acabados del cliente', NULL, 9, NULL, NULL, 2, 415, 1, 1, 'pendiente', 'media', 'media', 0.00, NULL, '2025-11-06', '2025-11-21 10:15:49', NULL, NULL, '2025-11-21 10:15:49', '2025-12-07 13:38:28', '[]', NULL, NULL, NULL, 0),
(415, 'Perfil', NULL, 9, NULL, NULL, 2, 131, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-21', NULL, '2025-11-21 10:17:06', NULL, NULL, '2025-11-21 10:17:06', '2025-11-21 10:38:11', '[]', NULL, NULL, NULL, 0),
(416, 'ver opcion de agregar informacion personal', NULL, 9, NULL, NULL, 2, 415, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-07', '2025-12-07 05:46:15', NULL, NULL, '2025-11-21 10:17:25', '2025-12-07 00:46:15', '[]', NULL, NULL, NULL, 0),
(417, 'Verificar el estado de los pqr', NULL, 9, NULL, NULL, 2, 151, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-06', '2025-11-30 21:59:41', NULL, NULL, '2025-11-21 10:22:37', '2025-11-30 16:59:42', '[]', NULL, NULL, NULL, 0),
(418, 'Verificar el estado de los pqr', NULL, 9, NULL, NULL, 2, 134, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-06', '2025-12-01 14:57:51', NULL, NULL, '2025-11-21 10:22:53', '2025-12-01 09:57:51', '[]', NULL, NULL, NULL, 0),
(419, 'Agregar summary de actividades pendientes', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-01', '2025-12-01 14:57:59', NULL, NULL, '2025-11-21 10:25:14', '2025-12-01 09:57:59', '[]', NULL, NULL, NULL, 0),
(420, 'Varita magica', 'En el chat responsable agregar un icono de icono de varita magica que al precionar me genere apartir de el texto que excribi una texto mejorado con ciertos criterior que voy colocar en el prompt:\nEl texto original no lo va a borrar, solo lo va sombrear visualmente de griss y el texto que genero la IA lo va sobrear con color verde ( no se va a enviar el texto automaticamente )\n\n-  Al precionar aparece un modal en donde estará el texto anterior y la version mejorada con la IA y vas a poder editar la verison de la IA y en el modal deben aparecer dos opción que va a ser guarda y esa lo que hara es reemplezar el texto que es en el \"chatInput\"', 9, NULL, NULL, 2, 415, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-21', '2025-12-07', '2025-12-07 06:24:25', NULL, NULL, '2025-11-21 10:30:15', '2025-12-07 01:24:25', '[]', NULL, NULL, NULL, 0),
(421, 'Añadir en propiedad si tiene garantias vigentes en el perfil del usuario', NULL, 9, NULL, NULL, 2, 415, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-21', '2025-12-07', '2025-12-07 05:46:07', NULL, NULL, '2025-11-21 10:52:02', '2025-12-07 00:46:06', '[]', NULL, NULL, NULL, 0),
(422, 'Agregar al lado de \"filter-btn\", una opcion de  \"Ver perfil\"', NULL, 9, NULL, NULL, 2, 158, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-30', '2025-11-30 21:41:47', NULL, NULL, '2025-11-21 10:55:40', '2025-11-30 16:41:47', '[]', NULL, NULL, NULL, 0),
(423, 'Ver la posibilidad de descargar transcirpcion en PDF con las imagenes incluidas', NULL, 9, NULL, NULL, 2, 415, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-07', '2025-12-07 06:31:39', NULL, NULL, '2025-11-21 10:56:09', '2025-12-07 01:31:39', '[]', NULL, NULL, NULL, 0),
(424, 'En el modal de noticias \"agregar nueva opcion de eligir etapa al enviar la notifficacion\"\"', NULL, 9, NULL, NULL, 2, 185, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-06', '2025-11-30 22:04:46', NULL, NULL, '2025-11-21 11:02:10', '2025-11-30 17:04:45', '[]', NULL, NULL, NULL, 0),
(425, 'En auidotira \"agregar en citas el tiempo en hora de esa cita\"', 'Al igual que con CTG y PQR', 9, NULL, NULL, 2, 141, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-21', '2025-11-06', '2025-11-21 11:06:16', NULL, NULL, '2025-11-21 11:06:16', '2025-11-21 11:06:43', '[]', NULL, NULL, NULL, 0),
(426, 'En el modulo de CTG y PQR añadir el que capture el status de esa misma', NULL, 9, NULL, NULL, 2, 141, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-06', '2025-11-21 11:13:04', NULL, NULL, '2025-11-21 11:13:04', '2025-11-21 11:13:04', '[]', NULL, NULL, NULL, 0),
(427, 'Captura al igual que en CTG y PQR el modelo de la urbanizacion y tambien debe mostrarlo en el detalle', NULL, 9, NULL, NULL, 2, 141, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-11-06', '2025-11-21 11:13:55', NULL, NULL, '2025-11-21 11:13:55', '2025-11-21 11:13:55', '[]', NULL, NULL, NULL, 0),
(428, 'El modulo de kits seleccionados, arreglar la visualizacion', 'Agregar los componentes, detalles y etapas \n', 9, NULL, NULL, 2, 141, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-21', '2025-11-06', '2025-11-21 11:15:14', NULL, NULL, '2025-11-21 11:15:14', '2025-11-21 11:15:57', '[]', NULL, NULL, NULL, 0),
(429, 'Agregar un acceso a modulos por usuarios', NULL, 9, NULL, NULL, 2, 141, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-25', '2025-11-06', '2025-11-30 21:16:36', NULL, NULL, '2025-11-21 11:18:56', '2025-11-30 16:16:36', '[]', NULL, NULL, NULL, 0),
(430, 'Boton de acceso a archivos ( Sharepoint )', NULL, 9, NULL, NULL, 2, 415, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-21 11:24:54', NULL, NULL, '2025-11-21 11:24:54', '2025-11-21 11:24:54', '[]', NULL, NULL, NULL, 0),
(432, 'En admin acabados agrergar en editar detalle de acabado un buscador con el filtro incluido', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-07', '2025-12-07 21:22:44', NULL, NULL, '2025-11-21 11:37:39', '2025-12-07 16:22:44', '[]', NULL, NULL, NULL, 0),
(433, 'En admin acabdos que en seleccion de cliente que en editar seleccion de cliente solo salga en paquetes de adicionales solo aparesca el selccionado', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-21 11:41:12', NULL, NULL, '2025-11-21 11:41:12', '2025-11-21 11:41:12', '[]', NULL, NULL, NULL, 0),
(434, 'Cambiar el nombre de Paquetes adiconales a complementos', 'Añadir que la porpiedad, modelo y la casa del cliente\n', 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-21', '2025-11-30', '2025-11-30 21:36:33', NULL, NULL, '2025-11-21 11:42:24', '2025-11-30 16:36:32', '[]', NULL, NULL, NULL, 0),
(435, 'Añadir que se puede exportar la seleccion de clientes en excel', NULL, 9, NULL, NULL, 2, 161, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-07', '2025-12-07 21:22:38', NULL, NULL, '2025-11-21 11:43:40', '2025-12-07 16:22:37', '[]', NULL, NULL, NULL, 0),
(436, 'De ser así, se puede inactivar porfa, es que luego de la reunión con José Javier, por el momento no se activará hasta revisar otros temas.', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-21', '2025-11-21 18:00:18', NULL, NULL, '2025-11-21 12:46:56', '2025-11-21 13:00:17', '[]', NULL, NULL, NULL, 0),
(437, 'Sistemas CTV dame acceso a estos formularios', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-21', '2025-11-21 17:55:31', NULL, NULL, '2025-11-21 12:47:15', '2025-11-21 12:55:29', '[]', NULL, NULL, NULL, 0),
(448, 'RAP GC: login en admin sinergics / pendientes de sinergics / vista de leads no contestados por el bot', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-25', '2025-11-25 13:50:10', NULL, NULL, '2025-11-24 08:34:44', '2025-11-25 08:50:10', '[]', NULL, NULL, NULL, 0),
(449, 'RAP JH: app CS, reunión con JQ interfaz / Metrics, construir el back', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-27', '2025-11-27 13:40:33', NULL, NULL, '2025-11-24 08:37:18', '2025-11-27 08:40:32', '[]', NULL, NULL, NULL, 0),
(452, 'Crear usuario y biometrico nuevo fiscalizador ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-25', '2025-11-25 13:47:13', NULL, NULL, '2025-11-24 09:39:49', '2025-11-25 08:47:13', '[]', NULL, NULL, NULL, 0),
(453, 'Crear dominio metrics.costasol.com.ec', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-02', '2025-12-02 15:55:12', NULL, NULL, '2025-11-24 10:04:25', '2025-12-02 10:55:11', '[]', NULL, NULL, NULL, 0),
(454, 'reunion comite sac 241125', 'inhibidor: los particpantes estuvieron fuera de oficina', 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-25', '2025-11-25 13:46:38', NULL, NULL, '2025-11-24 11:16:08', '2025-11-25 08:46:37', '[]', NULL, NULL, NULL, 0),
(455, 'Reunión de planificación 24/11/2025\n', NULL, 1, NULL, NULL, 15, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-24 11:39:09', NULL, NULL, '2025-11-24 11:39:09', '2025-11-24 11:39:09', '[]', NULL, NULL, NULL, 0),
(456, 'Ver viabilidad de agregar nota dentro de la reunión cuando se graba cuando se sube un audio', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 17:45:47', NULL, NULL, '2025-11-24 11:39:39', '2025-11-24 12:45:47', '[]', NULL, NULL, NULL, 0),
(457, 'Planics mejoras 241125', NULL, 7, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-25', '2025-11-25 15:19:04', NULL, NULL, '2025-11-24 11:46:52', '2025-11-25 10:19:04', '[]', NULL, NULL, NULL, 0),
(458, 'Cambiar descripcion por Observacion, esto servirá para guardar comentarios, inhibidores, notas', NULL, 1, NULL, NULL, 9, 457, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-24', '2025-11-24 22:07:18', NULL, NULL, '2025-11-24 11:47:18', '2025-11-24 17:07:17', '[]', NULL, NULL, NULL, 0),
(459, 'vista semanal (hoy - 7 dias), mes anterior, rango (mes actual-default)', NULL, 1, NULL, NULL, 9, 457, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-25', '2025-11-25 15:18:58', NULL, NULL, '2025-11-24 11:56:06', '2025-11-25 10:18:58', '[]', NULL, NULL, NULL, 0),
(460, 'cuando doy clic en atrasadas, se muestran en tabla junto con el campo observacion (que contiene los inhibidores)', NULL, 1, NULL, NULL, 9, 457, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-24', '2025-11-24 22:30:00', NULL, NULL, '2025-11-24 11:57:04', '2025-11-24 17:29:59', '[]', NULL, NULL, NULL, 0),
(462, 'Dashboard', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'en_progreso', 'media', 'media', 85.00, '2025-11-24', NULL, NULL, NULL, NULL, '2025-11-24 12:07:06', '2025-12-02 14:57:50', '[]', NULL, NULL, NULL, 0),
(463, 'Quitar en progreso, pendientes ', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-25', '2025-11-25 17:41:17', NULL, NULL, '2025-11-24 12:08:13', '2025-11-25 12:41:16', '[]', NULL, NULL, NULL, 0),
(464, 'Ordernas las card', 'Total - importante \nCompletada, atrasada, programada y sin fecha ', 7, NULL, NULL, 2, 462, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-25', '2025-11-25 15:19:20', NULL, NULL, '2025-11-24 12:11:11', '2025-11-25 10:19:20', '[]', NULL, NULL, NULL, 0),
(466, 'Agregar que se abran las cards de completada, etc', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-24', '2025-11-25', '2025-11-25 17:41:15', NULL, NULL, '2025-11-24 12:15:11', '2025-11-25 12:41:14', '[]', NULL, NULL, NULL, 0),
(467, 'En la card de atrasada que solo en ese caso se ve la descripción ( inhibidor ) ', NULL, 7, NULL, NULL, 2, 466, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-25', '2025-11-25 17:41:13', NULL, NULL, '2025-11-24 12:16:10', '2025-11-25 12:41:13', '[]', NULL, NULL, NULL, 0),
(471, 'RAP GC: sinergics: que las api apunten con los usuarios logeados / pendientes de sinergics / agregar opcion para subir hitos de liberacion en panel admin sinergics', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-25', '2025-11-27', '2025-11-27 13:40:24', NULL, NULL, '2025-11-25 08:51:53', '2025-11-27 08:40:22', '[]', NULL, NULL, NULL, 0),
(472, 'El transcrip hacerlo scroleble no que se despliegue hasta el fin ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-25', NULL, '2025-11-25 09:05:12', NULL, NULL, '2025-11-25 09:05:12', '2025-11-25 09:05:43', '[]', NULL, NULL, NULL, 0),
(473, 'Los participantes solo puedan editar las notas lo demás no, solo el dueño ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 18:21:51', NULL, NULL, '2025-11-25 09:11:26', '2025-11-26 13:21:50', '[]', NULL, NULL, NULL, 0),
(474, 'Arreglar la UIX de record', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-25 09:16:14', NULL, NULL, '2025-11-25 09:16:14', '2025-11-25 09:16:14', '[]', NULL, NULL, NULL, 0),
(475, 'En el chat que antes de responder corriga las ortografías', NULL, 18, NULL, NULL, 2, 410, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 18:07:41', NULL, NULL, '2025-11-25 09:16:32', '2025-11-26 13:07:40', '[]', NULL, NULL, NULL, 0),
(476, 'Agregar rol de visualizar pueden ver todas reuniones ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-25 09:17:57', NULL, NULL, '2025-11-25 09:17:57', '2025-11-25 09:17:57', '[]', NULL, NULL, NULL, 0),
(477, 'Agregar un buscador de reuniones ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 17:30:58', NULL, NULL, '2025-11-25 09:26:10', '2025-11-26 12:30:58', '[]', NULL, NULL, NULL, 0),
(478, 'Opciones de ver más reuniónes', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 17:30:53', NULL, NULL, '2025-11-25 09:26:52', '2025-11-26 12:30:53', '[]', NULL, NULL, NULL, 0),
(479, 'Cuando se descarga el PDF también debe traer las tareas ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-25 09:27:40', NULL, NULL, '2025-11-25 09:27:40', '2025-11-25 09:27:40', '[]', NULL, NULL, NULL, 0),
(480, 'Agregar que se puedan eliminar las reuniones desde el dashboard ', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 17:42:57', NULL, NULL, '2025-11-25 09:28:30', '2025-11-26 12:42:56', '[]', NULL, NULL, NULL, 0),
(481, 'Cambiar modelo de gpt', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 18:19:57', NULL, NULL, '2025-11-25 09:30:10', '2025-11-26 13:19:57', '[]', NULL, NULL, NULL, 0),
(482, 'Agregar lógica en el chat, que solo puede traer las reuniones tuyas y las que eres participante ', 'Agregar roles de gerencia y visualizador la unica diferencia que el rol gerencia puede ver en el chat todas reuniones sean suyas o no ', 18, NULL, NULL, 2, 409, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-25', '2025-11-26', '2025-11-26 18:07:08', NULL, NULL, '2025-11-25 09:33:13', '2025-11-26 13:07:07', '[]', NULL, NULL, NULL, 0),
(486, 'Poner contador de notificaciones en icono de planics ', NULL, 7, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-25 10:40:53', NULL, NULL, '2025-11-25 10:40:53', '2025-11-25 10:40:58', '[]', NULL, NULL, NULL, 0),
(487, 'Verificar la asignación de usuarios en las tareas', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-26', '2025-11-26 16:16:30', NULL, NULL, '2025-11-25 17:25:42', '2025-11-26 11:16:29', '[]', NULL, NULL, NULL, 0),
(488, 'RAP GC: pendientes de sinergics / Contratos en sinergics: agregar un filtro que muestre los proyectos por contratos', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-27', '2025-12-01', '2025-12-01 15:03:56', NULL, NULL, '2025-11-27 08:40:18', '2025-12-01 10:03:56', '[]', NULL, NULL, NULL, 0),
(489, 'RAP JH: app CS reunión con JQ interfaz / cargar multimedia de elecciones / AuditoriCS / MetriCS RAP-vg-pa-sgd', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-01', '2025-12-01 15:03:48', NULL, NULL, '2025-11-27 08:44:03', '2025-12-01 10:03:48', '[]', NULL, NULL, NULL, 0),
(490, 'Compu de Marilin ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-02', '2025-12-02 15:55:06', NULL, NULL, '2025-11-27 09:44:23', '2025-12-02 10:55:05', '[]', NULL, NULL, NULL, 0),
(491, 'Compu de obra ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-02', '2025-12-02 13:38:07', NULL, NULL, '2025-11-27 09:44:31', '2025-12-02 08:38:06', '[]', NULL, NULL, NULL, 0),
(492, 'Compu legal', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-11-27 09:44:36', NULL, NULL, '2025-11-27 09:44:36', '2025-11-27 09:44:36', '[]', NULL, NULL, NULL, 0),
(493, 'Metrics', NULL, 20, NULL, NULL, 2, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-11-28', NULL, '2025-11-28 09:47:51', NULL, NULL, '2025-11-28 09:47:51', '2025-12-05 19:10:39', '[]', NULL, NULL, NULL, 0),
(494, 'Rap Semanal', 'El colaborador va poder', 20, NULL, NULL, 2, 493, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-11-28', NULL, '2025-11-28 09:50:41', NULL, NULL, '2025-11-28 09:50:41', '2025-11-28 11:33:06', '[]', NULL, NULL, NULL, 0),
(495, 'En la vista del jefe, el debe de poder asignar a uno de su equipo como secretario ', 'esta opcion le debe salir ', 20, NULL, NULL, 2, 494, 1, 1, 'completada', 'media', 'media', 100.00, '2025-11-28', '2025-11-28', '2025-11-28 21:18:07', NULL, NULL, '2025-11-28 10:19:55', '2025-11-28 16:18:06', '[]', NULL, NULL, NULL, 0),
(496, 'Las ventaja ganadora solo debe aparecer segun tu estructura organizacional y no a todo el mundo', NULL, 20, NULL, NULL, 2, 494, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-28', '2025-11-28 19:52:46', NULL, NULL, '2025-11-28 10:27:32', '2025-11-28 14:52:45', '[]', NULL, NULL, NULL, 0),
(497, 'En home revisar que si salga los pendientes correctamente: ejemplo No haz marcado la rap diaria', NULL, 20, NULL, NULL, 2, 494, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-04', '2025-12-04 15:56:52', NULL, NULL, '2025-11-28 11:32:11', '2025-12-04 10:56:51', '[]', NULL, NULL, NULL, 0),
(498, 'En SGD verificar que se puede crear las delegciones desde la creacion del objetivo', NULL, 20, NULL, NULL, 2, 493, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-11-28', '2025-11-28 21:18:11', NULL, NULL, '2025-11-28 11:33:35', '2025-11-28 16:18:10', '[]', NULL, NULL, NULL, 0),
(499, 'AgenteCS', NULL, 21, NULL, NULL, 2, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-11-28', NULL, '2025-11-28 23:21:47', NULL, NULL, '2025-11-28 23:21:47', '2025-11-28 23:21:53', '[]', NULL, NULL, NULL, 0),
(502, 'Enviar correo a Tituana del río para trabajos conversados con él', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', NULL, '2025-12-01 08:12:46', NULL, NULL, '2025-12-01 08:12:46', '2025-12-04 08:43:45', '[]', NULL, NULL, NULL, 0),
(503, 'Enviar correo de materiales necesarios para hidrantes de la etapa 10 y 11', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-03', '2025-12-04 13:43:42', NULL, NULL, '2025-12-01 08:33:19', '2025-12-04 08:43:42', '[]', NULL, NULL, NULL, 0),
(504, 'Enviar correo con las fechas de fedatario de las casas prontas a subir', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 20:20:06', NULL, NULL, '2025-12-01 08:34:33', '2025-12-02 15:20:11', '[]', NULL, NULL, NULL, 0),
(505, 'Enviar correo con las fechas de fedatario de la sala de ventas y la villa Faba de CATANIA', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 15:58:51', NULL, NULL, '2025-12-01 08:35:15', '2025-12-02 10:58:52', '[]', NULL, NULL, NULL, 0),
(506, 'Entregar detalle solicitados por CIVCOEN', 'REVISAR LOS CORREOS ENVIADOS POR ELLOS Y DAR RESPUESTA', 23, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-04', '2025-12-05 12:47:19', NULL, NULL, '2025-12-01 08:40:52', '2025-12-05 07:47:19', '[]', NULL, NULL, NULL, 0),
(507, 'Corregir detalle de perfil para ventanales de dormitorios en departamentos', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 20:20:30', NULL, NULL, '2025-12-01 09:11:04', '2025-12-02 15:20:31', '[]', NULL, NULL, NULL, 0),
(508, 'Cotizar diseño de interiores de las villas modelos de DAVOS, ALOA PLUS y HANA PLUS', 'Se debe enviar arquitectura en Revit a la arquitecta Silvia silvia.saab@gmail.com, copiar a María Luisa para que continúe la negociación.', 27, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-15', '2025-12-19', '2025-12-04 14:46:03', NULL, NULL, '2025-12-01 09:13:56', '2025-12-04 09:46:02', '[]', NULL, NULL, NULL, 0),
(509, 'Actualizar planos totales de torre B CATANIA con todos los comentarios y observaciones de la A', 'Corregir acceso a área verde del lago\nSolicitar Planos estructurales a SEDEMI', 28, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', '2025-12-29', '2025-12-01 09:16:20', NULL, NULL, '2025-12-01 09:16:20', '2025-12-02 08:19:40', '[]', NULL, NULL, NULL, 0),
(510, 'Realizar planos de acabados de la torre B de CATANIA', NULL, 28, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-08', '2025-12-29', '2025-12-01 09:16:40', NULL, NULL, '2025-12-01 09:16:40', '2025-12-02 08:19:50', '[]', NULL, NULL, NULL, 0),
(511, 'Realizar planos de acabados de la torre E de DAVOS', 'Solicitar las plantas arq actualizadas a Merlyn', 27, NULL, NULL, 19, 513, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-04', '2025-12-04 04:12:01', NULL, NULL, '2025-12-01 09:17:20', '2025-12-03 23:12:00', '[]', NULL, NULL, NULL, 0),
(512, 'Realizar planos de acabados de la torre D de DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', '2025-12-29', '2025-12-01 09:17:46', NULL, NULL, '2025-12-01 09:17:46', '2025-12-02 08:22:56', '[]', NULL, NULL, NULL, 0),
(513, 'Entregar diseño y ubicación de tachos de basura y bancos para DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', '2025-12-29', '2025-12-01 09:19:23', NULL, NULL, '2025-12-01 09:19:23', '2025-12-02 08:33:24', '[]', NULL, NULL, NULL, 0),
(514, 'Realizar planos de todas las amenidades de DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', '2025-12-29', '2025-12-01 09:19:52', NULL, NULL, '2025-12-01 09:19:52', '2025-12-02 08:31:23', '[]', NULL, NULL, NULL, 0),
(515, 'Terminar diseño remate de adoquín en ingreso y salida de CATANIA', NULL, 27, NULL, NULL, 19, 511, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-05', '2025-12-04 13:33:23', NULL, NULL, '2025-12-01 09:22:33', '2025-12-04 08:33:22', '[]', NULL, NULL, NULL, 0),
(516, 'solicitar disposiciones técnicas de bomberos para la torre D y E de DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', '2025-12-11', '2025-12-01 09:30:43', NULL, NULL, '2025-12-01 09:30:43', '2025-12-02 09:51:36', '[]', NULL, NULL, NULL, 0),
(517, 'Obtener aprobación de la parte hidrosanitaria SCI de la torre B', NULL, 28, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-01', '2025-12-11', '2025-12-01 09:31:08', NULL, NULL, '2025-12-01 09:31:08', '2025-12-02 15:21:44', '[]', NULL, NULL, NULL, 0),
(518, 'RAP JH: app CS cambios en interfaz / cargar multimedia de elecciones acabados / MetriCS Home / TickeCS', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 13:36:18', NULL, NULL, '2025-12-01 10:03:21', '2025-12-02 08:36:17', '[]', NULL, NULL, NULL, 0),
(519, 'RAP GC: pendientes de sinergics fecha prometida poner justificativo y calcular los tiempos/ ', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 13:35:26', NULL, NULL, '2025-12-01 10:04:02', '2025-12-02 08:35:25', '[]', NULL, NULL, NULL, 0),
(522, 'Observaciones de MetricaCS', NULL, 26, NULL, NULL, 16, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-01', NULL, '2025-12-01 14:30:54', NULL, NULL, '2025-12-01 14:30:54', '2025-12-01 14:31:25', '[]', NULL, NULL, NULL, 0),
(523, 'En Acciones Pendientes solo estarán las evidencias pendientes de registrar? Si es así, sugiero que el nombre de la sección sea tal cual “Resultados y evidencias pendientes”.', 'URL: https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/EeQYKFWyM0dPq5TtOe6He9gBTnlmsbIbu26dY8QRrRveeg?e=7PY6Ki', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 21:12:21', NULL, NULL, '2025-12-01 14:32:03', '2025-12-02 16:12:21', '[]', NULL, NULL, NULL, 0),
(524, 'Aparecen 2 inhibidores activos pendientes, pero en realidad solo he creado 1. Adicional, cuando ingreso a esa acción pendiente me redirecciona al menú de SGD, no al de ventaja competitiva.', 'URL: https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/EXfduVCBl69Pg0uoKhHROC8Byu78sDG87LqV_krLub58pA?e=ttqlFA', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 20:52:27', NULL, NULL, '2025-12-01 14:40:52', '2025-12-02 15:52:27', '[]', NULL, NULL, NULL, 0),
(525, 'Confunde un poco que el anillo empiece de inaceptable a excepcional y que los rectángulos de abajo de las medidas empiecen de excepcional a inaceptable. Se puede poner el rango sobre el semi anillo? S', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/EbnMM6qEKhtEnKxH1b_aDPUBWz9wowa8cbCJFrlYh5uzcQ?e=Ns1Jec', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-03', '2025-12-03 13:11:33', NULL, NULL, '2025-12-01 14:45:38', '2025-12-03 08:11:34', '[]', NULL, NULL, NULL, 0),
(526, 'Es correcto que como Colaborador yo pueda seleccionar estas opciones? No debería ser solo el jefe?', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/ESwHJHWeTVtCm1JJIAnMsJYBRAWmHewxd9WqF94F7ZKLeQ?e=2Y1DAg', 26, NULL, NULL, 16, 522, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-01', NULL, '2025-12-01 14:50:48', NULL, NULL, '2025-12-01 14:50:48', '2025-12-01 14:51:02', '[]', NULL, NULL, NULL, 0),
(527, 'Cuando solicito aprobación de un objetivo, al enviarse la solicitud aparece como \"Vacia\" la información del objetivo.', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/EUMYKLRZhWZGgyWF4s5FHP8BKB3csbisGOZuc0Ql1xYB-Q?e=OakfVB', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 20:54:22', NULL, NULL, '2025-12-01 14:52:58', '2025-12-02 15:54:22', '[]', NULL, NULL, NULL, 0),
(528, 'Al dar clic sobre el día de la reunión se marca automáticamente como que asistí. Entonces cuando llegará al estado de Sin Registrar, Justificación pendiente, Justificado, No hubo RAP?.\nAdicional, la n', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/Ea91KqhpMaNJrvOO_gzHbcEBAds071CPfgyyvOostMhXbA?e=dHgrSt', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 21:12:45', NULL, NULL, '2025-12-01 15:14:21', '2025-12-02 16:12:44', '[]', NULL, NULL, NULL, 0),
(529, 'El último grupo de \"S5\" es \"Mensual\", no semana 5', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/ERbkjZC1Pa5NsCw0bGB_HOcBlqJWLk4PzmbEGLD0SfeebQ?e=zfmU8M', 26, NULL, NULL, 16, 522, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-01', NULL, '2025-12-01 15:17:23', NULL, NULL, '2025-12-01 15:17:23', '2025-12-01 15:17:40', '[]', NULL, NULL, NULL, 0),
(530, 'Se debe escoger solo 1 inhibidor como ventaja ganadora, no 3.', 'https://constv-my.sharepoint.com/:i:/g/personal/controller_thaliavictoria_com_ec/Ed5KLrhKpexElJFiKy9etYcBZLzTdmby2gg1GieHsv9ypA?e=txEc20', 26, NULL, NULL, 16, 522, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-01', '2025-12-02', '2025-12-02 20:54:55', NULL, NULL, '2025-12-01 15:21:11', '2025-12-02 15:54:55', '[]', NULL, NULL, NULL, 0),
(531, 'Enviar planos de cerramiento frontal y nivel de talud junto a garita de DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-02', '2025-12-11', '2025-12-05 17:10:13', NULL, NULL, '2025-12-02 08:21:01', '2025-12-05 12:10:14', '[]', NULL, NULL, NULL, 0),
(532, 'Actualizar torre E de DAVOS con los comentarios de las reunión con contratista', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-02', '2025-12-04', '2025-12-05 04:54:31', NULL, NULL, '2025-12-02 08:26:21', '2025-12-04 23:54:32', '[]', NULL, NULL, NULL, 0),
(533, 'Piletas ', NULL, 27, NULL, NULL, 19, 514, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-26', '2025-12-02 08:30:02', NULL, NULL, '2025-12-02 08:30:02', '2025-12-02 08:30:02', '[]', NULL, NULL, NULL, 0),
(534, 'Calistenia', NULL, 27, NULL, NULL, 19, 514, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-26', '2025-12-02 08:30:08', NULL, NULL, '2025-12-02 08:30:08', '2025-12-02 08:30:08', '[]', NULL, NULL, NULL, 0),
(535, 'Music', NULL, 27, NULL, NULL, 19, 514, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-26', '2025-12-02 08:30:14', NULL, NULL, '2025-12-02 08:30:14', '2025-12-02 08:30:14', '[]', NULL, NULL, NULL, 0),
(536, 'Zoom Room', NULL, 27, NULL, NULL, 19, 514, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-26', '2025-12-02 08:30:23', NULL, NULL, '2025-12-02 08:30:23', '2025-12-02 08:30:23', '[]', NULL, NULL, NULL, 0),
(537, 'Camineras corredores verdes', NULL, 27, NULL, NULL, 19, 514, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-26', '2025-12-02 08:31:08', NULL, NULL, '2025-12-02 08:31:08', '2025-12-02 08:31:08', '[]', NULL, NULL, NULL, 0),
(538, 'RAP GC: pendientes de sinergics / mejorar panel admin para asignacion / traer de hubspot propietario del lead, notas, llamadas, reuniones, tareas', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-02', '2025-12-03', '2025-12-03 13:28:24', NULL, NULL, '2025-12-02 08:35:20', '2025-12-03 08:28:24', '[]', NULL, NULL, NULL, 0),
(539, 'RAP JH: app CS cambios en interfaz / cargar multimedia de elecciones acabados / MetriCS Home / TickeCS responsive / Planics guardar archivos', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-02', '2025-12-03', '2025-12-03 13:27:29', NULL, NULL, '2025-12-02 08:37:07', '2025-12-03 08:27:29', '[]', NULL, NULL, NULL, 0),
(540, 'Revisar y realizar muros de DAVOS conversado con Esteban y Tituana', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-02', NULL, '2025-12-02 08:50:51', NULL, NULL, '2025-12-02 08:50:51', '2025-12-04 08:43:47', '[]', NULL, NULL, NULL, 0),
(541, 'Totem de ventas pantalla tactil!', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-02 09:13:02', NULL, NULL, '2025-12-02 09:13:02', '2025-12-02 09:13:02', '[]', NULL, NULL, NULL, 0),
(542, 'Arreglar filtro - no está filtrando bien las fechas', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-02 14:49:25', NULL, NULL, '2025-12-02 14:49:25', '2025-12-02 14:49:25', '[]', NULL, NULL, NULL, 0),
(543, 'Añadir botón en dónde está ver todas las tareas que se pueda exportar en excel ', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-02 14:51:03', NULL, NULL, '2025-12-02 14:51:03', '2025-12-02 14:51:03', '[]', NULL, NULL, NULL, 0),
(544, 'Realizar excel con objetivos y palancas para los colaboradores de diseño', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-02', '2025-12-05', '2025-12-02 15:18:20', NULL, NULL, '2025-12-02 15:18:20', '2025-12-02 15:18:40', '[]', NULL, NULL, NULL, 0),
(545, 'RAP JH: app CS cambios en interfaz / cargar multimedia de elecciones acabados / TickeCS responsive / Planics guardar archivos', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-03', '2025-12-04', '2025-12-04 13:51:12', NULL, NULL, '2025-12-03 08:27:26', '2025-12-04 08:51:12', '[]', NULL, NULL, NULL, 0),
(546, 'RAP GC: pendientes de sinergics / mejorar panel admin para asignacion / traer de hubspot propietario del lead, notas, llamadas, reuniones, tareas / Booking', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-03', '2025-12-04', '2025-12-04 13:51:03', NULL, NULL, '2025-12-03 08:28:14', '2025-12-04 08:51:03', '[]', NULL, NULL, NULL, 0),
(547, 'Palanca 1.1', NULL, 30, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-03', NULL, '2025-12-03 10:52:21', NULL, NULL, '2025-12-03 10:52:21', '2025-12-03 11:13:55', '[]', NULL, NULL, NULL, 0),
(548, 'Palanca 1.2', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-03 11:17:33', NULL, NULL, '2025-12-03 11:17:33', '2025-12-03 11:17:33', '[]', NULL, NULL, NULL, 0),
(549, 'Hablar con legal tema JH y rol', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-03 16:22:50', NULL, NULL, '2025-12-03 16:22:50', '2025-12-03 16:22:50', '[]', NULL, NULL, NULL, 0),
(550, 'Revisar la asignacion de usuario', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-04 08:33:40', NULL, NULL, '2025-12-04 08:33:40', '2025-12-04 08:33:40', '[]', NULL, NULL, NULL, 0),
(551, 'Opcion de eliminar un proyecto, un proyecto solo sin tareas', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-04 08:35:12', NULL, NULL, '2025-12-04 08:35:12', '2025-12-04 08:35:12', '[]', NULL, NULL, NULL, 0),
(552, 'agregar opción de marcar como completada en otro lado', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-04 08:36:52', NULL, NULL, '2025-12-04 08:36:52', '2025-12-04 08:36:52', '[]', NULL, NULL, NULL, 0),
(553, 'Añadir abjuntos', 'solo subir, fotos, videos, docs\n', 7, NULL, NULL, 2, 127, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-12-04', NULL, '2025-12-04 08:37:35', NULL, NULL, '2025-12-04 08:37:35', '2025-12-04 08:38:21', '[]', NULL, NULL, NULL, 0),
(554, 'Crear carpeta de shearpoint para almacenar documentos', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'pendiente', 'alta', 'baja', 0.00, '2025-12-04', NULL, '2025-12-04 08:39:12', NULL, NULL, '2025-12-04 08:39:12', '2025-12-04 08:40:01', '[]', NULL, NULL, NULL, 0),
(555, 'RAP GC: pendientes de sinergics / mejorar panel admin para asignacion / traer de hubspot propietario del lead, notas, llamadas, reuniones, tareas / Booking prioridad', NULL, 31, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-04', '2025-12-08', '2025-12-08 14:03:47', NULL, NULL, '2025-12-04 08:50:15', '2025-12-08 09:03:46', '[]', NULL, NULL, NULL, 0),
(556, 'RAP JH: app CS cambios en interfaz / dar seguimiento por correo al requerimiento para cargar multimedia de elecciones acabados / TickeCS responsive / Planics guardar archivos / METRICS prioridad', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-04', '2025-12-08', '2025-12-08 14:01:52', NULL, NULL, '2025-12-04 08:52:13', '2025-12-08 09:01:51', '[]', NULL, NULL, NULL, 0);
INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `proyecto_id`, `departamento_id`, `asignado_a`, `creado_por`, `tarea_padre_id`, `tipos_tareas_id`, `nivel_esquema`, `estado`, `prioridad`, `importancia`, `progreso`, `fecha_inicio`, `fecha_vencimiento`, `fecha_completada`, `tiempo_estimado`, `tiempo_real`, `fecha_creacion`, `fecha_actualizacion`, `adjuntos_url`, `asignados`, `ai_level`, `division`, `is_ticket`) VALUES
(557, 'Realizar diseño de cocina estándar y max con sus accesorios para las villas nuevas, HANA, ALOA, INOA', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-04', NULL, '2025-12-04 09:33:44', NULL, NULL, '2025-12-04 09:33:44', '2025-12-04 09:33:57', '[]', NULL, NULL, NULL, 0),
(558, 'Enviar plano de señalética para indicar que tenemos un reductor de velocidad en la vía principal entrada Catania Davos', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '2025-12-04', NULL, '2025-12-04 09:35:03', NULL, NULL, '2025-12-04 09:35:03', '2025-12-05 07:47:40', '[]', NULL, NULL, NULL, 0),
(559, 'Realizar detalle de puerta peatonal en portón de ingreso', NULL, 32, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-04', NULL, '2025-12-04 09:48:32', NULL, NULL, '2025-12-04 09:48:32', '2025-12-04 09:48:45', '[]', NULL, NULL, NULL, 0),
(560, 'Realizar planos constructivos con acabados de los contratos 13 al 15 y enviar a PRE', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-04', '2025-12-18', '2025-12-04 09:50:31', NULL, NULL, '2025-12-04 09:50:31', '2025-12-04 09:50:51', '[]', NULL, NULL, NULL, 0),
(561, 'dpe: Conseguir diseño de riego de DAVOS', NULL, 27, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-04', '2025-12-12', '2025-12-04 09:51:53', NULL, NULL, '2025-12-04 09:51:53', '2025-12-04 09:52:16', '[]', NULL, NULL, NULL, 0),
(562, 'Delegar objetivos y palancas del SGD en MetriCS.', NULL, 1, NULL, NULL, 17, NULL, 1, 1, 'completada', 'media', 'alta', 100.00, '2025-12-04', '2025-12-04', '2025-12-05 20:13:44', NULL, NULL, '2025-12-04 15:10:34', '2025-12-05 15:13:44', '[]', NULL, NULL, NULL, 0),
(563, 'Enviar a Erick toda la documentación digital del SGD.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-04', '2025-12-04', '2025-12-04 20:51:48', NULL, NULL, '2025-12-04 15:18:17', '2025-12-05 16:54:58', '[]', NULL, NULL, NULL, 0),
(564, 'Comunicar a colaboradores que empiecen el curso de SGD en AcademiCS.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, '2025-12-08', '2025-12-08', '2025-12-04 15:18:58', NULL, NULL, '2025-12-04 15:18:58', '2025-12-05 17:09:07', '[]', NULL, NULL, NULL, 0),
(566, 'Obtener Hallazgos sobre cronograma actualizado Accionadisa e Inhibidores', NULL, 1, NULL, NULL, 16, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-05', '2025-12-05', '2025-12-04 15:55:24', NULL, NULL, '2025-12-04 15:55:24', '2025-12-04 16:02:15', '[]', NULL, NULL, NULL, 0),
(567, 'Vista principal ', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'en_progreso', 'baja', 'baja', 65.00, '2025-12-04', NULL, NULL, NULL, NULL, '2025-12-04 15:56:02', '2025-12-04 16:00:27', '[]', NULL, NULL, NULL, 0),
(568, 'Agregar que si tiene importancia alta se coloque en el filtro de importante ', NULL, 7, NULL, NULL, 2, 567, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-04 15:56:30', NULL, NULL, '2025-12-04 15:56:30', '2025-12-04 15:56:30', '[]', NULL, NULL, NULL, 0),
(569, 'Realizar plano de cerramientos medianeros de Davos en villas no adosadas al lindero posterior.', NULL, 33, NULL, NULL, 22, NULL, 1, 1, 'pendiente', 'media', 'media', 0.00, '0000-00-00', '0000-00-00', '0000-00-00 00:00:00', NULL, NULL, '2025-12-05 08:23:15', '2025-12-05 08:25:15', '[]', NULL, NULL, NULL, 0),
(570, 'Modificar plano eléctrico exterior de Davos (reubicación de postes)', NULL, 1, NULL, NULL, 20, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-19', '2025-12-05 08:33:10', NULL, NULL, '2025-12-05 08:33:10', '2025-12-05 08:34:19', '[]', NULL, NULL, NULL, 0),
(571, 'Validar actualización de villas en SinergiCS. Información de Status.', NULL, 1, NULL, NULL, 16, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-05', '2025-12-05', '2025-12-05 08:43:53', NULL, NULL, '2025-12-05 08:43:53', '2025-12-05 08:44:03', '[]', NULL, NULL, NULL, 0),
(572, 'Solicitar pago a contratista que realizará planos asbuilt de la etapa CATANIA', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-08', '2025-12-10', '2025-12-05 14:06:28', NULL, NULL, '2025-12-05 14:06:28', '2025-12-05 14:07:11', '[]', NULL, NULL, NULL, 0),
(573, 'Registrarme en AcademiCS.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'completada', 'media', 'media', 100.00, '2025-12-05', '2025-12-05', '2025-12-05 20:15:49', NULL, NULL, '2025-12-05 15:14:01', '2025-12-05 17:10:23', '[]', NULL, NULL, NULL, 0),
(574, 'Auditar 8 RAPs Diarias hasta el 10 de diciembre.', NULL, 34, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-12-04', '2025-12-10', '2025-12-05 16:47:11', NULL, NULL, '2025-12-05 16:47:11', '2025-12-05 17:08:30', '[]', NULL, NULL, NULL, 0),
(575, 'Auditar 3 RAPs Semanales hasta el 10 de diciembre.', NULL, 34, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'media', 'baja', 0.00, '2025-12-04', '2025-12-10', '2025-12-05 16:47:52', NULL, NULL, '2025-12-05 16:47:52', '2025-12-05 17:13:18', '[]', NULL, NULL, NULL, 0),
(576, 'Reunirse para analizar la oportunidad de mejora en seguimiento de compromisos en reuniones (fusión entre MeetiCS y PlaniCS).', NULL, 34, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-12-04', '2025-12-10', '2025-12-05 16:52:56', NULL, NULL, '2025-12-05 16:52:56', '2025-12-05 17:08:26', '[]', NULL, NULL, NULL, 0),
(577, 'Campaña de registro de colaboradores en AcademiCS con instructivo.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'alta', 'baja', 0.00, '2025-12-04', '2025-12-05', '2025-12-05 16:55:22', NULL, NULL, '2025-12-05 16:55:22', '2025-12-05 17:13:25', '[]', NULL, NULL, NULL, 0),
(578, 'Enviar a Eleam capturas de pantalla sobre AcademiCS.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'completada', 'alta', 'alta', 100.00, '2025-12-04', '2025-12-04', '2025-12-06 03:34:38', NULL, NULL, '2025-12-05 16:57:16', '2025-12-05 22:34:40', '[]', NULL, NULL, NULL, 0),
(579, 'Analizar información digital del SGD y elaborar curso en AcademiCS.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, '2025-12-04', '2025-12-05', '2025-12-05 16:58:03', NULL, NULL, '2025-12-05 16:58:03', '2025-12-05 17:09:04', '[]', NULL, NULL, NULL, 0),
(580, 'Seguimiento de que los colaboradores estén realizando el curso del SGD.', NULL, 35, NULL, NULL, 17, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, '2025-12-08', '2025-12-10', '2025-12-05 16:58:49', NULL, NULL, '2025-12-05 16:58:49', '2025-12-05 17:09:08', '[]', NULL, NULL, NULL, 0),
(581, 'Enviar correo a Henry Ponce por el aprobado de la ET4', NULL, 23, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-08', '2025-12-05 17:04:12', NULL, NULL, '2025-12-05 17:04:12', '2025-12-05 17:04:21', '[]', NULL, NULL, NULL, 0),
(582, 'Revisar Planos de clientes', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 07:44:12', NULL, NULL, '2025-12-08 07:44:12', '2025-12-08 07:44:12', '[]', NULL, NULL, NULL, 0),
(583, 'Entregar lista actualizada de las villas de los nuevos contratos donde se deben sacar las Andreas y la Inoa Plus', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 07:46:15', NULL, NULL, '2025-12-08 07:46:15', '2025-12-08 07:46:15', '[]', NULL, NULL, NULL, 0),
(584, 'Terminar plano de muros medianeros para villas a construir', NULL, 1, NULL, NULL, 19, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 07:46:41', NULL, NULL, '2025-12-08 07:46:41', '2025-12-08 07:46:41', '[]', NULL, NULL, NULL, 0),
(585, 'Hacer que los compromisos se guarden en planics', NULL, 20, NULL, NULL, 2, 493, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 08:27:11', NULL, NULL, '2025-12-08 08:27:11', '2025-12-08 08:27:11', '[]', NULL, NULL, NULL, 0),
(586, 'Mejorar la UIX hacerlo responsive ', NULL, 20, NULL, NULL, 2, 493, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 08:33:01', NULL, NULL, '2025-12-08 08:33:01', '2025-12-08 08:33:01', '[]', NULL, NULL, NULL, 0),
(587, 'Añadir acordeon a rap semanal / en vista de secrrtario que venga recogido por default', NULL, 20, NULL, NULL, 2, 493, 1, 1, 'completada', 'media', 'media', 100.00, NULL, '2025-12-08', '2025-12-08 14:31:45', NULL, NULL, '2025-12-08 08:35:56', '2025-12-08 09:31:45', '[]', NULL, NULL, NULL, 0),
(588, 'Importar tareas, mediante una plantilla', NULL, 7, NULL, NULL, 2, 553, 1, 1, 'pendiente', 'alta', 'alta', 0.00, NULL, NULL, '2025-12-08 08:41:24', NULL, NULL, '2025-12-08 08:41:24', '2025-12-08 08:41:32', '[]', NULL, NULL, NULL, 0),
(589, 'Reestructurar la creacion añadir mas opciones y reformar el formato', NULL, 7, NULL, NULL, 2, 567, 1, 1, 'pendiente', 'alta', 'alta', 0.00, NULL, NULL, '2025-12-08 08:42:48', NULL, NULL, '2025-12-08 08:42:48', '2025-12-08 08:43:00', '[]', NULL, NULL, NULL, 0),
(590, 'Asignar a mas de un departamento', NULL, 7, NULL, NULL, 2, 127, 1, 1, 'pendiente', 'alta', 'media', 0.00, NULL, NULL, '2025-12-08 08:50:49', NULL, NULL, '2025-12-08 08:50:49', '2025-12-08 08:50:59', '[]', NULL, NULL, NULL, 0),
(591, 'Agregar un buscador/filtro', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 08:55:01', NULL, NULL, '2025-12-08 08:55:01', '2025-12-08 08:55:01', '[]', NULL, NULL, NULL, 0),
(592, 'Reestructurar el orden de las cards', NULL, 18, NULL, NULL, 2, 409, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 08:55:14', NULL, NULL, '2025-12-08 08:55:14', '2025-12-08 08:55:14', '[]', NULL, NULL, NULL, 0),
(593, 'RAP JH: app CS cambios en interfaz / dar seguimiento por correo al requerimiento para cargar multimedia de elecciones acabados / TickeCS responsive / Planics guardar archivos prioridad', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-08', '2025-12-08', NULL, NULL, NULL, '2025-12-08 09:02:49', '2025-12-08 09:37:13', '[]', NULL, NULL, NULL, 0),
(594, 'Agregar que en el selector de usuarios, también se puede ver las tareas del departamento/s', NULL, 7, NULL, NULL, 2, 462, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, NULL, '2025-12-08 09:03:18', NULL, NULL, '2025-12-08 09:03:18', '2025-12-08 09:03:18', '[]', NULL, NULL, NULL, 0),
(595, 'RAP GC: pendientes de sinergics / mejorar panel admin para asignacion / traer de hubspot propietario del lead, notas, llamadas, reuniones, tareas', NULL, 1, NULL, NULL, 9, NULL, 1, 1, 'pendiente', 'baja', 'baja', 0.00, '2025-12-08', NULL, '2025-12-08 09:08:28', NULL, NULL, '2025-12-08 09:08:28', '2025-12-08 09:36:33', '[]', NULL, NULL, NULL, 0),
(596, 'Enviar pago de Daniel  de la factura de $100 a Karla ', NULL, 1, NULL, NULL, 14, NULL, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-12-08', '2025-12-08', '2025-12-08 09:44:03', NULL, NULL, '2025-12-08 09:44:03', '2025-12-08 10:00:10', '[]', NULL, NULL, NULL, 0),
(597, 'Ingresar el procesos de pago del evento de cierre', NULL, 1, NULL, NULL, 14, NULL, 1, 1, 'pendiente', 'media', 'alta', 0.00, '2025-12-08', '2025-12-10', '2025-12-08 09:46:08', NULL, NULL, '2025-12-08 09:46:08', '2025-12-08 09:52:36', '[]', NULL, NULL, NULL, 0),
(598, 'Pago de Daniel ', NULL, 1, NULL, NULL, 14, 597, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-10', '2025-12-08 09:46:36', NULL, NULL, '2025-12-08 09:46:36', '2025-12-08 09:46:36', '[]', NULL, NULL, NULL, 0),
(599, 'Pago de Dulce recuerdo 50%', NULL, 1, NULL, NULL, 14, 597, 1, 1, 'pendiente', 'baja', 'baja', 0.00, NULL, '2025-12-10', '2025-12-08 09:47:00', NULL, NULL, '2025-12-08 09:47:00', '2025-12-08 09:47:00', '[]', NULL, NULL, NULL, 0),
(600, 'Actualizar el dashboard del RAP diario', NULL, 1, NULL, NULL, 14, NULL, 1, 1, 'pendiente', 'alta', 'baja', 0.00, NULL, '2025-12-08', '2025-12-08 09:53:14', NULL, NULL, '2025-12-08 09:53:14', '2025-12-08 10:00:21', '[]', NULL, NULL, NULL, 0),
(601, 'Hacer las tomas del drone del proyecto completo', NULL, 1, NULL, NULL, 14, NULL, 1, 1, 'pendiente', 'alta', 'alta', 0.00, '2025-12-08', '2025-12-08', '2025-12-08 09:55:54', NULL, NULL, '2025-12-08 09:55:54', '2025-12-08 10:00:21', '[]', NULL, NULL, NULL, 0),
(602, 'Pasar la factura a Karla de los $1200', NULL, 1, NULL, NULL, 14, NULL, 1, 1, 'pendiente', 'alta', 'baja', 0.00, NULL, '2025-12-08', '2025-12-08 09:59:24', NULL, NULL, '2025-12-08 09:59:24', '2025-12-08 10:00:21', '[]', NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas_asignados`
--

CREATE TABLE `tareas_asignados` (
  `id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tareas_asignados`
--

INSERT INTO `tareas_asignados` (`id`, `tarea_id`, `usuario_id`, `fecha_asignacion`) VALUES
(7, 90, 2, '2025-10-17 23:11:03'),
(8, 91, 2, '2025-10-17 23:16:42'),
(10, 92, 2, '2025-10-17 23:42:19'),
(11, 94, 2, '2025-10-20 13:26:42'),
(26, 118, 2, '2025-10-20 16:16:01'),
(31, 132, 2, '2025-10-20 20:20:34'),
(33, 134, 2, '2025-10-20 20:21:26'),
(34, 135, 2, '2025-10-20 20:22:06'),
(35, 136, 2, '2025-10-20 20:23:37'),
(36, 137, 2, '2025-10-20 20:23:51'),
(37, 138, 2, '2025-10-20 20:26:37'),
(38, 139, 2, '2025-10-20 20:26:48'),
(39, 140, 2, '2025-10-20 20:26:59'),
(40, 141, 2, '2025-10-20 20:29:24'),
(41, 142, 2, '2025-10-20 20:30:08'),
(42, 144, 2, '2025-10-20 20:50:40'),
(43, 145, 2, '2025-10-20 20:54:01'),
(44, 146, 2, '2025-10-20 20:54:06'),
(45, 147, 2, '2025-10-20 21:32:40'),
(46, 148, 2, '2025-10-20 21:32:44'),
(47, 149, 2, '2025-10-20 21:53:48'),
(48, 150, 2, '2025-10-20 22:23:16'),
(49, 151, 2, '2025-10-20 22:23:58'),
(50, 152, 2, '2025-10-20 22:24:21'),
(51, 153, 2, '2025-10-20 22:27:05'),
(53, 156, 2, '2025-10-21 13:39:32'),
(54, 157, 2, '2025-10-21 13:54:37'),
(55, 158, 2, '2025-10-21 14:01:51'),
(56, 159, 2, '2025-10-21 14:02:06'),
(57, 160, 2, '2025-10-21 14:07:40'),
(58, 161, 2, '2025-10-21 14:24:46'),
(59, 162, 2, '2025-10-21 14:25:59'),
(60, 163, 2, '2025-10-21 14:26:29'),
(61, 164, 2, '2025-10-21 14:32:49'),
(62, 165, 2, '2025-10-21 14:33:07'),
(63, 166, 2, '2025-10-21 14:36:39'),
(64, 167, 2, '2025-10-21 14:40:27'),
(65, 168, 2, '2025-10-21 14:42:31'),
(66, 169, 2, '2025-10-21 14:42:44'),
(67, 170, 2, '2025-10-21 14:43:11'),
(68, 171, 2, '2025-10-21 14:44:30'),
(69, 172, 2, '2025-10-21 15:09:58'),
(70, 173, 2, '2025-10-21 15:11:47'),
(72, 175, 2, '2025-10-21 15:15:53'),
(73, 176, 2, '2025-10-21 15:19:27'),
(74, 177, 2, '2025-10-21 15:19:42'),
(75, 178, 2, '2025-10-21 15:22:56'),
(76, 179, 2, '2025-10-21 15:29:12'),
(77, 180, 2, '2025-10-21 15:30:20'),
(78, 181, 2, '2025-10-21 15:35:23'),
(79, 182, 2, '2025-10-21 15:37:40'),
(80, 183, 2, '2025-10-21 15:43:06'),
(82, 185, 2, '2025-10-21 15:46:58'),
(83, 186, 2, '2025-10-21 15:50:38'),
(84, 187, 2, '2025-10-21 15:50:52'),
(86, 189, 2, '2025-10-21 15:52:11'),
(87, 190, 2, '2025-10-21 16:34:52'),
(88, 191, 2, '2025-10-21 18:32:07'),
(89, 192, 2, '2025-10-21 19:06:27'),
(90, 193, 2, '2025-10-21 21:10:28'),
(91, 194, 2, '2025-10-21 21:24:19'),
(92, 195, 2, '2025-10-21 21:24:30'),
(93, 196, 2, '2025-10-21 21:30:33'),
(94, 197, 2, '2025-10-21 21:30:45'),
(95, 198, 2, '2025-10-21 21:40:30'),
(96, 199, 2, '2025-10-22 04:38:35'),
(97, 201, 2, '2025-10-22 15:01:40'),
(98, 202, 2, '2025-10-22 15:03:01'),
(99, 203, 2, '2025-10-22 16:30:51'),
(100, 204, 2, '2025-10-22 17:45:13'),
(101, 205, 2, '2025-10-22 18:13:13'),
(102, 206, 2, '2025-10-22 21:28:43'),
(103, 207, 2, '2025-10-22 21:29:01'),
(104, 209, 9, '2025-10-23 17:33:35'),
(109, 217, 2, '2025-10-23 20:24:24'),
(110, 218, 2, '2025-10-23 20:25:30'),
(111, 218, 9, '2025-10-23 20:25:30'),
(112, 220, 2, '2025-10-23 21:40:26'),
(113, 223, 2, '2025-10-24 22:10:11'),
(114, 224, 2, '2025-10-24 22:11:08'),
(115, 225, 2, '2025-10-24 22:18:10'),
(116, 226, 2, '2025-10-24 22:18:39'),
(117, 227, 2, '2025-10-24 22:23:19'),
(118, 228, 2, '2025-10-24 22:24:02'),
(119, 229, 2, '2025-10-25 19:25:11'),
(120, 230, 2, '2025-10-25 19:26:06'),
(121, 231, 2, '2025-10-25 19:26:17'),
(122, 232, 2, '2025-10-27 15:24:11'),
(123, 233, 2, '2025-10-27 15:25:50'),
(124, 234, 2, '2025-10-27 15:26:18'),
(125, 235, 2, '2025-10-27 15:27:05'),
(126, 236, 2, '2025-10-27 15:31:34'),
(139, 261, 2, '2025-10-29 16:15:40'),
(150, 279, 2, '2025-10-30 16:31:11'),
(151, 280, 2, '2025-10-30 16:31:36'),
(152, 281, 2, '2025-10-30 16:31:48'),
(153, 282, 2, '2025-10-30 16:41:00'),
(154, 283, 2, '2025-10-30 16:41:06'),
(155, 284, 2, '2025-10-30 16:41:20'),
(156, 285, 2, '2025-10-30 16:41:46'),
(157, 286, 2, '2025-10-30 16:42:27'),
(158, 287, 9, '2025-10-30 17:02:05'),
(159, 288, 9, '2025-10-30 17:02:37'),
(160, 289, 2, '2025-10-31 00:15:57'),
(161, 290, 9, '2025-11-05 11:59:19'),
(162, 291, 9, '2025-11-05 12:00:08'),
(163, 292, 9, '2025-11-05 12:01:40'),
(164, 293, 9, '2025-11-05 12:02:04'),
(167, 298, 9, '2025-11-05 16:37:39'),
(168, 299, 9, '2025-11-05 16:37:56'),
(169, 303, 2, '2025-11-06 13:38:26'),
(170, 304, 2, '2025-11-06 13:38:54'),
(171, 305, 2, '2025-11-06 13:40:29'),
(172, 306, 2, '2025-11-06 13:42:02'),
(173, 307, 2, '2025-11-06 13:49:29'),
(174, 308, 2, '2025-11-06 13:54:28'),
(175, 309, 2, '2025-11-06 13:54:41'),
(176, 310, 2, '2025-11-06 13:54:55'),
(177, 311, 2, '2025-11-06 13:59:01'),
(178, 312, 2, '2025-11-06 14:13:46'),
(181, 315, 2, '2025-11-06 16:38:42'),
(182, 316, 2, '2025-11-06 16:43:28'),
(185, 320, 2, '2025-11-06 21:35:54'),
(186, 321, 2, '2025-11-06 21:36:40'),
(187, 322, 2, '2025-11-06 21:36:51'),
(188, 323, 2, '2025-11-06 21:59:16'),
(190, 328, 2, '2025-11-07 13:50:22'),
(191, 328, 12, '2025-11-07 13:54:12'),
(192, 324, 2, '2025-11-07 13:54:28'),
(193, 325, 13, '2025-11-07 13:54:38'),
(194, 330, 2, '2025-11-07 14:28:58'),
(195, 332, 2, '2025-11-10 13:59:21'),
(196, 331, 13, '2025-11-10 14:00:17'),
(197, 334, 2, '2025-11-10 15:03:00'),
(198, 334, 12, '2025-11-10 15:03:00'),
(199, 336, 2, '2025-11-10 16:21:38'),
(204, 339, 2, '2025-11-10 16:37:54'),
(205, 339, 12, '2025-11-10 16:37:54'),
(206, 340, 2, '2025-11-10 20:41:06'),
(207, 340, 12, '2025-11-10 20:41:06'),
(208, 345, 2, '2025-11-12 18:33:30'),
(217, 352, 2, '2025-11-13 02:12:26'),
(218, 352, 12, '2025-11-13 02:12:26'),
(219, 356, 2, '2025-11-14 05:09:12'),
(220, 371, 9, '2025-11-14 21:39:49'),
(221, 372, 9, '2025-11-14 21:40:13'),
(222, 373, 9, '2025-11-14 21:40:28'),
(223, 374, 9, '2025-11-14 21:40:36'),
(224, 375, 9, '2025-11-14 21:40:48'),
(225, 389, 2, '2025-11-17 15:15:55'),
(226, 391, 2, '2025-11-17 21:03:20'),
(227, 392, 2, '2025-11-17 21:03:59'),
(228, 393, 2, '2025-11-17 21:15:43'),
(229, 396, 2, '2025-11-18 20:53:02'),
(230, 397, 2, '2025-11-18 21:11:17'),
(231, 398, 2, '2025-11-18 21:11:33'),
(232, 399, 2, '2025-11-18 21:57:15'),
(233, 400, 2, '2025-11-18 21:58:55'),
(234, 402, 2, '2025-11-19 13:48:19'),
(235, 401, 13, '2025-11-19 13:48:26'),
(236, 410, 2, '2025-11-21 15:01:18'),
(237, 411, 2, '2025-11-21 15:02:11'),
(238, 412, 2, '2025-11-21 15:03:42'),
(239, 414, 2, '2025-11-21 15:15:49'),
(240, 415, 2, '2025-11-21 15:17:06'),
(241, 416, 2, '2025-11-21 15:17:25'),
(242, 417, 2, '2025-11-21 15:22:37'),
(243, 418, 2, '2025-11-21 15:22:53'),
(244, 419, 2, '2025-11-21 15:25:14'),
(245, 420, 2, '2025-11-21 15:30:15'),
(246, 421, 2, '2025-11-21 15:52:02'),
(247, 422, 2, '2025-11-21 15:55:40'),
(248, 423, 2, '2025-11-21 15:56:09'),
(249, 424, 2, '2025-11-21 16:02:10'),
(250, 425, 2, '2025-11-21 16:06:16'),
(251, 426, 2, '2025-11-21 16:13:04'),
(252, 427, 2, '2025-11-21 16:13:55'),
(253, 428, 2, '2025-11-21 16:15:14'),
(254, 429, 2, '2025-11-21 16:18:56'),
(255, 430, 2, '2025-11-21 16:24:54'),
(257, 432, 2, '2025-11-21 16:37:39'),
(258, 433, 2, '2025-11-21 16:41:12'),
(259, 434, 2, '2025-11-21 16:42:24'),
(260, 435, 2, '2025-11-21 16:43:40'),
(267, 448, 13, '2025-11-24 14:45:50'),
(268, 456, 2, '2025-11-24 16:39:39'),
(269, 457, 2, '2025-11-24 16:47:00'),
(270, 458, 2, '2025-11-24 16:47:18'),
(271, 458, 9, '2025-11-24 16:47:18'),
(272, 459, 2, '2025-11-24 16:56:06'),
(273, 459, 9, '2025-11-24 16:56:06'),
(274, 460, 2, '2025-11-24 16:57:04'),
(275, 460, 9, '2025-11-24 16:57:04'),
(277, 462, 2, '2025-11-24 17:07:06'),
(278, 463, 2, '2025-11-24 17:08:13'),
(279, 464, 2, '2025-11-24 17:11:11'),
(281, 466, 2, '2025-11-24 17:15:11'),
(282, 467, 2, '2025-11-24 17:16:10'),
(286, 472, 2, '2025-11-25 14:05:12'),
(287, 473, 2, '2025-11-25 14:11:26'),
(288, 474, 2, '2025-11-25 14:16:14'),
(289, 475, 2, '2025-11-25 14:16:32'),
(290, 476, 2, '2025-11-25 14:17:57'),
(291, 477, 2, '2025-11-25 14:26:10'),
(292, 478, 2, '2025-11-25 14:26:52'),
(293, 479, 2, '2025-11-25 14:27:40'),
(294, 480, 2, '2025-11-25 14:28:30'),
(295, 481, 2, '2025-11-25 14:30:10'),
(296, 482, 2, '2025-11-25 14:33:13'),
(302, 487, 2, '2025-11-25 22:25:42'),
(306, 493, 2, '2025-11-28 14:48:02'),
(307, 494, 2, '2025-11-28 14:50:41'),
(308, 495, 2, '2025-11-28 15:19:55'),
(309, 496, 2, '2025-11-28 15:27:32'),
(310, 497, 2, '2025-11-28 16:32:11'),
(311, 498, 2, '2025-11-28 16:33:35'),
(314, 518, 2, '2025-12-01 15:20:21'),
(316, 522, 2, '2025-12-01 19:34:38'),
(317, 524, 2, '2025-12-01 19:40:52'),
(319, 525, 2, '2025-12-01 19:45:38'),
(321, 523, 2, '2025-12-01 19:47:55'),
(322, 526, 2, '2025-12-01 19:50:48'),
(324, 527, 2, '2025-12-01 19:52:58'),
(326, 528, 2, '2025-12-01 20:14:21'),
(327, 528, 16, '2025-12-01 20:14:21'),
(328, 529, 2, '2025-12-01 20:17:23'),
(329, 529, 16, '2025-12-01 20:17:23'),
(330, 530, 2, '2025-12-01 20:21:11'),
(331, 530, 16, '2025-12-01 20:21:11'),
(336, 514, 20, '2025-12-01 20:49:34'),
(337, 517, 19, '2025-12-02 13:15:57'),
(339, 509, 20, '2025-12-02 13:18:15'),
(342, 532, 20, '2025-12-02 13:26:35'),
(343, 533, 20, '2025-12-02 13:30:02'),
(344, 533, 19, '2025-12-02 13:30:02'),
(345, 534, 20, '2025-12-02 13:30:08'),
(346, 534, 19, '2025-12-02 13:30:08'),
(347, 535, 20, '2025-12-02 13:30:14'),
(348, 535, 19, '2025-12-02 13:30:14'),
(349, 536, 20, '2025-12-02 13:30:23'),
(350, 536, 19, '2025-12-02 13:30:23'),
(351, 537, 20, '2025-12-02 13:31:08'),
(352, 537, 19, '2025-12-02 13:31:08'),
(353, 539, 2, '2025-12-02 13:37:37'),
(354, 538, 13, '2025-12-02 13:37:44'),
(355, 540, 19, '2025-12-02 13:51:14'),
(356, 515, 22, '2025-12-02 14:46:08'),
(357, 531, 20, '2025-12-02 14:46:43'),
(358, 516, 19, '2025-12-02 14:51:26'),
(359, 513, 22, '2025-12-02 14:52:00'),
(360, 512, 22, '2025-12-02 14:52:13'),
(361, 511, 22, '2025-12-02 14:52:25'),
(362, 510, 22, '2025-12-02 14:52:37'),
(363, 508, 22, '2025-12-02 14:52:45'),
(364, 506, 19, '2025-12-02 15:14:15'),
(365, 542, 2, '2025-12-02 19:49:25'),
(366, 543, 2, '2025-12-02 19:51:03'),
(367, 544, 19, '2025-12-02 20:18:32'),
(368, 504, 19, '2025-12-02 20:19:57'),
(369, 507, 19, '2025-12-02 20:20:24'),
(370, 545, 2, '2025-12-03 13:28:37'),
(371, 546, 13, '2025-12-03 13:29:21'),
(372, 550, 2, '2025-12-04 13:33:40'),
(373, 551, 2, '2025-12-04 13:35:12'),
(374, 552, 2, '2025-12-04 13:36:52'),
(375, 553, 2, '2025-12-04 13:37:35'),
(376, 554, 2, '2025-12-04 13:39:12'),
(377, 554, 9, '2025-12-04 13:39:18'),
(379, 502, 19, '2025-12-04 13:43:55'),
(380, 555, 13, '2025-12-04 13:50:36'),
(381, 557, 22, '2025-12-04 14:33:57'),
(382, 559, 22, '2025-12-04 14:49:04'),
(383, 560, 22, '2025-12-04 14:50:40'),
(384, 561, 22, '2025-12-04 14:52:09'),
(385, 567, 2, '2025-12-04 20:56:02'),
(386, 568, 2, '2025-12-04 20:56:30'),
(387, 558, 22, '2025-12-05 12:47:36'),
(388, 572, 19, '2025-12-05 19:06:40'),
(389, 574, 16, '2025-12-05 21:47:24'),
(390, 575, 16, '2025-12-05 21:48:08'),
(391, 576, 16, '2025-12-05 21:53:12'),
(392, 576, 9, '2025-12-05 21:53:16'),
(393, 577, 16, '2025-12-05 21:55:45'),
(394, 578, 9, '2025-12-05 21:57:34'),
(395, 579, 9, '2025-12-05 21:58:12'),
(396, 580, 16, '2025-12-05 21:58:56'),
(397, 585, 2, '2025-12-08 13:27:11'),
(398, 586, 2, '2025-12-08 13:33:01'),
(399, 587, 2, '2025-12-08 13:35:56'),
(400, 588, 2, '2025-12-08 13:41:24'),
(401, 589, 2, '2025-12-08 13:42:48'),
(402, 590, 2, '2025-12-08 13:50:49'),
(403, 591, 2, '2025-12-08 13:55:01'),
(404, 592, 2, '2025-12-08 13:55:14'),
(405, 594, 2, '2025-12-08 14:03:18'),
(406, 595, 13, '2025-12-08 14:36:33'),
(407, 593, 2, '2025-12-08 14:37:13'),
(408, 598, 14, '2025-12-08 14:46:36'),
(409, 599, 14, '2025-12-08 14:47:00');

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
-- Estructura de tabla para la tabla `tarea_adjuntos`
--

CREATE TABLE `tarea_adjuntos` (
  `id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL COMMENT 'ID de la tarea a la que pertenece el adjunto',
  `drive_item_id` varchar(255) NOT NULL COMMENT 'ID del archivo en SharePoint (Microsoft Graph API)',
  `nombre_archivo` varchar(500) NOT NULL COMMENT 'Nombre original del archivo',
  `tipo_archivo` enum('imagen','documento') NOT NULL DEFAULT 'documento' COMMENT 'Tipo de archivo para clasificación',
  `extension` varchar(20) NOT NULL COMMENT 'Extensión del archivo (jpg, pdf, docx, etc)',
  `tamano_bytes` bigint(20) NOT NULL COMMENT 'Tamaño del archivo en bytes',
  `mime_type` varchar(100) NOT NULL COMMENT 'Tipo MIME del archivo',
  `sharepoint_url` text DEFAULT NULL COMMENT 'URL para visualizar el archivo en SharePoint',
  `subido_por` int(11) NOT NULL COMMENT 'ID del usuario que subió el archivo',
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora de carga',
  `eliminado` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el archivo fue eliminado (borrado lógico)',
  `fecha_eliminacion` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora de eliminación',
  `eliminado_por` int(11) DEFAULT NULL COMMENT 'ID del usuario que eliminó el archivo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Adjuntos de tareas almacenados en SharePoint';

--
-- Volcado de datos para la tabla `tarea_adjuntos`
--

INSERT INTO `tarea_adjuntos` (`id`, `tarea_id`, `drive_item_id`, `nombre_archivo`, `tipo_archivo`, `extension`, `tamano_bytes`, `mime_type`, `sharepoint_url`, `subido_por`, `fecha_subida`, `eliminado`, `fecha_eliminacion`, `eliminado_por`) VALUES
(1, 567, '01SETDC7MQ4GYR2YGEBVEJDWJ7NPYVL6RZ', 'Sin título.png', 'imagen', 'png', 363049, 'image/png', 'https://constv.sharepoint.com/Directorio%20de%20Archivos%20Consultas/09.%20IT/Desarrollo/Adjuntos_PlaniCS/tarea_567/tarea_567_1765312811_Sin_t__tulo.png', 2, '2025-12-09 20:40:27', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_proyectos`
--

CREATE TABLE `tipos_proyectos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL COMMENT 'Color hexadecimal para la UI',
  `icono` varchar(50) DEFAULT NULL COMMENT 'Nombre del icono para la UI',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para clasificar los diferentes tipos de proyectos';

--
-- Volcado de datos para la tabla `tipos_proyectos`
--

INSERT INTO `tipos_proyectos` (`id`, `nombre`, `descripcion`, `color`, `icono`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'desarrollo', 'Proyectos de desarrollo de software', '#3498db', 'code', 1, '2025-10-29 15:05:51', '2025-10-29 15:05:51'),
(2, 'construccion', 'Proyectos de construcción y obras', '#e67e22', 'construction', 1, '2025-10-29 15:05:51', '2025-10-29 15:05:51'),
(3, 'marketing', 'Proyectos de marketing y publicidad', '#9b59b6', 'megaphone', 1, '2025-10-29 15:05:51', '2025-10-29 15:05:51'),
(4, 'investigacion', 'Proyectos de investigación y desarrollo', '#2ecc71', 'search', 1, '2025-10-29 15:05:51', '2025-10-29 15:05:51'),
(5, 'mantenimiento', 'Proyectos de mantenimiento y soporte', '#f39c12', 'wrench', 1, '2025-10-29 15:05:51', '2025-10-29 15:05:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_tareas`
--

CREATE TABLE `tipos_tareas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL COMMENT 'Color hexadecimal para la UI',
  `icono` varchar(50) DEFAULT NULL COMMENT 'Nombre del icono para la UI',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para clasificar los diferentes tipos de tareas';

--
-- Volcado de datos para la tabla `tipos_tareas`
--

INSERT INTO `tipos_tareas` (`id`, `nombre`, `descripcion`, `color`, `icono`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'tareas', 'Tareas generales del sistema', '#3498db', 'task', 1, '2025-10-29 14:52:47', '2025-10-29 14:52:47'),
(2, 'obras', 'Tareas relacionadas con obras y construcción', '#e67e22', 'construction', 1, '2025-10-29 14:52:47', '2025-10-29 14:52:47'),
(3, 'notas', 'Notas y recordatorios', '#f39c12', 'note', 1, '2025-10-29 14:52:47', '2025-10-29 14:52:47');

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
  `rol_id` int(11) DEFAULT 1 COMMENT 'ID del rol del usuario (1=usuario, 2=admin)',
  `estado` enum('activo','inactivo','suspendido') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ultimo_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `departamento_id`, `rol_id`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `ultimo_login`) VALUES
(1, 'admin', 'admin@example.com', '$2y$10$6AyvQn.6YsQSWOPetDY9MOnuZtmAPtb42zCqkCqrc/0ef.R1wtMoS', NULL, 1, 'activo', '2025-10-14 18:05:49', '2025-12-01 21:36:53', NULL),
(2, 'Joffre Holguin', 'jd@gmail.com', '$2y$10$jxjjd27fch8Iznfkf2XBmuCT70/F/SKpvb9ibjzdwjjE/iW3/6.oC', 9, 2, 'activo', '2025-10-15 21:42:46', '2025-12-08 13:51:14', '2025-12-08 13:51:14'),
(3, 'prueba', 'hola@com.ec', '$2y$10$zrqoSUbDUY5N.i6NXBQBJe8lnYmkXv3GP0Da7Y5yQUM4mh6QT7DUO', 3, 1, 'activo', '2025-10-15 22:04:45', '2025-12-09 13:34:20', NULL),
(9, 'Erick Reyes', 'sistemas@thaliavictoria.com.ec', '$2y$10$ExoT2uowmHM0E8BWQu.BI.Jk3sY9/VqXeZUiR6V8NbGaMkiPLesGy', 9, 1, 'activo', '2025-10-17 14:19:15', '2025-12-08 13:49:35', '2025-11-25 14:01:52'),
(12, 'PruebaJoff', 'pf@gmail.com', '$2y$10$6AyvQn.6YsQSWOPetDY9MOnuZtmAPtb42zCqkCqrc/0ef.R1wtMoS', 3, 1, 'activo', '2025-10-20 15:39:17', '2025-12-09 13:34:44', '2025-11-26 18:05:06'),
(13, 'Guillermo Coello', 'gcoello@thaliavictoria.com.ec', '$2y$10$v82HVdze7ASZzT5XbWcqwOikSIRmzq6OhQ9vlyfoGwwfBMuJXNqlO', 9, 1, 'activo', '2025-10-20 15:51:54', '2025-12-08 13:49:33', NULL),
(14, 'Jonathan Quijano', 'jquijano@thaliavictoria.com.ec', '$2y$10$KjHmGF/MVWBUq9X78nRyxO6/aoqO0GyGSsF2U4S/FGQSjZ4VOr9kW', 1, 1, 'activo', '2025-10-23 19:18:27', '2025-12-08 13:49:50', NULL),
(15, 'Adrian González', 'servicioalcliente@thaliavictoria.com.ec', '$2y$10$qqgo6s0kYty1OOG7/bRzjOlH8xMnPBS5Yy2YzEwmRBipYCVB1vHwW', 2, 1, 'activo', '2025-11-12 18:23:21', '2025-11-13 02:13:09', NULL),
(16, 'Eleam Ruela', 'controller@thaliavictoria.com.ec', '$2y$10$yz0HTRgLGg5rMQ.fqIifmOfgqnP5vq6g9Nz.GCoecJUuDix67HYvq', 9, 1, 'activo', '2025-11-13 16:59:12', '2025-12-08 13:49:38', NULL),
(17, 'Mario Jiménez', 'mjimenez@thaliavictoria.com.ec', '$2y$10$eSlpDDw5OqNE5q0iXVpEj.4JDMNcJ0k6Ppy4Xvu1KJao64DDeWNMK', 9, 1, 'activo', '2025-11-19 16:34:25', '2025-12-08 13:49:18', NULL),
(18, 'Ana María Félix', 'coordinadorsac@thaliavictoria.com.ec', '$2y$10$Q3LLxYmZHBt0edtFgXxLie8SIFzF3FmP3p0f.iXmt8r2G5sqI0/gu', 2, 1, 'activo', '2025-11-21 15:05:12', '2025-11-24 22:27:03', NULL),
(19, 'Alexander Burgos', 'aburgos@thaliavictoria.com.ec', '$2y$10$OHzBpTU4pc/UiKRzoFwojO4C1DTR3QhVetOoeiC4ELvg2QYXu47gG', 5, 1, 'activo', '2025-11-25 14:55:48', '2025-12-08 13:46:54', NULL),
(20, 'mapolo', 'mapolo@thaliavictoria.com.ec', '$2y$10$QJsNd/N7vX9Gm7Nqex6vKuXnCOByvPDBqitGWSm70lK84GIPWhzOq', 5, 1, 'activo', '2025-11-27 14:23:48', '2025-12-08 13:47:30', NULL),
(21, 'César Aguirre', 'caguirre@thaliavictoira.com.ec', '$2y$10$50ER41LfAJf6MVkzb97KNeUC4czb60Gf6V5j2YZ90FJzzJgPWNEg.', 5, 1, 'activo', '2025-12-01 13:01:32', '2025-12-08 13:47:20', NULL),
(22, 'caguirre@thaliavictoria.com.ec', 'caguirre@thaliavictoria.com.ec', '$2y$10$/ooWDuVuIigsVBm9FP5w8u5My/JyY7ZIScYBQ77skShcfyucE5KEa', 5, 1, 'activo', '2025-12-01 13:05:56', '2025-12-08 13:47:18', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_departamentos`
--

CREATE TABLE `usuario_departamentos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `departamento_id` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_departamentos`
--

INSERT INTO `usuario_departamentos` (`id`, `usuario_id`, `departamento_id`, `fecha_asignacion`) VALUES
(1, 14, 1, '2025-12-08 17:01:56'),
(2, 15, 2, '2025-12-08 17:01:56'),
(3, 18, 2, '2025-12-08 17:01:56'),
(5, 19, 5, '2025-12-08 17:01:56'),
(6, 20, 5, '2025-12-08 17:01:56'),
(7, 21, 5, '2025-12-08 17:01:56'),
(8, 22, 5, '2025-12-08 17:01:56'),
(9, 2, 9, '2025-12-08 17:01:56'),
(10, 9, 9, '2025-12-08 17:01:56'),
(11, 13, 9, '2025-12-08 17:01:56'),
(12, 16, 9, '2025-12-08 17:01:56'),
(13, 17, 9, '2025-12-08 17:01:56'),
(24, 3, 3, '2025-12-09 08:34:20'),
(25, 12, 3, '2025-12-09 08:34:44');

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
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `idx_manager_id` (`manager_id`);

--
-- Indices de la tabla `dependencias_tareas`
--
ALTER TABLE `dependencias_tareas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dependencia` (`tarea_predecesora_id`,`tarea_sucesora_id`),
  ADD KEY `idx_tarea_predecesora` (`tarea_predecesora_id`),
  ADD KEY `idx_tarea_sucesora` (`tarea_sucesora_id`),
  ADD KEY `idx_tipo_dependencia` (`tipo_dependencia`),
  ADD KEY `idx_dependencias_compuesto` (`tarea_predecesora_id`,`tipo_dependencia`),
  ADD KEY `idx_fecha_creacion` (`fecha_creacion`);

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
  ADD KEY `manager_id` (`manager_id`),
  ADD KEY `idx_tipos_proyectos_id` (`tipos_proyectos_id`),
  ADD KEY `idx_tipo_estado` (`tipos_proyectos_id`,`estado`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_nombre` (`nombre`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proyecto_id` (`proyecto_id`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `asignado_a` (`asignado_a`),
  ADD KEY `creado_por` (`creado_por`),
  ADD KEY `tarea_padre_id` (`tarea_padre_id`),
  ADD KEY `idx_tipos_tareas_id` (`tipos_tareas_id`),
  ADD KEY `idx_tipo_estado` (`tipos_tareas_id`,`estado`),
  ADD KEY `idx_nivel_esquema` (`nivel_esquema`),
  ADD KEY `idx_padre_nivel` (`tarea_padre_id`,`nivel_esquema`),
  ADD KEY `idx_importancia` (`importancia`),
  ADD KEY `idx_eisenhower` (`importancia`,`prioridad`,`estado`),
  ADD KEY `idx_ai_level` (`ai_level`),
  ADD KEY `idx_division` (`division`),
  ADD KEY `idx_is_ticket` (`is_ticket`),
  ADD KEY `idx_asignado_estado` (`asignado_a`,`estado`),
  ADD KEY `idx_fecha_vencimiento` (`fecha_vencimiento`);

--
-- Indices de la tabla `tareas_asignados`
--
ALTER TABLE `tareas_asignados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tarea_usuario` (`tarea_id`,`usuario_id`),
  ADD KEY `tarea_id` (`tarea_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `tareas_etiquetas`
--
ALTER TABLE `tareas_etiquetas`
  ADD PRIMARY KEY (`tarea_id`,`etiqueta_id`),
  ADD KEY `etiqueta_id` (`etiqueta_id`);

--
-- Indices de la tabla `tarea_adjuntos`
--
ALTER TABLE `tarea_adjuntos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tarea_id` (`tarea_id`),
  ADD KEY `idx_drive_item_id` (`drive_item_id`),
  ADD KEY `idx_tipo_archivo` (`tipo_archivo`),
  ADD KEY `idx_subido_por` (`subido_por`),
  ADD KEY `idx_eliminado` (`eliminado`);

--
-- Indices de la tabla `tipos_proyectos`
--
ALTER TABLE `tipos_proyectos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_nombre` (`nombre`);

--
-- Indices de la tabla `tipos_tareas`
--
ALTER TABLE `tipos_tareas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_nombre` (`nombre`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `idx_rol_id` (`rol_id`),
  ADD KEY `idx_rol_estado` (`rol_id`,`estado`);

--
-- Indices de la tabla `usuario_departamentos`
--
ALTER TABLE `usuario_departamentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_dept` (`usuario_id`,`departamento_id`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `dependencias_tareas`
--
ALTER TABLE `dependencias_tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=603;

--
-- AUTO_INCREMENT de la tabla `tareas_asignados`
--
ALTER TABLE `tareas_asignados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=410;

--
-- AUTO_INCREMENT de la tabla `tarea_adjuntos`
--
ALTER TABLE `tarea_adjuntos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tipos_proyectos`
--
ALTER TABLE `tipos_proyectos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tipos_tareas`
--
ALTER TABLE `tipos_tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `usuario_departamentos`
--
ALTER TABLE `usuario_departamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

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
-- Filtros para la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD CONSTRAINT `fk_departamentos_manager` FOREIGN KEY (`manager_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `dependencias_tareas`
--
ALTER TABLE `dependencias_tareas`
  ADD CONSTRAINT `dependencias_tareas_ibfk_1` FOREIGN KEY (`tarea_predecesora_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dependencias_tareas_ibfk_2` FOREIGN KEY (`tarea_sucesora_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `proyectos_ibfk_2` FOREIGN KEY (`tipos_proyectos_id`) REFERENCES `tipos_proyectos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tareas_ibfk_4` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `tareas_ibfk_5` FOREIGN KEY (`tarea_padre_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_ibfk_6` FOREIGN KEY (`tipos_tareas_id`) REFERENCES `tipos_tareas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `tareas_asignados`
--
ALTER TABLE `tareas_asignados`
  ADD CONSTRAINT `tareas_asignados_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_asignados_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `usuario_departamentos`
--
ALTER TABLE `usuario_departamentos`
  ADD CONSTRAINT `usuario_departamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_departamentos_ibfk_2` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
