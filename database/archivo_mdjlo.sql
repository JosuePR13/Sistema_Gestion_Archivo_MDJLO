-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para archivo_mdjlo
DROP DATABASE IF EXISTS `archivo_mdjlo`;
CREATE DATABASE IF NOT EXISTS `archivo_mdjlo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `archivo_mdjlo`;

-- Volcando estructura para evento archivo_mdjlo.actualizar_expedientes_para_depurar_diario
DROP EVENT IF EXISTS `actualizar_expedientes_para_depurar_diario`;
DELIMITER //
CREATE EVENT `actualizar_expedientes_para_depurar_diario` ON SCHEDULE EVERY 1 DAY STARTS '2026-06-10 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  -- Actualizamos a 'Para Depurar' los expedientes cuyo plazo de conservación ya venció
  UPDATE `expedientes`
  SET `estado` = 'Para Depurar',
      `updated_at` = NOW()
  WHERE `estado` = 'Activo'
    AND `tiempo_conservacion` IS NOT NULL
    AND `tiempo_conservacion` NOT LIKE '%PERMANENTE%'
    AND `tiempo_conservacion` NOT LIKE '%INDEFINI%'
    -- Matemática precisa: si los años transcurridos desde fecha_ingreso superan el tiempo_conservacion
    AND TIMESTAMPDIFF(YEAR, `fecha_ingreso`, CURDATE()) >= 
        CASE 
          WHEN `tiempo_conservacion` LIKE '%mes%' THEN 0.5 -- Control por si pusiste 6 meses
          ELSE CAST(REGEXP_REPLACE(`tiempo_conservacion`, '[^0-9.]', '') AS DECIMAL(10,2))
        END;
END//
DELIMITER ;

-- Volcando estructura para tabla archivo_mdjlo.archivos_digitales
DROP TABLE IF EXISTS `archivos_digitales`;
CREATE TABLE IF NOT EXISTS `archivos_digitales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `nombre_original` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nombre_archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ruta_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tipo_mime` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'application/pdf',
  `tamano_bytes` int DEFAULT NULL,
  `uploaded_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_archivo` (`nombre_archivo`),
  KEY `expediente_id` (`expediente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `archivos_digitales_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `archivos_digitales_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.archivos_digitales: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.areas
DROP TABLE IF EXISTS `areas`;
CREATE TABLE IF NOT EXISTS `areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.areas: ~37 rows (aproximadamente)
INSERT INTO `areas` (`id`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'Area de archivos y documentacion', 'Unidad Funcional de Archivo y Acceso Documentario', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(2, 'Oficina de tesorería', 'Gestión financiera y pagos', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(3, 'Oficina de gestión de recursos humanos', 'Gestión del personal municipal', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(4, 'Oficina de abastecimiento', 'Gestión logística y abastecimiento', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(6, 'Oficina general de administración', 'Administración institucional', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(7, 'Gerencia municipal', 'Dirección ejecutiva municipal', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(8, 'Oficina general de asesoría jurídica', 'Asesoramiento jurídico institucional', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(9, 'Subgerencia de fiscalización', 'Fiscalización y control municipal', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(10, 'Servicio de Administración Tributaria - SAT', 'Administración tributaria municipal', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(11, 'Alcaldía', 'Máxima autoridad ejecutiva municipal', 1, '2026-05-22 15:53:23', '2026-05-22 15:53:23'),
	(12, 'Oficina general de planeamiento y presupuesto', 'Planeamiento y presupuesto institucional', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(13, 'Oficina de presupuesto', 'Gestión presupuestaria', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(14, 'Oficina de planeamiento, modernización e inversiones', 'Planeamiento y modernización institucional', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(15, 'Oficina de contabilidad', 'Gestión contable institucional', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(16, 'Oficina de Tecnologías de la Información y Comunicación - OTIC', 'Gestión tecnológica y sistemas', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(17, 'Órgano de control institucional', 'Control institucional', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(18, 'Procuraduría pública', 'Defensa jurídica municipal', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(19, 'Gerencia de desarrollo social', 'Gestión de programas y servicios sociales', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(20, 'Gerencia de gestión ambiental y salud', 'Gestión ambiental y salud pública', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(21, 'Gerencia de desarrollo territorial e infraestructura', 'Infraestructura y desarrollo urbano', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(22, 'Gerencia de desarrollo económico', 'Promoción económica y comercial', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(23, 'Gerencia de seguridad ciudadana y gestión del riesgo de desastres', 'Seguridad ciudadana y gestión del riesgo', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(24, 'Subgerencia de estudios y proyectos', 'Formulación y evaluación de proyectos', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(25, 'Subgerencia de servicios sociales', 'Servicios y programas sociales', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(26, 'Subgerencia de participación ciudadana', 'Participación vecinal y ciudadana', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(27, 'Subgerencia de educación, cultura y deportes', 'Promoción educativa, cultural y deportiva', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(28, 'Subgerencia de comercio y licencias', 'Gestión comercial y licencias', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(29, 'Subgerencia de supervisión y liquidación de inversiones', 'Supervisión y liquidación de obras', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(30, 'Subgerencia de habilitaciones urbanas y edificaciones', 'Gestión urbana y edificaciones', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(31, 'Subgerencia de desarrollo territorial y catastro', 'Ordenamiento territorial y catastro', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(32, 'Subgerencia de áreas verdes', 'Gestión de parques y áreas verdes', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(33, 'Subgerencia de residuos sólidos', 'Gestión de limpieza pública y residuos', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(34, 'Subgerencia de promoción de la salud y control sanitario', 'Salud pública y control sanitario', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(35, 'Subgerencia de serenazgo y policía municipal', 'Seguridad y vigilancia municipal', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(36, 'Subgerencia de gestión del riesgo de desastres', 'Prevención y atención de desastres', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(37, 'Subgerencia de tránsito, transporte y seguridad vial', 'Gestión del tránsito y transporte', 1, '2026-05-22 15:53:23', '2026-06-11 00:52:35'),
	(38, 'Subgerencia de infraestructura', 'Ejecución de infraestructura pública', 0, '2026-06-02 15:03:05', '2026-06-11 00:52:35');

-- Volcando estructura para tabla archivo_mdjlo.cache
DROP TABLE IF EXISTS `cache`;
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla archivo_mdjlo.cache: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.cache_locks
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla archivo_mdjlo.cache_locks: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.expedientes
DROP TABLE IF EXISTS `expedientes`;
CREATE TABLE IF NOT EXISTS `expedientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_expediente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `tipo_documento_id` int NOT NULL,
  `area_origen_id` int NOT NULL,
  `area_actual_id` int NOT NULL,
  `numero_folios` int DEFAULT NULL,
  `estado` enum('Activo','Para revision','Para Depurar') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Activo',
  `fecha_ingreso` date NOT NULL,
  `tiempo_conservacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_revision` date DEFAULT NULL,
  `digitalizado` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_expediente` (`numero_expediente`),
  KEY `tipo_documento_id` (`tipo_documento_id`),
  KEY `area_origen_id` (`area_origen_id`),
  KEY `area_actual_id` (`area_actual_id`),
  CONSTRAINT `expedientes_ibfk_1` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`),
  CONSTRAINT `expedientes_ibfk_2` FOREIGN KEY (`area_origen_id`) REFERENCES `areas` (`id`),
  CONSTRAINT `expedientes_ibfk_3` FOREIGN KEY (`area_actual_id`) REFERENCES `areas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.expedientes: ~15 rows (aproximadamente)
INSERT INTO `expedientes` (`id`, `numero_expediente`, `titulo`, `descripcion`, `tipo_documento_id`, `area_origen_id`, `area_actual_id`, `numero_folios`, `estado`, `fecha_ingreso`, `tiempo_conservacion`, `fecha_revision`, `digitalizado`, `created_at`, `updated_at`) VALUES
	(1, 'EXP-1985-0412', 'Plan de Catastro Urbano Distrital y Delimitación Territorial de José Leonardo Ortiz', 'Expediente histórico que contiene los primeros planos cartográficos, zonificación y actas de colindancia del distrito.', 8, 31, 1, 350, 'Para Depurar', '1985-04-12', '10 años', '1995-04-12', 0, '2026-06-11 10:00:00', '2026-06-27 00:00:00'),
	(2, 'EXP-1998-1104', 'Convenio de Cooperación con Epsel S.A. para Redes de Saneamiento en el Sector Moshoqueque', 'Documentación matriz sobre el tendido primario de redes de agua potable y alcantarillado en las zonas comerciales.', 6, 11, 1, 185, 'Para Depurar', '1998-11-04', '5 años', '2003-11-04', 0, '2026-06-11 11:15:00', '2026-06-27 00:00:00'),
	(3, 'EXP-2005-0722', 'Reglamento de Organización y Funciones (ROF) Histórico de la Policía Municipal y Serenazgo', 'Directiva municipal antigua que normaba las funciones de control de orden público y comercio ambulatorio.', 21, 35, 1, 95, 'Para Depurar', '2005-07-22', '5 años', '2110-07-22', 0, '2026-06-11 12:30:00', '2026-06-27 00:00:00'),
	(4, 'EXP-2015-0914', 'Resolución de Alcaldía N° 412-2015 - Títulos de Propiedad de Adjudicación de Lotes en Sector San Carlos', 'Títulos de propiedad otorgados bajo el marco del programa de formalización de la propiedad informal.', 2, 11, 1, 540, 'Activo', '2015-09-14', 'PERMANENTE', NULL, 0, '2026-06-11 14:20:00', '2026-06-11 14:20:00'),
	(5, 'EXP-2018-0320', 'Expediente Técnico de Construcción de la Infraestructura del Terminal Terrestre de JLO', 'Planos estructurales, presupuestos analíticos, estudios de suelos y memoria descriptiva del terminal de transportes.', 8, 21, 1, 820, 'Activo', '2018-03-20', 'PERMANENTE', NULL, 0, '2026-06-11 15:45:00', '2026-06-11 15:45:00'),
	(6, 'EXP-2024-1005', 'Informe de Auditoría Financiera de Arbitrios Municipales - Ejercicio Fiscal 2023', 'Evaluación integral emitida por el Órgano de Control Interno (OCI) sobre la recaudación tributaria.', 12, 17, 1, 62, 'Activo', '2024-10-05', '3 años', '2027-10-05', 0, '2026-06-11 16:10:00', '2026-06-11 16:10:00'),
	(7, 'EXP-2025-0218', 'Licitación Pública N° 002-2025 - Adquisición de Combustible para el Pool de Compactadoras de Limpieza Pública', 'Bases administrativas, propuestas de postores y actas de otorgamiento de la buena pro para el servicio de residuos.', 7, 4, 1, 215, 'Activo', '2025-02-18', '5 años', '2030-02-18', 0, '2026-06-11 17:02:00', '2026-06-11 17:02:00'),
	(8, 'EXP-2025-0512', 'Estudio de Impacto Ambiental para la Reubicación de Residuos Sólidos en las Celdas Transitorias', 'Informe técnico que detalla las medidas de mitigación biológica para el manejo de la basura en el distrito.', 12, 20, 1, 145, 'Activo', '2025-05-12', '5 años', '2030-05-12', 0, '2026-06-11 18:30:00', '2026-06-11 18:30:00'),
	(9, 'EXP-2025-0922', 'Directiva de Control de Asistencia, Puntualidad y Permanencia del Personal Administrativo', 'Normativa interna emitida por Recursos Humanos para la regulación de marcaciones mediante sistema biométrico.', 21, 3, 1, 34, 'Activo', '2025-09-22', '5 años', '2030-09-22', 0, '2026-06-11 20:15:00', '2026-06-11 20:15:00'),
	(10, 'EXP-2025-1114', 'Convenio Institucional con el Gobierno Regional para el Pavimentado de la Av. Chiclayo', 'Adenda legal y acuerdos financieros tripartitos destinados al financiamiento de la obra de transitabilidad vial.', 6, 11, 1, 88, 'Activo', '2025-11-14', 'PERMANENTE', NULL, 0, '2026-06-11 22:00:00', '2026-06-11 22:00:00'),
	(11, 'EXP-2026-0502', 'Plan Operativo Institucional (POI) Corregido - Gerencia de Desarrollo Social', 'Presupuesto institucional y metas físicas asignadas a los Comedores Populares y Vaso de Leche de JLO.', 12, 19, 1, 112, 'Activo', '2026-05-02', '3 años', '2029-05-02', 0, '2026-06-16 04:33:40', '2026-06-16 04:33:40'),
	(12, 'EXP-2026-0515', 'Solicitud de Licencia de Funcionamiento Definitiva para el Centro Comercial Confecciones Moshoqueque', 'Inspección técnica de seguridad en edificaciones (ITSE) y certificado de zonificación comercial.', 7, 22, 1, 45, 'Activo', '2026-05-15', '5 años', '2031-05-15', 0, '2026-06-16 06:33:40', '2026-06-16 06:33:40'),
	(13, 'EXP-2026-0602', 'Ordenanza Municipal N° 008-2026 - Plan de Reordenamiento y Formalización del Comercio Ambulatorio', 'Marco regulatorio distrital aprobado en Sesión de Concejo para mitigar la congestión en los anillos comerciales.', 5, 11, 1, 28, 'Activo', '2026-06-02', 'PERMANENTE', NULL, 0, '2026-06-16 07:33:40', '2026-06-16 07:33:40'),
	(14, 'EXP-2026-0014', 'Informe del Estado Situacional de los Sistemas Informáticos y Servidores de la Municipalidad', 'Diagnóstico de la infraestructura tecnológica, conectividad de red y propuestas de modernización digital.', 12, 16, 1, 55, 'Activo', '2026-06-16', '3 años', '2029-06-16', 0, '2026-06-16 08:33:40', '2026-06-16 08:33:40'),
	(15, 'EXP-2026-0015', 'Solicitud de Alarmas Vecinales e Implementos de Patrullaje Integrado - Juntas Vecinales Sector San Carlos', 'Petición formal ingresada por Mesa de Partes para el equipamiento básico de las rondas de seguridad ciudadana.', 13, 26, 1, 18, 'Activo', '2026-06-16', '1 año', '2027-06-16', 0, '2026-06-16 08:33:40', '2026-06-16 08:33:40');

-- Volcando estructura para tabla archivo_mdjlo.historial_ediciones
DROP TABLE IF EXISTS `historial_ediciones`;
CREATE TABLE IF NOT EXISTS `historial_ediciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `campo_modificado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `valor_anterior` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `valor_nuevo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `historial_ediciones_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_ediciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.historial_ediciones: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.historial_estados
DROP TABLE IF EXISTS `historial_estados`;
CREATE TABLE IF NOT EXISTS `historial_estados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `estado_anterior` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `estado_nuevo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `historial_estados_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_estados_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.historial_estados: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.jobs
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla archivo_mdjlo.jobs: ~0 rows (aproximadamente)

-- Volcando estructura para tabla archivo_mdjlo.migrations
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla archivo_mdjlo.migrations: ~6 rows (aproximadamente)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1),
	(2, '0001_01_01_000001_create_cache_table', 1),
	(3, '0001_01_01_000002_create_jobs_table', 1),
	(4, '2026_05_18_185315_create_personal_access_tokens_table', 2),
	(5, '2026_06_22_101133_create_solicituds_table', 3),
	(6, '2026_06_22_120641_ajustar_columnas_solicitudes', 4);

-- Volcando estructura para tabla archivo_mdjlo.personal_access_tokens
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla archivo_mdjlo.personal_access_tokens: ~173 rows (aproximadamente)
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
	(2, 'App\\Models\\User', 1, 'auth_token', 'd66d3a1059cd669b17d697cb8e26aa06f39298865ad58731614b3d155af0f904', '["*"]', '2026-05-19 02:46:04', NULL, '2026-05-19 02:40:21', '2026-05-19 02:46:04'),
	(5, 'App\\Models\\User', 1, 'auth_token', 'e32b4f51c6298b75ff315c0e8c6ab43dee28f2e1c1df490bd23e95e2d9c87b84', '["*"]', '2026-05-21 20:58:46', NULL, '2026-05-19 18:42:59', '2026-05-21 20:58:46'),
	(6, 'App\\Models\\User', 1, 'auth_token', 'e53d5dccd1a965b530a188afedb33b268ba900fe9ad3c73a9cfac64adb4c0c4d', '["*"]', '2026-05-19 23:48:34', NULL, '2026-05-19 20:58:46', '2026-05-19 23:48:34'),
	(7, 'App\\Models\\User', 1, 'auth_token', '840617cd544e2dcf62192f7c5a229e747e34e5d8776c89162ac3b57592ea942f', '["*"]', '2026-05-19 23:59:40', NULL, '2026-05-19 23:49:01', '2026-05-19 23:59:40'),
	(8, 'App\\Models\\User', 1, 'auth_token', '23628d232d291fab8b486fa31faf9cc7c07bb824f8a50fd92fafa956ef14395d', '["*"]', '2026-05-21 20:13:39', NULL, '2026-05-20 00:01:06', '2026-05-21 20:13:39'),
	(9, 'App\\Models\\User', 1, 'auth_token', 'd5f986a7e7648b25b18a5e68233c9d0f463700652b37e63680b37cb8541f3d22', '["*"]', '2026-05-21 19:24:27', NULL, '2026-05-21 19:17:55', '2026-05-21 19:24:27'),
	(10, 'App\\Models\\User', 1, 'auth_token', '56627e4074c2939f608f372430ae5c59e6f45ef45f16bbc1f997a51e734630e1', '["*"]', '2026-05-21 19:54:23', NULL, '2026-05-21 19:52:33', '2026-05-21 19:54:23'),
	(11, 'App\\Models\\User', 1, 'auth_token', '3fd6d21ff21f6792a45961d7906aeb1c1bcfa78bca3940e84e56816745641570', '["*"]', NULL, NULL, '2026-05-21 20:21:33', '2026-05-21 20:21:33'),
	(12, 'App\\Models\\User', 1, 'auth_token', '5823da7e941e7ea5a849e0ad9600907a681b4ae7a0ddbddaea860157a8a80526', '["*"]', NULL, NULL, '2026-05-21 20:28:55', '2026-05-21 20:28:55'),
	(13, 'App\\Models\\User', 1, 'auth_token', '22923b43b138c28d955b7a4a5d46333f5e1f57d5567b514881903534d760408d', '["*"]', NULL, NULL, '2026-05-21 20:30:12', '2026-05-21 20:30:12'),
	(14, 'App\\Models\\User', 1, 'auth_token', '047dc8bc10593b4c62e216ab383fd0fe0a22e6470e2760a4f1e225060794e4f3', '["*"]', NULL, NULL, '2026-05-21 20:30:17', '2026-05-21 20:30:17'),
	(15, 'App\\Models\\User', 1, 'auth_token', 'a54c08a34a517388e741f935dcc498dbdfc96565f6d6b65892b9f718678eccdf', '["*"]', '2026-05-21 20:43:50', NULL, '2026-05-21 20:34:58', '2026-05-21 20:43:50'),
	(16, 'App\\Models\\User', 1, 'auth_token', '95fe336639937270cfbdd9cd2daa55c5a3671741ae279d61a362c4d2994249e5', '["*"]', '2026-05-21 20:41:36', NULL, '2026-05-21 20:40:51', '2026-05-21 20:41:36'),
	(17, 'App\\Models\\User', 1, 'auth_token', '491a2a6831a01d62cca01f98ab635e93cd9dfbbbf242918343dfd4e47cd32358', '["*"]', '2026-05-21 20:52:45', NULL, '2026-05-21 20:42:45', '2026-05-21 20:52:45'),
	(18, 'App\\Models\\User', 1, 'auth_token', '7be1295001e7d185d774ccbeb54d9b0c60ff2c2c542a57b4bad72ff3d676a6c1', '["*"]', '2026-05-21 20:59:45', NULL, '2026-05-21 20:44:12', '2026-05-21 20:59:45'),
	(19, 'App\\Models\\User', 1, 'auth_token', '33213f7ddb9c6dd46ddf411bfde186caa7a68c646ab63c5968ec672925533e3a', '["*"]', NULL, NULL, '2026-05-21 20:56:37', '2026-05-21 20:56:37'),
	(20, 'App\\Models\\User', 1, 'auth_token', 'c27092a894b2e9333c1a5df8b35c73fa242095d80d1e9b28f543548cf77338e6', '["*"]', '2026-05-21 20:58:52', NULL, '2026-05-21 20:58:19', '2026-05-21 20:58:52'),
	(22, 'App\\Models\\User', 1, 'auth_token', '7c5a799fa810757c20c07856e0c85a9eace1129f248eda78eb8e448c2554b34e', '["*"]', NULL, NULL, '2026-05-21 21:08:31', '2026-05-21 21:08:31'),
	(23, 'App\\Models\\User', 1, 'auth_token', 'd7f6f4d6711de19cd018b5ae00c96442e186af79c3c7d3a180e6cc2d235fc883', '["*"]', '2026-05-21 21:12:21', NULL, '2026-05-21 21:09:52', '2026-05-21 21:12:21'),
	(24, 'App\\Models\\User', 1, 'auth_token', '6c04602fafa8ea38771d031231b3cd9f95370913fa4b0ac785bb3b7fab6dd11f', '["*"]', '2026-05-21 21:20:29', NULL, '2026-05-21 21:12:27', '2026-05-21 21:20:29'),
	(25, 'App\\Models\\User', 1, 'auth_token', '809b636cbe2cd5df479597534d1825a7196b97eaeb521b617bab83102cc9d1ca', '["*"]', NULL, NULL, '2026-05-21 21:14:26', '2026-05-21 21:14:26'),
	(26, 'App\\Models\\User', 1, 'auth_token', '3ed7c4dad5719c7bba4c1452790bc875a4de523a49d4cfd7e90314d3a8eca1c6', '["*"]', '2026-05-21 22:42:33', NULL, '2026-05-21 21:14:39', '2026-05-21 22:42:33'),
	(27, 'App\\Models\\User', 2, 'auth_token', 'd5c46d2f1806236af3352513427a1110ebcf3dd25734cb1b941b06ec14f850e5', '["*"]', '2026-05-22 21:50:17', NULL, '2026-05-22 18:30:51', '2026-05-22 21:50:17'),
	(28, 'App\\Models\\User', 1, 'auth_token', 'eefd936a73228263d23a1209f9e6c5b9a78ef8f1c60aadf61fd6ef20429b8a9d', '["*"]', '2026-05-22 23:15:06', NULL, '2026-05-22 19:41:27', '2026-05-22 23:15:06'),
	(29, 'App\\Models\\User', 2, 'auth_token', '5d63f744dcf3710f87d6b591265b0ab9c53e7936cf5129171bb9299939052614', '["*"]', '2026-05-22 21:28:22', NULL, '2026-05-22 21:16:52', '2026-05-22 21:28:22'),
	(30, 'App\\Models\\User', 2, 'auth_token', '99c52074855139f23b374ec8260ad1a2d093c8811f3c73e3e452a1b2c15a3062', '["*"]', '2026-05-22 21:29:35', NULL, '2026-05-22 21:28:27', '2026-05-22 21:29:35'),
	(31, 'App\\Models\\User', 2, 'auth_token', 'b30cda9cce83e1eb9faf40ae15105100f9e43eaef5516e0fbaa1de743da50c52', '["*"]', '2026-05-22 21:51:04', NULL, '2026-05-22 21:50:24', '2026-05-22 21:51:04'),
	(32, 'App\\Models\\User', 2, 'auth_token', '593a87072abd13ababf8ccf9cb9879d6a6be1b46b482e3aace62468664ecf9cd', '["*"]', '2026-05-22 23:17:39', NULL, '2026-05-22 23:15:38', '2026-05-22 23:17:39'),
	(33, 'App\\Models\\User', 1, 'auth_token', '81825f09eb13c0f85e51038e35eb5a2757413fb0f49b73b284978d7cc60818e3', '["*"]', '2026-05-23 00:24:40', NULL, '2026-05-22 23:18:09', '2026-05-23 00:24:40'),
	(34, 'App\\Models\\User', 2, 'auth_token', '5ba96a65cdd0cee2f95970af5e8e2e8230f2f71b6d12a78881031ddc7408368e', '["*"]', '2026-05-22 23:50:18', NULL, '2026-05-22 23:49:40', '2026-05-22 23:50:18'),
	(35, 'App\\Models\\User', 2, 'auth_token', 'cf079f93e85b21ba9bc242d8262611563e0a66e0a026b28eab9938ce0003c640', '["*"]', '2026-05-25 18:32:30', NULL, '2026-05-25 18:29:49', '2026-05-25 18:32:30'),
	(36, 'App\\Models\\User', 2, 'auth_token', 'f664cbe6d3dfe289092927a0e60039696386f31eefcb6dcd25a5df1605c65527', '["*"]', '2026-06-02 15:10:23', NULL, '2026-05-25 18:32:51', '2026-06-02 15:10:23'),
	(37, 'App\\Models\\User', 1, 'auth_token', '28cada7dd27ee32ebbc776908dc0f259c5d3c4735d1f84bbe63affdbad5d0f9c', '["*"]', '2026-05-25 17:43:37', NULL, '2026-05-25 18:57:00', '2026-05-25 17:43:37'),
	(38, 'App\\Models\\User', 1, 'auth_token', '3bf62a71e2d581bca60cddc26ce491785b148975d545396b2ce577e9f8bbcdda', '["*"]', NULL, NULL, '2026-05-25 19:46:47', '2026-05-25 19:46:47'),
	(39, 'App\\Models\\User', 1, 'auth_token', 'de461a7d2ffeba378d8a650383437abbf4602531bfc90ebd71e360ded24b9729', '["*"]', '2026-05-26 16:13:08', NULL, '2026-05-26 14:51:46', '2026-05-26 16:13:08'),
	(40, 'App\\Models\\User', 1, 'auth_token', '77a083c7ab737bc67d99f9642f2a224fb21ec3cca942d6d28ef085378b1a6c2f', '["*"]', '2026-05-28 16:58:30', NULL, '2026-05-26 16:13:17', '2026-05-28 16:58:30'),
	(41, 'App\\Models\\User', 1, 'auth_token', 'f5c5a62d60bf2b5dcfef023739cc104b69370d0db3cde5f2c5509e5566bae7f9', '["*"]', '2026-05-29 17:05:45', NULL, '2026-05-28 16:59:00', '2026-05-29 17:05:45'),
	(42, 'App\\Models\\User', 1, 'auth_token', 'c1508dcdf5f503126060ff1bdc98a65fb9046801f0037e9c334430316b8dbef2', '["*"]', '2026-06-01 16:37:40', NULL, '2026-05-29 17:05:54', '2026-06-01 16:37:40'),
	(43, 'App\\Models\\User', 1, 'auth_token', 'cb0010a69e16fe321d25e50c541784599e9169491bd9947ec405e71607ba7a43', '["*"]', '2026-06-04 16:16:58', NULL, '2026-06-01 16:39:40', '2026-06-04 16:16:58'),
	(44, 'App\\Models\\User', 1, 'auth_token', 'a91d32a375d476fe11f422294407ee7c3de20a407dfc71ca6b200b5631f1d9e3', '["*"]', '2026-06-09 13:46:05', NULL, '2026-06-09 13:41:18', '2026-06-09 13:46:05'),
	(45, 'App\\Models\\User', 1, 'auth_token', 'b9a9be6d9a377da9c9d2d7dde9c773d538ff0f59d26f73e5c8aaeebf145f7264', '["*"]', '2026-06-09 13:53:40', NULL, '2026-06-09 13:53:38', '2026-06-09 13:53:40'),
	(46, 'App\\Models\\User', 1, 'auth_token', 'fb9382f1c3a4ddaecc3d814a57a77a18a9c9cb464b8c177e2256d3ee1d031bd2', '["*"]', '2026-06-09 13:53:54', NULL, '2026-06-09 13:53:52', '2026-06-09 13:53:54'),
	(47, 'App\\Models\\User', 1, 'auth_token', 'ba019989b5a1f067573c0a00fc56672ecc9c2099711bb5f8eb48d79c406d684c', '["*"]', '2026-06-09 13:54:45', NULL, '2026-06-09 13:54:43', '2026-06-09 13:54:45'),
	(48, 'App\\Models\\User', 1, 'auth_token', 'f8fd634cd92fe345980bff52bb46cba4e10f11d3bc4196c046b5711ca09beed6', '["*"]', '2026-06-09 13:58:48', NULL, '2026-06-09 13:58:46', '2026-06-09 13:58:48'),
	(49, 'App\\Models\\User', 1, 'auth_token', '2d82cfb987fc22fe3817f4b3ba165339009d52588d6d23a241b009d554ecae0f', '["*"]', '2026-06-09 15:41:04', NULL, '2026-06-09 14:35:35', '2026-06-09 15:41:04'),
	(50, 'App\\Models\\User', 1, 'auth_token', 'b2a5b18ed55351a7d9a767819c745caf612969d42f6be12c1b2e26c630e9d455', '["*"]', '2026-06-09 16:05:48', NULL, '2026-06-09 16:00:35', '2026-06-09 16:05:48'),
	(51, 'App\\Models\\User', 1, 'auth_token', '869066b718e4f034f01408b07e959b38ab6a0467acb5f4c96cd997d6b8ef6236', '["*"]', '2026-06-09 16:23:11', NULL, '2026-06-09 16:23:08', '2026-06-09 16:23:11'),
	(52, 'App\\Models\\User', 1, 'auth_token', '4d7ab8fc517e7b4bfcbd534ed0f077c774c7f40372db642a4c0bfa38a8e6508f', '["*"]', '2026-06-09 16:23:39', NULL, '2026-06-09 16:23:27', '2026-06-09 16:23:39'),
	(53, 'App\\Models\\User', 1, 'auth_token', '42d5dc87f89a498866e51921cb28f80074ca5ce7c3649c7b296a6f6c7e7bc18b', '["*"]', '2026-06-09 16:24:23', NULL, '2026-06-09 16:24:21', '2026-06-09 16:24:23'),
	(54, 'App\\Models\\User', 1, 'auth_token', 'e83734cb8a64989ba5ae8a8eea02694e1b98bd3ee188a4bd122816f6e9703be6', '["*"]', '2026-06-09 16:24:58', NULL, '2026-06-09 16:24:51', '2026-06-09 16:24:58'),
	(55, 'App\\Models\\User', 1, 'auth_token', '9939aeb6555574a4415c356f3d790897c12b88bcda0ab509ab6e6487d3c0e44f', '["*"]', '2026-06-09 16:25:03', NULL, '2026-06-09 16:25:01', '2026-06-09 16:25:03'),
	(56, 'App\\Models\\User', 1, 'auth_token', '33b5177b5396a985912bb33e09f09ada1f4b8a814f786bf17982ed1792aa6b49', '["*"]', '2026-06-09 16:25:59', NULL, '2026-06-09 16:25:12', '2026-06-09 16:25:59'),
	(57, 'App\\Models\\User', 1, 'auth_token', 'bee2a2ac2336dcf61afa0ceed6d539f6f835231ebc941020b9e85db948db39e6', '["*"]', '2026-06-09 16:26:40', NULL, '2026-06-09 16:26:00', '2026-06-09 16:26:40'),
	(58, 'App\\Models\\User', 1, 'auth_token', '1650e62b5938562fedc8708a114d4f4c092fa274b6b40ff597e895c5ab92aecc', '["*"]', '2026-06-09 16:57:31', NULL, '2026-06-09 16:57:29', '2026-06-09 16:57:31'),
	(59, 'App\\Models\\User', 1, 'auth_token', 'a9094423fa69e8dd0d0b4885bb0b31335fe848803f370d48980844026b1fa8ce', '["*"]', '2026-06-09 17:00:33', NULL, '2026-06-09 16:59:27', '2026-06-09 17:00:33'),
	(60, 'App\\Models\\User', 1, 'auth_token', 'c8b49c5fa82bb4d06b2a84f8afc629bba9ad8ac1cf4b8dfb0f47da70bdae5a5d', '["*"]', '2026-06-09 17:49:49', NULL, '2026-06-09 17:47:16', '2026-06-09 17:49:49'),
	(61, 'App\\Models\\User', 1, 'auth_token', '5cb61ff7aa34a0cca3d6b48e6bbfd999fd8d5db2e890717c8ffcbd9818ed452f', '["*"]', '2026-06-09 18:10:40', NULL, '2026-06-09 17:59:17', '2026-06-09 18:10:40'),
	(62, 'App\\Models\\User', 1, 'auth_token', '697ab3cebe0ff0aee79fce3903309a13a71754d16bcb06b7032949e0bdaae1dc', '["*"]', '2026-06-09 18:20:01', NULL, '2026-06-09 18:19:53', '2026-06-09 18:20:01'),
	(63, 'App\\Models\\User', 1, 'auth_token', '4d4335b8a33f5e71e8323901e568a3eeb39f7decae02ea580c1c1c0afe3da623', '["*"]', '2026-06-09 18:38:44', NULL, '2026-06-09 18:23:53', '2026-06-09 18:38:44'),
	(64, 'App\\Models\\User', 1, 'auth_token', '981860de6f2951582f7cf384b0967c44315eb885009ad99f3b0a50794ce26a7d', '["*"]', '2026-06-09 21:08:27', NULL, '2026-06-09 20:50:25', '2026-06-09 21:08:27'),
	(65, 'App\\Models\\User', 1, 'auth_token', '7503e6699af6ac23fc41abb91185a7bc4ea7412bc52f1f2838133aae96a9d3ef', '["*"]', '2026-06-09 21:32:13', NULL, '2026-06-09 21:24:17', '2026-06-09 21:32:13'),
	(66, 'App\\Models\\User', 1, 'auth_token', '396e6c9b908e1fde483d9a7c76c6c1f28d83e1e6b7ee12b8224fdca53c478c3b', '["*"]', '2026-06-09 21:59:19', NULL, '2026-06-09 21:37:26', '2026-06-09 21:59:19'),
	(67, 'App\\Models\\User', 1, 'auth_token', '68bca66dc9e4197cd569c117024f30f12e4d7d3620a5bae3b174eeff043ee9b2', '["*"]', '2026-06-09 22:13:51', NULL, '2026-06-09 22:13:49', '2026-06-09 22:13:51'),
	(68, 'App\\Models\\User', 1, 'auth_token', '52e6ae7fd7b9739a0446c4d7c7065d815e49204c2553044de1e52c535c06ab1f', '["*"]', '2026-06-09 22:19:56', NULL, '2026-06-09 22:18:50', '2026-06-09 22:19:56'),
	(69, 'App\\Models\\User', 1, 'auth_token', '98b126b3fc44b317694096a434c82ecd736e7f363f56443bb912db953420dbeb', '["*"]', '2026-06-09 22:40:09', NULL, '2026-06-09 22:35:40', '2026-06-09 22:40:09'),
	(70, 'App\\Models\\User', 1, 'auth_token', '1e52c9a1fb7c3ef828e72ab8462aa8c9567fdb9120aa1ab7323e34d5bce5981b', '["*"]', '2026-06-09 23:12:13', NULL, '2026-06-09 23:10:48', '2026-06-09 23:12:13'),
	(71, 'App\\Models\\User', 1, 'auth_token', 'bb817455d3a382e6c657e872525a6e426957babbf7e8f7f3fd32365dbc98a76c', '["*"]', '2026-06-09 23:14:27', NULL, '2026-06-09 23:13:33', '2026-06-09 23:14:27'),
	(72, 'App\\Models\\User', 1, 'auth_token', 'b21a283d8920ca211721902572d58b85537c2a5902c0b725da6e76f94bd2865b', '["*"]', '2026-06-10 00:28:11', NULL, '2026-06-10 00:27:23', '2026-06-10 00:28:11'),
	(73, 'App\\Models\\User', 1, 'auth_token', 'b676c34d98f59c6e2915dcf6fb6eb3d1440e19f817d5511acfe17ed428ee3938', '["*"]', '2026-06-10 00:46:32', NULL, '2026-06-10 00:37:06', '2026-06-10 00:46:32'),
	(74, 'App\\Models\\User', 1, 'auth_token', '77ccd68efd4212c79bf2a758fe27cc8a0455b81054208a3c86fa413379b6c161', '["*"]', '2026-06-10 00:52:26', NULL, '2026-06-10 00:52:24', '2026-06-10 00:52:26'),
	(75, 'App\\Models\\User', 1, 'auth_token', '16488bac9bac66a5c6ce1a572e3cf8ed1a72978a9b17fd410776ca7d5b6320f1', '["*"]', '2026-06-10 14:05:19', NULL, '2026-06-10 13:57:39', '2026-06-10 14:05:19'),
	(76, 'App\\Models\\User', 2, 'auth_token', 'e5e053b3d23c7abec6607a11315c4a9ff1c93d46a2a000891d598a3500062c38', '["*"]', '2026-06-10 15:28:14', NULL, '2026-06-10 15:13:55', '2026-06-10 15:28:14'),
	(77, 'App\\Models\\User', 1, 'auth_token', '894ab6ca983691e4bb88d9648430cdda6d010d67507512f6ef844eb01ee3bad9', '["*"]', '2026-06-10 16:50:52', NULL, '2026-06-10 15:29:12', '2026-06-10 16:50:52'),
	(78, 'App\\Models\\User', 1, 'auth_token', 'dc9e91985a0b8a52f06488dbe9d52dd12bcdf91a7372ee9411e7c83a2ca09071', '["*"]', '2026-06-11 02:49:52', NULL, '2026-06-11 00:54:46', '2026-06-11 02:49:52'),
	(79, 'App\\Models\\User', 1, 'auth_token', 'e94cd087598f68cdfca161b14bbc0914271d2fe56f39493889ecc7e1eaa2a688', '["*"]', '2026-06-11 03:09:01', NULL, '2026-06-11 02:54:51', '2026-06-11 03:09:01'),
	(80, 'App\\Models\\User', 1, 'auth_token', 'f64c71066ac9587d3f36cf02abc7b2f37b34dfe94227de14eb3e1c442f9ec0d1', '["*"]', '2026-06-11 03:40:03', NULL, '2026-06-11 03:10:01', '2026-06-11 03:40:03'),
	(81, 'App\\Models\\User', 1, 'auth_token', '52ff4a8f6226ea29a74aa266905c8016bd99d580a849c979f5a6c2d2226cc9e4', '["*"]', '2026-06-11 03:49:35', NULL, '2026-06-11 03:49:00', '2026-06-11 03:49:35'),
	(82, 'App\\Models\\User', 1, 'auth_token', '91bdf5d2ada4c1a05410bc72de41518f212bb6de9b2aa12613c3615b3e160e2f', '["*"]', '2026-06-11 03:55:29', NULL, '2026-06-11 03:55:25', '2026-06-11 03:55:29'),
	(83, 'App\\Models\\User', 1, 'auth_token', 'c29c6334948528334e853aff4c6474693242fd0474c90a80b7c7678bbc5e1b2a', '["*"]', '2026-06-11 04:04:43', NULL, '2026-06-11 03:56:17', '2026-06-11 04:04:43'),
	(84, 'App\\Models\\User', 1, 'auth_token', '05dbb9cf109dbbac6e9c977944b849e0daa43e7bea7b1ca6ac9e7aaf95aedcca', '["*"]', '2026-06-11 04:40:54', NULL, '2026-06-11 04:40:50', '2026-06-11 04:40:54'),
	(85, 'App\\Models\\User', 1, 'auth_token', '198ad340d3d2a548ab62163cc83a2d462d04a74277eda95e0945cf9fa011d9e7', '["*"]', '2026-06-11 04:42:50', NULL, '2026-06-11 04:41:37', '2026-06-11 04:42:50'),
	(86, 'App\\Models\\User', 1, 'auth_token', 'f67366209ff8a180007d9cc9cfe5dd4782f1eef7e0c698d6a193757e18e6505c', '["*"]', '2026-06-11 05:29:11', NULL, '2026-06-11 05:10:08', '2026-06-11 05:29:11'),
	(87, 'App\\Models\\User', 1, 'auth_token', '7a097487a763d4e43e763097e9c294197ddffc407b9ce901469e462bc83ef90e', '["*"]', '2026-06-11 05:35:51', NULL, '2026-06-11 05:34:17', '2026-06-11 05:35:51'),
	(88, 'App\\Models\\User', 1, 'auth_token', '32763cc892dfbb28f7022c05c9e948e5955a3d1d7fe707a71c40b882058d473b', '["*"]', '2026-06-11 05:44:42', NULL, '2026-06-11 05:42:24', '2026-06-11 05:44:42'),
	(89, 'App\\Models\\User', 1, 'auth_token', 'fe3bff0c84457b337ac44c4f8963afb9b6331cde2211aa704c4c20ddf94162ab', '["*"]', '2026-06-11 06:00:31', NULL, '2026-06-11 06:00:30', '2026-06-11 06:00:31'),
	(90, 'App\\Models\\User', 1, 'auth_token', '6c573866089c4fc7561846de63de29572b5177583175cc4cfb94870ef652f0fe', '["*"]', '2026-06-11 06:19:18', NULL, '2026-06-11 06:02:06', '2026-06-11 06:19:18'),
	(91, 'App\\Models\\User', 1, 'auth_token', '8b4488cd88b0de31a94f217598e9cb14163b5c507bd3f0ebb89071c1bafa7b56', '["*"]', '2026-06-11 13:31:47', NULL, '2026-06-11 13:26:17', '2026-06-11 13:31:47'),
	(92, 'App\\Models\\User', 1, 'auth_token', '7502ee0d1992f8dcc36edc5d85cef43c6142a5ab7794b1ebff9991ddafe5fe72', '["*"]', '2026-06-11 14:00:09', NULL, '2026-06-11 13:38:26', '2026-06-11 14:00:09'),
	(93, 'App\\Models\\User', 1, 'auth_token', '9fbf6a33483903a2ebc9f6105240ace7a7705259cb7acdde72a003bd8f290d4b', '["*"]', '2026-06-11 14:01:03', NULL, '2026-06-11 14:00:37', '2026-06-11 14:01:03'),
	(94, 'App\\Models\\User', 1, 'auth_token', 'f9c7ea5bda0012732fb83354e8a0879fe80a75b6852165d8eb2acede234e6478', '["*"]', '2026-06-11 14:43:30', NULL, '2026-06-11 14:21:22', '2026-06-11 14:43:30'),
	(95, 'App\\Models\\User', 1, 'auth_token', '9c99db755caf3692f50dcf51fc26e081a3f8f41de84a535817b761288eb7bfe0', '["*"]', '2026-06-11 14:44:05', NULL, '2026-06-11 14:43:41', '2026-06-11 14:44:05'),
	(96, 'App\\Models\\User', 1, 'auth_token', 'bcc08e9cc9e1c82bc1ea51676270a8a4603d850f9fd0cdee24911b70dbfaff82', '["*"]', '2026-06-11 14:56:22', NULL, '2026-06-11 14:56:01', '2026-06-11 14:56:22'),
	(97, 'App\\Models\\User', 1, 'auth_token', 'ffb30139c9ac0abd2e4e7528d53c926a8e0495f3148c500469eaa130b2ae6527', '["*"]', '2026-06-11 15:04:01', NULL, '2026-06-11 15:03:59', '2026-06-11 15:04:01'),
	(98, 'App\\Models\\User', 1, 'auth_token', 'b4e0a5f17789958914626984694679c8f598ceff518a0ed7503e08ec1a6a1fd8', '["*"]', '2026-06-11 15:17:14', NULL, '2026-06-11 15:08:43', '2026-06-11 15:17:14'),
	(99, 'App\\Models\\User', 1, 'auth_token', 'd3b3c50247d88d23647a1c2d2f440f72bf725d0225db359e5738f3e1f4b2858b', '["*"]', '2026-06-11 22:11:18', NULL, '2026-06-11 22:11:17', '2026-06-11 22:11:18'),
	(100, 'App\\Models\\User', 1, 'auth_token', '2e385152eab06bcaf8799db34956523f2bd3f0339ddb94637a07e81d6ea68a25', '["*"]', '2026-06-12 00:35:39', NULL, '2026-06-12 00:19:18', '2026-06-12 00:35:39'),
	(101, 'App\\Models\\User', 1, 'auth_token', 'd21b540653daba9666a83bae6551d01c9ab1ef20b81b6631f566a767b432eaee', '["*"]', '2026-06-12 00:47:57', NULL, '2026-06-12 00:41:18', '2026-06-12 00:47:57'),
	(102, 'App\\Models\\User', 1, 'auth_token', 'e20428d3f4c4649574604d3c30a5f9a9d45c6e9c10560e78f30bea6a871afa3b', '["*"]', '2026-06-12 00:48:15', NULL, '2026-06-12 00:48:14', '2026-06-12 00:48:15'),
	(103, 'App\\Models\\User', 1, 'auth_token', '24fcaee5866414a92fae725f70400ab6b5cd76eb7cbe91bb23a2a39d35e416f7', '["*"]', '2026-06-12 00:53:41', NULL, '2026-06-12 00:53:40', '2026-06-12 00:53:41'),
	(104, 'App\\Models\\User', 1, 'auth_token', '4046c7ac06ac9b887cfabc25d76761d4066190f7a4d57d17c0f6b5836f562a7d', '["*"]', '2026-06-12 00:57:53', NULL, '2026-06-12 00:55:17', '2026-06-12 00:57:53'),
	(105, 'App\\Models\\User', 1, 'auth_token', '52f353b797cca6761dc04f0a0e7f27125b36fdf1377e046fb9145f0d475cdc7f', '["*"]', '2026-06-12 01:11:05', NULL, '2026-06-12 01:07:05', '2026-06-12 01:11:05'),
	(106, 'App\\Models\\User', 1, 'auth_token', '9781863c554a9a1f93536726fc870200375d16524323202d4ef28997b1ece7fc', '["*"]', '2026-06-12 13:40:23', NULL, '2026-06-12 13:33:24', '2026-06-12 13:40:23'),
	(107, 'App\\Models\\User', 1, 'auth_token', '596e27c73e1a9021ca31cb234af4ce352d96b71713374456df0cd65d375a955a', '["*"]', '2026-06-12 14:57:35', NULL, '2026-06-12 13:44:58', '2026-06-12 14:57:35'),
	(108, 'App\\Models\\User', 1, 'auth_token', '9362cf83f2e6477acd84f12d3e4a33bcfd3dc93ffc7bed56b767c0b1406808d1', '["*"]', '2026-06-12 15:03:40', NULL, '2026-06-12 15:00:49', '2026-06-12 15:03:40'),
	(109, 'App\\Models\\User', 1, 'auth_token', 'cc97adeb45f244765ef9cee0b123a398d3539306e869843ae9f6c11d20ae36e4', '["*"]', '2026-06-12 18:20:59', NULL, '2026-06-12 18:20:39', '2026-06-12 18:20:59'),
	(110, 'App\\Models\\User', 1, 'auth_token', '6d566f5e8e0b0cd107dcf5107b6194240112ba295e001faedf945d972c75ab4b', '["*"]', '2026-06-12 18:23:48', NULL, '2026-06-12 18:23:46', '2026-06-12 18:23:48'),
	(111, 'App\\Models\\User', 1, 'auth_token', 'f0ed5bb1881ba03bafb513ec0cd36577513edc02c6c1fbb3aa95c6dbbcefdf30', '["*"]', '2026-06-12 18:31:19', NULL, '2026-06-12 18:28:00', '2026-06-12 18:31:19'),
	(112, 'App\\Models\\User', 1, 'auth_token', '64f7d4b936a71634faf4ccab8ada5fd3ab2d4f6ab10346429427def2454b0ad4', '["*"]', '2026-06-12 18:35:32', NULL, '2026-06-12 18:31:35', '2026-06-12 18:35:32'),
	(113, 'App\\Models\\User', 1, 'auth_token', '1aee4f0fb4f700c149d7ca7be3ff4b6aaf320ab057398ceb666c061ccf8500c6', '["*"]', '2026-06-12 18:36:48', NULL, '2026-06-12 18:35:43', '2026-06-12 18:36:48'),
	(114, 'App\\Models\\User', 1, 'auth_token', '2599df771e5b4a9724c2a7e3e58a185155542d529273d091396505a44d87855b', '["*"]', '2026-06-12 18:47:42', NULL, '2026-06-12 18:46:13', '2026-06-12 18:47:42'),
	(115, 'App\\Models\\User', 1, 'auth_token', 'bc40ff790a2ec3b8942f8ff6db79ac35c728f911ec468902500d317993e5167e', '["*"]', '2026-06-13 22:33:22', NULL, '2026-06-13 22:27:47', '2026-06-13 22:33:22'),
	(116, 'App\\Models\\User', 1, 'auth_token', '39e5c85d9e4781797eeaf9a23e4c6071e5ba8d004bc9ce5add5485bc28a21e73', '["*"]', '2026-06-13 22:45:18', NULL, '2026-06-13 22:42:53', '2026-06-13 22:45:18'),
	(117, 'App\\Models\\User', 1, 'auth_token', 'e326cf2f9add2d078a2c78cdfaef8a21142a91d0d4df688cbbefa72725089e5f', '["*"]', '2026-06-13 23:39:24', NULL, '2026-06-13 22:50:07', '2026-06-13 23:39:24'),
	(118, 'App\\Models\\User', 1, 'auth_token', 'cbdf7ce06451c4d02e89c2c66c2855e1808ab7b2eaccda591c7404ffe8d99498', '["*"]', '2026-06-13 23:50:37', NULL, '2026-06-13 23:49:49', '2026-06-13 23:50:37'),
	(119, 'App\\Models\\User', 1, 'auth_token', '1f9f3a517f9b541c72996c1bde5a48f8e9cfc1e44793da35dcbf3e7d5da02011', '["*"]', '2026-06-15 01:05:55', NULL, '2026-06-15 01:04:07', '2026-06-15 01:05:55'),
	(120, 'App\\Models\\User', 1, 'auth_token', 'bc8f4ee27967d400bd2f94ac55adaf0c5a4321433fb104795676815449410362', '["*"]', '2026-06-15 02:11:05', NULL, '2026-06-15 02:10:41', '2026-06-15 02:11:05'),
	(121, 'App\\Models\\User', 1, 'auth_token', 'db737964a0aac34c17e99d01c5e06fadf3d5be721525982e94bd2eef2e2f190c', '["*"]', '2026-06-15 03:28:36', NULL, '2026-06-15 03:28:08', '2026-06-15 03:28:36'),
	(122, 'App\\Models\\User', 1, 'auth_token', '79b4b6450211edfc0a7636c123c421813f16fc07a524827aeb0f3f405f046300', '["*"]', '2026-06-15 14:01:11', NULL, '2026-06-15 13:19:34', '2026-06-15 14:01:11'),
	(123, 'App\\Models\\User', 1, 'auth_token', '7bbc8976e9b3f2a62a19460f10f997f516889c63d91cf9f47c999c629cb36d83', '["*"]', '2026-06-15 14:01:42', NULL, '2026-06-15 14:01:33', '2026-06-15 14:01:42'),
	(124, 'App\\Models\\User', 1, 'auth_token', 'b888c9c5cff695c1e0bdd25c68d5b9b12dda2c24b2af8ac3f464a3314a8412b5', '["*"]', '2026-06-15 14:10:31', NULL, '2026-06-15 14:07:35', '2026-06-15 14:10:31'),
	(125, 'App\\Models\\User', 1, 'auth_token', 'c2dc0f9726e521ce78deac0031c6c1e60cf435e02a73bae37f0177923e0d95f8', '["*"]', '2026-06-15 14:12:27', NULL, '2026-06-15 14:10:40', '2026-06-15 14:12:27'),
	(126, 'App\\Models\\User', 1, 'auth_token', 'c5609197a81a28726883809aef6c33e2e74a986e1ada5f68f2493dba6df929ea', '["*"]', '2026-06-15 14:13:52', NULL, '2026-06-15 14:13:49', '2026-06-15 14:13:52'),
	(127, 'App\\Models\\User', 1, 'auth_token', 'b0c6c7fcba87c34f31cb4b0bbfb49a25db17b19e163e1a7922a10951307c5e04', '["*"]', '2026-06-15 14:18:02', NULL, '2026-06-15 14:17:58', '2026-06-15 14:18:02'),
	(128, 'App\\Models\\User', 1, 'auth_token', 'd3c2abcc166e0e84dba14cb4168dba4fe40f130b60c1f91da5ec0af36f2764b6', '["*"]', '2026-06-15 14:45:57', NULL, '2026-06-15 14:32:24', '2026-06-15 14:45:57'),
	(129, 'App\\Models\\User', 1, 'auth_token', 'bd81a83d9b2c0dd96f6c97bba7fcdd30796cfebcc84cea7985dd66b5f93e50e5', '["*"]', '2026-06-16 13:32:17', NULL, '2026-06-16 13:31:18', '2026-06-16 13:32:17'),
	(130, 'App\\Models\\User', 1, 'auth_token', '68dd5463514548102689f3ff75e245c2e7cb75ff91196e33ec00f31b228e4731', '["*"]', '2026-06-16 13:32:47', NULL, '2026-06-16 13:32:43', '2026-06-16 13:32:47'),
	(131, 'App\\Models\\User', 1, 'auth_token', 'd40be18c8844541a3981339a99c0bbc1b16758fe34682c764a36e9b8dfe1071c', '["*"]', '2026-06-16 13:35:02', NULL, '2026-06-16 13:34:59', '2026-06-16 13:35:02'),
	(132, 'App\\Models\\User', 1, 'auth_token', '7a6ba2422a184d7b6fa5c46eb0d105ff12bec6251058e4d1931d5a714bf065df', '["*"]', '2026-06-19 16:42:57', NULL, '2026-06-19 16:41:01', '2026-06-19 16:42:57'),
	(133, 'App\\Models\\User', 1, 'auth_token', '41b1a8e56da1ae8c7bd9aa7b805af622541ca1f7911bb151f6ef27771d57af90', '["*"]', NULL, NULL, '2026-06-19 18:09:26', '2026-06-19 18:09:26'),
	(134, 'App\\Models\\User', 1, 'auth_token', 'adb188b4b3c24823955c6c18a0fee81bc72dfd797b842f34b1a9d57268fb1a22', '["*"]', '2026-06-19 18:17:05', NULL, '2026-06-19 18:09:28', '2026-06-19 18:17:05'),
	(135, 'App\\Models\\User', 1, 'auth_token', '0bcfeeb1e10a932bc9d820cb4e976f675fc0da883241ace30e4ca56a419f1e93', '["*"]', '2026-06-19 18:32:31', NULL, '2026-06-19 18:31:37', '2026-06-19 18:32:31'),
	(136, 'App\\Models\\User', 1, 'auth_token', 'dcf432d8d02b412a541d73bca5b3c65db25925b4f442d45691ff34e887ca7a07', '["*"]', '2026-06-22 07:47:01', NULL, '2026-06-22 07:46:54', '2026-06-22 07:47:01'),
	(137, 'App\\Models\\User', 1, 'auth_token', 'ecdced39baf3fe5e8da58c3f2243fc9e76a5a52434dc78d69ae34a854dc8898e', '["*"]', '2026-06-22 13:41:19', NULL, '2026-06-22 13:41:14', '2026-06-22 13:41:19'),
	(138, 'App\\Models\\User', 1, 'auth_token', '04629eaaa1319bedc1fdf1867ce4ef7d272afca0f2a664f08354b3a544de18d2', '["*"]', '2026-06-22 13:48:30', NULL, '2026-06-22 13:48:25', '2026-06-22 13:48:30'),
	(139, 'App\\Models\\User', 1, 'auth_token', '886a7550dd4d5a42ca5ab2ef973872c1f07ab221bb8070ec5259a973b6776db9', '["*"]', '2026-06-22 13:52:03', NULL, '2026-06-22 13:51:58', '2026-06-22 13:52:03'),
	(140, 'App\\Models\\User', 1, 'auth_token', 'd4fb4216c4286ea9392ccd7b0715341c1726ce76765141acfac3d905b54eb5b2', '["*"]', '2026-06-22 14:38:13', NULL, '2026-06-22 14:37:32', '2026-06-22 14:38:13'),
	(141, 'App\\Models\\User', 1, 'auth_token', '2d435a0adafa9dc46e6540a7bf3b77a716419c45be51804d389c9600bf689238', '["*"]', '2026-06-22 15:41:35', NULL, '2026-06-22 15:41:29', '2026-06-22 15:41:35'),
	(142, 'App\\Models\\User', 1, 'auth_token', '0b6975aec5c8e7a20383a1a486cc0caa76a57a6e18af4c3fbfcddb5f3ca63627', '["*"]', NULL, NULL, '2026-06-22 17:17:33', '2026-06-22 17:17:33'),
	(143, 'App\\Models\\User', 1, 'auth_token', 'a5b84ea92a1ecd2580ed6158c48550def427a23b25903dfa84e88fe991e5e8f6', '["*"]', NULL, NULL, '2026-06-22 17:41:02', '2026-06-22 17:41:02'),
	(144, 'App\\Models\\User', 1, 'auth_token', '8c5fda0136241e96069844afec5ddd9afb64b1554c097b981cc46ead17b3c845', '["*"]', '2026-06-22 17:42:23', NULL, '2026-06-22 17:42:19', '2026-06-22 17:42:23'),
	(145, 'App\\Models\\User', 1, 'auth_token', '5b794d060c26c0e242860bb08a2b16258864931579b9f198861c2906f0682a82', '["*"]', '2026-06-22 18:11:09', NULL, '2026-06-22 17:43:38', '2026-06-22 18:11:09'),
	(146, 'App\\Models\\User', 1, 'auth_token', 'bda8b6e2f89c22e7e0bf101ad9b5a91a6c8a694811ba09fe74d7d84a01cbde80', '["*"]', '2026-06-22 18:26:22', NULL, '2026-06-22 18:11:10', '2026-06-22 18:26:22'),
	(147, 'App\\Models\\User', 1, 'auth_token', '25a48e6153662c875d16bf7afce095b4ccc2a0a7082ef9994a3064ed7dc76161', '["*"]', '2026-06-23 18:50:27', NULL, '2026-06-23 18:49:31', '2026-06-23 18:50:27'),
	(148, 'App\\Models\\User', 1, 'auth_token', 'c3d5496f498c47866c6a0790400ec01cf12f53a9cba7ef839f0acea95d0281be', '["*"]', '2026-06-24 13:36:44', NULL, '2026-06-24 13:36:23', '2026-06-24 13:36:44'),
	(149, 'App\\Models\\User', 1, 'auth_token', 'e0ef9fde40f21dc2ec02b7f7421a6ee88e8575176d2a0c4ff5a8ae469fcf7ec9', '["*"]', '2026-06-24 16:34:06', NULL, '2026-06-24 16:33:55', '2026-06-24 16:34:06'),
	(150, 'App\\Models\\User', 1, 'auth_token', 'dffa066d0ab8f9bdfdebd0a3286e0cab3ae5167dc0f3e0d038135bad5fe15511', '["*"]', '2026-06-24 16:44:12', NULL, '2026-06-24 16:43:59', '2026-06-24 16:44:12'),
	(151, 'App\\Models\\User', 1, 'auth_token', '18fd5593b360a7756cf4951cce5360139424aa76bf2e4d68a928999e3e71d352', '["*"]', '2026-06-25 13:50:33', NULL, '2026-06-25 13:50:21', '2026-06-25 13:50:33'),
	(152, 'App\\Models\\User', 1, 'auth_token', 'fb275282d7151b31039e50c007bce18b0a4ece56cb0ad6f976189e5b16d682c0', '["*"]', '2026-06-25 14:29:22', NULL, '2026-06-25 14:17:31', '2026-06-25 14:29:22'),
	(153, 'App\\Models\\User', 1, 'auth_token', '288b0e8fcc88ae181121a6a859f7dc7abaf102f566e69e4becc918744b3bc263', '["*"]', '2026-06-25 14:31:44', NULL, '2026-06-25 14:29:26', '2026-06-25 14:31:44'),
	(154, 'App\\Models\\User', 1, 'auth_token', '77d1c695fc410fbb1ce72162054f803d1baea9c9adcd50b99400f0e7a1e8d79c', '["*"]', '2026-06-25 15:18:14', NULL, '2026-06-25 14:43:05', '2026-06-25 15:18:14'),
	(155, 'App\\Models\\User', 1, 'auth_token', '8388870e76f64099e5e85d6102f6e9bc803e763c55225285b1dcbe36c5e0a0af', '["*"]', '2026-06-25 15:20:02', NULL, '2026-06-25 15:18:24', '2026-06-25 15:20:02'),
	(156, 'App\\Models\\User', 1, 'auth_token', '292786b67e0609e5a0a80490b8b43ea41ad46592be4e8d68e9fc9bc38cb4681a', '["*"]', '2026-06-25 15:23:56', NULL, '2026-06-25 15:20:19', '2026-06-25 15:23:56'),
	(157, 'App\\Models\\User', 1, 'auth_token', 'aca64a53579858c2a06c2ee63a76225b523eff176ef14cbb9ba4f2063ddb71f4', '["*"]', '2026-06-25 15:47:18', NULL, '2026-06-25 15:23:57', '2026-06-25 15:47:18'),
	(158, 'App\\Models\\User', 1, 'auth_token', '1042c527af93a1090d912ee31675e892ec488a5b0185ed82faa83b2d7ac11219', '["*"]', '2026-06-25 15:51:09', NULL, '2026-06-25 15:47:32', '2026-06-25 15:51:09'),
	(159, 'App\\Models\\User', 1, 'auth_token', '88307e24c9c80cc9466c9b0eb3f10537be4a55710b5025e8610205aed9ac230b', '["*"]', '2026-06-25 15:57:32', NULL, '2026-06-25 15:51:16', '2026-06-25 15:57:32'),
	(160, 'App\\Models\\User', 1, 'auth_token', '8b6d1d60e98db87faf0361c8115b82e3c040e96c8e7c1c6e328f9b32ef5b8ad6', '["*"]', '2026-06-25 15:57:52', NULL, '2026-06-25 15:57:39', '2026-06-25 15:57:52'),
	(161, 'App\\Models\\User', 1, 'auth_token', 'dde5f5840d652f279b2e0da91280a595a58258a08993e8405bdc32d91899361c', '["*"]', '2026-06-25 16:51:08', NULL, '2026-06-25 16:34:20', '2026-06-25 16:51:08'),
	(162, 'App\\Models\\User', 1, 'auth_token', '534ff1cfb34e05a852c3f32cbd7740f41acd2f44fc51390386457600cc7a742c', '["*"]', '2026-06-26 13:41:11', NULL, '2026-06-25 17:10:58', '2026-06-26 13:41:11'),
	(163, 'App\\Models\\User', 1, 'auth_token', '19f8fa47a7801ac6b7d87c324764899ce7fa5a08c4d48dc9d176d0b5920a270a', '["*"]', '2026-06-26 14:18:50', NULL, '2026-06-26 13:41:13', '2026-06-26 14:18:50'),
	(164, 'App\\Models\\User', 1, 'auth_token', '9fa9ff3dedc03a1a73cad3c319aab3f34f1bbc72118874623b03eca377f53a1d', '["*"]', '2026-06-26 14:19:46', NULL, '2026-06-26 14:19:39', '2026-06-26 14:19:46'),
	(165, 'App\\Models\\User', 1, 'auth_token', 'b88c841809a31d24b2c140cf2bb7357cf8a34f93c975ccfb67816db62d7210c4', '["*"]', '2026-06-26 14:35:39', NULL, '2026-06-26 14:35:31', '2026-06-26 14:35:39'),
	(166, 'App\\Models\\User', 1, 'auth_token', 'e765942c7a0c01299d0a893c87c80e3d4d9966b74dbd523c416d058836192e17', '["*"]', '2026-06-26 14:46:09', NULL, '2026-06-26 14:44:49', '2026-06-26 14:46:09'),
	(167, 'App\\Models\\User', 1, 'auth_token', '62cf018266fbc32183aa3eb98272a071441d3bf05996898a8ad9fc7fd8fc56f3', '["*"]', '2026-06-26 15:42:32', NULL, '2026-06-26 14:47:11', '2026-06-26 15:42:32'),
	(168, 'App\\Models\\User', 1, 'auth_token', '1a29f1a83b32c0f8353dd878d908f09fcdb064f325fb2a3414d3a3539f110a03', '["*"]', '2026-06-26 15:42:40', NULL, '2026-06-26 15:42:33', '2026-06-26 15:42:40'),
	(169, 'App\\Models\\User', 1, 'auth_token', 'c886da5677979f45f0f312a3b628e22e08bcb6963cfe3c029e758b6fad38a1bb', '["*"]', '2026-06-26 17:35:56', NULL, '2026-06-26 16:27:11', '2026-06-26 17:35:56'),
	(170, 'App\\Models\\User', 1, 'auth_token', 'eaa42101d1a5aa9f819a08b7cd179ef9e3d7ad1a1983b1dc0cde330985b5cb5c', '["*"]', '2026-06-26 17:36:24', NULL, '2026-06-26 17:35:58', '2026-06-26 17:36:24'),
	(171, 'App\\Models\\User', 1, 'auth_token', 'aa7001e85c9cb3b3576ba6cd38ee6dc5f9bee16ec6337dcc51633a83bd0d5660', '["*"]', '2026-06-26 22:35:59', NULL, '2026-06-26 22:35:57', '2026-06-26 22:35:59'),
	(172, 'App\\Models\\User', 1, 'auth_token', '762e899fa9ae7bd86fe8eec6cd2bdce60b0a25edfaa1550384230e3313807296', '["*"]', '2026-06-27 01:27:41', NULL, '2026-06-26 23:05:41', '2026-06-27 01:27:41'),
	(173, 'App\\Models\\User', 1, 'auth_token', '7a9477f9504dd9244b656bd6e95970137f144509c0a8f8792e161c6e36ef68a2', '["*"]', '2026-06-27 08:16:08', NULL, '2026-06-27 08:16:06', '2026-06-27 08:16:08'),
	(174, 'App\\Models\\User', 1, 'auth_token', 'df66965e54eff1034003f0db820b5157af4f6f82bdbb3f729f321bb40f42d563', '["*"]', '2026-06-27 08:55:31', NULL, '2026-06-27 08:55:29', '2026-06-27 08:55:31'),
	(175, 'App\\Models\\User', 1, 'auth_token', '84082f58f3709e3fd13db1bb9695bf405f8b88456c20c85b1c691e303364be51', '["*"]', '2026-06-27 08:58:59', NULL, '2026-06-27 08:58:57', '2026-06-27 08:58:59'),
	(176, 'App\\Models\\User', 1, 'auth_token', '025be5559f31c610fb8dfe537852e37adafb857a21edca9bcd5cbf0b3f884115', '["*"]', '2026-06-27 17:15:04', NULL, '2026-06-27 09:00:19', '2026-06-27 17:15:04'),
	(177, 'App\\Models\\User', 1, 'auth_token', 'ea6a168290e5e227a0ce5a7699f04d8956be5cee965cf76ee935323f18a7e986', '["*"]', '2026-06-27 17:25:06', NULL, '2026-06-27 17:15:26', '2026-06-27 17:25:06');

-- Volcando estructura para tabla archivo_mdjlo.solicitudes
DROP TABLE IF EXISTS `solicitudes`;
CREATE TABLE IF NOT EXISTS `solicitudes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nombres` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `apellidos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expediente_solicitado` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_solicitud` date NOT NULL,
  `estado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pendiente',
  `motivo_rechazo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `costo_tupa` decimal(8,2) DEFAULT NULL,
  `tipo_formato_tupa` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `paginas_simples` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `paginas_fedateadas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `numero_hojas` int DEFAULT NULL,
  `cantidad_copias` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.solicitudes: ~26 rows (aproximadamente)
INSERT INTO `solicitudes` (`id`, `dni`, `nombres`, `apellidos`, `telefono`, `direccion`, `expediente_solicitado`, `descripcion`, `fecha_solicitud`, `estado`, `motivo_rechazo`, `costo_tupa`, `tipo_formato_tupa`, `paginas_simples`, `paginas_fedateadas`, `numero_hojas`, `cantidad_copias`, `created_at`, `updated_at`) VALUES
	(31, '72145689', 'Juan Carlos', 'Pérez Ramos', NULL, NULL, 'EXP-2026-001', 'Solicitud de copias de actas de sesión de consejo', '2026-01-10', 'Aceptada', NULL, 3.00, 'Copia Simple A4', '15', '0', 15, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(32, '45871236', 'María Fe', 'Ruiz Gonzales', NULL, NULL, 'EXP-2026-002', 'Copia fiel del original de resolución de alcaldía', '2026-01-15', 'Aceptada', NULL, 5.00, 'Copia Fedateada', '0', '10', 10, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(33, '10254789', 'Jorge Luis', 'Chávez Palacios', NULL, NULL, 'EXP-2026-003', 'Expediente técnico compuesto acumulado', '2026-02-05', 'Aceptada', NULL, 12.50, 'Mixto', '15', '15', 30, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(34, '09632514', 'Ana Lucía', 'Mendoza Castro', NULL, NULL, 'EXP-2026-004', 'Planos antiguos de zonificación JLO', '2026-02-20', 'Rechazada', NULL, 0.00, 'Copia Simple A4', '5', '0', 5, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(35, '41257896', 'Pedro Alcántara', 'Gómez Tello', NULL, NULL, 'EXP-2026-005', 'Copias simples de constancia de posesión', '2026-03-12', 'Aceptada', NULL, 1.60, 'Copia Simple A4', '8', '0', 8, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(36, '70214536', 'Diana Carolina', 'Sánchez Díaz', NULL, NULL, 'EXP-2026-006', 'Fedateado de partida de defunción archivo central', '2026-03-25', 'Aceptada', NULL, 10.00, 'Copia Fedateada', '0', '20', 20, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(37, '25841369', 'Carlos Augusto', 'Vargas Llosa', NULL, NULL, 'EXP-2026-007', 'Compendio mixto de licencias de edificación', '2026-04-02', 'Aceptada', NULL, 22.00, 'Mixto', '30', '20', 50, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(38, '48751296', 'Sofía Antonieta', 'Flores Torres', NULL, NULL, 'EXP-2026-008', 'Revisión de planos de catastro urbano', '2026-04-18', 'Rechazada', NULL, 0.00, 'Mixto', '6', '6', 12, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(39, '07412589', 'Miguel Ángel', 'Benites Rivas', NULL, NULL, 'EXP-2026-009', 'Acervo documentario masivo de la gerencia de rentas', '2026-05-14', 'Aceptada', NULL, 20.00, 'Copia Simple A4', '100', '0', 100, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(40, '15926348', 'Elena Beatriz', 'Sovero Marín', NULL, NULL, 'EXP-2026-010', 'Copia legalizada interna de adjudicación de lote', '2026-05-22', 'Aceptada', NULL, 2.50, 'Copia Fedateada', '0', '5', 5, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(41, '60124578', 'Roberto Carlos', 'Ganoza Vega', NULL, NULL, 'EXP-2026-011', 'Expediente administrativo integrado de transportes', '2026-06-01', 'Aceptada', NULL, 8.40, 'Mixto', '10', '8', 18, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(42, '42153698', 'Julio César', 'Tello Rojas', NULL, NULL, 'EXP-2026-012', 'Documentación sustentatoria de trámite de baja', '2026-06-10', 'Aceptada', NULL, 5.00, 'Copia Simple A4', '25', '0', 25, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(43, '33251478', 'Rosa Mercedes', 'Ayala Prado', NULL, NULL, 'EXP-2026-013', 'Copia de actas de matrimonio antiguas', '2026-06-18', 'Rechazada', NULL, 0.00, 'Copia Fedateada', '0', '4', 4, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(44, '71254836', 'Luis Fernando', 'Murrugarra Sáenz', NULL, NULL, 'EXP-2026-014', 'Resoluciones gerenciales completas año 2022', '2026-07-04', 'Aceptada', NULL, 20.00, 'Copia Fedateada', '0', '40', 40, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(45, '08521436', 'Gisela Paola', 'Ortiz Pinedo', NULL, NULL, 'EXP-2026-015', 'Reporte consolidado mixto de deudas coactivas', '2026-08-19', 'Aceptada', NULL, 6.20, 'Mixto', '7', '7', 14, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(46, '44512369', 'Humberto', 'Solis Quiroga', NULL, NULL, 'EXP-2026-016', 'Copia de Boucher y registros de caja antiguos', '2026-09-21', 'Aceptada', NULL, 2.40, 'Copia Simple A4', '12', '0', 12, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(47, '12547839', 'David Salomón', 'Vera Tudela', NULL, NULL, 'EXP-2026-017', 'Certificado de parámetros urbanísticos', '2026-10-05', 'Rechazada', NULL, 0.00, 'Copia Simple A4', '2', '0', 2, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(48, '70362514', 'Walter Alfonso', 'Guevara Arévalo', NULL, NULL, 'EXP-2026-018', 'Paquete compuesto de fiscalización tributaria', '2026-10-31', 'Aceptada', NULL, 19.50, 'Mixto', '25', '20', 45, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(49, '41526378', 'Carmen Julia', 'Delgado Neyra', NULL, NULL, 'EXP-2026-019', 'Duplicado de planos visados por obras públicas', '2026-11-12', 'Aceptada', NULL, 7.50, 'Copia Fedateada', '0', '15', 15, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(50, '80214536', 'Francisco', 'Bolognesi Cervantes', NULL, NULL, 'EXP-2026-020', 'Hojas informativas de mesa de partes', '2026-12-23', 'Aceptada', NULL, 10.00, 'Copia Simple A4', '50', '0', 50, 1, '2026-06-26 14:41:57', '2026-06-26 14:41:57'),
	(51, '70788512', 'Josue Joal', 'Pedraza Rivadeneira', '934402822', 'Los Inkas #453', 'EXP-2026-0014', 'Requiere de la pág 20-30', '2026-06-26', 'Aceptada', NULL, 1.00, 'Copia Simple A4', '20-30', NULL, 10, 1, '2026-06-27 00:28:40', '2026-06-27 00:29:28'),
	(52, '56456468', 'Roxana Alejandra', 'Mendoza Castillo', NULL, NULL, 'EXP-2026-0100', 'Requiere de la 1-10 copia simple y de la 20-30 fedateada', '2026-06-26', 'Aceptada', NULL, 2.00, 'Mixto', '1-10', '20-30', 20, 1, '2026-06-27 00:30:38', '2026-06-27 00:31:51'),
	(53, '45245345', 'José Luis', 'Rivera Castillo', NULL, NULL, 'EXP-2026-0101', 'Fedateados de la 50-80', '2026-06-26', 'Aceptada', NULL, 3.00, 'Fedateado', NULL, '50-80', 30, 1, '2026-06-27 00:38:00', '2026-06-27 00:38:36'),
	(54, '54645645', 'Joal', 'Rivadeneira', NULL, NULL, 'EXP-2026-0017', 'Requiere folios de la 1-50', '2026-06-26', 'Rechazada', 'Este expediente EXP-2026-0017 no se registra en el sistema, por lo tanto no se le puede entregar lo que solicita', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-27 01:26:58', '2026-06-27 01:27:41'),
	(55, '45645354', 'Juan Carlos Esteban', 'Chuquihuanca Flores', NULL, NULL, 'EXP-2026-0018', 'EXP-2026-0018', '2026-06-27', 'Rechazada', 'No se encuentra el expediente', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-27 17:23:29', '2026-06-27 17:25:05'),
	(56, '54345345', 'Roxy Aleja', 'Condorhuamán Rivera', NULL, NULL, 'EXP-2026-0017', 'EXP-2026-0017', '2026-06-27', 'Aceptada', NULL, 1.00, 'Copia Simple A4', '1-10', NULL, 10, 1, '2026-06-27 17:24:39', '2026-06-27 17:24:51');

-- Volcando estructura para tabla archivo_mdjlo.tipos_documento
DROP TABLE IF EXISTS `tipos_documento`;
CREATE TABLE IF NOT EXISTS `tipos_documento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.tipos_documento: ~24 rows (aproximadamente)
INSERT INTO `tipos_documento` (`id`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'Resolución', 'Documento administrativo de decisión', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(2, 'Resolucion de alcaldia', 'Resolución emitida por Alcaldía', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(3, 'Resolución gerencial', 'Resolución emitida por Gerencia', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(4, 'Decreto de alcaldia', 'Decreto emitido por Alcaldía', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(5, 'Ordenanza municipal', 'Norma municipal de alcance general', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(6, 'Contrato', 'Acuerdo contractual municipal', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(7, 'Expediente administrativo', 'Conjunto de documentos administrativos', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(8, 'Expediente técnico', 'Documentación técnica de proyectos', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(9, 'Comprobante de pago', 'Documento de pago institucional', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(10, 'Recibo de tributación', 'Comprobante de pago tributario', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(11, 'Memorándum', 'Comunicación interna', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(12, 'Informe tecnico', 'Documento técnico institucional', 1, '2026-05-15 14:12:16', '2026-06-11 00:52:35'),
	(13, 'Oficio', 'Comunicación oficial externa', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(14, 'Notificación', 'Documento de notificación oficial', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(15, 'Acta', 'Registro de reuniones o eventos', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(16, 'Otros', 'Otros tipos de documentos', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(17, 'Resolucion de secretaria general', 'Resolución emitida por Secretaría General', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(18, 'Resolucion de contraloria', 'Resolución emitida por Contraloría', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(19, 'Acuerdo de concejo', 'Acuerdo aprobado por Concejo Municipal', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(20, 'Resolucion de gerencia municipal', 'Resolución emitida por Gerencia Municipal', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(21, 'Directiva', 'Documento directivo institucional', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(22, 'Resolucion administrativa', 'Resolución administrativa institucional', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(23, 'Resolucion de gerencia de gestion de recursos humanos', 'Resolución de Recursos Humanos', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35'),
	(24, 'Convocatoria de trabajo', 'Convocatoria laboral institucional', 1, '2026-05-22 15:46:01', '2026-06-11 00:52:35');

-- Volcando estructura para tabla archivo_mdjlo.usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rol` enum('administrador','usuario') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'usuario',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla archivo_mdjlo.usuarios: ~2 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'Administrador Sistema', 'admin@jlo.gob.pe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador', 1, '2026-05-15 14:12:16', '2026-05-15 14:12:16'),
	(2, 'Usuario', 'archivo@jlo.gob.pe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1, '2026-05-22 13:29:53', '2026-05-22 13:29:53');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
