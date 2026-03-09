---
applyTo: '**'
---
# Configuración Global del Proyecto

## Base de Datos y Entorno

- **SIEMPRE** usar MySQL a través de phpMyAdmin
- Todos los proyectos deben ser 100% compatibles con BlueHost
- Usar PHP versión 7.4+ (compatible con BlueHost estándar)

## Gestión de Datos y Configuración

- **NUNCA** hardcodear credenciales, URLs, o datos sensibles en el código
- **SIEMPRE** usar archivos de configuración separados (config.php) fuera del directorio público
- Todas las conexiones a BD deben usar variables de entorno o archivos config
- Las APIs externas deben configurarse mediante variables de entorno
- Usar constantes PHP para rutas y configuraciones del sistema

## Conexión a Base de Datos

```php
// Ejemplo de estructura (NUNCA hardcodear estos valores)
// Usar config.php separado con:
define('DB_HOST', getenv('DB_HOST'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('DB_NAME', getenv('DB_NAME'));

```

## Manejo Consistente de Tipos de ID (Local vs Producción)

### Problema Común

En aplicaciones web, los IDs pueden ser números en desarrollo local pero strings en producción debido a diferencias en la base de datos o API.

### Regla Obligatoria

**SIEMPRE** usar comparaciones de ID normalizadas para evitar inconsistencias entre entornos:

```typescript
// ❌ INCORRECTO - Falla en producción si los tipos difieren
if (task.ID === selectedId) { ... }
if (project.id === taskProjectId) { ... }

// ✅ CORRECTO - Funciona en ambos entornos
if (parseInt(String(task.ID)) === parseInt(String(selectedId))) { ... }
if (parseInt(String(project.id)) === parseInt(String(taskProjectId))) { ... }
```

### Casos de Aplicación

- Comparaciones de IDs en filtros
- Búsqueda de elementos en arrays
- Operaciones de drag & drop
- Actualizaciones de estado
- Cualquier comparación entre IDs de diferentes fuentes

### Patrón Recomendado

```typescript
const normalizeId = (id: any): number => parseInt(String(id));

// Uso en comparaciones
if (normalizeId(task.ID) === normalizeId(selectedId)) { ... }

// Uso en búsquedas
const task = tasks.find(t => normalizeId(t.ID) === normalizeId(targetId));
```

### Recordatorio

Esta regla debe aplicarse **automáticamente** en cualquier código que maneje IDs, especialmente en:

- Componentes React que manejan listas
- Funciones de filtrado y búsqueda
- Operaciones CRUD
- Comparaciones de entidades relacionadas

## Para verfiicar errores en react usar:

- npx tsc --noEmit --skipLibCheck

## Para verfiicar errores en php usar:

- php -l <nombr_del_archivo>

## Acceder a Mysql desde terminal

   Puedes acceder a la base datos local y segura con el siguiente comando
    Ejemplo:
C:\xampp\mysql\bin\mysql.exe -u portalao_jholguin -h localhost -pjofCTV321!* portalao_ReunionesCS -e "Select * from tareas"
