
## 📘 Documentación
- Usar JSDoc para funciones complejas
- Documentar props y responsabilidades de componentes
- Incluir ejemplos de uso cuando sea relevante

## 📖 README.md - Documentación del Proyecto
- **Crear y mantener README.md** en la raíz del proyecto
- **Contenido obligatorio**:
  - Descripción completa de la aplicación
  - Stack tecnológico (versiones específicas)
  - Arquitectura y estructura de carpetas
  - Instrucciones de instalación y configuración
  - Comandos disponibles (dev, build, test)
  - Variables de entorno necesarias
  - Endpoints de API documentados
  - Flujo de desarrollo y convenciones
  - Decisiones técnicas importantes
  - Problemas conocidos y soluciones
- **Actualizar README.md** con cada cambio significativo
- **Mantener contexto completo** para nuevos desarrolladores

## 🚨 Reglas Críticas Universales

### REGLA: CONSISTENCIA DE TIPOS EN APIs ENTRE ENTORNOS
Cuando trabajes con APIs REST entre PHP/MySQL y React/TypeScript:

1. **IDENTIFICACIÓN DEL PROBLEMA**:
   - Local: IDs como números (ej: `{id: 3}`)
   - Producción: IDs como strings (ej: `{id: '3'}`)

2. **DIAGNÓSTICO**:
   - Comparar tipos con `console.log(typeof variable)`
   - Buscar comparaciones que fallen: `3 === '3'` → false

3. **SOLUCIÓN AUTOMÁTICA**:
   - Normalizar IDs: `parseInt(String(value))`
   - Comparaciones: asegurar mismo tipo en ambos lados

4. **EJEMPLOS**:
   ```typescript
   ❌ selectedProjectId === task.proyecto  // si uno es string y otro number
   ✅ parseInt(String(selectedProjectId)) === parseInt(String(task.proyecto))
 