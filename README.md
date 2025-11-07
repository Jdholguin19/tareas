# 📋 Planics - Sistema de Gestión de Tareas

Una aplicación web full-stack para gestión de tareas personales y de equipo, con interfaz moderna y funcionalidades avanzadas como subtareas, asignación de usuarios, búsqueda inteligente, gestión de proyectos, vistas múltiples (Lista, Kanban, Gantt, Matriz de Eisenhower) y filtrado por tipos de tarea.

## 🚀 Stack Tecnológico

### Frontend
- **React 19** + TypeScript
- **Vite 6.3.7** (build tool optimizado)
- **Tailwind CSS** (estilos utility-first)
- **React Hooks** (useState, useEffect, useMemo, useCallback, useRef)

### Backend
- **PHP 8.2+** con PDO
- **MySQL** (base de datos relacional)
- **Sesiones PHP** (48 horas de duración)
- **Output buffering** para respuestas JSON limpias

### Características Técnicas
- **Arquitectura**: API REST con separación completa backend/frontend
- **Autenticación**: Sesiones PHP con auto-expiración y verificación por endpoint
- **CORS**: Configurado dinámicamente para desarrollo y producción
- **Responsive**: Mobile-first design con breakpoints optimizados
- **Compatibilidad**: 100% compatible con BlueHost y hosting compartido
- **Normalización de tipos**: Sistema robusto para manejar IDs (string/number) entre entornos

## 📁 Estructura del Proyecto

```
tareas/
├── api/                         # Backend PHP (API REST)
│   ├── config.php              # Configuración BD, CORS y constantes
│   ├── checkAuth.php           # Verificación de autenticación
│   ├── login.php               # Inicio de sesión
│   ├── logout.php              # Cierre de sesión
│   ├── register.php            # Registro de nuevos usuarios
│   ├── getTasks.php            # Obtener tareas del usuario
│   ├── getTaskTypes.php        # Obtener tipos de tarea (tareas, obras, notas)
│   ├── createQuickTask.php     # Crear tarea rápida
│   ├── updateTask.php          # Actualizar tarea (con Tipos_Tareas_ID)
│   ├── deleteTask.php          # Eliminar tarea
│   ├── createSubTask.php       # Crear subtarea (hereda proyecto_id)
│   ├── toggleImportant.php     # Toggle importancia (Eisenhower)
│   ├── getProjects.php         # Obtener proyectos del usuario
│   ├── createProject.php       # Crear nuevo proyecto
│   ├── searchUsers.php         # Buscar usuarios para asignación
│   ├── assignUserToTask.php    # Asignar usuario a tarea
│   ├── unassignUserFromTask.php # Desasignar usuario
│   ├── getAllTaskAssignees.php # Obtener todos los asignados
│   ├── getDependencies.php     # Obtener dependencias de tareas
│   ├── createDependency.php    # Crear dependencia
│   ├── deleteDependency.php    # Eliminar dependencia
│   └── uploadFile.php          # Subida de archivos
├── components/                  # Componentes React
│   ├── CreateQuickTask.tsx     # Creación rápida de tareas
│   ├── EditTaskModal.tsx       # Modal de edición (no cierra al guardar proyecto)
│   ├── TaskItem.tsx            # Item individual de tarea
│   ├── TaskList.tsx            # Lista de tareas
│   ├── KanbanBoard.tsx         # Vista Kanban (drag & drop)
│   ├── GanttChart.tsx          # Vista Gantt (timeline)
│   ├── EisenhowerMatrix.tsx    # Matriz de Eisenhower (4 cuadrantes)
│   ├── Icon.tsx                # Sistema de iconos SVG
│   ├── LoginForm.tsx           # Formulario de login
│   ├── RegisterForm.tsx        # Formulario de registro
│   ├── TaskSkeleton.tsx        # Skeleton loader
│   └── DeleteConfirmationModal.tsx # Modal de confirmación
├── services/                    # Servicios frontend
│   └── apiService.ts           # Funciones API con fetchWithSessionCheck
├── utils/                       # Utilidades
│   ├── taskUtils.ts            # Cálculos de progreso y subtareas
│   └── sessionUtils.ts         # Manejo de sesiones expiradas
├── types.ts                     # Interfaces TypeScript (Task, Project, TaskType, etc.)
├── constants.ts                 # Constantes de la aplicación
├── App.tsx                      # Componente principal (estado global)
├── index.tsx                    # Punto de entrada React
├── index.html                   # HTML base
├── vite.config.ts               # Configuración Vite
├── tsconfig.json                # Configuración TypeScript
└── package.json                 # Dependencias y scripts
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
- `GET /api/getCurrentUser.php` - Obtener datos del usuario actual

### Tareas
- `GET /api/getTasks.php` - Obtener todas las tareas (filtra por usuario automáticamente)
- `GET /api/getTaskTypes.php` - Obtener tipos de tarea (tareas, obras, notas)
- `POST /api/createQuickTask.php` - Crear tarea rápida (retorna con Tipos_Tareas_ID)
- `PUT /api/updateTask.php?id={id}` - Actualizar tarea (retorna Tipos_Tareas_ID actualizado)
- `DELETE /api/deleteTask.php?id={id}` - Eliminar tarea
- `POST /api/createSubTask.php` - Crear subtarea (hereda proyecto_id y tipos_tareas_id del padre)
- `POST /api/toggleImportant.php` - Toggle campo `importancia` (alta/baja para Eisenhower)

### Proyectos
- `GET /api/getProjects.php` - Obtener proyectos del usuario
- `POST /api/createProject.php` - Crear proyecto nuevo

### Usuarios y Asignaciones
- `GET /api/searchUsers.php?q={query}` - Buscar usuarios (mínimo 1 caracter)
- `POST /api/assignUserToTask.php` - Asignar usuario a tarea
- `POST /api/unassignUserFromTask.php` - Desasignar usuario de tarea
- `POST /api/getAllTaskAssignees.php` - Obtener todos los usuarios asignados a múltiples tareas
- `GET /api/getTaskAssignees.php?taskId={id}` - Obtener asignados de una tarea específica

### Dependencias (para Gantt)
- `GET /api/getDependencies.php` - Obtener dependencias de tareas
- `POST /api/createDependency.php` - Crear dependencia entre tareas
- `DELETE /api/deleteDependency.php?id={id}` - Eliminar dependencia

### Archivos
- `POST /api/uploadFile.php` - Subir archivo adjunto
- `POST /api/transcribeAudio.php` - Transcribir audio (requiere OpenAI API Key)

## 🔄 Flujo de Desarrollo

### Convenciones del Proyecto
- **TypeScript estricto**: Sin uso de `any` (usar tipos específicos siempre)
- **Consistencia de tipos entre entornos**: SIEMPRE normalizar IDs con `parseInt(String(value))` en comparaciones
- **No hardcodear datos**: Usar archivos de configuración separados (config.php) fuera del código
- **Documentación**: JSDoc en funciones complejas
- **useRef para flags inmediatos**: Usar `useRef` cuando se necesitan valores sin re-render
- **Eventos de mouse**: Preferir `onMouseDown` sobre `onClick` para prevenir conflictos con blur
- **Validación de filtros**: Verificar `(searchFilter || selectedProjectId !== null)` para aplicar filtros
- **Output buffering en PHP**: Usar `ob_start()` y `ob_end_clean()` antes de JSON para respuestas limpias
- **Dependencias de useMemo**: SIEMPRE incluir `selectedTaskTypes` en arrays de dependencias de filtros

### Regla Crítica: Normalización de IDs
**SIEMPRE** usar esta normalización para evitar inconsistencias entre local (numbers) y producción (strings):

```typescript
// ❌ INCORRECTO - Falla en producción
if (task.ID === selectedId) { ... }

// ✅ CORRECTO - Funciona en todos los entornos
if (parseInt(String(task.ID)) === parseInt(String(selectedId))) { ... }

// Patrón recomendado
const normalizeId = (id: any): number => parseInt(String(id));
if (normalizeId(task.ID) === normalizeId(selectedId)) { ... }
```

### Estados de Tareas (Enum)
- `pending`: Pendiente (0% progreso)
- `in_progress`: En progreso (1-99%)
- `completed`: Tarea finalizada (100% progreso)

### Clasificación Visual de Tareas
- **Urgentes**: Vencidas o sin fecha de vencimiento
- **Importantes**: Vencen hoy
- **Programadas**: Vencen en el futuro
- **Completadas**: 100% de progreso

### Tipos de Tarea (Database-driven)
- **ID 1 - Tareas**: Tareas normales (color: #3498db - azul)
- **ID 2 - Obras**: Proyectos de construcción (color: #e67e22 - naranja)
- **ID 3 - Notas**: Notas y recordatorios (color: #f39c12 - amarillo)

*Cargados dinámicamente desde tabla `tipos_tareas`*

### Matriz de Eisenhower (Prioridad vs Importancia)
- **Prioridad** (eje X): `alta`, `media`, `baja` (urgencia)
- **Importancia** (eje Y): `alta`, `baja` (impacto)
- **Cuadrantes**:
  - Urgente + Importante → Hacer primero
  - No urgente + Importante → Planificar
  - Urgente + No importante → Delegar
  - No urgente + No importante → Eliminar

### Gestión de Progreso
- **Tareas padre**: Calculan automáticamente progreso basado en subtareas
- **Tareas sin subtareas**: Progreso manual (0-100%)
- **Estados visuales**: Diferenciados por colores y badges

## 🎨 Características de la Interfaz

### Diseño
- **Mobile-first**: Optimizado para dispositivos móviles
- **Responsive**: Breakpoints adaptables (sm, md, lg, xl)
- **Accesibilidad**: ARIA labels, roles semánticos, navegación por teclado
- **Tema**: Colores consistentes con estados de tareas y tipos

### Vistas Disponibles
1. **Vista Lista** (por defecto)
   - Secciones colapsables: Urgentes, Importantes, Programadas, Completadas
   - Contadores en tiempo real
   - Drag & drop entre secciones

2. **Vista Kanban**
   - Columnas por estado (Pendiente, En Progreso, Completada)
   - Drag & drop entre columnas
   - Actualización en tiempo real

3. **Vista Gantt**
   - Timeline visual de tareas
   - Gestión de dependencias (fin-inicio, inicio-inicio, fin-fin)
   - Edición inline de fechas

4. **Matriz de Eisenhower**
   - 4 cuadrantes (Prioridad × Importancia)
   - Drag & drop entre cuadrantes
   - Actualización automática del eje correspondiente

### Funcionalidades Principales
- ✅ **Creación rápida de tareas** con micrófono
- ✅ **Subtareas jerárquicas** con herencia de proyecto
- ✅ **Asignación múltiple** de usuarios
- ✅ **Gestión de proyectos** (crear, asignar, quitar)
- ✅ **Filtrado por tipos de tarea** (tareas, obras, notas) con checkboxes dinámicos
- ✅ **Búsqueda inteligente** con dropdown (tareas y proyectos)
- ✅ **Notificaciones** de tareas vencidas con dropdown
- ✅ **Exportación a CSV** de todas las tareas
- ✅ **Recarga manual** de datos sin refrescar página
- ✅ **Transcripción de audio** (OpenAI Whisper)
- ✅ **Subida de archivos** adjuntos
- ✅ **Estados visuales** diferenciados por colores
- ✅ **Progreso automático** en tareas padre
- ✅ **Modal de edición persistente** (no cierra al asignar proyecto)

### Sistema de Búsqueda y Filtrado
- **Dropdown con sugerencias**: Tareas y proyectos en tiempo real
- **Filtrado por texto**: Busca en títulos de tareas y nombres de proyectos
- **Filtrado por proyecto**: Selecciona un proyecto para ver solo sus tareas
- **Filtrado por tipo**: Checkboxes para tareas, obras, notas (default: solo tareas)
- **Filtrado combinado**: Texto + proyecto + tipo simultáneamente
- **Prevención de conflictos**: `useRef` + `onMouseDown` para evitar race conditions

### Optimizaciones Implementadas
- ✅ **useMemo** para listas filtradas (evita recálculos innecesarios)
- ✅ **useCallback** para funciones que se pasan como props
- ✅ **Promise.allSettled** para carga paralela de datos
- ✅ **Prop drilling optimizado**: `taskAssigneesRecord` precargado
- ✅ **AbortController** para prevenir memory leaks
- ✅ **Skeleton loaders** durante carga de datos
- ✅ **Debouncing** en búsquedas (300ms)
- ✅ **Output buffering** en PHP para JSON limpio
- ✅ **fetchWithSessionCheck** wrapper para manejo unificado de sesiones

## 🐛 Problemas Resueltos y Soluciones

### 1. IDs inconsistentes entre entornos (Local vs Producción)
**Problema**: Local retorna números, producción retorna strings desde MySQL
**Solución**: Normalización universal con `parseInt(String(value))` en todas las comparaciones
```typescript
const normalizeId = (id: any): number => parseInt(String(id));
if (normalizeId(task.ID) === normalizeId(selectedId)) { ... }
```

### 2. Filtro por tipo de tarea no aplicaba por defecto
**Problema**: Default filter (solo "tareas") no se aplicaba en producción
**Solución**: Múltiples safeguards:
- Estado inicial: `selectedTaskTypes: [1]`
- Validación en `fetchTaskTypes()`
- `useEffect` fallback para asegurar `[1]` por defecto
- Incluir `selectedTaskTypes` en TODAS las dependencias de `useMemo`

### 3. Drag & drop no actualizaba UI sin reload
**Problema**: Cambios se guardaban en BD pero UI no reflejaba hasta recargar
**Solución**: 
- Todos los endpoints PHP retornan `Tipos_Tareas_ID` en response
- `updateTask` usa `fetchWithSessionCheck` con logging
- Agregar `selectedTaskTypes` a dependencias de useMemo

### 4. Botón "Marcar como importante" no persistía
**Problema**: Star button modificaba campo incorrecto (`prioridad` en vez de `importancia`)
**Solución**: 
- `toggleImportant.php`: Ahora toggle campo `importancia` (alta ↔ baja)
- `EditTaskModal.tsx`: Verifica y actualiza `formData.Importancia`
- Response JSON: Retorna `newImportance` en lugar de `newPriority`

### 5. Modal de edición se cerraba al asignar proyecto
**Problema**: Asignar/crear proyecto cerraba el modal automáticamente
**Solución**:
- Nuevo prop `onTaskUpdate` en `EditTaskModal`
- Llamar a `updateTask()` directamente sin `onSave()`
- `handleUpdateTask()` actualiza lista Y `editingTask` sin cerrar modal
- Modal permanece abierto, cambios se ven inmediatamente

### 6. Subtareas no heredaban proyecto del padre
**Problema**: 59 subtareas sin `proyecto_id` en producción
**Solución**:
- `createSubTask.php`: Lookup recursivo de `proyecto_id` en cadena de padres
- Hereda también `tipos_tareas_id` del padre
- SQL UPDATE para corregir 35 subtareas existentes

### 7. Conflictos en búsqueda con dropdown
**Problema**: `onBlur` del input se dispara antes del `onClick` del dropdown
**Solución**: 
- Usar `onMouseDown` con `preventDefault()` en opciones del dropdown
- Flag con `useRef` (`justSelectedFromDropdownRef`) para evitar delays
- Timeout de 150ms en blur para permitir clics

### 8. Filtrado por proyecto no funcionaba
**Problema**: Condición `if (searchFilter && ...)` evaluaba a `false` con string vacío
**Solución**: Cambiar a `if ((searchFilter || selectedProjectId !== null) && ...)`

### 9. Hardcoded filter bloqueaba obras/notas
**Problema**: `getTasks.php` tenía filtro hardcoded `AND (t.tipos_tareas_id = 1 OR ...)`
**Solución**: Remover filtro del backend, dejar que frontend maneje con checkboxes

## 🔍 Decisiones Técnicas Importantes

### Arquitectura y Patrones

#### 1. Separación Backend/Frontend
- **Backend**: PHP puro sin frameworks (máxima compatibilidad con hosting compartido)
- **Frontend**: React SPA con TypeScript estricto
- **Comunicación**: API REST JSON con CORS configurado dinámicamente
- **Estado**: Centralizado en `App.tsx`, prop drilling optimizado

#### 2. Sistema de Tipos de Tarea (Database-driven)
- **Tabla `tipos_tareas`**: Define tipos dinámicamente (tareas, obras, notas)
- **Colores personalizables**: Cada tipo tiene su color en hex
- **Filtrado con checkboxes**: Estado `selectedTaskTypes: number[]`
- **Default solo "tareas"**: Safeguards múltiples para producción
- **Normalización**: Tareas sin tipo se asignan automáticamente a ID 1

#### 3. Matriz de Eisenhower (Dos Ejes Independientes)
- **Prioridad** (eje X - urgencia): `alta`, `media`, `baja`
- **Importancia** (eje Y - impacto): `alta`, `baja`
- **Star button**: Toggle solo `importancia`, no `prioridad`
- **Drag & drop**: Actualiza solo el eje correspondiente al movimiento

#### 4. Gestión de Sesiones PHP
- **Duración**: 48 horas (172,800 segundos)
- **Auto-expiración**: `checkAuth.php` verifica en cada carga
- **fetchWithSessionCheck**: Wrapper que detecta sesiones expiradas
- **handleSessionExpired**: Redirige a login y muestra alerta

#### 5. Normalización de IDs (Critical)
Por qué es necesario:
- **Local**: MySQL retorna integers
- **Producción**: Algunas consultas retornan strings
- **Solución**: `parseInt(String(value))` en TODAS las comparaciones
- **Patrón**: `normalizeId()` helper function

#### 6. Herencia en Subtareas
- **proyecto_id**: Lookup recursivo en cadena de padres hasta encontrar uno
- **tipos_tareas_id**: Heredado directamente del padre inmediato
- **Permisos**: Creador del padre puede ver subtareas aunque otros las asignen

#### 7. Búsqueda y Filtrado
- **Estado separado**: `appliedSearchFilter` (texto) + `selectedProjectId` (proyecto)
- **useRef para flags**: `justSelectedFromDropdownRef` evita race conditions
- **onMouseDown vs onClick**: onMouseDown se dispara antes del blur
- **Validación combinada**: `(searchFilter || selectedProjectId !== null)`

#### 8. Optimización de Renders
- **useMemo**: Todas las listas filtradas (currentTasks, urgentTasks, etc.)
- **useCallback**: Funciones que se pasan como props (`fetchTasks`, `handleUpdateTask`)
- **Dependencies**: SIEMPRE incluir `selectedTaskTypes` en filtros
- **Skeleton loaders**: UX mejorada durante carga

#### 9. Modal de Edición Persistente
Por qué no cierra:
- **Flujo antiguo**: `onSave()` → `handleUpdateTask()` → `handleCloseModal()`
- **Flujo nuevo**: `onTaskUpdate()` → `handleUpdateTask()` → ✅ Modal sigue abierto
- **Beneficio**: Ver cambios inmediatamente sin perder contexto

#### 10. Output Buffering en PHP
Necesario porque:
- PHP puede enviar warnings/notices antes del JSON
- `ob_start()` captura toda salida
- `ob_end_clean()` la descarta antes de `echo json_encode()`
- **Resultado**: JSON siempre válido y parseable

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

*Última actualización: Noviembre 2025*

## 📊 Changelog Reciente

### Versión 2.0.0 (Noviembre 2025) 🎉

#### Nuevas Funcionalidades
- ✨ **Sistema de tipos de tarea** con filtrado por checkboxes (tareas, obras, notas)
- ✨ **Múltiples vistas**: Lista, Kanban, Gantt, Matriz de Eisenhower
- ✨ **Botón de recarga manual** de tareas sin refresh completo
- ✨ **Notificaciones de tareas vencidas** con dropdown interactivo
- ✨ **Modal de edición persistente** (no cierra al asignar proyecto)
- ✨ **Herencia automática de proyecto** en subtareas (lookup recursivo)
- ✨ **Matriz de Eisenhower** con drag & drop entre cuadrantes
- ✨ **Vista Gantt** con gestión de dependencias
- ✨ **Vista Kanban** con drag & drop entre estados

#### Mejoras Críticas
- 🔧 **Normalización universal de IDs** para compatibilidad local/producción
- 🔧 **Filtro por tipo de tarea** con default "tareas" y múltiples safeguards
- 🔧 **Star button corregido** (ahora toggle `importancia`, no `prioridad`)
- 🔧 **Actualización en tiempo real** tras drag & drop (sin reload)
- 🔧 **Modal persistente** al crear/asignar proyectos
- 🔧 **Output buffering** en todos los endpoints PHP para JSON limpio

#### Bugs Resueltos
- 🐛 **Fix**: IDs inconsistentes entre entornos (local: number, prod: string)
- � **Fix**: Default filter "tareas" no aplicaba en producción
- 🐛 **Fix**: Drag & drop guardaba pero no actualizaba UI
- 🐛 **Fix**: Star button modificaba campo incorrecto
- 🐛 **Fix**: Modal se cerraba al asignar proyecto
- 🐛 **Fix**: Subtareas no heredaban proyecto del padre (59 casos)
- 🐛 **Fix**: Filtro hardcoded en getTasks.php bloqueaba obras/notas
- 🐛 **Fix**: Conflictos entre blur y selección de dropdown

#### Optimizaciones
- ⚡ **useMemo** en todas las listas filtradas
- ⚡ **useCallback** en funciones pasadas como props
- ⚡ **Promise.allSettled** para carga paralela
- ⚡ **fetchWithSessionCheck** wrapper unificado
- ⚡ **Prop drilling optimizado** (taskAssigneesRecord precargado)
- ⚡ **Debouncing** en búsquedas (300ms)

#### Base de Datos
- 📊 SQL UPDATE para corregir 35 subtareas sin proyecto
- 📊 SQL UPDATE para asignar tipo 1 a 106 tareas sin tipo
- 📊 Nuevos endpoints: `getTaskTypes.php`, `toggleImportant.php`
- 📊 Modificación: `createSubTask.php` con herencia recursiva

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

---

## 📈 Estadísticas del Proyecto

- **Total de endpoints**: 20+ APIs REST
- **Componentes React**: 15+
- **Líneas de código**: ~10,000+ (TypeScript + PHP)
- **Build size (gzipped)**: 94.36 kB
- **Tiempo de build**: ~900ms (Vite optimizado)
- **Compatibilidad**: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- **Mobile**: iOS 12+, Android 8+
