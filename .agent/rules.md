# Reglas del Proyecto

## Stack Tecnológico
- **Lenguaje**: JavaScript (CommonJS)
- **Backend Framework**: Node.js con Express
- **ORM**: Sequelize (con MySQL)
- **Base de Datos**: MySQL

## Arquitectura
- **Patrón**: MVC + Capa de Servicios.
  - **Controllers** (`src/controllers`): Manejan la petición HTTP y envían la respuesta. No deben contener lógica de negocio compleja.
  - **Services** (`src/services`): Contienen la lógica de negocio. Son invocados por los controladores.
  - **Models** (`src/models`): Definiciones de Sequelize.
  - **Routes** (`src/routes`): Definición de rutas.
- **Middleware**: Autenticación (`authMiddleware`, `noAuthMiddleware`) y manejo de errores (`CatchGeneric`).

## Convenciones de Nombres
- **Archivos**:
  - Models, Controllers, Services, Utils: PascalCase (ej. `VentaController.js`, `VentaService.js`, `Cliente.js`).
  - Algunos archivos legacy pueden estar en camelCase, pero preferir PascalCase para nuevos archivos.
- **Variables y Base de Datos**:
  - Preferencia por `snake_case` para nombres de columnas, claves de objetos que mapean a la BD y variables locales relacionadas (ej. `venta_key`, `sede_id`, `created_at`).
  - `camelCase` para variables de lógica general JS.

## Estándares de Código
- **Indentación**: 4 espacios.
- **Transacciones**: Usar transacciones de Sequelize (`t`) para operaciones que involucren múltiples escrituras en base de datos.
- **Manejo de Errores**:
  - Lanzar excepciones como objetos con propiedad message: `throw { message: 'Error...' }`.
  - Usar `CatchGeneric` en las rutas para capturar errores de los controladores.

## Estructura de Endpoints
- **Respuestas**:
  - Éxito: `{ message: 'ok', data: ... }`
  - Errores: `{ message: 'Descripción del error' }` (manejado por middleware).
