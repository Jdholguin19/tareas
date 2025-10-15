CREATE DATABASE  IF NOT EXISTS `portalao_ReunionesCS` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `portalao_ReunionesCS`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: box5500.bluehost.com    Database: portalao_ReunionesCS
-- ------------------------------------------------------
-- Server version	5.7.44-48

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archivos_adjuntos`
--

DROP TABLE IF EXISTS `archivos_adjuntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivos_adjuntos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_url` varchar(500) NOT NULL,
  `tipo_mime` varchar(50) DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `archivos_adjuntos_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `archivos_adjuntos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archivos_adjuntos`
--

LOCK TABLES `archivos_adjuntos` WRITE;
/*!40000 ALTER TABLE `archivos_adjuntos` DISABLE KEYS */;
/*!40000 ALTER TABLE `archivos_adjuntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etiquetas`
--

DROP TABLE IF EXISTS `etiquetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etiquetas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etiquetas`
--

LOCK TABLES `etiquetas` WRITE;
/*!40000 ALTER TABLE `etiquetas` DISABLE KEYS */;
/*!40000 ALTER TABLE `etiquetas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyectos`
--

DROP TABLE IF EXISTS `proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyectos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `manager_id` int(11) DEFAULT NULL,
  `estado` enum('activo','en_espera','finalizado') DEFAULT 'activo',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyectos`
--

LOCK TABLES `proyectos` WRITE;
/*!40000 ALTER TABLE `proyectos` DISABLE KEYS */;
INSERT INTO `proyectos` VALUES (1,'General','Proyecto por defecto',NULL,'activo',NULL,NULL);
/*!40000 ALTER TABLE `proyectos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text,
  `proyecto_id` int(11) DEFAULT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `asignado_a` int(11) DEFAULT NULL,
  `creado_por` int(11) NOT NULL,
  `tarea_padre_id` int(11) DEFAULT NULL,
  `estado` enum('pendiente','en_progreso','en_revision','completada','cancelada') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','critica') DEFAULT 'media',
  `progreso` decimal(5,2) DEFAULT '0.00',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `tiempo_estimado` int(11) DEFAULT NULL,
  `tiempo_real` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `adjuntos_url` varchar(500) DEFAULT NULL,
  `asignados` text,
  PRIMARY KEY (`id`),
  KEY `proyecto_id` (`proyecto_id`),
  KEY `departamento_id` (`departamento_id`),
  KEY `asignado_a` (`asignado_a`),
  KEY `creado_por` (`creado_por`),
  KEY `tarea_padre_id` (`tarea_padre_id`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tareas_ibfk_4` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `tareas_ibfk_5` FOREIGN KEY (`tarea_padre_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (12,'Tareas',NULL,NULL,NULL,NULL,1,NULL,'en_progreso','media',50.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 20:44:37','2025-10-15 18:23:16','[]',NULL),(13,'Mejoras de IA',NULL,NULL,NULL,NULL,1,12,'en_progreso','media',50.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 20:46:08','2025-10-15 18:23:29','[]',NULL),(14,'Agregar filtro',NULL,NULL,NULL,NULL,1,12,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-14 20:47:00','2025-10-15 16:20:40','[]',NULL),(15,'Filtrar por tareas de hoy o que tengo por hacer y tareas sin fechas',NULL,NULL,NULL,NULL,1,14,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-14 20:47:28','2025-10-15 15:38:27','[]',NULL),(16,'Filtrar aparte tareas vencidas',NULL,NULL,NULL,NULL,1,14,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-14 20:47:49','2025-10-15 15:38:33','[]',NULL),(17,'Progeso',NULL,NULL,NULL,NULL,1,12,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 20:51:23','2025-10-15 18:31:14','[]',NULL),(18,'El progreso poderle escribir porcentaje manulmente',NULL,NULL,NULL,NULL,1,17,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 20:51:49','2025-10-15 18:30:33','[]',NULL),(19,'Agregar notificaciones de las tareas vencidas',NULL,NULL,NULL,NULL,1,14,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-14 20:58:02','2025-10-15 15:35:14','[]',NULL),(20,'Arreglar el progreso calcula mal',NULL,NULL,NULL,NULL,1,17,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:01:06','2025-10-15 18:16:45','[]',NULL),(21,'Mejorar la transcripcion para que entienda el contexto de la tarea y no transcribir informacion innecesaria',NULL,NULL,NULL,NULL,1,13,'en_progreso','media',45.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:03:09','2025-10-15 18:16:07','[]',NULL),(22,'Tareas',NULL,NULL,NULL,NULL,1,12,'en_progreso','media',35.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:06:30','2025-10-15 17:39:35','[]',NULL),(23,'El progreso desde la vista principal poderlo cambiar el porcentaje moviendolo tipo progress drag',NULL,NULL,NULL,NULL,1,17,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:15:44','2025-10-15 18:17:03','[]',NULL),(24,'Para el filtro de todas la tareas agregar un acordeón para cada tarea padre y subtarea por defecto aparece escondido',NULL,NULL,NULL,NULL,1,22,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-14 21:18:11','2025-10-15 15:50:14','[]',NULL),(25,'Funciones',NULL,NULL,NULL,NULL,1,12,'pendiente','media',0.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:24:59','2025-10-15 17:29:46','[]',NULL),(26,'Adaptar el editar tarea para que se pueda asignar a mas de una persona esa tarea ( por defecto viene asignado al que la creo ya esta el campo en la base de datos)','',NULL,NULL,NULL,1,25,'en_progreso','media',40.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:26:11','2025-10-15 17:55:10','[]',NULL),(27,'Crear tipos de tareas ( tarea, rubro, dpe), usan la misma estructura solo que para diferentes fines ',NULL,NULL,NULL,NULL,1,22,'pendiente','media',0.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:27:04','2025-10-15 15:08:40','[]',NULL),(28,'Solo puedes ver tus mismas tareas y las tareas a las que te asignaron',NULL,NULL,NULL,NULL,1,25,'pendiente','media',0.00,NULL,'2025-10-31',NULL,NULL,NULL,'2025-10-14 21:28:12','2025-10-15 18:32:52','[]',NULL),(29,'Al crear la tarea aparte de guardar la fecha en fecha_creacion tambien la guarde en fecha_inicio',NULL,NULL,NULL,NULL,1,22,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:36:29','2025-10-15 20:52:15','[]',NULL),(30,'Agregar: Al Editar Tarea Modifica los detalles de tu tarea, agregar que aparescar la fecha_inicio y se pueda modificar ',NULL,NULL,NULL,NULL,1,29,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-14 21:37:25','2025-10-15 20:52:14','[]',NULL),(32,'Prueba adj',NULL,NULL,NULL,NULL,1,NULL,'completada','media',100.00,NULL,'2025-10-16',NULL,NULL,NULL,'2025-10-15 13:30:07','2025-10-15 19:10:15','[\"\\/uploads\\/1760534999_file\"]',NULL),(33,'Cambiar icono de eliminar ( X ) por tacho',NULL,NULL,NULL,NULL,1,22,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-15 13:31:36','2025-10-15 15:49:25','[]',NULL),(35,'Agregar nuevo filtro de tareas pendientes',NULL,NULL,NULL,NULL,1,14,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-15 14:48:00','2025-10-15 15:35:11','[]',NULL),(38,'Revisa la subida de archivos, que pasa cuando creo una tarea con una imagen, guarda la imagen? que hace con ella',NULL,NULL,NULL,NULL,1,25,'en_progreso','media',10.00,NULL,NULL,NULL,NULL,NULL,'2025-10-15 16:01:24','2025-10-15 17:13:53','[]',NULL),(39,'Cambiar el icono de auto',NULL,NULL,NULL,NULL,1,17,'completada','media',100.00,NULL,'2025-10-15',NULL,NULL,NULL,'2025-10-15 16:10:08','2025-10-15 17:09:05','[]',NULL),(41,'prueba',NULL,NULL,NULL,NULL,1,NULL,'en_progreso','media',70.00,NULL,NULL,NULL,NULL,NULL,'2025-10-15 17:01:51','2025-10-15 18:23:14','[]',NULL),(42,'Que se guarda la fecha completado',NULL,NULL,NULL,NULL,1,29,'completada','media',100.00,NULL,NULL,NULL,NULL,NULL,'2025-10-15 18:42:43','2025-10-15 20:52:03','[]',NULL),(43,'prueba',NULL,NULL,NULL,NULL,1,38,'completada','media',100.00,'2025-10-15','2025-10-31','2025-10-16 01:29:07',NULL,NULL,'2025-10-15 18:49:44','2025-10-15 19:29:11','[]',NULL),(44,'prueba2',NULL,NULL,NULL,NULL,1,NULL,'pendiente','media',0.00,NULL,NULL,NULL,NULL,NULL,'2025-10-15 21:19:01','2025-10-15 21:19:01','[]','[1]');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas_etiquetas`
--

DROP TABLE IF EXISTS `tareas_etiquetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas_etiquetas` (
  `tarea_id` int(11) NOT NULL,
  `etiqueta_id` int(11) NOT NULL,
  PRIMARY KEY (`tarea_id`,`etiqueta_id`),
  KEY `etiqueta_id` (`etiqueta_id`),
  CONSTRAINT `tareas_etiquetas_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tareas_etiquetas_ibfk_2` FOREIGN KEY (`etiqueta_id`) REFERENCES `etiquetas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas_etiquetas`
--

LOCK TABLES `tareas_etiquetas` WRITE;
/*!40000 ALTER TABLE `tareas_etiquetas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tareas_etiquetas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento_id` int(11) DEFAULT NULL,
  `estado` enum('activo','inactivo','suspendido') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `departamento_id` (`departamento_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin','admin@example.com','$2y$10$examplehashedpassword',NULL,'activo','2025-10-14 18:05:49','2025-10-14 18:05:49',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'portalao_ReunionesCS'
--

--
-- Dumping routines for database 'portalao_ReunionesCS'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-15 16:22:59
