# Guía para Configurar Permisos de Azure AD para SharePoint

## Problema Actual
Error 401 Unauthorized al intentar acceder a SharePoint desde la API.

## Solución: Configurar Permisos en Azure AD

### Paso 1: Ir a Azure Portal
1. Abre https://portal.azure.com
2. Inicia sesión con la cuenta de administrador de constv.sharepoint.com

### Paso 2: Ir a App Registrations
1. En el menú lateral, busca **Azure Active Directory**
2. Click en **App registrations** (Registros de aplicaciones)
3. Busca la aplicación: **Planics-Sharepoint**
   - Client ID: `bb032b2e-9836-466e-9bf7-ae3c337e5c1d`

### Paso 3: Configurar API Permissions
1. Click en tu aplicación **Planics-Sharepoint**
2. En el menú lateral, click en **API permissions**
3. Click en **+ Add a permission**
4. Selecciona **Microsoft Graph**
5. Selecciona **Application permissions** (NO Delegated permissions)
6. Busca y agrega los siguientes permisos:
   - ✅ **Sites.Read.All** - Leer elementos en todos los sitios
   - ✅ **Sites.ReadWrite.All** - Leer y escribir elementos en todos los sitios
   - ✅ **Files.Read.All** - Leer archivos en todos los sitios
   - ✅ **Files.ReadWrite.All** - Leer y escribir archivos en todos los sitios

### Paso 4: Grant Admin Consent (MUY IMPORTANTE)
1. Después de agregar los permisos, verás una lista de permisos
2. En la parte superior, click en **Grant admin consent for [Tu organización]**
3. Click en **Yes** para confirmar
4. Verifica que todos los permisos tengan un ✅ verde en la columna "Status"

### Paso 5: Verificar el Client Secret
1. En el menú lateral, click en **Certificates & secrets**
2. Verifica que el secret esté activo y no haya expirado
3. Si expiró, crea uno nuevo y actualiza `env_sharepoint.php`

## Permisos Necesarios (Resumen)

| Permiso | Tipo | Descripción |
|---------|------|-------------|
| Sites.Read.All | Application | Leer sitios de SharePoint |
| Sites.ReadWrite.All | Application | Leer y escribir en sitios |
| Files.Read.All | Application | Leer archivos |
| Files.ReadWrite.All | Application | Leer y escribir archivos |

## Después de Configurar los Permisos

1. **Espera 5-10 minutos** para que los cambios se propaguen
2. Ejecuta el test nuevamente:
   ```
   http://localhost/tareas/api/test_sharepoint_connection.php
   ```
3. Deberías ver ✅ en todos los pasos

## Solución Alternativa: Usar SharePoint Site Específico

Si no tienes permisos de administrador para otorgar permisos a nivel de toda la organización:

1. En Azure Portal > App registrations > Tu app
2. Click en **API permissions**
3. En lugar de usar permisos **Application**, usa **Delegated permissions**:
   - Sites.Read.All (Delegated)
   - Sites.ReadWrite.All (Delegated)
   - Files.Read.All (Delegated)
   - Files.ReadWrite.All (Delegated)

**NOTA:** Con permisos delegados necesitarás autenticación de usuario en lugar de autenticación de aplicación.

## Verificar Permisos Actuales

Para ver qué permisos tiene actualmente la aplicación:

1. Ve a https://portal.azure.com
2. Azure Active Directory > App registrations > Planics-Sharepoint
3. API permissions
4. Revisa la columna **Status** - debe decir "Granted for [organización]"

## Errores Comunes

### Error: "Insufficient privileges to complete the operation"
- **Causa:** Faltan permisos de API
- **Solución:** Agrega Sites.ReadWrite.All y Files.ReadWrite.All

### Error: "Access denied"
- **Causa:** Los permisos no tienen "Admin Consent"
- **Solución:** Click en "Grant admin consent"

### Error: "Invalid client secret"
- **Causa:** El secret expiró
- **Solución:** Genera un nuevo secret en Azure Portal

## Contacto con Administrador

Si no tienes acceso de administrador en Azure AD, contacta a:
- **Administrador de Azure AD** de CONSTV
- Proporciona:
  - App ID: `bb032b2e-9836-466e-9bf7-ae3c337e5c1d`
  - App Name: `Planics-Sharepoint`
  - Permisos necesarios: Sites.ReadWrite.All, Files.ReadWrite.All

---

**Una vez configurados los permisos, el test debería pasar sin errores.**
