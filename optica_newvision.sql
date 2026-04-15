-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-04-2026 a las 21:39:47
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
-- Estructura de tabla para la tabla `bancos_receptores_config`
--

CREATE TABLE `bancos_receptores_config` (
  `id` int(11) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `scope` enum('national','international') NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `bancos_receptores_config`
--

INSERT INTO `bancos_receptores_config` (`id`, `sede`, `codigo`, `nombre`, `scope`, `activo`, `created_at`, `updated_at`) VALUES
(3, 'guatire', '0102', 'Banco de Venezuela', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(4, 'guatire', '0104', 'Venezolano de Crédito', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(5, 'guatire', '0108', 'Banco Provincial', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(6, 'guatire', '0134', 'Banesco', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(7, 'guatire', '0172', 'Bancamiga', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(8, 'guatire', '0191', 'Banco Nacional de Crédito', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(9, 'guatire', 'BOFAUS3N', 'Bank of America (BOFA)', 'international', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(10, 'guatire', 'CHASUS33', 'JPMorgan Chase Bank', 'international', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(11, 'guarenas', '0102', 'Banco de Venezuela', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(12, 'guarenas', '0104', 'Venezolano de Crédito', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(13, 'guarenas', '0108', 'Banco Provincial', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(14, 'guarenas', '0134', 'Banesco', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(15, 'guarenas', '0172', 'Bancamiga', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(16, 'guarenas', '0191', 'Banco Nacional de Crédito', 'national', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(17, 'guarenas', 'BOFAUS3N', 'Bank of America (BOFA)', 'international', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(18, 'guarenas', 'CHASUS33', 'JPMorgan Chase Bank', 'international', 1, '2026-04-13 15:32:42', '2026-04-13 15:32:42');

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
(2, 'Cristales'),
(3, 'Líquidos'),
(4, 'Estuches'),
(5, 'Accesorios'),
(6, 'Lentes de contacto'),
(7, 'Filtro/Aditivos'),
(8, 'Materiales');

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
(1, 'guarenas', '24367965', 'Ruben dario Martinez castro', '04123920817', 'rubemm@gmail.com', '2026-03-17 07:44:51', '2026-04-01 09:50:15'),
(2, 'guatire', '30000001', 'Cliente Prueba Abono', '04120000000', 'prueba.abono@example.com', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(3, 'guatire', '30000002', 'Cliente Contado API', '04120000001', 'cliente.contado@example.com', '2026-04-11 15:46:57', '2026-04-11 15:46:57'),
(4, 'guarenas', '70000001', 'Filtro Uno', '04120000001', 'filtro1@test.com', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(5, 'guarenas', '70000002', 'Filtro Dos', '04120000002', 'filtro2@test.com', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(6, 'guarenas', '70000003', 'Filtro Tres', '04120000003', 'filtro3@test.com', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(7, 'guarenas', '70000004', 'Filtro Cuatro', '04120000004', 'filtro4@test.com', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(8, 'guarenas', '70000005', 'Filtro Cinco', '04120000005', 'filtro5@test.com', '2026-04-11 17:13:30', '2026-04-11 17:13:30');

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
(1, 'guarenas', 'numero_control', '240', 'Siguiente numero de control para la sede de Guarenas.'),
(2, 'guatire', 'numero_control', '39', 'Siguiente numero de control para la sede de Guatire.'),
(4, 'guatire', 'moneda_base', 'dolar', 'Moneda base del sistema para la sede de Guatire.'),
(6, 'guarenas', 'moneda_base', 'dolar', 'Moneda base del sistema para la sede de ${req.sede.nombre}.'),
(7, 'guatire', 'dias_archivar_ordenes', '10', 'Dias para archivar las ordenes de trabajo con el estado de  \"entregado\"'),
(8, 'guarenas', 'dias_archivar_ordenes', '1', 'Dias para archivar las ordenes de trabajo con el estado de  \"entregado\"'),
(9, 'guatire', 'costo_total_consulta', '60', 'Costo total de las consultas'),
(10, 'guarenas', 'costo_total_consulta', '40', 'Costo total de las consultas'),
(11, 'guatire', 'costo_medico_consulta', '40', 'Costo de consulta del medico'),
(12, 'guarenas', 'costo_medico_consulta', '30', 'Costo de consulta del medico');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `rif` varchar(20) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(200) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresas`
--

INSERT INTO `empresas` (`id`, `sede`, `rif`, `nombre`, `telefono`, `correo`, `direccion`, `created_at`, `updated_at`) VALUES
(1, 'guarenas', '254099046', 'Empresa de Prueba', NULL, NULL, NULL, '2026-01-16 17:58:25', '2026-01-19 23:17:18'),
(2, 'guarenas', 'J-12345678', '123', '2', '3', '5', '2026-01-16 19:41:14', '2026-01-16 19:41:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historiales_medicos`
--

CREATE TABLE `historiales_medicos` (
  `id` int(11) NOT NULL,
  `numero` varchar(14) NOT NULL,
  `venta_key` varchar(100) DEFAULT NULL,
  `pago_pendiente` tinyint(4) NOT NULL DEFAULT 1,
  `fecha` date NOT NULL,
  `paciente_id` varchar(70) NOT NULL,
  `motivo_consulta` text DEFAULT NULL,
  `otro_motivo_consulta` text DEFAULT NULL,
  `tipo_cristal_actual` text DEFAULT NULL,
  `tipo_lentes_contacto` text DEFAULT NULL,
  `ultima_graduacion` date DEFAULT NULL,
  `especialista_tipo` varchar(20) DEFAULT NULL,
  `especialista_cedula` varchar(25) DEFAULT NULL,
  `especialista_externo_nombre` varchar(255) DEFAULT NULL,
  `especialista_externo_lugar` varchar(255) DEFAULT NULL,
  `formula_original_tipo` varchar(20) DEFAULT NULL,
  `formula_original_nombre` varchar(255) DEFAULT NULL,
  `formula_original_lugar` varchar(255) DEFAULT NULL,
  `formula_externa` tinyint(4) NOT NULL DEFAULT 0,
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

INSERT INTO `historiales_medicos` (`id`, `numero`, `venta_key`, `pago_pendiente`, `fecha`, `paciente_id`, `motivo_consulta`, `otro_motivo_consulta`, `tipo_cristal_actual`, `tipo_lentes_contacto`, `ultima_graduacion`, `especialista_tipo`, `especialista_cedula`, `especialista_externo_nombre`, `especialista_externo_lugar`, `formula_original_tipo`, `formula_original_nombre`, `formula_original_lugar`, `formula_externa`, `examen_ocular_lensometria`, `examen_ocular_refraccion`, `examen_ocular_refraccion_final`, `examen_ocular_avsc_avae_otros`, `diagnostico`, `tratamiento`, `recomendaciones`, `conformidad_nota`, `conformidad_firma_paciente`, `conformidad_firma_medico`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'H-20260317-001', 'b6547031-0d9a-47dd-8d4c-8c6955504024', 0, '2026-03-17', 'c4ca4238a0b923820dcc509a6f75849b', 'Chequeo visual', '', 'Ninguno', 'No usa', '2022-12-31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"nota\":\"\"}', 'Miopía leve', 'Lentes de descanso', '[\"Usar lentes al leer\"]', 'Conforme', NULL, NULL, '999999999', '999999999', '2026-03-17 07:44:51', '2026-03-17 07:44:51', NULL),
(2, 'H-20260317-002', '026727da-abd9-4646-91cc-32cfa5069f11', 1, '2026-03-17', 'c4ca4238a0b923820dcc509a6f75849b', 'Chequeo visual', '', 'Ninguno', 'No usa', '2022-12-31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"oIDistancia\":\"\",\"oDDistancia\":\"\"}', '{\"nota\":\"\"}', 'Miopía leve', 'Lentes de descanso', '[\"Usar lentes al leer\"]', 'Conforme', NULL, NULL, '999999999', '999999999', '2026-03-17 07:44:51', '2026-04-11 17:13:30', NULL),
(3, 'H-20260318-001', '67145e82-4751-4481-9be0-05a34ef4975c', 0, '2026-03-18', 'c4ca4238a0b923820dcc509a6f75849b', 'Visión borrosa', NULL, 'Monofocal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[{\"ojo\":\"OD\",\"esfera\":\"-1.00\",\"cilindro\":\"-0.50\",\"eje\":\"90\",\"adicion\":\"\"},{\"ojo\":\"OI\",\"esfera\":\"-0.75\",\"cilindro\":\"0.00\",\"eje\":\"0\",\"adicion\":\"\"}]', '[{\"ojo\":\"OD\",\"esfera\":\"-1.25\",\"cilindro\":\"-0.50\",\"eje\":\"90\",\"avsc\":\"20/40\",\"avae\":\"\"},{\"ojo\":\"OI\",\"esfera\":\"-1.00\",\"cilindro\":\"0.00\",\"eje\":\"0\",\"avsc\":\"20/30\",\"avae\":\"\"}]', '[{\"ojo\":\"OD\",\"esfera\":\"-1.25\",\"cilindro\":\"-0.50\",\"eje\":\"90\"},{\"ojo\":\"OI\",\"esfera\":\"-1.00\",\"cilindro\":\"0.00\",\"eje\":\"0\"}]', '{\"avsc\":\"20/40\",\"avae\":\"20/20\",\"otros\":\"\"}', 'Miopía leve', 'Lentes oftálmicos monofocales', '[{\"tipo\":\"Control\",\"descripcion\":\"Revisión en 6 meses\"}]', 'El paciente acepta el tratamiento indicado.', NULL, NULL, '25409904', '25409904', '2026-03-18 18:37:19', '2026-04-11 17:13:30', NULL);

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
(44, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc2ODA4MjUzOSwiZXhwIjoxNzY4MTY4OTM5fQ.CCbjOk4nQO7zi3XQuDNvTCdavzEWFGCx-p9L7oDtFYQ', '::1', '2026-01-10 18:02:19', '2026-01-10 18:02:19'),
(45, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc2ODQwNzY5MiwiZXhwIjoxNzY4NDk0MDkyfQ.tGRbQE6LDVK4iWAYz8j0McaMlvkWEIlbEqPPiTA_IC4', '::1', '2026-01-14 12:21:32', '2026-01-14 12:21:32'),
(46, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njg0MTE1MzUsImV4cCI6MTc2ODQ5NzkzNX0.5857E5htB7ewIsB3sYjbiFknBRU3z7s6PzpsknmwzrQ', '::1', '2026-01-14 13:25:35', '2026-01-14 13:25:35'),
(47, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njg0NDAzMTgsImV4cCI6MTc2ODUyNjcxOH0.Ld8TWyDx55ZtwtYkFCRlc0I8rN_rYNhuQH52te3n6PY', '::1', '2026-01-14 21:25:18', '2026-01-14 21:25:18'),
(48, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njg0ODE4MDIsImV4cCI6MTc2ODU2ODIwMn0.-Gr9C9l-1oXs5RbGyCBcW-qvdubzk8WMGbzt1JDbabA', '::1', '2026-01-15 08:56:42', '2026-01-15 08:56:42'),
(49, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njg2MDA5NzYsImV4cCI6MTc2ODY4NzM3Nn0.YM5t1ekd-EDTCOL7kbmEde4j7f75Ib0-BCxmDmgVUjw', '::1', '2026-01-16 18:02:56', '2026-01-16 18:02:56'),
(50, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3Njg4NzY2NjcsImV4cCI6MTc2ODk2MzA2N30.5o6gZ6inIwURDrtZ5ApT6zyNFI21-n_O38hb4aMJBvI', '::1', '2026-01-19 22:37:47', '2026-01-19 22:37:47'),
(51, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjkwMzI0OTUsImV4cCI6MTc2OTExODg5NX0.TZeWYzQ-qvRH-lOHqmmCl6lI6FW2-Nj_bE21_880XSQ', '::1', '2026-01-21 17:54:55', '2026-01-21 17:54:55'),
(52, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NjkwODM3MDcsImV4cCI6MTc2OTE3MDEwN30.E8Mz0U3gjikNEqd5_K-dYuvoMf3U_BkFB7CCpNowUII', '::1', '2026-01-22 08:08:27', '2026-01-22 08:08:27'),
(53, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzA0Nzc0NjIsImV4cCI6MTc3MDU2Mzg2Mn0.OVwOSgjf8BfIJkBGbbSe9PB9Cu9EFkrb0jObMGeRdic', '::1', '2026-02-07 11:17:42', '2026-02-07 11:17:42'),
(54, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzA4Mjg3NzYsImV4cCI6MTc3MDkxNTE3Nn0.guKPb5xbTKihrFWZikgvy3FVBOqiP4gIVQ89rxfCeUM', '::1', '2026-02-11 12:52:56', '2026-02-11 12:52:56'),
(55, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzE1NzM0NTEsImV4cCI6MTc3MTY1OTg1MX0.ZOyGDABirghwpdEV56LXAaWbyOH_Cyo6GxOorRJRWf4', '::1', '2026-02-20 03:44:11', '2026-02-20 03:44:11'),
(56, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzM2MDIwNDUsImV4cCI6MTc3MzY4ODQ0NX0.Ns7f7ccleM3QGIe-zDxaLb8Ww0JkfJCOerm5VTKI_xA', '::1', '2026-03-15 15:14:05', '2026-03-15 15:14:05'),
(57, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjg4Njc4LCJleHAiOjE3NzM3NzUwNzh9.M23QrVbPHQu5omczKg5_3tsbTwH5JKeSUq2ALvvVW3k', '::1', '2026-03-16 15:17:58', '2026-03-16 15:17:58'),
(58, 'guatire', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiI5OTk5OTk5OTkiLCJpYXQiOjE3NzM2ODg4NDQsImV4cCI6MTc3Mzc3NTI0NH0.BL2YhyeC8m8rCUJAM8vk6Z7_xO6mVIG2yl22fVLlDQQ', '::1', '2026-03-16 15:20:44', '2026-03-16 15:20:44'),
(59, 'guatire', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiI5OTk5OTk5OTkiLCJpYXQiOjE3NzM2ODkxMjQsImV4cCI6MTc3Mzc3NTUyNH0.IGZDjrHjPOXk83gqzeYuswnf48kqkmWWOuwL0A68KZU', '::1', '2026-03-16 15:25:24', '2026-03-16 15:25:24'),
(60, 'guatire', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiI5OTk5OTk5OTkiLCJpYXQiOjE3NzM2OTAyNTAsImV4cCI6MTc3Mzc3NjY1MH0.z0mZfeZdqXutu0OD0zcVeOFDbmqHp11UcmI9We8hTXc', '::1', '2026-03-16 15:44:10', '2026-03-16 15:44:10'),
(61, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk1NjQ3LCJleHAiOjE3NzM3ODIwNDd9.b6pHTMfPnsC_TRzY5wBqHJrjpft-1sf1K-s_8HFCIm0', '::1', '2026-03-16 17:14:07', '2026-03-16 17:14:07'),
(62, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk1Njg4LCJleHAiOjE3NzM3ODIwODh9.GbpVc_BiF_FNvrsKVyiXhep4SralMXXwHtvMNvwyjvs', '::1', '2026-03-16 17:14:48', '2026-03-16 17:14:48'),
(63, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk2MDkxLCJleHAiOjE3NzM3ODI0OTF9.wjbLUQJe7rquV0SVW5VyxXcxIZH6V1Ln4tUdAGmqFq8', '::1', '2026-03-16 17:21:31', '2026-03-16 17:21:31'),
(64, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk2NzEyLCJleHAiOjE3NzM3ODMxMTJ9.Q623fF4jqkpYvid0mgwanraHdW-5Hnq7JUaagQsG_lw', '::1', '2026-03-16 17:31:52', '2026-03-16 17:31:52'),
(65, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk2OTI3LCJleHAiOjE3NzM3ODMzMjd9.9E1blthMGeOBaaOu4n5SVsGP2d8pvhQMf8cDZ8FRe7A', '::1', '2026-03-16 17:35:27', '2026-03-16 17:35:27'),
(66, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk3NjQxLCJleHAiOjE3NzM3ODQwNDF9.U30r6mf4FG4gvEmBNemUumOJC_FpB3O8CJhMR-Wp3tM', '::1', '2026-03-16 17:47:21', '2026-03-16 17:47:21'),
(67, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk3NjU5LCJleHAiOjE3NzM3ODQwNTl9.o_FMAPByrQ9qcHirFFnvhyI5vBBeWai-FvwATPhuVl0', '::1', '2026-03-16 17:47:39', '2026-03-16 17:47:39'),
(68, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk4MzM5LCJleHAiOjE3NzM3ODQ3Mzl9.5w6RmKPFQqcapOzc1bWmlV_olpuxBsa7eTUllyptVMw', '::1', '2026-03-16 17:58:59', '2026-03-16 17:58:59'),
(69, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk4OTM0LCJleHAiOjE3NzM3ODUzMzR9.WFt-bg_QvmfTQbLKvOlI43R-8vriiqMCZgKr7WhchqI', '::1', '2026-03-16 18:08:54', '2026-03-16 18:08:54'),
(70, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk4OTU1LCJleHAiOjE3NzM3ODUzNTV9.UZoUEgw_Hdc8i-lMv05paz8R6-fx8UfzOLJGL0HvNzs', '::1', '2026-03-16 18:09:15', '2026-03-16 18:09:15'),
(71, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk4OTY0LCJleHAiOjE3NzM3ODUzNjR9.B9F4WZEly35PHJGMuv7STnJdNkq13w2UagxO1DMIKvA', '::1', '2026-03-16 18:09:24', '2026-03-16 18:09:24'),
(72, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNjk5MDA4LCJleHAiOjE3NzM3ODU0MDh9.vZxhIZ-7yr-yJFFhpi1pPU1Igu90EBdrxHnNAFBQ4Ck', '::1', '2026-03-16 18:10:08', '2026-03-16 18:10:08'),
(73, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzAyMzUyLCJleHAiOjE3NzM3ODg3NTJ9.X-Ij_jYD0sIm4Ks0EcC2wCIa1htDe2Z1Xwnw7M8Pa6Q', '::1', '2026-03-16 19:05:52', '2026-03-16 19:05:52'),
(74, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzAyMzcwLCJleHAiOjE3NzM3ODg3NzB9.-w_j5YTTs5VXh1jtTfH2tUrK_7pYBHW9F5Kv50mR5NU', '::1', '2026-03-16 19:06:10', '2026-03-16 19:06:10'),
(75, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQwNjY1LCJleHAiOjE3NzM4MjcwNjV9.HV8v5HWySKbVF_pM2owFf3mkyHKCQoN3EsbMRbCMoOs', '::1', '2026-03-17 05:44:25', '2026-03-17 05:44:25'),
(76, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzMTcyLCJleHAiOjE3NzM4Mjk1NzJ9.eXrFFDaCkEjvCSSvz_P8IymMAWFLOT2JL5rcycerruw', '::1', '2026-03-17 06:26:12', '2026-03-17 06:26:12'),
(77, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzMjE1LCJleHAiOjE3NzM4Mjk2MTV9.PFGhQoPHFIeIAm3AIsG5hV4WrbIKeBiVafVTjByryQ8', '::1', '2026-03-17 06:26:55', '2026-03-17 06:26:55'),
(78, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzMjM5LCJleHAiOjE3NzM4Mjk2Mzl9.fQSO7E6UBPLDTtTloD7H9yb71PAvmWxZB3OkrGDYpP4', '::1', '2026-03-17 06:27:19', '2026-03-17 06:27:19'),
(79, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzMjcwLCJleHAiOjE3NzM4Mjk2NzB9.4HewR_ggXOmhrYe37ZpzrITcNoklySdybjbIzaqHL_g', '::1', '2026-03-17 06:27:50', '2026-03-17 06:27:50'),
(80, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzMzAyLCJleHAiOjE3NzM4Mjk3MDJ9.ZojIuvp-LpagyggihCr_R9JNQqF_nH6a1L_vA7ULWsw', '::1', '2026-03-17 06:28:22', '2026-03-17 06:28:22'),
(81, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzNTUyLCJleHAiOjE3NzM4Mjk5NTJ9.ZZaXaC0jC8d1Ln7hfKehbwvRWIw2eBfxM15Z8HhvWck', '::1', '2026-03-17 06:32:32', '2026-03-17 06:32:32'),
(82, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzNjI4LCJleHAiOjE3NzM4MzAwMjh9.dqWt4hR967JIvOuNLKA40uhuRtFPb3THcv7Hz5Y_KXc', '::1', '2026-03-17 06:33:48', '2026-03-17 06:33:48'),
(83, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzNzcyLCJleHAiOjE3NzM4MzAxNzJ9.oZD7nkLWVNA_A73eSKLYmm9hc_dFaP_ga8KR6LshPaw', '::1', '2026-03-17 06:36:12', '2026-03-17 06:36:12'),
(84, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzODMyLCJleHAiOjE3NzM4MzAyMzJ9.iDORZKPLNX_9OkchiULgIwrhwdeOdzBbC1jLVkPuwlk', '::1', '2026-03-17 06:37:12', '2026-03-17 06:37:12'),
(85, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQzOTEzLCJleHAiOjE3NzM4MzAzMTN9.TVFfupBW8PSH_-l74e90ZaHK7dzD7uUXi9zWLCXkea8', '::1', '2026-03-17 06:38:33', '2026-03-17 06:38:33'),
(86, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ0MTgzLCJleHAiOjE3NzM4MzA1ODN9.E-FfsWwJw8-5xz5L7mI8_DfqikoHj_tq0DNDgmNhmQ0', '::1', '2026-03-17 06:43:03', '2026-03-17 06:43:03'),
(87, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ0MjYzLCJleHAiOjE3NzM4MzA2NjN9.8z0694MNmtwECIS3qjXERFtOz5a-CrsgBjctxUKXudU', '::1', '2026-03-17 06:44:23', '2026-03-17 06:44:23'),
(88, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ0Mzc3LCJleHAiOjE3NzM4MzA3Nzd9.uwCnTrN9pZKdlRuG9WBEBhQbbAc1t3yHrfYjLIQJHsI', '::1', '2026-03-17 06:46:17', '2026-03-17 06:46:17'),
(89, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1MjY1LCJleHAiOjE3NzM4MzE2NjV9.w-EJrkCKYjXUn7RxOSAK8g-2uPDh8u9uJxLjZRIjH04', '::1', '2026-03-17 07:01:05', '2026-03-17 07:01:05'),
(90, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1MjgyLCJleHAiOjE3NzM4MzE2ODJ9.6PYpkEt0cBd2HDpTLw4lxcqf5kWHyK3kppP8CY-k7L8', '::1', '2026-03-17 07:01:22', '2026-03-17 07:01:22'),
(91, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1MzU2LCJleHAiOjE3NzM4MzE3NTZ9.yhRdcASbexN_YhzaWKZApeddLr1wbPk1HWUFl7pbsXQ', '::1', '2026-03-17 07:02:36', '2026-03-17 07:02:36'),
(92, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1MzY5LCJleHAiOjE3NzM4MzE3Njl9.eFkE3P4ohm4zdFZPxVChuGsX09URDv9kMyweuylBEnM', '::1', '2026-03-17 07:02:49', '2026-03-17 07:02:49'),
(93, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1MzgyLCJleHAiOjE3NzM4MzE3ODJ9.RmAgCp2nJcXvKCmbqLDotTF64K8-0FiWQ34kW5bAtO8', '::1', '2026-03-17 07:03:02', '2026-03-17 07:03:02'),
(94, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NDI3LCJleHAiOjE3NzM4MzE4Mjd9.xDov6URRTRX5EwHFVn4aQyogFnJ5RvU7ofrmD-ozlN4', '::1', '2026-03-17 07:03:47', '2026-03-17 07:03:47'),
(95, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NTI5LCJleHAiOjE3NzM4MzE5Mjl9.22Jms3TyqeVoHwBIxts2cHra1SJF_rMBS4uCW9tGlRU', '::1', '2026-03-17 07:05:29', '2026-03-17 07:05:29'),
(96, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NTQwLCJleHAiOjE3NzM4MzE5NDB9.vvYoeHBYllOgOKyD_46tFqJht2U0JynVdx_X4Llm-4A', '::1', '2026-03-17 07:05:40', '2026-03-17 07:05:40'),
(97, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NTkwLCJleHAiOjE3NzM4MzE5OTB9.aGmf-QESjJyQudsvL1bsctkiHVkMU6EgKvZkGU6G4g0', '::1', '2026-03-17 07:06:30', '2026-03-17 07:06:30'),
(98, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NTk4LCJleHAiOjE3NzM4MzE5OTh9.uCfqjTXhjzLJiRuUP7dfrR7V9phBRKVmzJtsFGRfZ8U', '::1', '2026-03-17 07:06:38', '2026-03-17 07:06:38'),
(99, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NjUwLCJleHAiOjE3NzM4MzIwNTB9.LdyCRblnEtkut-6ZR-iPc9aHgp5nXqsAjQ_SC5dcCTI', '::1', '2026-03-17 07:07:30', '2026-03-17 07:07:30'),
(100, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NjYyLCJleHAiOjE3NzM4MzIwNjJ9.f2c0pfPaDTvBAwncLsOtvTRsjriak5olx0MPgDgdTis', '::1', '2026-03-17 07:07:42', '2026-03-17 07:07:42'),
(101, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1NzkwLCJleHAiOjE3NzM4MzIxOTB9.YmwD2looUV_fYJ06BkvGruhA5daj_LKd9SAIvVxWNRA', '::1', '2026-03-17 07:09:50', '2026-03-17 07:09:50'),
(102, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ1OTM4LCJleHAiOjE3NzM4MzIzMzh9.7APs0On5IxGfbGHG4xQsVyUjjsnxM5Gw_9YLG-2j91A', '::1', '2026-03-17 07:12:18', '2026-03-17 07:12:18'),
(103, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ2MDU1LCJleHAiOjE3NzM4MzI0NTV9.Z76YhyQ381okSXb41IKavNX5kvAjkIpVeo1bWl1rG9c', '::1', '2026-03-17 07:14:15', '2026-03-17 07:14:15'),
(104, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ2MTk5LCJleHAiOjE3NzM4MzI1OTl9.qsyQW6SAL5QC-kzgkwhJoUVF3oZ0xGPSY3K3B34pngc', '::1', '2026-03-17 07:16:39', '2026-03-17 07:16:39'),
(105, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ2MjM3LCJleHAiOjE3NzM4MzI2Mzd9.lwKI-shnUYiM3xjVJopnDLQAqj_6chjc5gv3SmUdyFU', '::1', '2026-03-17 07:17:17', '2026-03-17 07:17:17'),
(106, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ3NTk4LCJleHAiOjE3NzM4MzM5OTh9.Qe8gaIqi9T06fwpL7nV_IJN_XS_2lW2pUFrJ7JXNqRo', '::1', '2026-03-17 07:39:58', '2026-03-17 07:39:58'),
(107, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ3NzI1LCJleHAiOjE3NzM4MzQxMjV9.Q-7XkKlPT_7310vFd9Po8Kp-e-H0MED2pgRFsgniEHk', '::1', '2026-03-17 07:42:05', '2026-03-17 07:42:05'),
(108, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ3ODA0LCJleHAiOjE3NzM4MzQyMDR9.U_I8BnPM7xtEpgGZVdJ1dRoBmGlaqfr5u-UTRM3RiEo', '::1', '2026-03-17 07:43:24', '2026-03-17 07:43:24'),
(109, 'guarenas', '999999999', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiOTk5OTk5OTk5IiwiaWF0IjoxNzczNzQ3ODkxLCJleHAiOjE3NzM4MzQyOTF9.4AditE2ZTIr2cO9QwI0ncDP2tDQhLpn31iEswAvfFAo', '::1', '2026-03-17 07:44:51', '2026-03-17 07:44:51'),
(110, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3Mzg3MzQzOSwiZXhwIjoxNzczOTU5ODM5fQ.ee9PGyijoDpC4shDDFBGcpVDyeT1JEys4VrJ3kVz60M', '::1', '2026-03-18 18:37:19', '2026-03-18 18:37:19'),
(111, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzUwNTA2NzksImV4cCI6MTc3NTEzNzA3OX0.cVHKKZsNylwM7ckQ48ha4KVDgZQBxQB_E157YMvR0Y8', '::1', '2026-04-01 09:37:59', '2026-04-01 09:37:59'),
(112, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzU1NzU2ODAsImV4cCI6MTc3NTY2MjA4MH0.8N7fXTtvLTFlYPSleTaAdQ2MUDC-xGtmj5xWMPuPSW0', '::1', '2026-04-07 11:28:00', '2026-04-07 11:28:00'),
(113, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzU5Mjk5OTAsImV4cCI6MTc3NjAxNjM5MH0.QBsXu3OzjY-a09IwBXSi_8D4yX-Px1opuAbGky9zx5g', '::1', '2026-04-11 13:53:10', '2026-04-11 13:53:10'),
(114, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzU5MzExNDMsImV4cCI6MTc3NjAxNzU0M30.HkfO3gFkbo_vtjuUG_jmyiQl4VzEl5n0JJSKtFfnOf0', '::1', '2026-04-11 14:12:23', '2026-04-11 14:12:23'),
(115, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NTkzNTY5OSwiZXhwIjoxNzc2MDIyMDk5fQ.MEPD2soahd_SNW1D6H7BcizNACrza_DIQK6nmQDhAl4', '::1', '2026-04-11 15:28:19', '2026-04-11 15:28:19'),
(116, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NTkzNTcxNywiZXhwIjoxNzc2MDIyMTE3fQ.o1GxOTNt4BSBgHrL6YJYKmaSBb4Sw9pHaxJ7BnoT0Hk', '::1', '2026-04-11 15:28:37', '2026-04-11 15:28:37'),
(117, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzU5MzU3MjksImV4cCI6MTc3NjAyMjEyOX0.Jk6vSqfLcNvB0ACbwvjbi_X5t4QtN15LhKG2Bs2TXpk', '::1', '2026-04-11 15:28:49', '2026-04-11 15:28:49'),
(118, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzU5MzU3MzUsImV4cCI6MTc3NjAyMjEzNX0.bQkl9ocZRVro11mo_866laJEjX4L47vu6bpCKeiRK5c', '::1', '2026-04-11 15:28:55', '2026-04-11 15:28:55'),
(119, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NTkzNTc2MywiZXhwIjoxNzc2MDIyMTYzfQ.z8XdpG49wMITKmRRJwDOf9JCPBdYBG59U8EH3exoakU', '::1', '2026-04-11 15:29:23', '2026-04-11 15:29:23'),
(120, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NjA5NDAwMywiZXhwIjoxNzc2MTgwNDAzfQ.3PtYyjMPPhlHPEB9MdUFiyXMCKZmQt5lEzwfoSdNvGI', '::1', '2026-04-13 11:26:43', '2026-04-13 11:26:43'),
(121, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NjEwNTMwMywiZXhwIjoxNzc2MTkxNzAzfQ.biKkTXEi9G63lxAE6PY-kQedr823Pfna9GZSnALG7Gw', '::1', '2026-04-13 14:35:03', '2026-04-13 14:35:03'),
(122, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NjEwNTgzNywiZXhwIjoxNzc2MTkyMjM3fQ.7CeUtFZZ91d2X8WYr_1WZClK9mqx5Cfr70SzZIV_cdU', '::1', '2026-04-13 14:43:57', '2026-04-13 14:43:57'),
(123, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NjEwNTg4MCwiZXhwIjoxNzc2MTkyMjgwfQ.RQ6YVxEDzzvlRKhNXQz7fzrya8kBu6EE5RLh3six-ag', '::1', '2026-04-13 14:44:40', '2026-04-13 14:44:40'),
(124, 'guatire', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhdGlyZSIsInVzZXJDZWR1bGEiOiIyNTQwOTkwNCIsImlhdCI6MTc3NjEwNjkzOCwiZXhwIjoxNzc2MTkzMzM4fQ.4NJWVpNM3M055579-EidY4ksRmigY6SiaryNGLrtlQw', '::1', '2026-04-13 15:02:18', '2026-04-13 15:02:18'),
(125, 'guarenas', '25409904', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWRlX2lkIjoiZ3VhcmVuYXMiLCJ1c2VyQ2VkdWxhIjoiMjU0MDk5MDQiLCJpYXQiOjE3NzYxMDY5MzgsImV4cCI6MTc3NjE5MzMzOH0.iRa2fRzekOlikOC6I_LVttU-AshmpHFIyZFXjEX0GoA', '::1', '2026-04-13 15:02:18', '2026-04-13 15:02:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pago_config`
--

CREATE TABLE `metodos_pago_config` (
  `id` int(11) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `metodo_key` varchar(80) NOT NULL,
  `label` varchar(120) NOT NULL,
  `description` text NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `currency` varchar(20) NOT NULL,
  `requires_receiver_account` tinyint(1) NOT NULL DEFAULT 0,
  `is_custom` tinyint(1) NOT NULL DEFAULT 0,
  `accounts` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `metodos_pago_config`
--

INSERT INTO `metodos_pago_config` (`id`, `sede`, `metodo_key`, `label`, `description`, `enabled`, `currency`, `requires_receiver_account`, `is_custom`, `accounts`, `created_at`, `updated_at`) VALUES
(3, 'guatire', 'efectivo', 'Efectivo', 'Pago inmediato en caja para operaciones presenciales.', 1, 'MULTI', 0, 0, '[]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(4, 'guatire', 'punto_de_venta', 'Punto de Venta', 'Cobro con tarjetas procesadas a través de puntos de venta físicos internos.', 1, 'VES', 1, 0, '[{\"id\":\"punto-1\",\"bank\":\"Bancamiga\",\"bankCode\":\"0172\",\"ownerName\":\"\",\"ownerId\":\"\",\"phone\":\"\",\"email\":\"\",\"walletAddress\":\"\",\"accountDescription\":\"Punto de venta interno - Óptica Principal\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(5, 'guatire', 'pago_movil', 'Pago Móvil', 'Pago móvil interbancario con selección de banco receptor.', 1, 'VES', 1, 0, '[{\"id\":\"pm-1\",\"bank\":\"Banco Provincial\",\"bankCode\":\"0108\",\"ownerName\":\"Ruben Martinez\",\"ownerId\":\"24367965\",\"phone\":\"04123920817\",\"email\":\"\",\"walletAddress\":\"\",\"accountDescription\":\"Cuenta personal de Ruben\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(6, 'guatire', 'zelle', 'Zelle', 'Transferencia electrónica en USD con destino operativo definido.', 1, 'USD', 1, 0, '[{\"id\":\"zelle-1\",\"bank\":\"Bank of America (BOFA)\",\"bankCode\":\"BOFAUS3N\",\"ownerName\":\"Ruben Perez\",\"ownerId\":\"V-12345678\",\"phone\":\"+15875551234\",\"email\":\"ruben.perez@email.com\",\"walletAddress\":\"\",\"accountDescription\":\"Cuenta personal de Ruben (Zelle)\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(7, 'guarenas', 'efectivo', 'Efectivo', 'Pago inmediato en caja para operaciones presenciales.', 1, 'MULTI', 0, 0, '[]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(8, 'guarenas', 'punto_de_venta', 'Punto de Venta', 'Cobro con tarjetas procesadas a través de puntos de venta físicos internos.', 1, 'VES', 1, 0, '[{\"id\":\"punto-1\",\"bank\":\"Bancamiga\",\"bankCode\":\"0172\",\"ownerName\":\"\",\"ownerId\":\"\",\"phone\":\"\",\"email\":\"\",\"walletAddress\":\"\",\"accountDescription\":\"Punto de venta interno - Óptica Principal\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(9, 'guarenas', 'pago_movil', 'Pago Móvil', 'Pago móvil interbancario con selección de banco receptor.', 1, 'VES', 1, 0, '[{\"id\":\"pm-1\",\"bank\":\"Banco Provincial\",\"bankCode\":\"0108\",\"ownerName\":\"Ruben Martinez\",\"ownerId\":\"24367965\",\"phone\":\"04123920817\",\"email\":\"\",\"walletAddress\":\"\",\"accountDescription\":\"Cuenta personal de Ruben\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42'),
(10, 'guarenas', 'zelle', 'Zelle', 'Transferencia electrónica en USD con destino operativo definido.', 1, 'USD', 1, 0, '[{\"id\":\"zelle-1\",\"bank\":\"Bank of America (BOFA)\",\"bankCode\":\"BOFAUS3N\",\"ownerName\":\"Ruben Perez\",\"ownerId\":\"V-12345678\",\"phone\":\"+15875551234\",\"email\":\"ruben.perez@email.com\",\"walletAddress\":\"\",\"accountDescription\":\"Cuenta personal de Ruben (Zelle)\"}]', '2026-04-13 15:32:42', '2026-04-13 15:32:42');

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
(1, 'OT-GUATIRE-2026-001', 'guatire', 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 'en_tienda', NULL, NULL, 0, NULL, 2026, 1, 0, NULL, '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(2, 'OT-GUARENAS-2026-001', 'guarenas', '67145e82-4751-4481-9be0-05a34ef4975c', 'en_tienda', NULL, NULL, 0, NULL, 2026, 1, 0, NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30');

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
  `empresa_rif` varchar(20) DEFAULT NULL,
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
  `patologias` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `pkey`, `sede_id`, `cedula`, `sin_cedula`, `nombre`, `fecha_nacimiento`, `telefono`, `email`, `ocupacion`, `genero`, `direccion`, `redes_sociales`, `empresa_rif`, `created_at`, `updated_at`, `deleted_at`, `tiene_lentes`, `fotofobia`, `uso_dispositivo_electronico`, `traumatismo_ocular`, `traumatismo_ocular_descripcion`, `cirugia_ocular`, `cirugia_ocular_descripcion`, `alergias`, `antecedentes_personales`, `antecedentes_familiares`, `patologias`) VALUES
(1, 'c4ca4238a0b923820dcc509a6f75849b', 'guarenas', '24367965', 0, 'Ruben dario Martinez castro', '1994-11-20', '04120000000', 'ruben@example.com', 'Ingeniero', 'm', 'Guarenas', '[]', NULL, '2026-03-17 07:44:51', '2026-03-17 07:44:51', NULL, 'No', 'No', 'Sí', 'No', '', 'No', '', 'Ninguna', '', '', 'Ninguna');

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
  `precio` decimal(18,4) NOT NULL,
  `aplica_iva` tinyint(4) NOT NULL,
  `precio_con_iva` decimal(18,4) NOT NULL,
  `moneda` varchar(20) NOT NULL,
  `activo` tinyint(4) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `requiere_formula` tinyint(4) NOT NULL DEFAULT 0,
  `requiere_item_padre` tinyint(4) NOT NULL DEFAULT 0,
  `imagen_url` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `sede_id`, `nombre`, `marca`, `color`, `codigo`, `material`, `proveedor`, `categoria`, `modelo`, `stock`, `precio`, `aplica_iva`, `precio_con_iva`, `moneda`, `activo`, `descripcion`, `imagen_url`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 'guarenas', 'Producto Chevere 1', 'Marca Generica 1', 'Azul', 'PR-000005', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -78, 862.0700, 0, 1000.0000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311414341', '2025-09-19 19:50:14', '2026-04-07 11:30:07', NULL),
(6, 'guarenas', 'Producto Chevere 2', 'Marca Generica 1', 'Azul', 'PR-000006', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -41, 2000.0000, 1, 2320.0000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311675271', '2025-09-19 19:54:35', '2026-04-07 11:30:07', NULL),
(7, 'guarenas', 'Producto Chevere 3', 'Marca Generica 2', 'Azul', 'PR-000006', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -1, 2000.0000, 1, 2320.0000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1758311675271', '2025-09-19 19:54:35', '2025-11-16 19:01:25', NULL),
(8, 'guarenas', 'Producto 5', 'Marca Generica 1', 'Azul', 'PR-000008', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -36, 431.0300, 0, 500.0000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1763317141933', '2025-11-16 18:19:01', '2026-03-16 15:08:21', NULL),
(9, 'guarenas', 'Producto Chevere 6', 'Marca Generica 1', 'Azul', 'PR-000009', 'Plastico', 'Pepsi', 'Lentes', 'Modelo de prueba', -12, 1724.1400, 1, 2000.0000, 'bolivar', 1, 'Descripcion generica de muestra', '/public/images/product-generic-image.jpg?t=1763317167002', '2025-11-16 18:19:27', '2026-03-16 15:08:21', NULL),
(10, 'guatire', 'Lentes Guatire 1', 'Ray-Ban', 'Negro', 'GT-001', 'Pasta', NULL, 'Lentes de Sol', 'Wayfarer', -2, 150.0000, 1, 174.0000, 'dolar', 1, NULL, NULL, '2026-03-16 15:19:29', '2026-03-16 15:44:10', NULL),
(11, 'guatire', 'Lentes Guatire 2', 'Oakley', 'Azul', 'GT-002', 'Metal', NULL, 'Lentes Deportivos', 'Holbrook', 1, 120.0000, 1, 139.2000, 'dolar', 1, NULL, NULL, '2026-03-16 15:19:29', '2026-04-11 15:46:57', NULL),
(101, 'guarenas', 'Producto Pago A', 'Test', NULL, 'PAG-A', 'Pasta', NULL, 'Monturas', NULL, 28, 86.2100, 1, 100.0000, 'dolar', 1, NULL, NULL, '2026-03-16 17:13:29', '2026-04-11 17:13:30', NULL),
(102, 'guarenas', 'Producto Pago B', 'Test', NULL, 'PAG-B', 'Pasta', NULL, 'Monturas', NULL, 82, 43.1000, 1, 50.0000, 'dolar', 1, NULL, NULL, '2026-03-16 17:13:29', '2026-04-11 17:13:30', NULL);

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
  `valor` decimal(18,8) NOT NULL,
  `rastreo_bcv` tinyint(4) NOT NULL DEFAULT 0,
  `ultimo_tipo_cambio` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tasas`
--

INSERT INTO `tasas` (`id`, `nombre`, `simbolo`, `valor`, `rastreo_bcv`, `ultimo_tipo_cambio`, `created_at`, `updated_at`) VALUES
('bolivar', 'Bolivar', 'bs', 1.00000000, 0, NULL, '2025-09-09 21:56:54', '2025-09-09 21:56:54'),
('dolar', 'Dolar', '$', 100.00000000, 0, 'Automatico con BCV', '2025-06-14 16:18:23', '2025-08-20 02:53:00'),
('euro', 'Euro', '€', 200.00000000, 0, 'Automatico con BCV', '2025-06-14 16:18:23', '2025-08-20 02:53:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasas_historial`
--

CREATE TABLE `tasas_historial` (
  `id` int(11) NOT NULL,
  `tasa_id` varchar(20) NOT NULL,
  `valor_nuevo` decimal(18,8) NOT NULL,
  `usu_cedula` varchar(20) DEFAULT NULL,
  `tipo_cambio` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tasas_historial`
--

INSERT INTO `tasas_historial` (`id`, `tasa_id`, `valor_nuevo`, `usu_cedula`, `tipo_cambio`, `created_at`, `updated_at`) VALUES
(25, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:39:00', '2025-08-20 02:39:00'),
(26, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:39:00', '2025-08-20 02:39:00'),
(27, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:40:00', '2025-08-20 02:40:00'),
(28, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:40:00', '2025-08-20 02:40:00'),
(29, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:41:00', '2025-08-20 02:41:00'),
(30, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:42:00', '2025-08-20 02:42:00'),
(31, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:43:00', '2025-08-20 02:43:00'),
(32, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:44:00', '2025-08-20 02:44:00'),
(33, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:45:00', '2025-08-20 02:45:00'),
(34, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:46:00', '2025-08-20 02:46:00'),
(35, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:47:00', '2025-08-20 02:47:00'),
(36, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:48:00', '2025-08-20 02:48:00'),
(37, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:50:00', '2025-08-20 02:50:00'),
(38, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:51:00', '2025-08-20 02:51:00'),
(39, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:52:00', '2025-08-20 02:52:00'),
(40, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:53:00', '2025-08-20 02:53:00'),
(41, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:53:00', '2025-08-20 02:53:00'),
(42, 'dolar', 138.12830000, NULL, 'Automatico con BCV', '2025-08-20 02:54:00', '2025-08-20 02:54:00'),
(43, 'euro', 161.22200000, NULL, 'Automatico con BCV', '2025-08-20 02:54:00', '2025-08-20 02:54:00');

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
(24, 'asesor-optico', 'asesor-optico-1', '11554570', 'Heriberto Torres', '$2b$10$7KuJRh76glMvnAPw7l.S9ebE2y6lalWWui7R3Znwyjk4pqStyPnOy', 'heriberto@gmail.com', '04241738615', '1996-06-11', NULL, NULL, 1, '2025-07-27 15:19:32', '2025-07-27 15:19:32', NULL),
(25, 'admin', 'administrador', '999999999', 'Test API User', '$2b$10$evWisltZZdEaHIEdGgQqFuRxcUFxQpg3Rn5/zEFzhDAG1K4s/1FkS', 'testapi@example.com', NULL, NULL, NULL, NULL, 1, '2026-03-16 15:11:55', '2026-03-16 15:11:55', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_control` bigint(20) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `tipo_venta` varchar(30) NOT NULL,
  `paciente_key` varchar(70) DEFAULT NULL,
  `cliente_tipo` varchar(20) NOT NULL,
  `cliente_informacion_persona` varchar(100) DEFAULT NULL,
  `cliente_informacion_nombre` varchar(255) DEFAULT NULL,
  `cliente_informacion_cedula` varchar(20) DEFAULT NULL,
  `cliente_informacion_telefono` varchar(20) DEFAULT NULL,
  `cliente_informacion_email` varchar(255) DEFAULT NULL,
  `empresa_rif` varchar(20) DEFAULT NULL,
  `empresa_nombre` varchar(255) DEFAULT NULL,
  `empresa_telefono` varchar(20) DEFAULT NULL,
  `empresa_correo` varchar(200) DEFAULT NULL,
  `empresa_direccion` varchar(255) DEFAULT NULL,
  `moneda` varchar(20) NOT NULL,
  `tasa_moneda` decimal(18,8) DEFAULT NULL,
  `tasas_actuales` text NOT NULL,
  `forma_pago` varchar(255) NOT NULL,
  `iva_porcentaje` decimal(10,4) NOT NULL,
  `descuento` decimal(18,4) NOT NULL,
  `subtotal` decimal(18,4) NOT NULL,
  `iva` decimal(18,4) NOT NULL,
  `total` decimal(18,4) NOT NULL,
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

INSERT INTO `ventas` (`id`, `venta_key`, `numero_control`, `sede`, `tipo_venta`, `paciente_key`, `cliente_tipo`, `cliente_informacion_persona`, `cliente_informacion_nombre`, `cliente_informacion_cedula`, `cliente_informacion_telefono`, `cliente_informacion_email`, `empresa_rif`, `empresa_nombre`, `empresa_telefono`, `empresa_correo`, `empresa_direccion`, `moneda`, `tasa_moneda`, `tasas_actuales`, `forma_pago`, `iva_porcentaje`, `descuento`, `subtotal`, `iva`, `total`, `observaciones`, `fecha`, `pago_completo`, `created_by`, `asesor_id`, `especialista_cedula`, `estatus_venta`, `estatus_pago`, `motivo_cancelacion`, `created_at`, `updated_at`) VALUES
(1, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 37, 'guatire', 'solo_productos', NULL, 'cliente_general', 'natural', 'Cliente Prueba Abono', '30000001', '04120000000', 'prueba.abono@example.com', NULL, NULL, NULL, NULL, NULL, 'dolar', 0.00000000, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'abono', 16.0000, 0.0000, 0.0000, 0.0000, 139.2000, NULL, '2026-04-11 15:01:32', 0, '25409904', 4, NULL, 'pendiente', 'pendiente', NULL, '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(2, '26890c60-b570-4a0b-b668-6c15b9c891b8', 38, 'guatire', 'solo_productos', NULL, 'cliente_general', 'natural', 'Cliente Contado API', '30000002', '04120000001', 'cliente.contado@example.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'contado', 16.0000, 0.0000, 0.0000, 0.0000, 139.2000, NULL, '2026-04-11 15:46:57', 1, '25409904', 4, NULL, 'completada', 'completada', NULL, '2026-04-11 15:46:57', '2026-04-11 15:46:57'),
(3, '79eb5077-cf5f-4e98-9196-e63cb01216c4', 235, 'guarenas', 'solo_productos', NULL, 'cliente_general', 'natural', 'Filtro Uno', '70000001', '04120000001', 'filtro1@test.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'contado', 16.0000, 0.0000, 0.0000, 0.0000, 50.0000, NULL, '2026-04-11 17:13:30', 1, '25409904', 4, NULL, 'completada', 'completada', NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(4, 'e55a0f8c-7e00-4a0a-a9f8-4ff90d3f9de8', 236, 'guarenas', 'solo_productos', NULL, 'cliente_general', 'natural', 'Filtro Dos', '70000002', '04120000002', 'filtro2@test.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'abono', 16.0000, 0.0000, 0.0000, 0.0000, 100.0000, NULL, '2026-04-11 17:13:30', 0, '25409904', 4, NULL, 'pendiente', 'pendiente', NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(5, '56951388-741e-455b-ac4a-41cd6e6c44e4', 237, 'guarenas', 'solo_productos', NULL, 'cliente_general', 'natural', 'Filtro Tres', '70000003', '04120000003', 'filtro3@test.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'de_contado-pendiente', 16.0000, 0.0000, 0.0000, 0.0000, 50.0000, NULL, '2026-04-11 17:13:30', 0, '25409904', 24, NULL, 'completada', 'pendiente', NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(6, '67145e82-4751-4481-9be0-05a34ef4975c', 238, 'guarenas', 'consulta_productos', NULL, 'cliente_paciente', 'natural', 'Filtro Cuatro', '70000004', '04120000004', 'filtro4@test.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'contado', 16.0000, 0.0000, 0.0000, 0.0000, 70.0000, NULL, '2026-04-11 17:13:30', 1, '25409904', 4, '25409904', 'completada', 'completada', NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(7, '026727da-abd9-4646-91cc-32cfa5069f11', 239, 'guarenas', 'consulta_productos', NULL, 'cliente_paciente', 'natural', 'Filtro Cinco', '70000005', '04120000005', 'filtro5@test.com', NULL, NULL, NULL, NULL, NULL, 'dolar', NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', 'abono', 16.0000, 0.0000, 0.0000, 0.0000, 90.0000, NULL, '2026-04-11 17:13:30', 0, '25409904', 24, '25409904', 'pendiente', 'pendiente', NULL, '2026-04-11 17:13:30', '2026-04-11 17:13:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_cashea`
--

CREATE TABLE `ventas_cashea` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `nivel_cashea` varchar(50) NOT NULL,
  `monto_inicial` decimal(18,4) NOT NULL,
  `cantidad_cuotas` int(11) NOT NULL,
  `monto_por_cuota` decimal(18,4) NOT NULL,
  `total_adelantado` decimal(18,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_cashea_cuotas`
--

CREATE TABLE `ventas_cashea_cuotas` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero` int(11) NOT NULL,
  `monto` decimal(18,4) NOT NULL,
  `fecha_vencimiento` varchar(50) NOT NULL,
  `pagada` tinyint(4) NOT NULL,
  `seleccionada` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_consultas`
--

CREATE TABLE `ventas_consultas` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `historia_id` int(11) NOT NULL,
  `pago_medico` decimal(18,4) NOT NULL,
  `pago_optica` decimal(18,4) NOT NULL,
  `es_formula_externa` tinyint(1) NOT NULL,
  `tipo_especialista` varchar(100) NOT NULL,
  `monto_original` decimal(18,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `ventas_consultas`
--

INSERT INTO `ventas_consultas` (`id`, `venta_key`, `historia_id`, `pago_medico`, `pago_optica`, `es_formula_externa`, `tipo_especialista`, `monto_original`) VALUES
(1, '67145e82-4751-4481-9be0-05a34ef4975c', 3, 20.0000, 0.0000, 0, 'Oftalmólogo', 20.0000),
(2, '026727da-abd9-4646-91cc-32cfa5069f11', 2, 30.0000, 10.0000, 0, 'Oftalmólogo', 40.0000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos`
--

CREATE TABLE `ventas_pagos` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_pago` int(11) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `monto` decimal(18,4) NOT NULL,
  `moneda_id` varchar(20) NOT NULL,
  `monto_moneda_base` decimal(18,4) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `bancoCodigo` varchar(4) DEFAULT NULL,
  `bancoNombre` varchar(255) DEFAULT NULL,
  `bancoReceptorCodigo` varchar(4) DEFAULT NULL,
  `bancoReceptorNombre` varchar(255) DEFAULT NULL,
  `bancoReceptor` varchar(255) DEFAULT NULL,
  `notaPago` text DEFAULT NULL,
  `created_by` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_pagos`
--

INSERT INTO `ventas_pagos` (`id`, `venta_key`, `numero_pago`, `tipo`, `monto`, `moneda_id`, `monto_moneda_base`, `referencia`, `bancoCodigo`, `bancoNombre`, `bancoReceptorCodigo`, `bancoReceptorNombre`, `bancoReceptor`, `notaPago`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 1, 'efectivo', 20.0000, 'dolar', 20.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(2, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 2, 'pagomovil', 19995.9707, 'bolivar', 42.0100, '1212121', '0134', 'Banesco', '0104', 'Venezolano de Crédito', '0104 - Venezolano de Crédito', 'pago cuenta de jeffe', '25409904', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(3, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 2, 'efectivo', 50.1000, 'euro', 57.9900, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(4, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 3, 'pagomovil', 500.0000, 'bolivar', 5.0000, 'abc123', '0134', 'Banesco', '0104', 'Venezolano de Crédito', '0104 - Venezolano de Crédito', 'test salida', '25409904', '2026-04-11 15:33:01', '2026-04-11 15:33:01'),
(5, '26890c60-b570-4a0b-b668-6c15b9c891b8', 1, 'efectivo', 139.2000, 'dolar', 139.2000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 15:46:57', '2026-04-11 15:46:57'),
(6, '79eb5077-cf5f-4e98-9196-e63cb01216c4', 1, 'efectivo', 50.0000, 'dolar', 50.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(7, 'e55a0f8c-7e00-4a0a-a9f8-4ff90d3f9de8', 1, 'efectivo', 30.0000, 'dolar', 30.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(8, '56951388-741e-455b-ac4a-41cd6e6c44e4', 1, 'efectivo', 20.0000, 'dolar', 20.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(9, '67145e82-4751-4481-9be0-05a34ef4975c', 1, 'efectivo', 70.0000, 'dolar', 70.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(10, '026727da-abd9-4646-91cc-32cfa5069f11', 1, 'efectivo', 25.0000, 'dolar', 25.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos_agrupados`
--

CREATE TABLE `ventas_pagos_agrupados` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `numero_pago` int(11) NOT NULL,
  `monto_abonado` decimal(18,4) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `tasas_actuales` text NOT NULL,
  `created_by` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_pagos_agrupados`
--

INSERT INTO `ventas_pagos_agrupados` (`id`, `venta_key`, `numero_pago`, `monto_abonado`, `observaciones`, `tasas_actuales`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 1, 20.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(2, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 2, 100.0000, '', '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 15:01:32', '2026-04-11 15:01:32'),
(3, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 3, 10.0000, 'test salida montoEnMonedaVenta', '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 15:33:01', '2026-04-11 15:33:01'),
(4, '26890c60-b570-4a0b-b668-6c15b9c891b8', 1, 139.2000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 15:46:57', '2026-04-11 15:46:57'),
(5, '79eb5077-cf5f-4e98-9196-e63cb01216c4', 1, 50.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(6, 'e55a0f8c-7e00-4a0a-a9f8-4ff90d3f9de8', 1, 30.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(7, '56951388-741e-455b-ac4a-41cd6e6c44e4', 1, 20.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(8, '67145e82-4751-4481-9be0-05a34ef4975c', 1, 70.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30'),
(9, '026727da-abd9-4646-91cc-32cfa5069f11', 1, 25.0000, NULL, '[{\"id\":\"dolar\",\"valor\":100},{\"id\":\"euro\",\"valor\":200}]', '25409904', '2026-04-11 17:13:30', '2026-04-11 17:13:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_productos`
--

CREATE TABLE `ventas_productos` (
  `id` bigint(20) NOT NULL,
  `venta_key` varchar(100) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `precio_unitario_sin_iva` decimal(18,4) NOT NULL,
  `tiene_iva` tinyint(4) NOT NULL,
  `precio_unitario` decimal(18,4) NOT NULL,
  `total` decimal(18,4) NOT NULL,
  `moneda_producto` varchar(20) NOT NULL,
  `tasa_moneda_producto` decimal(18,8) NOT NULL,
  `total_moneda_producto` decimal(18,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_productos`
--

INSERT INTO `ventas_productos` (`id`, `venta_key`, `producto_id`, `cantidad`, `tipo`, `descripcion`, `precio_unitario_sin_iva`, `tiene_iva`, `precio_unitario`, `total`, `moneda_producto`, `tasa_moneda_producto`, `total_moneda_producto`) VALUES
(1, 'e2b7697e-7c84-4dfe-8fee-db8a8022b3fd', 11, 1, 'PRODUCTO', 'Prueba flujo abono', 120.0000, 1, 139.2000, 139.2000, 'dolar', 100.00000000, 139.2000),
(2, '26890c60-b570-4a0b-b668-6c15b9c891b8', 11, 1, 'PRODUCTO', 'Venta contado de prueba', 120.0000, 1, 139.2000, 139.2000, 'dolar', 100.00000000, 139.2000),
(3, '79eb5077-cf5f-4e98-9196-e63cb01216c4', 102, 1, 'PRODUCTO', 'test filtros 1', 43.1000, 1, 50.0000, 50.0000, 'dolar', 100.00000000, 50.0000),
(4, 'e55a0f8c-7e00-4a0a-a9f8-4ff90d3f9de8', 101, 1, 'PRODUCTO', 'test filtros 2', 86.2100, 1, 100.0000, 100.0000, 'dolar', 100.00000000, 100.0000),
(5, '56951388-741e-455b-ac4a-41cd6e6c44e4', 102, 1, 'PRODUCTO', 'test filtros 3', 43.1000, 1, 50.0000, 50.0000, 'dolar', 100.00000000, 50.0000),
(6, '67145e82-4751-4481-9be0-05a34ef4975c', 102, 1, 'PRODUCTO', 'test filtros 4', 43.1000, 1, 50.0000, 50.0000, 'dolar', 100.00000000, 50.0000),
(7, '026727da-abd9-4646-91cc-32cfa5069f11', 102, 1, 'PRODUCTO', 'test filtros 5', 43.1000, 1, 50.0000, 50.0000, 'dolar', 100.00000000, 50.0000);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bancos_receptores_config`
--
ALTER TABLE `bancos_receptores_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_bancos_receptores_config_sede_codigo` (`sede`,`codigo`),
  ADD KEY `idx_bancos_receptores_config_sede` (`sede`);

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
-- Indices de la tabla `empresas`
--
ALTER TABLE `empresas`
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
-- Indices de la tabla `metodos_pago_config`
--
ALTER TABLE `metodos_pago_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_metodos_pago_config_sede_key` (`sede`,`metodo_key`),
  ADD KEY `idx_metodos_pago_config_sede` (`sede`);

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
  ADD KEY `empresa_rif` (`empresa_rif`);

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
-- Indices de la tabla `ventas_consultas`
--
ALTER TABLE `ventas_consultas`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT de la tabla `bancos_receptores_config`
--
ALTER TABLE `bancos_receptores_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `historiales_medicos`
--
ALTER TABLE `historiales_medicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `historial_rastreo_bcv`
--
ALTER TABLE `historial_rastreo_bcv`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `logins`
--
ALTER TABLE `logins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT de la tabla `metodos_pago_config`
--
ALTER TABLE `metodos_pago_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT de la tabla `tasas_historial`
--
ALTER TABLE `tasas_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
-- AUTO_INCREMENT de la tabla `ventas_consultas`
--
ALTER TABLE `ventas_consultas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos_agrupados`
--
ALTER TABLE `ventas_pagos_agrupados`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `ventas_productos`
--
ALTER TABLE `ventas_productos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
