# 📱 Guía para Cambiar Instagram de @vela.pnbe a @pampero.pnbe

## ✅ **CAMBIOS YA REALIZADOS**

### 📝 **Archivos actualizados:**
- ✅ `js/env-config.js` - Valor por defecto cambiado a `@pampero.pnbe`
- ✅ `inject-env.js` - Valor por defecto de respaldo cambiado
- ✅ `js/update-instagram.js` - Script para forzar actualización (NUEVO)
- ✅ `index.html` - Script agregado para auto-gestión

## 🔧 **PASOS PARA APLICAR EL CAMBIO**

### **PASO 1: Variable de entorno en Digital Ocean ✅**
Ya configuraste:
```bash
RAFFLE_CLUB_INSTAGRAM=@pampero.pnbe
```

### **PASO 2: Forzar rebuild en Digital Ocean**
1. Ir a tu app en Digital Ocean
2. Ir a la pestaña **"Settings"**
3. Scroll hasta **"App Spec"**
4. Hacer clic en **"Edit"** 
5. Hacer clic en **"Save"** (sin cambios)
6. Esto forzará un nuevo deployment con las variables actualizadas

### **PASO 3: Verificar en el sitio web**
Después del deployment:

1. **Abrir el sitio web**
2. **Abrir consola del navegador** (F12 → Console)
3. **Ejecutar comando de verificación**:
   ```javascript
   checkInstagramConfig()
   ```

### **PASO 4: Forzar actualización si es necesario**
Si aún muestra `@vela.pnbe`, ejecutar:
```javascript
updateClubInstagram()
```

## 🔍 **CÓMO VERIFICAR QUE FUNCIONA**

### ✅ **Señales de éxito:**
- Variables de entorno muestran `@pampero.pnbe`
- El formulario de configuración muestra `@pampero.pnbe` como valor predeterminado
- Los compradores ven el nuevo Instagram en sus formularios
- Los datos guardados en Supabase usan el nuevo Instagram

### ❌ **Si persiste @vela.pnbe:**
1. Verificar que el deployment terminó correctamente
2. Hacer **hard refresh** (Ctrl+Shift+R)
3. Ejecutar `updateClubInstagram()` manualmente
4. Verificar que la variable esté bien configurada en Digital Ocean

## 🛠️ **COMANDOS DE DIAGNÓSTICO**

En la consola del navegador:

```javascript
// Verificar estado actual
checkInstagramConfig()

// Forzar actualización
updateClubInstagram()

// Verificar variables de entorno
console.log(window.ENV_RAFFLE_CONFIG.clubInstagram)

// Ver estado de la aplicación
console.log(window.AppState?.raffleConfig?.clubInstagram)
```

## 📱 **DÓNDE SE VE EL CAMBIO**

### 🔍 **Lugares donde aparece el Instagram:**
1. **Formulario de compra** - Campo "Instagram (opcional)"
2. **Configuración de rifa** - Campo "Instagram del Club"
3. **Datos guardados** - En ventas y configuración
4. **Notificaciones** - Mensajes sobre seguir novedades

### 🎯 **Funcionalidad:**
- Se muestra a los compradores para que puedan seguir novedades sobre navegación
- Es un campo opcional en el proceso de compra
- Se guarda junto con los datos del comprador
- Ayuda a mantener contacto con la comunidad náutica

## ⚡ **PROCESO AUTOMÁTICO**

El script `update-instagram.js` incluye:

### 🔄 **Verificación automática:**
- Al cargar la página, verifica si hay discrepancias
- Compara variables de entorno vs datos locales
- Alerta si encuentra valores antiguos

### 🛠️ **Herramientas manuales:**
- `updateClubInstagram()` - Fuerza actualización completa
- `checkInstagramConfig()` - Muestra estado de todas las fuentes
- Auto-detección de cambios pendientes

## 🚨 **TROUBLESHOOTING**

### **Problema: Sigue mostrando @vela.pnbe**
**Solución:**
1. Verificar deployment completado en Digital Ocean
2. Hard refresh del navegador (Ctrl+Shift+R)
3. Ejecutar `updateClubInstagram()` en consola
4. Verificar variable de entorno: `echo $RAFFLE_CLUB_INSTAGRAM`

### **Problema: Error al actualizar**
**Solución:**
1. Verificar que Supabase esté conectado
2. Revisar consola de errores
3. Intentar sincronización: `forceSyncFromSupabase()`
4. Verificar permisos en Digital Ocean

### **Problema: Cambio no persistente**
**Solución:**
1. El cambio debe hacerse a nivel de variables de entorno
2. Los valores hardcodeados ahora apuntan a `@pampero.pnbe`
3. Verificar que el deployment incluya los nuevos archivos

## ✅ **CHECKLIST FINAL**

- [ ] ✅ Variable `RAFFLE_CLUB_INSTAGRAM=@pampero.pnbe` en Digital Ocean
- [ ] ✅ Deployment completado exitosamente  
- [ ] ✅ Hard refresh del navegador realizado
- [ ] ✅ `checkInstagramConfig()` muestra `@pampero.pnbe`
- [ ] ✅ Formulario de configuración muestra valor correcto
- [ ] ✅ Nuevas ventas usan el Instagram actualizado
- [ ] ✅ Sin errores en consola del navegador

## 🎉 **RESULTADO ESPERADO**

Después de seguir estos pasos:
- 🔴 **Antes**: Instagram `@vela.pnbe` en todos lados
- 🟢 **Después**: Instagram `@pampero.pnbe` en toda la aplicación
- ✅ **Compatibilidad**: Datos existentes mantienen integridad
- 🔄 **Automático**: Futuras configuraciones usan el nuevo valor

---

**Nota importante**: Los datos históricos (ventas/compradores anteriores) que ya tengan `@vela.pnbe` **mantendrán ese valor** por integridad de datos. Solo las **nuevas configuraciones y ventas** usarán `@pampero.pnbe`.
