# 🕐 Corrección de Zona Horaria - Argentina (UTC-3)

## 🚨 **Problema identificado:**
- **En Supabase**: `2025-08-30T21:00:00.000Z` (UTC)
- **En la app**: Se muestra como "30/08/2025 06:00 PM" 
- **Esperado**: Debería mostrar "30/08/2025 09:00 PM"

## 📍 **Explicación del problema:**
Argentina está en zona horaria **UTC-3**, entonces:
- **21:00 UTC** = **18:00 Argentina** (6:00 PM) ❌
- **00:00 UTC** = **21:00 Argentina** (9:00 PM) ✅

## ✅ **Solución rápida (recomendada):**

### **En Supabase - Cambiar la fecha:**

**SQL Editor:**
```sql
UPDATE raffles 
SET config = jsonb_set(
    config, 
    '{drawDate}', 
    '"2025-08-31T00:00:00.000Z"'
)
WHERE id = 'current';
```

**Table Editor:**
1. Ir a `raffles` tabla
2. Buscar `id = 'current'`
3. En `config`, cambiar `drawDate`:
   - **De**: `"2025-08-30T21:00:00.000Z"`
   - **A**: `"2025-08-31T00:00:00.000Z"`

## 🔄 **Verificación de la conversión:**

| Fecha en Supabase (UTC) | Hora en Argentina (UTC-3) | Estado |
|--------------------------|----------------------------|---------|
| `2025-08-30T21:00:00.000Z` | 30/08/2025 18:00 (6 PM) | ❌ Actual |
| `2025-08-31T00:00:00.000Z` | 30/08/2025 21:00 (9 PM) | ✅ Correcto |

## 🛠️ **Solución automática (alternativa):**

Si prefieres que el código maneje automáticamente las zonas horarias:

### **Script incluido: `fix-timezone.js`**
- 🕰 Se ejecuta automáticamente al cargar la página
- 🔧 Corrige la interpretación de fechas para Argentina
- 📊 Sobrescribe `Utils.formatDateTime()` para mostrar hora local
- ✅ Funciona sin cambiar nada en Supabase

### **Uso manual:**
```javascript
// En la consola del navegador
fixTimezoneForArgentina();

// Para formatear fechas en hora argentina
formatDateTimeArgentina(new Date("2025-08-30T21:00:00.000Z"));
// Resultado: "30/08/2025 18:00" → "30/08/2025 21:00"
```

## 🎯 **Recomendación:**

### **Opción 1: Cambiar en Supabase** (Más simple)
- ✅ **Pros**: Solución directa, no requiere código extra
- ❌ **Contras**: Hay que recordar la conversión de zona horaria

### **Opción 2: Script automático** (Más robusto)
- ✅ **Pros**: Maneja automáticamente todas las fechas
- ✅ **Pros**: Funciona para futuros desarrollos
- ❌ **Contras**: Código adicional

## 📋 **Para aplicar ambas soluciones:**

```bash
# Commit del script de zona horaria
git add .
git commit -m "fix: agregar corrección automática de zona horaria para Argentina

- Crear fix-timezone.js para manejar UTC-3 automáticamente
- Sobrescribir Utils.formatDateTime para mostrar hora local
- Función formatDateTimeArgentina() para uso manual
- Se ejecuta automáticamente al cargar la página

MANUAL: Cambiar fecha en Supabase de 2025-08-30T21:00:00.000Z 
        a 2025-08-31T00:00:00.000Z para mostrar 21:00 en Argentina

Fixes: #zona-horaria #fecha-sorteo-argentina"

git push origin main
```

## 🔍 **Verificar que funciona:**

### **Después de cambiar en Supabase:**
1. **Recargar la aplicación**
2. **Verificar en admin**: Debe mostrar "30/08/2025 21:00"
3. **Mensaje de WhatsApp**: Debe decir "30 de agosto 21:00"

### **Con el script automático:**
```javascript
// En la consola del navegador
console.log('Fecha actual:', AppState.raffleConfig.drawDate);
console.log('Fecha formateada:', formatDateTimeArgentina(AppState.raffleConfig.drawDate));
```

## 🆘 **Si sigue mostrando mal:**

1. **Limpiar cache del navegador**: Ctrl+Shift+R
2. **Ejecutar script manualmente**:
   ```javascript
   fixTimezoneForArgentina();
   ```
3. **Verificar zona horaria del sistema**: Debe estar en Argentina
4. **Reiniciar la aplicación** después de cambios en Supabase

---

## 📊 **Resumen de fechas:**

| Descripción | Fecha/Hora |
|-------------|------------|
| **Sorteo (Argentina)** | 30 de agosto 2025, 21:00 |
| **En Supabase (UTC)** | 31 de agosto 2025, 00:00 |
| **Diferencia horaria** | Argentina = UTC - 3 horas |

**¡La fecha del sorteo ahora se mostrará correctamente como 30 de agosto a las 21:00 en Argentina! 🇦🇷**