# 🔧 Guía de Solución de Problemas - Sistema de Rifas

## Errores Solucionados

### ✅ Error Principal: `Unexpected identifier 'Peña'`
**Problema**: Error de sintaxis con caracteres especiales (ñ, á, é, etc.)
**Solución**: Convertimos todos los caracteres especiales a representación Unicode
- `ñ` → `\u00f1`
- `á` → `\u00e1`
- Y otros caracteres especiales

### ✅ Variables de Entorno No Encontradas
**Problema**: Supabase no se inicializa correctamente
**Solución**: 
- Mejorado el manejo de errores en `inject-env.js`
- La aplicación funciona correctamente con localStorage cuando Supabase no está disponible
- Agregado escape de caracteres especiales

### ✅ Múltiples Inicializaciones
**Problema**: La aplicación se inicializaba varias veces
**Solución**: 
- Creado `init-manager.js` que evita inicializaciones duplicadas
- Sistema de banderas para controlar el estado de inicialización
- Manejo de reintentos para Supabase

## Archivos Modificados

### 📄 `js/env-config.js`
- Convertidos caracteres especiales a Unicode para evitar errores de sintaxis
- Mantiene compatibilidad total con caracteres especiales

### 📄 `inject-env.js`
- Agregada función `escapeForJS()` para manejar caracteres especiales
- Mejor validación de variables de Supabase
- Codificación UTF-8 explícita en escritura de archivos

### 📄 `js/init-manager.js` (NUEVO)
- Sistema de inicialización sin duplicados
- Manejo de errores y reintentos
- Carga ordenada de componentes
- Detección automática de problemas

### 📄 `js/diagnostics.js` (NUEVO)
- Diagnósticos automáticos del sistema
- Limpieza de datos corruptos
- Verificación de compatibilidad del navegador
- Función manual: `runSystemDiagnostics()`

### 📄 `index.html`
- Simplificado el script de inicialización
- Agregados scripts de gestión y diagnóstico
- Eliminadas inicializaciones duplicadas

## Comandos de Diagnóstico

### En Consola del Navegador:
```javascript
// Ejecutar diagnósticos completos
runSystemDiagnostics()

// Verificar estado de inicialización
InitManager.isInitialized()

// Verificar variables disponibles
console.log(window.ENV_RAFFLE_CONFIG)
console.log(window.ENV_PAYMENT_CONFIG)
```

## Proceso de Solución Paso a Paso

### 1. Si aparecen errores de sintaxis:
1. Recargar la página (Ctrl+F5)
2. Verificar en consola si aparece "Variables de entorno cargadas"
3. Si persiste, ejecutar `runSystemDiagnostics()`

### 2. Si Supabase no conecta:
1. Verificar que las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas
2. La aplicación funcionará con localStorage si no hay Supabase
3. El indicador de conexión mostrará el estado actual

### 3. Si la aplicación no carga:
1. Abrir herramientas de desarrollador (F12)
2. Ir a la pestaña Console
3. Buscar errores en rojo
4. Ejecutar `runSystemDiagnostics()` para un reporte completo

### 4. Si hay datos corruptos:
1. El sistema limpia automáticamente datos corruptos
2. Para limpieza manual: `localStorage.clear()`
3. Recargar la página después de limpiar

## Indicadores del Sistema

### 🟢 Estado Saludable:
- "✅ Variables de entorno cargadas"
- "✅ Supabase inicializado" o "⚠️ Usando localStorage"
- "✅ Aplicación inicializada correctamente"

### 🟡 Estado de Advertencia:
- "⚠️ Variables de Supabase no encontradas"
- "⚠️ Usando almacenamiento local"
- Funciona normalmente, solo sin sincronización en línea

### 🔴 Estado de Error:
- "❌ Error de sintaxis"
- "❌ Error durante la inicialización"
- Revisar consola y ejecutar diagnósticos

## Prevención de Problemas

### Para desarrollo local:
1. Usar `node inject-env.js` antes de abrir en navegador
2. Verificar que todos los scripts se carguen sin errores
3. Mantener backup de `localStorage` para datos importantes

### Para producción:
1. Las variables de entorno se inyectan automáticamente
2. El sistema es resiliente a fallos de conexión
3. Los diagnósticos se ejecutan automáticamente

## Contacto para Problemas

Si persisten los errores después de seguir esta guía:
1. Tomar captura de la consola completa
2. Anotar los pasos que llevaron al error
3. Incluir resultado de `runSystemDiagnostics()`

---
**Última actualización**: 1 de agosto de 2025
**Versión del sistema**: 2.0 con diagnósticos automáticos
