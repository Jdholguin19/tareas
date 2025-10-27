# 📋 Task Manager - Minimalist Task Manager

Una aplicación web full-stack para gestión de tareas personales y de equipo, con interfaz moderna y funcionalidades avanzadas como subtareas, asignación de usuarios, búsqueda inteligente y gestión de proyectos.

## 🚀 Stack Tecnológico

### Frontend
- **React 19** + TypeScript
- **Vite** (build tool con esbuild)
- **Tailwind CSS** (estilos)
- **React Hooks** (useState, useEffect, useMemo)

### Backend
- **PHP 8.2** + PDO
- **MySQL** (base de datos)
- **Sesiones PHP** (autenticación)

### Características Técnicas
- **Arquitectura**: API REST con separación backend/frontend
- **Autenticación**: Sesiones PHP tradicionales con cookies
- **CORS**: Configurado para desarrollo y producción
- **Responsive**: Mobile-first design

## 📁 Estructura del Proyecto

```
tareas/
├── api/                    # Backend PHP (API REST)
│   ├── config.php         # Configuración base de datos y CORS
│   ├── checkAuth.php      # Verificación de autenticación
│   ├── login.php          # Inicio de sesión
│   ├── logout.php         # Cierre de sesión
│   ├── getTasks.php       # Obtener tareas
│   ├── createQuickTask.php # Crear tarea rápida
│   ├── updateTask.php     # Actualizar tarea
│   ├── deleteTask.php     # Eliminar tarea
│   └── ...                # Otros endpoints
├── components/            # Componentes React
│   ├── TaskItem.tsx       # Item individual de tarea
│   ├── TaskList.tsx       # Lista de tareas
│   ├── CreateQuickTask.tsx # Creación rápida
│   ├── EditTaskModal.tsx  # Modal de edición
│   └── ...
├── services/              # Servicios frontend
│   └── apiService.ts      # Funciones API
├── types.ts               # Interfaces TypeScript
├── utils/                 # Utilidades
├── App.tsx                # Componente principal
├── index.tsx              # Punto de entrada React
└── index.html             # HTML base
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- **Node.js** 18+ y **npm**
- **PHP** 8.2+ con extensión PDO
- **MySQL** 5.7+ o **MariaDB**
- **Servidor web** (Apache/Nginx) o PHP built-in server

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jdholguin19/tareas.git
cd tareas
```

### 2. Instalar dependencias frontend
```bash
npm install
```

### 3. Configurar base de datos
```sql
-- Ejecutar el archivo meetings.sql incluido en el proyecto
-- O crear la base de datos manualmente con las tablas necesarias
```

### 4. Variables de entorno
Crear archivo `.env` en la raíz del proyecto backend:

```env
# Base de datos
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=nombre_base_datos
DB_TIMEZONE=-05:00

# OpenAI (opcional para transcripción de audio)
OPENAI_API_KEY=tu_clave_api
```

### 5. Configuración PHP
Asegurarse de que PHP tenga las extensiones necesarias:
- `pdo_mysql`
- `session`
- `json`

## 🚀 Ejecución del Proyecto

### Desarrollo
```bash
# Terminal 1: Backend PHP
php -S localhost:8000 -t .

# Terminal 2: Frontend React
npm run dev
```

### Producción
```bash
# Build del frontend
npm run build

# El backend se sirve desde el directorio api/
# Configurar servidor web para apuntar a la carpeta api/
```

## 📋 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo Vite
npm run build        # Construye para producción
npm run preview      # Vista previa del build

# PHP (desde directorio api/)
php -S localhost:8000  # Servidor de desarrollo PHP
```

## 🔗 Endpoints de API

### Autenticación
- `POST /api/login.php` - Inicio de sesión
- `POST /api/logout.php` - Cierre de sesión
- `GET /api/checkAuth.php` - Verificar sesión activa
- `POST /api/register.php` - Registro de usuario

### Tareas
- `GET /api/getTasks.php` - Obtener todas las tareas
- `POST /api/createQuickTask.php` - Crear tarea rápida
- `PUT /api/updateTask.php?id={id}` - Actualizar tarea
- `DELETE /api/deleteTask.php?id={id}` - Eliminar tarea
- `POST /api/createSubTask.php` - Crear subtarea

### Proyectos
- `GET /api/getProjects.php` - Obtener proyectos
- `POST /api/createProject.php` - Crear proyecto

### Usuarios
- `GET /api/searchUsers.php?q={query}` - Buscar usuarios
- `POST /api/assignUserToTask.php` - Asignar usuario a tarea
- `POST /api/unassignUserFromTask.php` - Desasignar usuario

### Archivos
- `POST /api/uploadFile.php` - Subir archivo
- `POST /api/transcribeAudio.php` - Transcribir audio (requiere OpenAI)

## 🔄 Flujo de Desarrollo

### Convenciones del Proyecto
- **TypeScript estricto**: Sin uso de `any` o `unknown`
- **Separación backend/frontend**: Repositorios independientes recomendados
- **Autenticación**: Siempre usar sesiones PHP, nunca JWT
- **Consistencia de tipos**: Normalizar IDs con `parseInt(String(value))`
- **Documentación**: JSDoc en funciones complejas
- **useRef para flags**: Usar `useRef` en lugar de `useState` cuando se necesitan valores inmediatos
- **Eventos de mouse**: Preferir `onMouseDown` sobre `onClick` para prevenir conflictos con blur
- **Validación de filtros**: Siempre verificar tanto texto como ID de proyecto: `(searchFilter || selectedProjectId !== null)`

### Estados de Tareas
- `completed`: Tarea finalizada (100% progreso)
- `in_progress`: En progreso (0-99%)
- `pending`: Pendiente (0%)
- `overdue`: Vencida (fecha límite pasada)
- `proximate`: Próxima a vencer (próximos días)

### Gestión de Progreso
- Las tareas padre calculan automáticamente su progreso basado en subtareas
- Progreso manual para tareas sin subtareas
- Estados visuales diferenciados por colores

## 🎨 Características de la Interfaz

### Diseño
- **Mobile-first**: Optimizado para dispositivos móviles
- **Responsive**: Adaptable a todas las pantallas
- **Accesibilidad**: Cumple WCAG AA
- **Tema**: Colores consistentes con estados de tareas

### Funcionalidades
- ✅ Creación rápida de tareas
- ✅ Subtareas con progreso automático
- ✅ Asignación de usuarios
- ✅ Gestión de proyectos
- ✅ **Búsqueda inteligente con dropdown** (tareas y proyectos)
- ✅ **Filtros avanzados** por texto, usuario y proyecto
- ✅ **Auto-sugerencias en tiempo real** al escribir en buscador
- ✅ Estados visuales diferenciados
- ✅ Transcripción de audio (OpenAI)
- ✅ Subida de archivos
- ✅ Notificaciones de tareas vencidas
- ✅ Exportación a CSV
- ✅ **Micrófono responsive** (móvil/desktop)

### Sistema de Búsqueda y Filtrado
El sistema de búsqueda incluye:
- **Dropdown con sugerencias**: Muestra tareas y proyectos que coinciden mientras escribes
- **Filtrado por texto**: Busca en títulos de tareas y nombres de proyectos
- **Filtrado por proyecto**: Selecciona un proyecto para ver solo sus tareas
- **Filtrado combinado**: Busca texto dentro de un proyecto específico
- **Prevención de conflictos**: Usa `useRef` para evitar race conditions entre blur y selección
- **eventos `onMouseDown`**: Previene que el blur interfiera con la selección del dropdown

### Optimizaciones Implementadas
- ✅ **Eliminación de llamadas API duplicadas**: AbortController y control de dependencias
- ✅ **useRef para flags temporales**: Evita retrasos en actualizaciones de estado
- ✅ **Promise.allSettled**: Carga paralela de datos (tareas, proyectos, usuario)
- ✅ **useMemo**: Caching de listas filtradas y cálculos costosos
- ✅ **Prop drilling optimizado**: taskAssigneesRecord como prop en lugar de llamadas individuales

## 🐛 Problemas Conocidos y Soluciones

### 1. IDs inconsistentes entre entornos
**Problema**: Local usa números, producción usa strings
**Solución**: Normalizar con `parseInt(String(value))` en comparaciones

### 2. CORS en desarrollo
**Solución**: Configurado dinámicamente en `config.php`

### 3. Sesiones PHP en hosting compartido
**Solución**: Usar configuración estándar de sesiones

### 4. Conflictos en búsqueda con dropdown
**Problema**: El evento `onBlur` del input se dispara antes del `onClick` del dropdown
**Solución**: 
- Usar `onMouseDown` con `preventDefault()` en lugar de `onClick`
- Implementar flag con `useRef` en lugar de `useState` para evitar delays
- Verificar `(searchFilter || selectedProjectId !== null)` para aplicar filtros

### 5. Filtrado por proyecto no funcionaba
**Problema**: La condición `if (searchFilter && ...)` evaluaba a false cuando `searchFilter` estaba vacío
**Solución**: Cambiar a `if ((searchFilter || selectedProjectId !== null) && ...)`

## 🔍 Decisiones Técnicas Importantes

### Búsqueda y Filtrado
- **Separación de concerns**: `appliedSearchFilter` para texto, `selectedProjectId` para proyectos
- **Estado inmediato con useRef**: Flag `justSelectedFromDropdownRef` para prevenir race conditions
- **onMouseDown vs onClick**: onMouseDown se dispara antes del blur, previniendo conflictos
- **Validación doble**: Verificar tanto texto como ID de proyecto en filtros

### Permisos de Subtareas
- **Usuario creador**: Puede ver subtareas aunque otro usuario las asigne
- **Usuario asignado**: Puede ver subtareas que le asignen
- **Verificación en backend**: `createSubTask.php` valida permisos antes de crear

### Autenticación
- **Sesiones PHP**: Tradicionales con cookies, no JWT
- **Verificación por endpoint**: `checkAuth.php` llamado al cargar la app
- **Estado tristate**: `null` (cargando), `false` (no autenticado), `true` (autenticado)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👥 Autor

**Jdholguin19** - Desarrollo full-stack

---

*Última actualización: Octubre 2025*

## 📊 Changelog Reciente

### Versión 1.5.0 (Octubre 2025)
- ✨ **Sistema de búsqueda mejorado** con dropdown de sugerencias
- 🔍 **Filtrado avanzado** por texto y proyectos con validación doble
- 🐛 **Fix**: Conflictos entre blur y selección de dropdown (onMouseDown + useRef)
- 🐛 **Fix**: Filtrado por proyecto ahora funciona correctamente
- ⚡ **Optimización**: Eliminadas llamadas API duplicadas
- ⚡ **Optimización**: Prop drilling para taskAssigneesRecord
- 📱 **UX**: Micrófono responsive (móvil/desktop)
- 🔐 **Permisos**: Usuario creador puede ver subtareas asignadas por otros
- 📤 **Export**: Funcionalidad de exportación a CSV
