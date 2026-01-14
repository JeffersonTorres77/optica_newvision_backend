-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 14-01-2026 a las 16:15:44
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `optica_newvision`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cargos`
--

CREATE TABLE `cargos` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cargos`
--

INSERT INTO `cargos` (`id`, `nombre`) VALUES
('administrador', 'Administrador'),
('asesor-optico-1', 'Asesor optico 1'),
('asesor-optico-2', 'Asesor optico 2'),
('gerente', 'Gerente'),
('oftalmologo', 'Oftalmologo'),
('optometrista', 'Optometrista');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Monturas'),
(2, 'Lentes'),
(3, 'Líquidos'),
(4, 'Estuches'),
(5, 'Misceláneos'),
(6, 'Lentes de contacto');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `sede_id` varchar(50) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `sede_id`, `cedula`, `nombre`, `telefono`, `email`, `created_at`, `updated_at`) VALUES
(1, 'guarenas', '25409904', 'Jefferson Torres', '04241738615', 'jefersonugas@gmail.com', '2025-12-08 23:28:31', '2025-12-23 21:30:03'),
(2, 'guarenas', '9999999', 'Papita', '04142134565', 'papita@gmail.com', '2025-12-08 22:50:40', '2025-12-09 16:02:52'),
(4, 'guarenas', '267758784', 'Jesus Martinez', '04142134565', 'jesusmc@gmail.com', '2025-12-16 21:21:33', '2025-12-16 21:21:33'),
(5, 'guarenas', 'Castro', 'Ana', '021235440511', 'rubemm18@gmail.com', '2025-12-19 10:56:05', '2025-12-19 10:56:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones`
--

CREATE TABLE `configuraciones` (
  `id` int(11) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `clave` varchar(50) NOT NULL,
  `valor` varchar(100) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuraciones`
--

INSERT INTO `configuraciones` (`id`, `sede`, `clave`, `valor`, `descripcion`) VALUES
(1, 'guarenas', 'numero_control', '66', 'Siguiente numero de control para la sede de Guarenas.'),
(2, 'guatire', 'numero_control', '10', 'Siguiente numero de control para la sede de Guatire.'),
(4, 'guatire', 'moneda_base', 'dolar', 'Moneda base del sistema para la sede de Guatire.'),
(6, 'guarenas', 'moneda_base', 'bolivar', 'Moneda base del sistema para la sede de ${req.sede.nombre}.'),
(7, 'guatire', 'dias_archivar_ordenes', '10', 'Dias para archivar las ordenes de trabajo con el estado de  \"entregado\"'),
(8, 'guarenas', 'dias_archivar_ordenes', '1', 'Dias para archivar las ordenes de trabajo con el estado de  \"entregado\"');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historiales_medicos`
--

CREATE TABLE `historiales_medicos` (
  `id` int(11) NOT NULL,
  `numero` varchar(14) NOT NULL,
  `fecha` date NOT NULL,
  `paciente_id` varchar(70) NOT NULL,
  `motivo_consulta` text DEFAULT NULL,
  `otro_motivo_consulta` text DEFAULT NULL,
  `tipo_cristal_actual` text DEFAULT NULL,
  `ultima_graduacion` date DEFAULT NULL,
  `medico` varchar(255) DEFAULT NULL,
  `examen_ocular_lensometria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`examen_ocular_lensometria`)),
  `examen_ocular_refraccion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`examen_ocular_refraccion`)),
  `examen_ocular_refraccion_final` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`examen_ocular_refraccion_final`)),
  `examen_ocular_avsc_avae_otros` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`examen_ocular_avsc_avae_otros`)),
  `diagnostico` text DEFAULT NULL,
  `tratamiento` text DEFAULT NULL,
  `recomendaciones` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`recomendaciones`)),
  `conformidad_nota` text DEFAULT NULL,
  `conformidad_firma_paciente` varchar(100) DEFAULT NULL,
  `conformidad_firma_medico` varchar(100) DEFAULT NULL,
  `created_by` varchar(20) NOT NULL,
  `updated_by` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historiales_medicos`
--

INSERT INTO `historiales_medicos` (`id`, `numero`, `fecha`, `paciente_id`, `motivo_consulta`, `otro_motivo_consulta`, `tipo_cristal_actual`, `ultima_graduacion`, `medico`, `examen_ocular_lensometria`, `examen_ocular_refraccion`, `examen_ocular_refraccion_final`, `examen_ocular_avsc_avae_otros`, `diagnostico`, `tratamiento`, `recomendaciones`, `conformidad_nota`, `conformidad_firma_paciente`, `conformidad_firma_medico`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(26, 'H-20250812-001', '2025-08-12', 'aab3238922bcc25a6f606eb525ffdc56', 'Molestia ocular', '', 'Progresivo digital amplio', '2025-06-26', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\"}', '', '', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-12 02:15:11', '2025-08-12 13:47:02', NULL),
(27, 'H-20250812-002', '2025-08-12', 'aab3238922bcc25a6f606eb525ffdc56', 'Consulta rutinaria|Fatiga visual', '', 'Visión sencilla digital', '2025-08-07', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\"}', '', '', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_BLUE_BLOCK\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-12 02:24:40', '2025-08-12 15:00:04', NULL),
(28, 'H-20250812-003', '2025-08-12', 'c9f0f895fb98ab9159f51fd0297e236d', 'Fatiga visual|Consulta rutinaria|Molestia ocular', '', 'Bifocal', '2025-05-29', '25409904', '{\"esf_od\":{\"value\":\"+0.25\",\"label\":\"+0.25\"},\"cil_od\":\"+0.50\",\"eje_od\":90,\"add_od\":\"+0.75\",\"av_lejos_od\":\"20/30\",\"av_cerca_od\":\"J2\",\"av_lejos_bi\":\"20/30\",\"av_bi\":\"20/30\",\"esf_oi\":\"+0.50\",\"cil_oi\":\"+0.50\",\"eje_oi\":90,\"add_oi\":\"+1.00\",\"av_lejos_oi\":\"20/30\",\"av_cerca_oi\":\"J3\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"+0.25\",\"cil_od\":\"+0.50\",\"eje_od\":90,\"add_od\":\"+1.00\",\"avccl_od\":\"20/30\",\"avccc_od\":\"J2\",\"avccl_bi\":\"20/25\",\"avccc_bi\":\"20/25\",\"esf_oi\":\"+0.25\",\"cil_oi\":\"+0.25\",\"eje_oi\":90,\"add_oi\":\"+0.75\",\"avccl_oi\":\"20/25\",\"avccc_oi\":\"J2\"}', '{\"esf_od\":\"+0.50\",\"cil_od\":\"+0.25\",\"eje_od\":2,\"add_od\":\"+0.75\",\"alt_od\":\"10\",\"dp_od\":\"22\",\"esf_oi\":\"+0.25\",\"cil_oi\":\"+0.50\",\"eje_oi\":90,\"add_oi\":\"+0.75\",\"alt_oi\":\"10\",\"dp_oi\":\"22\"}', '{\"avsc_od\":\"20/20\",\"avae_od\":\"J2\",\"otros_od\":\"12\",\"avsc_oi\":\"20/20\",\"avae_oi\":\"J2\",\"otros_oi\":\"21\"}', 'Diagnostico de prueba', 'Tratamiento de prueba', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_BLUE_BLOCK\"],\"montura\":\"Plastico\",\"cristalSugerido\":\"\",\"observaciones\":\"Observaciones de prueba\"},{\"cristal\":{\"label\":\"Bifocal\",\"value\":\"Bifocal\"},\"material\":[\"CR39\"],\"montura\":\"Metalica\",\"cristalSugerido\":\"\",\"observaciones\":\"Observaciones de prueba\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-12 17:58:55', '2025-08-13 14:20:01', NULL),
(29, 'H-20250812-004', '2025-08-12', 'd3d9446802a44259755d38e6d163e820', 'Fatiga visual', '', 'Visión sencilla digital', '2025-08-05', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', '', '', '[{\"cristal\":{\"label\":\"Monofocal visión sencilla\",\"value\":\"Monofocal visión sencilla\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-12 18:02:40', '2025-08-12 18:02:40', NULL),
(30, 'H-20250822-001', '2025-08-22', 'aab3238922bcc25a6f606eb525ffdc56', 'Molestia ocular', '', 'Monofocal visión sencilla', '2025-08-14', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'ghghjg', 'gjgjgjh', '[{\"cristal\":{\"label\":\"Monofocal visión sencilla\",\"value\":\"Monofocal visión sencilla\"},\"material\":[\"CR39\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-22 00:38:19', '2025-08-22 00:38:19', NULL),
(31, 'H-20250822-002', '2025-08-22', 'aab3238922bcc25a6f606eb525ffdc56', 'Consulta rutinaria', '', 'Visión sencilla digital', NULL, '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', '', '', '[{\"cristal\":{\"label\":\"Monofocal visión sencilla\",\"value\":\"Monofocal visión sencilla\"},\"material\":[\"AR_BLUE_BLOCK\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"},{\"cristal\":{\"label\":\"Lentes de contacto\",\"value\":\"Lentes de contacto\"},\"material\":[\"CR39\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-22 00:58:31', '2025-08-22 00:58:31', NULL),
(32, 'H-20250831-001', '2025-08-31', '4e732ced3463d06de0ca9a15b6153677', 'Fatiga visual', '', 'Bifocal', '2025-08-06', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'sadasdasdasdad', 'asdasdasdasdada', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-08-31 23:55:36', '2025-08-31 23:55:36', NULL),
(33, 'H-20250901-001', '2025-09-01', '28acbaf873ad2772e216895c44281940', 'Consulta rutinaria', '', 'Bifocal', '2025-06-04', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'dfhdfgdfg', 'ddfgdgdfgd', '[{\"cristal\":{\"label\":\"Progresivo digital intermedio\",\"value\":\"Progresivo digital intermedio\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 13:40:10', '2025-09-01 13:40:10', NULL),
(34, 'H-20250901-002', '2025-09-01', '28acbaf873ad2772e216895c44281940', 'Fatiga visual', '', 'Bifocal', NULL, '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'fgsdfsdfs', 'fsdfsdfsdf', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:13:51', '2025-09-01 14:13:51', NULL),
(35, 'H-20250901-003', '2025-09-01', '02e74f10e0327ad868d138f2b4fdd6f0', 'Consulta rutinaria', '', 'Bifocal', NULL, '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'werwrwerewr', 'wrewer', '[{\"cristal\":{\"label\":\"Monofocal visión sencilla\",\"value\":\"Monofocal visión sencilla\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:14:44', '2025-09-01 14:14:44', NULL),
(36, 'H-20250901-004', '2025-09-01', '02e74f10e0327ad868d138f2b4fdd6f0', 'Consulta rutinaria', '', 'Bifocal', NULL, '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'retert', 'erteteete', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:15:10', '2025-09-01 14:15:10', NULL),
(37, 'H-20250901-005', '2025-09-01', '45c48cce2e2d7fbdea1afc51c7c6ad26', 'Fatiga visual', '', 'Bifocal', '2025-08-31', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', '', '', '[{\"cristal\":{\"label\":\"Monofocal visión sencilla\",\"value\":\"Monofocal visión sencilla\"},\"material\":[\"CR39\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:15:36', '2025-09-01 14:15:36', NULL),
(38, 'H-20250901-006', '2025-09-01', '45c48cce2e2d7fbdea1afc51c7c6ad26', 'Consulta rutinaria', '', NULL, '2025-08-31', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'erewrew', 'werewrew', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:27:26', '2025-09-01 14:27:26', NULL),
(39, 'H-20250901-007', '2025-09-01', '02e74f10e0327ad868d138f2b4fdd6f0', 'Consulta rutinaria', '', 'Bifocal', '2025-08-31', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'asdsada', 'asdasda', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:36:39', '2025-09-01 14:36:39', NULL),
(40, 'H-20250901-008', '2025-09-01', '45c48cce2e2d7fbdea1afc51c7c6ad26', 'Consulta rutinaria', '', 'Bifocal', '2025-08-31', '25409904', '{\"esf_od\":{\"value\":\"+0.25\",\"label\":\"+0.25\"},\"cil_od\":\"-0.25\",\"eje_od\":2,\"add_od\":\"+0.75\",\"av_lejos_od\":\"20/25\",\"av_cerca_od\":\"J2\",\"av_lejos_bi\":\"20/25\",\"av_bi\":\"20/25\",\"esf_oi\":\"+0.25\",\"cil_oi\":\"-0.25\",\"eje_oi\":2,\"add_oi\":\"+0.75\",\"av_lejos_oi\":\"20/25\",\"av_cerca_oi\":\"J2\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"+0.50\",\"cil_od\":\"-0.50\",\"eje_od\":2,\"add_od\":\"0.00\",\"avccl_od\":\"20/25\",\"avccc_od\":\"J2\",\"avccl_bi\":\"20/20\",\"avccc_bi\":\"20/20\",\"esf_oi\":\"+0.25\",\"cil_oi\":\"-0.25\",\"eje_oi\":2,\"add_oi\":\"+0.75\",\"avccl_oi\":\"20/20\",\"avccc_oi\":\"J2\"}', '{\"esf_od\":\"+0.25\",\"cil_od\":\"0.00\",\"eje_od\":1,\"add_od\":\"0.00\",\"alt_od\":\"897\",\"dp_od\":\"7897\",\"esf_oi\":\"0.00\",\"cil_oi\":\"-0.25\",\"eje_oi\":2,\"add_oi\":\"+0.75\",\"alt_oi\":\"7897\",\"dp_oi\":\"79879\"}', '{\"avsc_od\":\"20/25\",\"avae_od\":\"J2\",\"otros_od\":\"hfghfgh\",\"avsc_oi\":\"20/20\",\"avae_oi\":\"J1\",\"otros_oi\":\"fhgfhf\",\"avsc_bi\":\"\"}', 'fghfhg', 'fhfhfh', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"fghfhfhf\",\"cristalSugerido\":\"\",\"observaciones\":\"fghfghfhfhfh\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:41:47', '2025-09-01 14:41:47', NULL),
(41, 'H-20250901-009', '2025-09-01', '45d23e843211818dd5ad1bbd9caf4bfd', 'Fatiga visual', '', 'Visión sencilla digital', '2025-08-31', '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'sdfsdf', 'sdfsdfsd', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"AR_VERDE\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 14:42:18', '2025-09-01 14:42:18', NULL),
(42, 'H-20250901-010', '2025-09-01', '02e74f10e0327ad868d138f2b4fdd6f0', 'Fatiga visual', '', 'Bifocal', NULL, '25409904', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"av_lejos_od\":\"\",\"av_cerca_od\":\"\",\"av_lejos_bi\":\"\",\"av_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"av_lejos_oi\":\"\",\"av_cerca_oi\":\"\",\"av_cerca_bi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"avccl_od\":\"\",\"avccc_od\":\"\",\"avccl_bi\":\"\",\"avccc_bi\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"avccl_oi\":\"\",\"avccc_oi\":\"\"}', '{\"esf_od\":\"\",\"cil_od\":\"\",\"eje_od\":\"\",\"add_od\":\"\",\"alt_od\":\"\",\"dp_od\":\"\",\"esf_oi\":\"\",\"cil_oi\":\"\",\"eje_oi\":\"\",\"add_oi\":\"\",\"alt_oi\":\"\",\"dp_oi\":\"\"}', '{\"avsc_od\":\"\",\"avae_od\":\"\",\"otros_od\":\"\",\"avsc_oi\":\"\",\"avae_oi\":\"\",\"otros_oi\":\"\",\"avsc_bi\":\"\"}', 'dfgdgd', 'gdgdgd', '[{\"cristal\":{\"label\":\"Visión sencilla digital\",\"value\":\"Visión sencilla digital\"},\"material\":[\"CR39\"],\"montura\":\"\",\"cristalSugerido\":\"\",\"observaciones\":\"\"}]', 'PACIENTE CONFORME CON LA EXPLICACION  REALIZADA POR EL ASESOR SOBRE LAS VENTAJAS Y DESVENTAJAS DE LOS DIFERENTES TIPOS DE CRISTALES Y MATERIAL DE MONTURA, NO SE ACEPTARAN MODIFICACIONES LUEGO DE HABER RECIBIDO LA INFORMACION Y FIRMADA LA HISTORIA POR EL PACIENTE.', NULL, NULL, '24367965', '24367965', '2025-09-01 15:45:36', '2025-09-01 15:45:36', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_rastreo_bcv`
--

CREATE TABLE `historial_rastreo_bcv` (
  `id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora` varchar(8) NOT NULL,
  `rastreado` tinyint(4) NOT NULL,
  `respuesta` text DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_rastreo_bcv`
--

INSERT INTO `historial_rastreo_bcv` (`id`, `fecha`, `hora`, `rastreado`, `respuesta`, `comentario`, `created_at`, `updated_at`) VALUES
(10, '2025-08-19', '22:39:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:39:00', '2025-08-20 02:39:00'),
(11, '2025-08-19', '22:40:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:40:00', '2025-08-20 02:40:00'),
(12, '2025-08-19', '22:41:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:41:00', '2025-08-20 02:41:00'),
(13, '2025-08-19', '22:42:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:42:00', '2025-08-20 02:42:00'),
(14, '2025-08-19', '22:43:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:43:00', '2025-08-20 02:43:00'),
(15, '2025-08-19', '22:44:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:44:00', '2025-08-20 02:44:00'),
(16, '2025-08-19', '22:45:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:45:00', '2025-08-20 02:45:00'),
(17, '2025-08-19', '22:46:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:46:00', '2025-08-20 02:46:00'),
(18, '2025-08-19', '22:47:00', 1, '[]', NULL, '2025-08-20 02:47:00', '2025-08-20 02:47:00'),
(19, '2025-08-19', '22:48:00', 1, '[]', NULL, '2025-08-20 02:48:00', '2025-08-20 02:48:00'),
(20, '2025-08-19', '22:50:00', 1, '{\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:50:00', '2025-08-20 02:50:00'),
(21, '2025-08-19', '22:51:00', 1, '{\"dolar\":\"138.12830000\"}', NULL, '2025-08-20 02:51:00', '2025-08-20 02:51:00'),
(22, '2025-08-19', '22:52:00', 1, '{\"dolar\":\"138.12830000\"}', NULL, '2025-08-20 02:52:00', '2025-08-20 02:52:00'),
(23, '2025-08-19', '22:53:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:53:00', '2025-08-20 02:53:00'),
(24, '2025-08-19', '22:54:00', 1, '{\"dolar\":\"138.12830000\",\"euro\":\"161.22197047\"}', NULL, '2025-08-20 02:54:00', '2025-08-20 02:54:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logins`
--

CREATE TABLE `logins` (
  `id` int(11) NOT NULL,
  `sede_id` varchar(50) NOT NULL,
  `usu_cedula` varchar(20) NOT NULL,
  `token` text NOT NULL,
  `ip` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `logins`
--

INSERT INTO `logins` (`id`, `sede_id`, `usu_cedula`, `token`, `ip`, `created_at`, `updated_at`) VALUES
(5, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTMyNTM1NzMsImV4cCI6MTc1MzMzOTk3M30.3d-pbVT3JKUv0GQdbKA6IgzahZpeH0ZWtIG1w-IR5F4', '::1', '2025-07-23 06:52:53', '2025-07-23 06:52:53'),
(6, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTM1NTU2MzIsImV4cCI6MTc1MzY0MjAzMn0.ME93WQeOnB5CvkB6wCdV4BVQX4e0GcrSQl1LSyZSgcc', '::1', '2025-07-26 18:47:12', '2025-07-26 18:47:12'),
(7, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTM2Mjg0OTcsImV4cCI6MTc1MzcxNDg5N30.7chzX_gKfNYUP9O1t3C6ttNQoWM9PTPbcc5z_ofRFf0', '::1', '2025-07-27 15:01:37', '2025-07-27 15:01:37'),
(8, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTM2Mjg2ODYsImV4cCI6MTc1MzcxNTA4Nn0.m3tCEhVkmXafTyohLpH4O5qEgmvradmbpnWOgvQAl1c', '::1', '2025-07-27 15:04:46', '2025-07-27 15:04:46'),
(9, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTQwNjA4MTYsImV4cCI6MTc1NDE0NzIxNn0.Tkqiiwcl7f6M17JiJ5PBgVVuHNdCgizoMbDz5r9XiHg', '::1', '2025-08-01 15:06:56', '2025-08-01 15:06:56'),
(10, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTQxMTEwMzEsImV4cCI6MTc1NDE5NzQzMX0.cJ5hzM-u6Jg66tvLRMQuphlmgXD7qF6l7Z-uOjGr-_o', '::1', '2025-08-02 05:03:51', '2025-08-02 05:03:51'),
(11, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTQ1NzkwMDAsImV4cCI6MTc1NDY2NTQwMH0.288c8pukMenKpsVCzJ7v1NtC7offjMB7QJwb3CxuhgU', '::1', '2025-08-07 15:03:20', '2025-08-07 15:03:20'),
(12, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTQ5MTQ5MTcsImV4cCI6MTc1NTAwMTMxN30.GVMr-JiN9MZ1sQ5BGWOOWBA667B89IlRdAJVjIrTJL4', '::1', '2025-08-11 12:21:57', '2025-08-11 12:21:57'),
(13, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTY0NTk5NDEsImV4cCI6MTc1NjU0NjM0MX0.MLdTduWPJh81vOS1_v1wvWNjvkq4CJwK9WYcxWEcV78', '::1', '2025-08-29 09:32:21', '2025-08-29 09:32:21'),
(14, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTY1OTEwMjEsImV4cCI6MTc1NjY3NzQyMX0.efwcCIZT1ZGjBYQZunECl9yEp8AZJQx72AHkMpjWSR4', '::1', '2025-08-30 21:57:01', '2025-08-30 21:57:01'),
(15, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTY2NTY1NTEsImV4cCI6MTc1Njc0Mjk1MX0.iwn4zgRsvOt56tGqi0YynWvW0Ve0Q41fNfIqIebBzpE', '::1', '2025-08-31 16:09:11', '2025-08-31 16:09:11'),
(16, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTY3NDM5NzcsImV4cCI6MTc1NjgzMDM3N30.c1WSYN7oi86Qe0tgyVriuqAK97v-LUBZzJOeVusATtQ', '::1', '2025-09-01 16:26:17', '2025-09-01 16:26:17'),
(17, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTcxOTQxMDcsImV4cCI6MTc1NzI4MDUwN30.iyeNnGw0EX7_h09FPyEXMLoBEuwdDa2mM9KrhEAsB40', '::1', '2025-09-06 21:28:27', '2025-09-06 21:28:27'),
(18, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTczNzk1NTQsImV4cCI6MTc1NzQ2NTk1NH0.lYfP-AjdAmDPoBXlzyitCuiKW0NOZzKiDmEKgg2-II4', '::1', '2025-09-09 00:59:14', '2025-09-09 00:59:14'),
(19, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTc1NTI2NjMsImV4cCI6MTc1NzYzOTA2M30.Wu0bULJGmBvp3QVTTWKshQsuBHKrKHPKDqWpBOiroNw', '::1', '2025-09-11 01:04:23', '2025-09-11 01:04:23'),
(20, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTgzMTA1MjgsImV4cCI6MTc1ODM5NjkyOH0.U91voKCA6aAqdB9pQvUDkWRSrKVqkaNVnvi9nZ1lD_w', '::1', '2025-09-19 19:35:28', '2025-09-19 19:35:28'),
(21, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NTg0OTA4OTEsImV4cCI6MTc1ODU3NzI5MX0.V_f4VSDSmsIsNzfPAa3Go2isrnqxOqO64kNzkuonXfE', '::1', '2025-09-21 21:41:31', '2025-09-21 21:41:31'),
(22, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMwNDU1OTAsImV4cCI6MTc2MzEzMTk5MH0.8ks-Y9zAKJVuKy2k1UixslzMm1LV3HaBvsR6YEJ6Oh4', '::1', '2025-11-13 14:53:10', '2025-11-13 14:53:10'),
(23, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMxMjU5NDEsImV4cCI6MTc2MzIxMjM0MX0.hauZvrz90QgzNQ54itY_gdZGKZc0XHDqNey5NPGebyw', '::1', '2025-11-14 13:12:21', '2025-11-14 13:12:21'),
(24, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMxMjU5NjksImV4cCI6MTc2MzIxMjM2OX0.yb4lHUhj-MkX6VM9Lg-8s4Yh2OiDDhE-NEjTI2NEOvE', '::1', '2025-11-14 13:12:49', '2025-11-14 13:12:49'),
(25, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMxMjYzMTYsImV4cCI6MTc2MzIxMjcxNn0.cqUUoKiAYEWbB41-yfJJNtogCBJCr7HC_lpL17TrfZI', '::1', '2025-11-14 13:18:36', '2025-11-14 13:18:36'),
(26, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMxMjY5NzYsImV4cCI6MTc2MzIxMzM3Nn0.FissUhyhMGe3CYHukqDWfcryTYigq1PeGLIftpunBIY', '::1', '2025-11-14 13:29:36', '2025-11-14 13:29:36'),
(27, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMyNTU5NjgsImV4cCI6MTc2MzM0MjM2OH0.fwblYdFQuiENRGerbjI3sDuFVERUyE3cTnSbRwu0mvI', '::1', '2025-11-16 01:19:28', '2025-11-16 01:19:28'),
(28, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMyNzU1MzYsImV4cCI6MTc2MzM2MTkzNn0.YjIgAUl4oWd73lKKwwNqxdHJXhZZoNc31V6a7daPfpM', '::1', '2025-11-16 06:45:36', '2025-11-16 06:45:36'),
(29, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjMzMTU5MDMsImV4cCI6MTc2MzQwMjMwM30.DAnserMMmeGRf4eDu7895sS_VRCkpwqmp8WUZ3zZRgs', '::1', '2025-11-16 17:58:23', '2025-11-16 17:58:23'),
(30, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjM5Mjg3OTgsImV4cCI6MTc2NDAxNTE5OH0.u69d1h5j2WvXDBuypMlsdmuI2gWhvLj-ch19sT_IDUU', '::1', '2025-11-23 20:13:18', '2025-11-23 20:13:18'),
(31, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjQ0Mzk5MTIsImV4cCI6MTc2NDUyNjMxMn0.tUOzCDpqlLhs03gCfARUhgvfaUI8LY3FuBdWB_I_SvA', '::1', '2025-11-29 18:11:52', '2025-11-29 18:11:52'),
(32, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjQ4Njk3NzksImV4cCI6MTc2NDk1NjE3OX0.661FhheGsISKsNNi57AcbB8owESJfVYb7dFX3rWKkwo', '::1', '2025-12-04 17:36:19', '2025-12-04 17:36:19'),
(33, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjUyMzI4NTQsImV4cCI6MTc2NTMxOTI1NH0.U3tkcPnbGK--SeINNfdtRMKaAB9ME-o91AQRQ_zuq0o', '::1', '2025-12-08 22:27:34', '2025-12-08 22:27:34'),
(34, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjUyOTM3OTcsImV4cCI6MTc2NTM4MDE5N30.MA-PnclpVq3hfolx-ITtwTbVOqKpUG4J6oJ-YaYyyr0', '::1', '2025-12-09 15:23:17', '2025-12-09 15:23:17'),
(35, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjU5MTc0MzUsImV4cCI6MTc2NjAwMzgzNX0.HOMDjnsiqhiozFIFrqoUGoMfPCG7KKSi7t33yM54pAk', '::1', '2025-12-16 20:37:15', '2025-12-16 20:37:15'),
(36, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjYxNDExMjksImV4cCI6MTc2NjIyNzUyOX0.wjw1CnzxbNgPTDAHXm2u8YWegkygQQoGr1SHehNRlSk', '::1', '2025-12-19 10:45:29', '2025-12-19 10:45:29'),
(37, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjY1MjUyOTksImV4cCI6MTc2NjYxMTY5OX0.Q4lBb3NxIrub9I0x7JuEmkXBbOdz1roTkJJyshlIjjU', '::1', '2025-12-23 21:28:19', '2025-12-23 21:28:19'),
(38, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjcwNTI1MTMsImV4cCI6MTc2NzEzODkxM30.eJ5ybLsCMxNG1zx1uQ9qpk4Xig1SbESSQzd3zgACnsk', '::1', '2025-12-29 23:55:13', '2025-12-29 23:55:13'),
(39, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjcwODY2MDAsImV4cCI6MTc2NzE3MzAwMH0.rlSHcUsVYN87k2X-r0onHOHKh9Yjfi9jE32aH2NRwfI', '::1', '2025-12-30 09:23:20', '2025-12-30 09:23:20'),
(40, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjcxMjI1ODMsImV4cCI6MTc2NzIwODk4M30.JXihSBZfVCBDPd2SWVDVknAQRgQ8qj9msSqBMLAtoro', '::1', '2025-12-30 19:23:03', '2025-12-30 19:23:03'),
(41, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjcxMjI3ODgsImV4cCI6MTc2NzIwOTE4OH0.VXykOAf_rEOBd0if1o5n7LIu57nX3LvgUZTulqsmTCY', '::1', '2025-12-30 19:26:28', '2025-12-30 19:26:28'),
(42, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njc4MTYxOTYsImV4cCI6MTc2NzkwMjU5Nn0.WzT3K0xmomb5tDhP5w8z6tRnKJ0SQqQIFOa0u9mjGY0', '::1', '2026-01-07 20:03:16', '2026-01-07 20:03:16'),
(43, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjgwNzgxNDQsImV4cCI6MTc2ODE2NDU0NH0.-HCSx8asTPPIiXb2fnxun9UenwvA6jZF3di9K6Sn_E4', '::1', '2026-01-10 20:49:04', '2026-01-10 20:49:04'),
(44, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc2ODA4MjUzOSwiZXhwIjoxNzY4MTY4OTM5fQ.CCbjOk4nQO7zi3XQuDNvTCdavzEWFGCx-p9L7oDtFYQ', '::1', '2026-01-10 18:02:19', '2026-01-10 18:02:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_trabajo`
--

CREATE TABLE `ordenes_trabajo` (
  `id` int(11) NOT NULL,
  `orden_key` varchar(20) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `estado` varchar(25) NOT NULL,
  `fecha_inicio_proceso` datetime DEFAULT NULL,
  `fecha_entrega_estimada` datetime DEFAULT NULL,
  `progreso` int(11) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `anio` int(11) NOT NULL,
  `consecutivo` int(11) NOT NULL,
  `archivado` tinyint(4) NOT NULL DEFAULT 0,
  `fecha_entregado` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ordenes_trabajo`
--

INSERT INTO `ordenes_trabajo` (`id`, `orden_key`, `sede`, `venta_key`, `estado`, `fecha_inicio_proceso`, `fecha_entrega_estimada`, `progreso`, `observaciones`, `anio`, `consecutivo`, `archivado`, `fecha_entregado`, `created_at`, `updated_at`) VALUES
(1, 'OT-GUARENAS-2025-001', 'guarenas', '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 'entregado', NULL, '2026-01-10 00:00:00', 100, NULL, 2025, 1, 0, '2026-01-09 17:52:04', '2025-12-30 19:24:16', '2026-01-10 18:22:00'),
(2, 'OT-GUARENAS-2025-002', 'guarenas', '31e9ea4e-7605-45ba-9598-43211ef71b02', 'en_tienda', NULL, NULL, 0, NULL, 2025, 2, 0, NULL, '2025-12-30 19:25:12', '2025-12-30 19:25:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `otps`
--

CREATE TABLE `otps` (
  `id` int(11) NOT NULL,
  `usu_cedula` varchar(20) NOT NULL,
  `otp` varchar(8) NOT NULL,
  `ip` varchar(15) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `activo` tinyint(4) NOT NULL,
  `verificado` tinyint(4) NOT NULL,
  `historial` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `otps`
--

INSERT INTO `otps` (`id`, `usu_cedula`, `otp`, `ip`, `correo`, `activo`, `verificado`, `historial`, `created_at`, `updated_at`) VALUES
(2, '25409904', '887011', '::1', 'jeffersonjtorresu@gmail.com', 0, 1, '[{\"accion\":\"verificado\",\"datetime\":\"2025-11-14 09:28:54\"},{\"accion\":\"desactivado\",\"datetime\":\"2025-11-14 09:29:14\"}]', '2025-11-14 13:28:40', '2025-11-14 13:29:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `pkey` varchar(70) NOT NULL,
  `sede_id` varchar(50) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `sin_cedula` tinyint(4) NOT NULL DEFAULT 0,
  `nombre` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `ocupacion` text NOT NULL,
  `genero` varchar(1) NOT NULL,
  `direccion` text NOT NULL,
  `redes_sociales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`redes_sociales`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `tiene_lentes` varchar(100) DEFAULT NULL,
  `fotofobia` varchar(100) DEFAULT NULL,
  `uso_dispositivo_electronico` text DEFAULT NULL,
  `traumatismo_ocular` varchar(100) DEFAULT NULL,
  `traumatismo_ocular_descripcion` text DEFAULT NULL,
  `cirugia_ocular` varchar(100) DEFAULT NULL,
  `cirugia_ocular_descripcion` text DEFAULT NULL,
  `alergias` text DEFAULT NULL,
  `antecedentes_personales` text DEFAULT NULL,
  `antecedentes_familiares` text DEFAULT NULL,
  `patologias` text DEFAULT NULL,
  `patologia_ocular` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `pkey`, `sede_id`, `cedula`, `sin_cedula`, `nombre`, `fecha_nacimiento`, `telefono`, `email`, `ocupacion`, `genero`, `direccion`, `redes_sociales`, `created_at`, `updated_at`, `deleted_at`, `tiene_lentes`, `fotofobia`, `uso_dispositivo_electronico`, `traumatismo_ocular`, `traumatismo_ocular_descripcion`, `cirugia_ocular`, `cirugia_ocular_descripcion`, `alergias`, `antecedentes_personales`, `antecedentes_familiares`, `patologias`, `patologia_ocular`) VALUES
(8, 'c9f0f895fb98ab9159f51fd0297e236d', 'guatire', '267758784', 0, 'Jesus Martinez', '1998-10-03', '04142134565', 'jesusmc@gmail.com', 'Ingeniero', 'm', 'Guatire', '[{\"platform\":\"Facebook\",\"username\":\"jesusmc\"},{\"platform\":\"Instagram\",\"username\":\"@jesusmc\"}]', '2025-07-22 00:34:08', '2025-08-30 21:36:51', NULL, 'No', 'No', 'No', 'No', NULL, 'No', NULL, NULL, '', '', '', ''),
(9, '45c48cce2e2d7fbdea1afc51c7c6ad26', 'guatire', '10092901', 0, 'Ana Castro', '1969-10-03', '04142134565', 'jesusmc@gmail.com', 'Ingeniero', 'm', 'Guatire', '[{\"platform\":\"Facebook\",\"username\":\"anacastro\"},{\"platform\":\"Instagram\",\"username\":\"@anacastro\"}]', '2025-07-22 00:47:47', '2025-07-22 00:47:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'd3d9446802a44259755d38e6d163e820', 'guarenas', '25409904', 1, 'Jefferson Torres', '1996-06-11', '04241738615', 'jefersonugas@gmail.com', 'Ingeniero de Sistemas', 'm', 'Guatire, Castillejo, en una casa.', '[{\"platform\":\"Facebook\",\"username\":\"maria.gonzalez\"},{\"platform\":\"Instagram\",\"username\":\"@maria.g\"}]', '2025-07-23 15:52:19', '2025-12-23 21:30:03', NULL, 'Si', NULL, 'Si, 3 a 6 horas', NULL, NULL, NULL, NULL, NULL, '', '', 'a|b|c', ''),
(14, 'aab3238922bcc25a6f606eb525ffdc56', 'guatire', '24367965', 0, 'Ruben dario Martinez castro', '1995-11-10', '04123920817', 'rubemm18@gmail.com', 'Ingeniero', 'm', 'Las rosas, conj res, country villas', '[{\"platform\":\"Instagram\",\"username\":\"martinezcr_\"}]', '2025-07-24 21:35:31', '2025-08-31 23:29:27', NULL, 'Sí', 'No', 'Sí, 1 a 3 horas', 'No', NULL, 'Sí', 'Miopia y agtismatismo', NULL, '', '', 'Miopía|Astigmatismo', ''),
(24, '45d23e843211818dd5ad1bbd9caf4bfd', 'guatire', '23423432', 0, 'test test', '2025-08-04', '04123920817', 'rubemm18@gmail.com', 'qwdasdasd', 'f', 'Las rosas, conj res, country villas', '[]', '2025-08-29 15:59:05', '2025-08-30 21:42:09', NULL, 'No', 'No', 'No', 'No', NULL, 'No', NULL, NULL, '', '', '', ''),
(25, '28acbaf873ad2772e216895c44281940', 'guatire', '8759927', 1, 'Dario Castro', '2025-08-14', '04123920817', 'rubemm18@gmail.com', 'Programador', 'm', 'Las rosas, conj res, country villas', '[]', '2025-08-30 21:48:38', '2025-08-30 21:48:38', NULL, 'No', 'No', 'No', 'No', '', 'No', '', NULL, '', '', '', ''),
(26, '4e732ced3463d06de0ca9a15b6153677', 'guatire', '4353453', 0, 'dfsfsdfsf', '2025-09-16', '04123920817', 'rubemm18@gmail.com', 'sfsdfsd', 'f', 'Las rosas, conj res, country villas', '[]', '2025-09-01 13:34:30', '2025-09-01 13:34:30', NULL, 'No', 'No', 'No', 'No', '', 'No', '', NULL, '', '', '', ''),
(27, '02e74f10e0327ad868d138f2b4fdd6f0', 'guatire', '723423432', 0, 'sdfsdfsdfd', '2025-09-02', '04123920817', 'rubemm18@gmail.com', 'sadasdsad', 'f', 'Las rosas, conj res, country villas', '[]', '2025-09-01 16:43:09', '2025-09-01 16:43:09', NULL, 'No', 'No', 'No', 'No', '', 'No', '', NULL, '', '', '', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `sede_id` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `marca` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `codigo` varchar(255) DEFAULT NULL,
  `material` varchar(255) NOT NULL,
  `proveedor` varchar(255) DEFAULT NULL,
  `categoria` varchar(255) NOT NULL,
  `modelo` varchar(255) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `precio` double NOT NULL,
  `aplica_iva` tinyint(4) NOT NULL,
  `precio_con_iva` double NOT NULL,
  `moneda` varchar(20) NOT NULL,
  `activo` tinyint(4) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen_url` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `sede_id`, `nombre`, `marca`, `color`, `codigo`, `material`, `proveedor`, `categoria`, `modelo`, `stock`, `precio`, `aplica_iva`, `precio_con_iva`, `moneda`, `activo`, `descripcion`, `imagen_url`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 'guarenas', 'Producto Chevere 1', 'Marca Generica 1', 'Azul', 'PR-000005', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -72, 862.07, 0, 1000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311414341', '2025-09-19 19:50:14', '2025-12-30 19:25:56', NULL),
(6, 'guarenas', 'Producto Chevere 2', 'Marca Generica 1', 'Azul', 'PR-000006', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -39, 2000, 1, 2320, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311675271', '2025-09-19 19:54:35', '2025-12-30 19:25:56', NULL),
(7, 'guarenas', 'Producto Chevere 3', 'Marca Generica 2', 'Azul', 'PR-000006', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -1, 2000, 1, 2320, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311675271', '2025-09-19 19:54:35', '2025-11-16 19:01:25', NULL),
(8, 'guarenas', 'Producto 5', 'Marca Generica 1', 'Azul', 'PR-000008', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', 5, 431.03, 0, 500, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1763317141933', '2025-11-16 18:19:01', '2025-11-16 19:01:25', NULL),
(9, 'guarenas', 'Producto Chevere 6', 'Marca Generica 1', 'Azul', 'PR-000009', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', 5, 1724.14, 1, 2000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1763317167002', '2025-11-16 18:19:27', '2025-11-16 19:01:25', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` varchar(100) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
('admin', 'Administrador'),
('asesor-optico', 'Asesor optico'),
('gerente', 'Gerente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sedes`
--

CREATE TABLE `sedes` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `nombre_optica` varchar(255) NOT NULL,
  `rif` varchar(100) NOT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion_fiscal` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sedes`
--

INSERT INTO `sedes` (`id`, `nombre`, `nombre_optica`, `rif`, `direccion`, `telefono`, `email`, `direccion_fiscal`) VALUES
('guarenas', 'Sede Guarenas', 'Optica New Vision', 'rifJ50016164-6', 'Centro comercial candelaria plaza, planta baja local Pb-04, Guarenas estado Miranda', '0412-365-99-29', 'newvisionlens2020@gmail.com', NULL),
('guatire', 'Sede Guatire', 'Optica New Vision', 'rifJ50173124-1', 'Centro comercial Buenaventura vista place piso 1 nivel mirador, local M52 Guatire Estado Miranda.', '04127042837', 'opticanewvisionlensii@gmail.com', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasas`
--

CREATE TABLE `tasas` (
  `id` varchar(20) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `simbolo` varchar(3) NOT NULL,
  `valor` double NOT NULL,
  `rastreo_bcv` tinyint(4) NOT NULL DEFAULT 0,
  `ultimo_tipo_cambio` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tasas`
--

INSERT INTO `tasas` (`id`, `nombre`, `simbolo`, `valor`, `rastreo_bcv`, `ultimo_tipo_cambio`, `created_at`, `updated_at`) VALUES
('bolivar', 'Bolivar', 'bs', 1, 0, NULL, '2025-09-09 21:56:54', '2025-09-09 21:56:54'),
('dolar', 'Dolar', '$', 100, 0, 'Automatico con BCV', '2025-06-14 16:18:23', '2025-08-20 02:53:00'),
('euro', 'Euro', '€', 200, 0, 'Automatico con BCV', '2025-06-14 16:18:23', '2025-08-20 02:53:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasas_historial`
--

CREATE TABLE `tasas_historial` (
  `id` int(11) NOT NULL,
  `tasa_id` varchar(20) NOT NULL,
  `valor_nuevo` double NOT NULL,
  `usu_cedula` varchar(20) DEFAULT NULL,
  `tipo_cambio` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tasas_historial`
--

INSERT INTO `tasas_historial` (`id`, `tasa_id`, `valor_nuevo`, `usu_cedula`, `tipo_cambio`, `created_at`, `updated_at`) VALUES
(25, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:39:00', '2025-08-20 02:39:00'),
(26, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:39:00', '2025-08-20 02:39:00'),
(27, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:40:00', '2025-08-20 02:40:00'),
(28, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:40:00', '2025-08-20 02:40:00'),
(29, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:41:00', '2025-08-20 02:41:00'),
(30, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:42:00', '2025-08-20 02:42:00'),
(31, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:43:00', '2025-08-20 02:43:00'),
(32, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:44:00', '2025-08-20 02:44:00'),
(33, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:45:00', '2025-08-20 02:45:00'),
(34, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:46:00', '2025-08-20 02:46:00'),
(35, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:47:00', '2025-08-20 02:47:00'),
(36, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:48:00', '2025-08-20 02:48:00'),
(37, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:50:00', '2025-08-20 02:50:00'),
(38, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:51:00', '2025-08-20 02:51:00'),
(39, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:52:00', '2025-08-20 02:52:00'),
(40, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:53:00', '2025-08-20 02:53:00'),
(41, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:53:00', '2025-08-20 02:53:00'),
(42, 'dolar', 138.1283, NULL, 'Automatico con BCV', '2025-08-20 02:54:00', '2025-08-20 02:54:00'),
(43, 'euro', 161.222, NULL, 'Automatico con BCV', '2025-08-20 02:54:00', '2025-08-20 02:54:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `rol_id` varchar(100) NOT NULL,
  `cargo_id` varchar(50) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `ruta_imagen` text DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `rol_id`, `cargo_id`, `cedula`, `nombre`, `password`, `correo`, `telefono`, `fecha_nacimiento`, `ruta_imagen`, `avatar_url`, `activo`, `created_at`, `updated_at`, `deleted_at`) VALUES
(4, 'admin', 'gerente', '25409904', 'Jefferson Torres', '$2b$10$rVR3GakmyWh.aJylX4Lv0eNPUFtwDCGClViFXHnXglrdajmoEBLca', 'jeffersonjtorresu@gmail.com', '04128977574', '1996-06-11', NULL, NULL, 1, '2025-03-28 18:31:30', '2025-11-14 13:29:14', NULL),
(24, 'asesor-optico', 'asesor-optico-1', '11554570', 'Heriberto Torres', '$2b$10$7KuJRh76glMvnAPw7l.S9ebE2y6lalWWui7R3Znwyjk4pqStyPnOy', 'heriberto@gmail.com', '04241738615', '1996-06-11', NULL, NULL, 1, '2025-07-27 15:19:32', '2025-07-27 15:19:32', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_control` bigint(20) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `paciente_key` varchar(70) DEFAULT NULL,
  `cliente_tipo` varchar(20) NOT NULL,
  `cliente_informacion_persona` varchar(100) DEFAULT NULL,
  `cliente_informacion_nombre` varchar(255) DEFAULT NULL,
  `cliente_informacion_cedula` varchar(20) DEFAULT NULL,
  `cliente_informacion_telefono` varchar(20) DEFAULT NULL,
  `cliente_informacion_email` varchar(255) DEFAULT NULL,
  `historia_medica_id` int(11) DEFAULT NULL,
  `moneda` varchar(20) NOT NULL,
  `tasa_moneda` float NOT NULL,
  `forma_pago` varchar(255) NOT NULL,
  `iva_porcentaje` float NOT NULL,
  `descuento` float NOT NULL,
  `subtotal` float NOT NULL,
  `iva` float NOT NULL,
  `total` float NOT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `pago_completo` tinyint(4) NOT NULL,
  `created_by` varchar(20) NOT NULL,
  `asesor_id` int(11) DEFAULT NULL,
  `especialista_cedula` varchar(20) DEFAULT NULL,
  `estatus_venta` varchar(50) NOT NULL,
  `estatus_pago` varchar(50) NOT NULL,
  `motivo_cancelacion` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `venta_key`, `numero_control`, `sede`, `paciente_key`, `cliente_tipo`, `cliente_informacion_persona`, `cliente_informacion_nombre`, `cliente_informacion_cedula`, `cliente_informacion_telefono`, `cliente_informacion_email`, `historia_medica_id`, `moneda`, `tasa_moneda`, `forma_pago`, `iva_porcentaje`, `descuento`, `subtotal`, `iva`, `total`, `observaciones`, `fecha`, `pago_completo`, `created_by`, `asesor_id`, `especialista_cedula`, `estatus_venta`, `estatus_pago`, `motivo_cancelacion`, `created_at`, `updated_at`) VALUES
(1, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 63, 'guarenas', NULL, 'paciente', 'natural', 'Jesus Martinez', '267758784', '04142134565', 'jesusmc@gmail.com', 27, 'dolar', 100, 'abono', 16, 132.63, 1326.27, 187.03, 1380.67, NULL, '2025-12-30 21:12:48', 0, '25409904', 4, '25409904', 'pendiente', 'pendiente', NULL, '2025-12-30 19:24:16', '2025-12-30 19:24:16'),
(2, '31e9ea4e-7605-45ba-9598-43211ef71b02', 64, 'guarenas', NULL, 'paciente', 'natural', 'Jesus Martinez', '267758784', '04142134565', 'jesusmc@gmail.com', 27, 'dolar', 100, 'abono', 16, 132.63, 1326.27, 187.03, 1380.67, NULL, '2025-12-30 21:12:48', 0, '25409904', 4, '25409904', 'pendiente', 'pendiente', NULL, '2025-12-30 19:25:12', '2025-12-30 19:25:12'),
(3, 'dea00fef-1122-4efd-b357-371f67c974eb', 65, 'guarenas', NULL, 'paciente', 'natural', 'Jesus Martinez', '267758784', '04142134565', 'jesusmc@gmail.com', 27, 'dolar', 100, 'abono', 16, 132.63, 1326.27, 187.03, 1380.67, NULL, '2025-12-30 21:12:48', 0, '25409904', 4, '25409904', 'pendiente', 'pendiente', NULL, '2025-12-30 19:25:56', '2025-12-30 19:25:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_cashea`
--

CREATE TABLE `ventas_cashea` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `nivel_cashea` varchar(50) NOT NULL,
  `monto_inicial` float NOT NULL,
  `cantidad_cuotas` int(11) NOT NULL,
  `monto_por_cuota` float NOT NULL,
  `total_adelantado` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_cashea_cuotas`
--

CREATE TABLE `ventas_cashea_cuotas` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero` int(11) NOT NULL,
  `monto` float NOT NULL,
  `fecha_vencimiento` varchar(50) NOT NULL,
  `pagada` tinyint(4) NOT NULL,
  `seleccionada` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos`
--

CREATE TABLE `ventas_pagos` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_pago` int(11) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `monto` float NOT NULL,
  `moneda_id` varchar(20) NOT NULL,
  `tasa_moneda` float NOT NULL,
  `monto_moneda_base` float NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `bancoCodigo` varchar(4) DEFAULT NULL,
  `bancoNombre` varchar(255) DEFAULT NULL,
  `created_by` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_pagos`
--

INSERT INTO `ventas_pagos` (`id`, `venta_key`, `numero_pago`, `tipo`, `monto`, `moneda_id`, `tasa_moneda`, `monto_moneda_base`, `referencia`, `bancoCodigo`, `bancoNombre`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 1, 'efectivo', 700, 'dolar', 100, 700, NULL, NULL, NULL, '25409904', '2025-12-30 19:24:16', '2025-12-30 19:24:16'),
(2, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 1, 'pagomovil', 24051.2, 'bolivar', 1, 240.51, '21212121', '0134', 'Banesco', '25409904', '2025-12-30 19:24:16', '2025-12-30 19:24:16'),
(3, '31e9ea4e-7605-45ba-9598-43211ef71b02', 1, 'efectivo', 700, 'dolar', 100, 700, NULL, NULL, NULL, '25409904', '2025-12-30 19:25:12', '2025-12-30 19:25:12'),
(4, '31e9ea4e-7605-45ba-9598-43211ef71b02', 1, 'pagomovil', 24051.2, 'bolivar', 1, 240.51, '21212121', '0134', 'Banesco', '25409904', '2025-12-30 19:25:12', '2025-12-30 19:25:12'),
(5, 'dea00fef-1122-4efd-b357-371f67c974eb', 1, 'efectivo', 700, 'dolar', 100, 700, NULL, NULL, NULL, '25409904', '2025-12-30 19:25:56', '2025-12-30 19:25:56'),
(6, 'dea00fef-1122-4efd-b357-371f67c974eb', 1, 'pagomovil', 24051.2, 'bolivar', 1, 240.51, '21212121', '0134', 'Banesco', '25409904', '2025-12-30 19:25:56', '2025-12-30 19:25:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos_agrupados`
--

CREATE TABLE `ventas_pagos_agrupados` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_pago` int(11) NOT NULL,
  `monto_abonado` float NOT NULL,
  `observaciones` text DEFAULT NULL,
  `created_by` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_pagos_agrupados`
--

INSERT INTO `ventas_pagos_agrupados` (`id`, `venta_key`, `numero_pago`, `monto_abonado`, `observaciones`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 1, 940.51, NULL, '25409904', '2025-12-30 19:24:16', '2025-12-30 19:24:16'),
(2, '31e9ea4e-7605-45ba-9598-43211ef71b02', 1, 940.51, NULL, '25409904', '2025-12-30 19:25:12', '2025-12-30 19:25:12'),
(3, 'dea00fef-1122-4efd-b357-371f67c974eb', 1, 940.51, NULL, '25409904', '2025-12-30 19:25:56', '2025-12-30 19:25:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_productos`
--

CREATE TABLE `ventas_productos` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario_sin_iva` float NOT NULL,
  `tiene_iva` tinyint(4) NOT NULL,
  `precio_unitario` float NOT NULL COMMENT 'En moneda de la venta',
  `total` float NOT NULL COMMENT 'En moneda de la venta',
  `moneda_producto` varchar(20) NOT NULL,
  `tasa_moneda_producto` float NOT NULL,
  `total_moneda_producto` float NOT NULL COMMENT 'En moneda del producto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_productos`
--

INSERT INTO `ventas_productos` (`id`, `venta_key`, `producto_id`, `cantidad`, `precio_unitario_sin_iva`, `tiene_iva`, `precio_unitario`, `total`, `moneda_producto`, `tasa_moneda_producto`, `total_moneda_producto`) VALUES
(1, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 5, 2, 10, 0, 10, 20, 'bolivar', 1, 2000),
(2, '0a6e31c2-4aec-4d4f-af43-9ce2b5f55619', 6, 1, 20, 1, 23.2, 23.2, 'bolivar', 1, 2320),
(3, '31e9ea4e-7605-45ba-9598-43211ef71b02', 5, 2, 10, 0, 10, 20, 'bolivar', 1, 2000),
(4, '31e9ea4e-7605-45ba-9598-43211ef71b02', 6, 1, 20, 1, 23.2, 23.2, 'bolivar', 1, 2320),
(5, 'dea00fef-1122-4efd-b357-371f67c974eb', 5, 2, 10, 0, 10, 20, 'bolivar', 1, 2000),
(6, 'dea00fef-1122-4efd-b357-371f67c974eb', 6, 1, 20, 1, 23.2, 23.2, 'bolivar', 1, 2320);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cargos`
--
ALTER TABLE `cargos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `historiales_medicos`
--
ALTER TABLE `historiales_medicos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`);

--
-- Indices de la tabla `historial_rastreo_bcv`
--
ALTER TABLE `historial_rastreo_bcv`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `logins`
--
ALTER TABLE `logins`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ordenes_trabajo`
--
ALTER TABLE `ordenes_trabajo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_key` (`orden_key`),
  ADD KEY `venta_key` (`venta_key`),
  ADD KEY `sede` (`sede`);

--
-- Indices de la tabla `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pkey` (`pkey`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sedes`
--
ALTER TABLE `sedes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Indices de la tabla `tasas`
--
ALTER TABLE `tasas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tasas_historial`
--
ALTER TABLE `tasas_historial`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasa_id` (`tasa_id`),
  ADD KEY `usu_cedula` (`usu_cedula`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cedula` (`cedula`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `venta_key` (`venta_key`),
  ADD KEY `sede` (`sede`),
  ADD KEY `paciente_key` (`paciente_key`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `created_at` (`created_at`),
  ADD KEY `cliente_informacion_cedula` (`cliente_informacion_cedula`),
  ADD KEY `asesor_id` (`asesor_id`),
  ADD KEY `forma_pago` (`forma_pago`),
  ADD KEY `estatus_venta` (`estatus_venta`),
  ADD KEY `estatus_pago` (`estatus_pago`),
  ADD KEY `fecha` (`fecha`),
  ADD KEY `cliente_informacion_nombre` (`cliente_informacion_nombre`),
  ADD KEY `numero_control` (`numero_control`),
  ADD KEY `historia_medica_id` (`historia_medica_id`);

--
-- Indices de la tabla `ventas_cashea`
--
ALTER TABLE `ventas_cashea`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_key` (`venta_key`);

--
-- Indices de la tabla `ventas_cashea_cuotas`
--
ALTER TABLE `ventas_cashea_cuotas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_key` (`venta_key`);

--
-- Indices de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_key` (`venta_key`),
  ADD KEY `moneda_id` (`moneda_id`),
  ADD KEY `numero_pago` (`numero_pago`);

--
-- Indices de la tabla `ventas_pagos_agrupados`
--
ALTER TABLE `ventas_pagos_agrupados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_key` (`venta_key`),
  ADD KEY `numero_pago` (`numero_pago`);

--
-- Indices de la tabla `ventas_productos`
--
ALTER TABLE `ventas_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_key` (`venta_key`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `historiales_medicos`
--
ALTER TABLE `historiales_medicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `historial_rastreo_bcv`
--
ALTER TABLE `historial_rastreo_bcv`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `logins`
--
ALTER TABLE `logins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de la tabla `ordenes_trabajo`
--
ALTER TABLE `ordenes_trabajo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `tasas_historial`
--
ALTER TABLE `tasas_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ventas_cashea`
--
ALTER TABLE `ventas_cashea`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ventas_cashea_cuotas`
--
ALTER TABLE `ventas_cashea_cuotas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos_agrupados`
--
ALTER TABLE `ventas_pagos_agrupados`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ventas_productos`
--
ALTER TABLE `ventas_productos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
