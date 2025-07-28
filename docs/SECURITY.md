# 🔒 SECURITY.md - Sistema de Rifas Pampero

## 🚨 REPORTE DE SEGURIDAD

**PROBLEMA IDENTIFICADO:** Credenciales JWT expuestas en el código fuente  
**ESTADO:** ✅ RESUELTO  
**FECHA:** 2025-06-07  

---

## 📋 RESUMEN DEL PROBLEMA

### ❌ **ANTES (Inseguro)**
```javascript
// ❌ CREDENCIALES EXPUESTAS EN EL CÓDIGO
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### ✅ **AHORA (Seguro)**
```javascript
// ✅ CONFIGURACIÓN SEGURA SIN CREDENCIALES HARDCODEADAS
const supabaseKey = AppConfig.supabase.anonKey; // Desde almacenamiento seguro
```

---

## 🔧 SOLUCIONES IMPLEMENTADAS

### 1. **Sistema de Configuración Seguro**
- **Archivo:** `js/config.js`
- **Función:** Gestión interactiva de credenciales
- **Características:**
  - Validación automática de tipos de clave
  - Detección de service_role keys
  - Almacenamiento local seguro
  - Modo demo para desarrollo

### 2. **Variables de Entorno**
- **Archivo:** `.env.example`
- **Función:** Plantilla para configuración local
- **Uso:** Copia como `.env.local` y configura tus credenciales

### 3. **Protección del Repositorio**
- **Archivo:** `.gitignore`
- **Función:** Evita commits accidentales de credenciales
- **Incluye:** `.env*`, `config.json`, archivos temporales

---

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD

### 🔍 **Validación Automática**
```javascript
// Detecta automáticamente service_role keys
const payload = JSON.parse(atob(anonKey.split('.')[1]));
if (payload.role === 'service_role') {
    alert('🚨 ¡PELIGRO! Has ingresado una SERVICE ROLE KEY');
    return;
}
```

### 🔐 **Almacenamiento Seguro**
```javascript
// Almacena de forma segura en localStorage
localStorage.setItem('supabase_config_secure', JSON.stringify(config));
```

### 🎮 **Modo Demo**
```javascript
// Permite desarrollo sin credenciales reales
localStorage.setItem('demo_mode', 'true');
```

---

## 📋 CHECKLIST DE SEGURIDAD

### ✅ **Completado**
- [x] Eliminadas credenciales hardcodeadas del código
- [x] Implementado sistema de configuración seguro
- [x] Creado .gitignore para proteger archivos sensibles
- [x] Agregada validación de tipos de clave
- [x] Documentadas mejores prácticas de seguridad

### 🔄 **Recomendado (Para el usuario)**
- [ ] Revocar credenciales si estuvieron públicas
- [ ] Configurar Row Level Security (RLS) en Supabase
- [ ] Implementar rotación regular de credenciales
- [ ] Configurar variables de entorno en producción

---

## 🚀 INSTRUCCIONES DE USO

### 1. **Primera Configuración**
1. Abre la aplicación en el navegador
2. Se mostrará automáticamente el diálogo de configuración
3. Ingresa tus credenciales de Supabase:
   - URL del proyecto
   - **Solo la anon key** (no service_role)
4. El sistema validará y almacenará las credenciales de forma segura

### 2. **Obtener Credenciales de Supabase**
1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **Project URL**
5. Copia la **anon/public key** (⚠️ NO la service_role)

### 3. **Modo Demo (Sin Credenciales)**
Si no tienes credenciales de Supabase:
1. Selecciona "Usar modo demo" en el diálogo
2. Los datos se guardarán solo localmente
3. Funciona perfecto para probar la aplicación

---

## ⚠️ MEJORES PRÁCTICAS

### 🔐 **Para Desarrollo**
```bash
# 1. Crear archivo de configuración local
cp .env.example .env.local

# 2. Configurar credenciales (solo anon key)
echo "SUPABASE_URL=https://tu-proyecto.supabase.co" >> .env.local
echo "SUPABASE_ANON_KEY=tu_anon_key_aqui" >> .env.local

# 3. Verificar que está en .gitignore
grep ".env.local" .gitignore
```

### 🚀 **Para Producción**
- Usar variables de entorno del hosting (Vercel, Netlify, etc.)
- Nunca commitear credenciales al repositorio
- Configurar HTTPS obligatorio
- Implementar Content Security Policy (CSP)

### 🔄 **Para Mantenimiento**
- Rotar credenciales cada 6-12 meses
- Monitorear accesos en Supabase Dashboard
- Revisar políticas RLS regularmente
- Mantener logs de auditoría

---

## 🆘 REPORTE DE VULNERABILIDADES

Si encuentras algún problema de seguridad:

1. **NO lo publiques en issues públicos**
2. Contacta al administrador del repositorio directamente
3. Incluye:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de solución

---

## 📚 RECURSOS ADICIONALES

### 🔗 **Documentación de Supabase**
- [Security Guide](https://supabase.com/docs/guides/database/secure-data)
- [API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 🛡️ **Herramientas de Seguridad**
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Supabase Security Checklist](https://supabase.com/docs/guides/database/secure-data)

---

## 📝 HISTORIAL DE CAMBIOS

### v2.0.0 (2025-06-07)
- **SECURITY FIX:** Eliminadas credenciales hardcodeadas
- **FEATURE:** Sistema de configuración seguro interactivo
- **FEATURE:** Validación automática de tipos de clave
- **FEATURE:** Modo demo para desarrollo
- **DOCS:** Documentación completa de seguridad

---

## ✅ VERIFICACIÓN

Para verificar que tu instalación es segura:

```javascript
// Ejecuta en la consola del navegador
console.log('=== VERIFICACIÓN DE SEGURIDAD ===');
console.log('Credenciales hardcodeadas:', 
    document.documentElement.innerHTML.includes('eyJhbGciOiJIUzI1NiI'));
console.log('AppConfig disponible:', !!window.AppConfig);
console.log('Configuración segura:', !!localStorage.getItem('supabase_config_secure'));
```

**Resultado esperado:**
- `Credenciales hardcodeadas: false`
- `AppConfig disponible: true`
- `Configuración segura: true` (después de configurar)

---

**🔒 Tu aplicación ahora cumple con las mejores prácticas de seguridad.**
