# Sistema de Adjuntos con SharePoint - Resumen de Implementación

## 📋 Cambios Implementados

### 1. ✅ Kanban - Diseño Horizontal de 4 Columnas

**Archivo modificado:** `components/KanbanBoard.tsx`

- Cambiado de diseño vertical a horizontal con 4 columnas
- Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Columnas: Pendiente | En progreso | En espera | Completada
- Cada columna muestra el número de tareas en el header

### 2. ✅ Sistema de Adjuntos con SharePoint

#### Componentes React Creados:

1. **`AttachmentUploadModal.tsx`** - Modal para subir archivos
   - Opción 1: 📷 Tomar foto (abre cámara del dispositivo)
   - Opción 2: 📁 Subir archivo (selector de archivos)
   - Opción 3: 📋 Pegar imagen (desde portapapeles Ctrl+V)
   - Validaciones: máx 100MB, tipos permitidos
   - Preview antes de subir
   - Barra de progreso durante la carga

2. **`ImageViewer.tsx`** - Visor de imágenes lightbox
   - Vista modal pantalla completa
   - Zoom in/out
   - Navegación entre imágenes (anterior/siguiente)
   - Descarga de imagen
   - Abrir en SharePoint
   - Información del archivo (nombre, tamaño, fecha)
   - Diseño responsive

3. **`AttachmentIcons.tsx`** - Iconos de adjuntos en EditTaskModal
   - Botón "+" para agregar nuevos adjuntos
   - Iconos diferenciados por tipo:
     * 🖼️ Imagen: icono de imagen
     * 📄 PDF: icono rojo con "PDF"
     * 📊 Excel: icono verde con "X"
     * 📝 Word: icono azul con "W"
     * 📑 PowerPoint: icono naranja con "P"
     * 📁 Otros: icono genérico de archivo
   - Click en icono de imagen: abre visor
   - Click en icono de documento: abre en SharePoint
   - Tooltips con información del archivo

#### Componentes Actualizados:

4. **`CreateQuickTask.tsx`**
   - Agregado botón de adjuntos (icono clip 📎)
   - Posicionado al lado del botón del micrófono
   - Abre modal de subida de archivos
   - Carga automática de adjuntos al crear tarea

5. **`EditTaskModal.tsx`**
   - Integración del componente `AttachmentIcons`
   - Muestra iconos debajo del textarea de título
   - Actualización automática al agregar/eliminar adjuntos
   - Carga de adjuntos existentes al abrir modal

6. **`Icon.tsx`**
   - Agregados nuevos iconos:
     * camera (cámara)
     * upload (subir)
     * clipboard (portapapeles)
     * image (imagen)
     * file (archivo genérico)
     * file-text (documento texto)
     * archive (archivo comprimido)
     * pdf (PDF)
     * minus (minimizar)
     * chevron-left (flecha izquierda)

#### Backend PHP - SharePoint Integration:

7. **`api/config/env_sharepoint.php`** - Configuración de SharePoint
   ```php
   Tenant ID: b9618ac6-2648-41ed-bb4f-03bcd94a7493
   Client ID: bb032b2e-9836-466e-9bf7-ae3c337e5c1d
   Client Secret: REEMPLAZAR_CON_TU_SECRETO
   Domain: constv.sharepoint.com
   Root Path: Directorio de Archivos Consultas/09. IT/Desarrollo/Adjuntos_PlaniCS
   ```

8. **`api/uploadToSharePoint.php`** - Subir archivos
   - Recibe archivo multipart/form-data
   - Valida tamaño (máx 100MB) y tipo
   - Obtiene token de Azure AD
   - Sube a SharePoint usando Microsoft Graph API
   - Guarda referencia en BD (drive_item_id)
   - Retorna URL de SharePoint

9. **`api/getTaskAttachments.php`** - Obtener adjuntos de una tarea
   - Lista todos los adjuntos no eliminados
   - Obtiene URL de descarga temporal desde SharePoint
   - Retorna metadata completa (nombre, tamaño, tipo, fecha)

10. **`api/deleteAttachment.php`** - Eliminar adjuntos
    - Borrado lógico en BD (marca como eliminado)
    - Opcional: borrado físico en SharePoint
    - Solo el creador o admin puede eliminar

11. **`api/test_sharepoint.php`** - Script de diagnóstico
    - Verifica credenciales de Azure AD
    - Prueba conexión con SharePoint
    - Lista contenido de carpeta
    - Muestra información detallada para debugging

#### Base de Datos:

12. **`api/database/create_tarea_adjuntos_table.sql`** - Tabla de adjuntos
    ```sql
    Campos principales:
    - id: ID autoincremental
    - tarea_id: Relación con tareas
    - drive_item_id: ID del archivo en SharePoint
    - nombre_archivo: Nombre original
    - tipo_archivo: imagen | documento
    - extension: jpg, pdf, docx, etc
    - tamano_bytes: Tamaño del archivo
    - mime_type: Tipo MIME
    - sharepoint_url: URL de visualización
    - subido_por: Usuario que subió
    - eliminado: Borrado lógico
    ```

#### Servicios API (Frontend):

13. **`services/apiService.ts`** - Funciones agregadas:
    - `uploadAttachment(tareaId, file)` - Subir archivo
    - `getTaskAttachments(tareaId)` - Obtener adjuntos
    - `deleteAttachment(attachmentId)` - Eliminar adjunto

## 🔧 Configuración de SharePoint

### Credenciales de Azure AD (Planics-Sharepoint):
- **Tenant ID:** b9618ac6-2648-41ed-bb4f-03bcd94a7493
- **Application ID:** bb032b2e-9836-466e-9bf7-ae3c337e5c1d
- **Client Secret:** REEMPLAZAR_CON_TU_SECRETO

### Estructura de Carpetas en SharePoint:
```
constv.sharepoint.com/
└── Directorio de Archivos Consultas/
    └── 09. IT/
        └── Desarrollo/
            └── Adjuntos_PlaniCS/
                ├── tarea_1/
                │   ├── imagen1.jpg
                │   └── documento.pdf
                ├── tarea_2/
                │   └── archivo.xlsx
                └── ...
```

## 📊 Flujo de Funcionamiento

### Subir Adjunto:
1. Usuario hace click en botón "+" o botón de clip 📎
2. Se abre modal con 3 opciones (cámara/archivo/pegar)
3. Usuario selecciona archivo (máx 100MB)
4. Preview del archivo en el modal
5. Click en "Subir"
6. Frontend envía a `uploadToSharePoint.php`
7. PHP obtiene token de Azure AD
8. PHP sube archivo a SharePoint
9. SharePoint retorna drive_item_id
10. PHP guarda registro en BD con drive_item_id
11. Frontend actualiza lista de iconos

### Ver Adjunto (Imagen):
1. Usuario hace click en icono de imagen
2. Se abre `ImageViewer` en pantalla completa
3. Frontend llama a `getTaskAttachments.php`
4. PHP obtiene URL temporal de SharePoint
5. Imagen se muestra en el visor
6. Usuario puede zoom, navegar, descargar

### Ver Adjunto (Documento):
1. Usuario hace click en icono de documento
2. Frontend obtiene sharepoint_url de la BD
3. Se abre nueva pestaña con documento en SharePoint
4. Usuario ve/descarga desde SharePoint directamente

## 🧪 Pruebas

### 1. Verificar Conexión con SharePoint:
```
http://localhost/tareas/api/test_sharepoint.php
```

Este script verifica:
- ✅ Configuración completa
- ✅ Token de acceso obtenido
- ✅ Conexión con SharePoint exitosa
- ✅ Acceso a carpeta de destino

### 2. Prueba Manual de Subida:
1. Crear una tarea rápida
2. Click en botón de adjuntos (clip)
3. Subir una imagen de prueba
4. Verificar que aparece el icono
5. Click en el icono para ver en visor

### 3. Verificar en SharePoint:
1. Ir a: https://constv.sharepoint.com
2. Navegar a: Directorio de Archivos Consultas/09. IT/Desarrollo/Adjuntos_PlaniCS
3. Verificar que existe la carpeta `tarea_[ID]`
4. Verificar que el archivo está allí

## 📝 Base de Datos - SQL a Ejecutar

```sql
-- Ejecutar en phpMyAdmin o MySQL:
CREATE TABLE IF NOT EXISTS `tarea_adjuntos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tarea_id` INT UNSIGNED NOT NULL,
  `drive_item_id` VARCHAR(255) NOT NULL,
  `nombre_archivo` VARCHAR(500) NOT NULL,
  `tipo_archivo` ENUM('imagen', 'documento') NOT NULL DEFAULT 'documento',
  `extension` VARCHAR(20) NOT NULL,
  `tamano_bytes` BIGINT UNSIGNED NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `sharepoint_url` TEXT NULL,
  `subido_por` INT UNSIGNED NOT NULL,
  `fecha_subida` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `eliminado` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_eliminacion` TIMESTAMP NULL DEFAULT NULL,
  `eliminado_por` INT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tarea_id` (`tarea_id`),
  INDEX `idx_drive_item_id` (`drive_item_id`),
  CONSTRAINT `fk_adjuntos_tarea` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_adjuntos_usuario_subido` FOREIGN KEY (`subido_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🚀 Despliegue a Producción (BlueHost)

### 1. Subir archivos:
- Todos los archivos PHP en `/api/`
- Componentes React compilados en `/dist/`
- Archivo `.htaccess` (si no existe)

### 2. Ejecutar SQL:
- Conectar a phpMyAdmin en BlueHost
- Ejecutar script de creación de tabla

### 3. Verificar configuración:
- Abrir `https://tudominio.com/api/test_sharepoint.php`
- Verificar que todos los pasos sean exitosos

### 4. Permisos en Azure AD:
Asegurar que la aplicación tenga:
- `Sites.ReadWrite.All` (Application permission)
- `Files.ReadWrite.All` (Application permission)

## 🎨 Interfaz de Usuario

### CreateQuickTask:
```
┌─────────────────────────────────────┐
│ Ingresa tu tarea...                 │
│                                     │
│                          [🎤] [📎] │
└─────────────────────────────────────┘
```

### EditTaskModal - Sección de Adjuntos:
```
┌─────────────────────────────────────┐
│ Título de la tarea                  │
│                                     │
└─────────────────────────────────────┘

Adjuntos: [+] [🖼️] [📄] [📊]
          Agregar  img1  doc1  excel1
```

### AttachmentUploadModal:
```
┌────────────────────────────────────┐
│        Subir Adjunto               │
├────────────────────────────────────┤
│  [📷 Tomar Foto]                   │
│  [📁 Subir Archivo]                │
│  [📋 Pegar Imagen]                 │
│                                    │
│  [Preview del archivo]             │
│                                    │
│  [Cancelar]          [Subir]       │
└────────────────────────────────────┘
```

### ImageViewer:
```
┌─────────────────────────────────────────┐
│ [←] imagen.jpg 2.5 MB      [+] [-] [↓] │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           [IMAGEN AMPLIADA]             │
│                                         │
│                                         │
│         1 de 3        [→]               │
└─────────────────────────────────────────┘
```

## 💡 Características Especiales

1. **Ahorro de espacio:** Los archivos NO se guardan en el hosting, solo en SharePoint
2. **Seguridad:** Solo usuarios autenticados pueden subir/ver adjuntos
3. **Borrado lógico:** Los archivos eliminados se marcan pero no se borran físicamente
4. **URLs temporales:** Las URLs de descarga de SharePoint expiran automáticamente
5. **Responsive:** Funciona en desktop, tablet y móvil
6. **Preview:** Visor de imágenes integrado sin salir de la app
7. **Metadata:** Se guarda tamaño, tipo, fecha, usuario que subió
8. **Organización:** Una carpeta por tarea en SharePoint

## 🔐 Seguridad

- ✅ Validación de tamaño (100MB máx)
- ✅ Validación de extensiones permitidas
- ✅ Verificación de sesión de usuario
- ✅ Sanitización de nombres de archivo
- ✅ Credenciales en archivo separado (no versionado)
- ✅ Borrado lógico (no se pierden archivos)
- ✅ Foreign keys con cascada

## 📱 Compatibilidad

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Móviles (iOS/Android)
- ✅ Tablets
- ✅ BlueHost PHP 7.4+

## 🐛 Solución de Problemas

### Error: "No se pudo obtener token"
- Verificar credenciales en `env_sharepoint.php`
- Revisar que la app de Azure AD esté activa

### Error: "No se pudo subir archivo"
- Verificar tamaño (máx 100MB)
- Verificar extensión permitida
- Verificar permisos en SharePoint

### Error: "No se puede ver imagen"
- Verificar que la URL de SharePoint sea válida
- Revisar que el usuario tenga permisos

### Carpeta no se crea automáticamente
- Ejecutar `test_sharepoint.php` para verificar permisos
- La carpeta se crea al subir el primer archivo

## 📞 Soporte

Para más información o problemas:
1. Revisar logs de PHP en el servidor
2. Ejecutar `test_sharepoint.php` para diagnóstico
3. Verificar consola del navegador (F12) para errores JavaScript
4. Revisar red (Network tab) para ver respuestas de API

---

**¡Sistema listo para usar!** 🎉
