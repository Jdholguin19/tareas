# Sistema de Adjuntos con SharePoint

Este documento describe cómo configurar y usar el nuevo sistema de adjuntos para tareas, que utiliza SharePoint como almacenamiento.

## Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Endpoints API](#endpoints-api)
4. [Componentes React](#componentes-react)
5. [Uso en Producción](#uso-en-producción)
6. [Solución de Problemas](#solución-de-problemas)

---

## Configuración Inicial

### 1. Crear Tabla en la Base de Datos

Ejecuta el script SQL ubicado en `database/tarea_adjuntos.sql`:

```sql
-- Ver archivo database/tarea_adjuntos.sql
```

### 2. Configurar Credenciales de SharePoint

Edita el archivo `api/config/env_sharepoint.php` con tus credenciales de Azure AD:

```php
putenv('AZURE_TENANT_ID=tu-tenant-id');
putenv('AZURE_CLIENT_ID=tu-client-id');
putenv('AZURE_CLIENT_SECRET=tu-client-secret');
putenv('SHAREPOINT_DOMAIN=tu-dominio.sharepoint.com');
putenv('SHAREPOINT_USER=tu_usuario');
putenv('SHAREPOINT_ROOT_PATH=ruta/a/carpeta/adjuntos');
```

**IMPORTANTE:** Este archivo contiene credenciales sensibles. NUNCA debe subirse a repositorios públicos.

### 3. Crear Aplicación en Azure AD

Para obtener las credenciales necesitas:

1. Ir a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory > App registrations > New registration
3. Configurar:
   - Nombre: "Adjuntos-Tareas" (o el que prefieras)
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: No requerido
4. Una vez creada, obtener:
   - Application (client) ID → `AZURE_CLIENT_ID`
   - Directory (tenant) ID → `AZURE_TENANT_ID`
5. En "Certificates & secrets":
   - New client secret
   - Copiar el valor → `AZURE_CLIENT_SECRET`
6. En "API permissions":
   - Add permission > Microsoft Graph > Application permissions
   - Agregar: `Sites.ReadWrite.All` y `Files.ReadWrite.All`
   - Grant admin consent

### 4. Configurar Carpeta en SharePoint

1. Crear carpeta en SharePoint: `Adjuntos_Tareas`
2. La estructura será:
   ```
   Adjuntos_Tareas/
   ├── tarea_1/
   │   ├── imagen1.jpg
   │   └── documento1.pdf
   ├── tarea_2/
   │   └── foto.png
   └── ...
   ```

---

## Estructura de Base de Datos

### Tabla `tarea_adjuntos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único del adjunto |
| `tarea_id` | INT | ID de la tarea (FK → tareas.ID) |
| `drive_item_id` | VARCHAR(255) | ID del archivo en SharePoint |
| `nombre_archivo` | VARCHAR(500) | Nombre original del archivo |
| `tipo_archivo` | ENUM | 'imagen' o 'documento' |
| `extension` | VARCHAR(10) | Extensión del archivo |
| `tamano_bytes` | BIGINT | Tamaño en bytes |
| `mime_type` | VARCHAR(100) | Tipo MIME del archivo |
| `fecha_subida` | DATETIME | Fecha de subida |
| `subido_por` | INT | Usuario que subió (FK → usuarios.id) |

---

## Endpoints API

### 1. Subir Adjunto

**Endpoint:** `POST /api/uploadToSharePoint.php`

**Parámetros (multipart/form-data):**
- `tarea_id` (number): ID de la tarea
- `file` (File): Archivo a subir

**Validaciones:**
- Tamaño máximo: 100 MB
- Extensiones permitidas: jpg, jpeg, png, gif, bmp, webp, svg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, zip, rar

**Respuesta exitosa:**
```json
{
  "success": true,
  "attachment_id": 123,
  "nombre_archivo": "imagen.jpg",
  "tipo_archivo": "imagen",
  "extension": "jpg",
  "tamano_bytes": 51200,
  "drive_item_id": "01ABCD..."
}
```

### 2. Obtener Adjuntos de una Tarea

**Endpoint:** `GET /api/getTaskAttachments.php?tarea_id=123`

**Respuesta exitosa:**
```json
{
  "success": true,
  "attachments": [
    {
      "id": 123,
      "nombre_archivo": "imagen.jpg",
      "tipo_archivo": "imagen",
      "extension": "jpg",
      "tamano_bytes": 51200,
      "tamano_formateado": "50 KB",
      "mime_type": "image/jpeg",
      "fecha_subida": "2025-12-09 10:30:00",
      "subido_por": {
        "id": 1,
        "username": "usuario"
      },
      "url_descarga": "https://..."
    }
  ]
}
```

**Nota:** La URL de descarga es temporal y válida por ~1 hora.

### 3. Eliminar Adjunto

**Endpoint:** `POST /api/deleteTaskAttachment.php`

**Parámetros (JSON):**
```json
{
  "attachment_id": 123
}
```

**Permisos:**
- Solo el usuario que subió el archivo o el creador de la tarea pueden eliminarlo

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Adjunto eliminado correctamente"
}
```

---

## Componentes React

### 1. AttachmentUploadModal

Modal para subir archivos con tres opciones:

```tsx
import { AttachmentUploadModal } from './AttachmentUploadModal';

<AttachmentUploadModal
  isOpen={showModal}
  tareaId={123}
  onClose={() => setShowModal(false)}
  onUploadSuccess={() => {
    // Refrescar adjuntos
  }}
/>
```

**Características:**
- ✅ Tomar foto con cámara
- ✅ Subir archivo desde dispositivo
- ✅ Pegar imagen desde portapapeles
- ✅ Validación de tamaño y tipo
- ✅ Barra de progreso
- ✅ Preview de imágenes

### 2. AttachmentPreview

Muestra iconos de adjuntos:

```tsx
import { AttachmentPreview } from './AttachmentPreview';

<AttachmentPreview
  attachments={attachments}
  onAttachmentClick={(attachment, index) => {
    // Abrir vista previa
  }}
  onAttachmentDelete={(attachmentId) => {
    // Eliminar adjunto
  }}
  canDelete={true}
  showAddButton={true}
  onAddClick={() => {
    // Abrir modal de subida
  }}
/>
```

**Iconos por tipo:**
- 📷 Imagen: Miniatura de la imagen
- 📄 PDF: Icono rojo con "pdf"
- 📘 Word: Icono azul con "W"
- 📊 Excel: Icono verde con "X"
- 📙 PowerPoint: Icono naranja con "P"
- 📝 Texto: Icono gris con "file-text"
- 📦 Comprimido: Icono morado con "archive"
- 📁 Otros: Icono gris con "file"

### 3. ImageViewer

Lightbox para ver imágenes:

```tsx
import { ImageViewer } from './ImageViewer';

<ImageViewer
  isOpen={showViewer}
  imageUrl="https://..."
  imageName="imagen.jpg"
  onClose={() => setShowViewer(false)}
  onNext={() => {}} // Opcional
  onPrevious={() => {}} // Opcional
  hasNext={false}
  hasPrevious={false}
/>
```

**Controles:**
- ✅ Zoom in/out (+/-)
- ✅ Reset zoom
- ✅ Descargar imagen
- ✅ Navegación con flechas (si hay múltiples imágenes)
- ✅ Drag para mover cuando hay zoom
- ✅ Atajos de teclado (Esc, +, -, ←, →)

---

## Uso en Producción

### Checklist de Deploy

#### 1. Base de Datos
- [ ] Ejecutar script SQL `database/tarea_adjuntos.sql`
- [ ] Verificar que las foreign keys existan

#### 2. Archivos PHP
- [ ] Subir `api/config/env_sharepoint.php` (configurado con credenciales de producción)
- [ ] Subir `api/uploadToSharePoint.php`
- [ ] Subir `api/getTaskAttachments.php`
- [ ] Subir `api/deleteTaskAttachment.php`

#### 3. Configuración
- [ ] Verificar que el archivo `.htaccess` proteja `api/config/env_sharepoint.php`
- [ ] Configurar Azure AD con permisos correctos
- [ ] Crear carpeta en SharePoint con permisos de escritura

#### 4. React
- [ ] Compilar con `npm run build`
- [ ] Verificar que no haya errores TypeScript
- [ ] Subir archivos compilados de `dist/`

#### 5. Pruebas
- [ ] Subir imagen (JPG, PNG)
- [ ] Subir documento (PDF, Word, Excel)
- [ ] Verificar preview de imágenes
- [ ] Verificar descarga de documentos
- [ ] Probar eliminación de adjuntos
- [ ] Verificar permisos de usuario

### Variables de Entorno en Producción

Modificar `api/config/env_sharepoint.php` con:

```php
// PRODUCCIÓN
putenv('AZURE_TENANT_ID=b9618ac6-2648-41ed-bb4f-03bcd94a7493');
putenv('AZURE_CLIENT_ID=bb032b2e-9836-466e-9bf7-ae3c337e5c1d');
putenv('AZURE_CLIENT_SECRET=REEMPLAZAR_CON_TU_SECRETO');
putenv('SHAREPOINT_DOMAIN=constv.sharepoint.com');
putenv('SHAREPOINT_USER=aburgos_thaliavictoria_com_ec');
putenv('SHAREPOINT_ROOT_PATH=Directorio de Archivos Consultas/09. IT/Desarrollo/Adjuntos_Tareas');
```

### Proteger Archivo de Configuración

Agregar a `.htaccess`:

```apache
<FilesMatch "^(env_sharepoint\.php)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Solución de Problemas

### Error: "Configuración de SharePoint incompleta"

**Causa:** Falta alguna variable de entorno en `env_sharepoint.php`

**Solución:**
1. Verificar que todas las variables estén definidas
2. Usar `getenv('VARIABLE_NAME')` para verificar valores
3. Revisar permisos del archivo

### Error: "No se pudo obtener el token de acceso"

**Causa:** Credenciales incorrectas o permisos insuficientes en Azure AD

**Solución:**
1. Verificar TENANT_ID, CLIENT_ID y CLIENT_SECRET
2. Verificar que la aplicación tenga permisos `Sites.ReadWrite.All` y `Files.ReadWrite.All`
3. Verificar que el admin haya dado consentimiento a los permisos

### Error: "El archivo excede el tamaño máximo"

**Causa:** Archivo mayor a 100 MB

**Solución:**
1. Reducir tamaño del archivo
2. O modificar `MAX_FILE_SIZE` en `env_sharepoint.php` (no recomendado)

### Error: "Tipo de archivo no permitido"

**Causa:** Extensión no está en la lista permitida

**Solución:**
1. Verificar extensión del archivo
2. Agregar extensión a `ALLOWED_EXTENSIONS` en `env_sharepoint.php` si es necesario

### Archivos no se muestran / URLs expiradas

**Causa:** Las URLs de descarga de SharePoint expiran después de ~1 hora

**Solución:**
1. Las URLs se regeneran cada vez que se llama a `getTaskAttachments.php`
2. Si un archivo lleva mucho tiempo abierto, refrescar la página

### Error: "No se pudo acceder a la cámara"

**Causa:** Permisos del navegador no otorgados o HTTPS no habilitado

**Solución:**
1. Verificar que el sitio use HTTPS (requerido para acceso a cámara)
2. Otorgar permisos de cámara en el navegador
3. Usar "Subir archivo" como alternativa

---

## Arquitectura del Sistema

```
Usuario → React Component (AttachmentUploadModal)
           ↓
         FormData con archivo
           ↓
       API PHP (uploadToSharePoint.php)
           ↓
       1. Validar archivo
       2. Obtener token de Azure AD
       3. Subir a SharePoint Graph API
       4. Guardar drive_item_id en MySQL
           ↓
       Respuesta con attachment_id
           ↓
       React actualiza UI
```

### Flujo de Descarga

```
Usuario → Clic en adjunto
           ↓
       React (getTaskAttachments)
           ↓
       API PHP (getTaskAttachments.php)
           ↓
       1. Buscar en MySQL
       2. Obtener token de Azure AD
       3. Obtener URL temporal de SharePoint
       4. Retornar lista con URLs
           ↓
       React muestra en ImageViewer o descarga
```

---

## Seguridad

### Validaciones Implementadas

1. **Tamaño de archivo**: Máximo 100 MB
2. **Tipo de archivo**: Solo extensiones permitidas
3. **Autenticación**: Usuario debe estar logueado
4. **Autorización**: Solo creador/asignados pueden eliminar
5. **Sanitización**: Nombres de archivo limpiados
6. **SQL Injection**: Prepared statements en todas las queries
7. **XSS**: URLs validadas antes de usar

### Recomendaciones Adicionales

1. Implementar rate limiting en uploads
2. Escanear archivos con antivirus (ClamAV o similar)
3. Rotar el client_secret cada 6-12 meses
4. Monitorear logs de acceso a SharePoint
5. Implementar cuotas de almacenamiento por usuario
6. Backup regular de la base de datos

---

## Performance

### Optimizaciones Implementadas

1. URLs temporales se cachean en el cliente
2. Imágenes se cargan lazy en previews
3. Upload con progress tracking
4. Eliminación de archivos en cascada (SQL)

### Consideraciones

- SharePoint tiene límites de API calls (no documentados públicamente)
- URLs temporales expiran en ~1 hora
- Archivos grandes pueden tardar en subir
- Conexión a SharePoint requiere internet estable

---

## Roadmap Futuro

### Posibles Mejoras

1. **Compresión automática** de imágenes antes de subir
2. **Thumbnails** generados para previe más rápido
3. **Edición de imágenes** inline (recortar, rotar)
4. **Versionado de archivos** (histórico de cambios)
5. **Compartir links** públicos con expiración
6. **Búsqueda** de archivos por contenido
7. **Soporte para carpetas** dentro de tareas
8. **Drag & drop** multiple de archivos
9. **OCR** para extraer texto de imágenes
10. **Preview de PDF** en el navegador

---

## Contacto y Soporte

Para problemas técnicos:
1. Revisar logs de PHP: `error_log`
2. Revisar console del navegador
3. Verificar Network tab para errores API

---

**Última actualización:** 9 de Diciembre, 2025
**Versión:** 1.0.0
