# 🌊 Configuración en Digital Ocean App Platform

## 🚀 Variables de Entorno

Para configurar tu aplicación en Digital Ocean App Platform con las credenciales de Supabase:

### 1. **Accede a tu aplicación en Digital Ocean**
- Ve a [cloud.digitalocean.com](https://cloud.digitalocean.com)
- Selecciona tu aplicación `pampero-rifas`

### 2. **Configura las Variables de Entorno**
- Ve a **Settings** → **App-Level Environment Variables**
- Agrega estas variables:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Obtener las Credenciales de Supabase**

#### 📍 **Dónde encontrarlas:**
1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

#### ⚠️ **IMPORTANTE:**
- ✅ **SÍ** usa la `anon` key (segura para frontend)
- ❌ **NUNCA** uses la `service_role` key (solo backend)

### 4. **Redeploy tu Aplicación**
- Después de agregar las variables, haz click en **Deploy**
- La aplicación se redeployará con las nuevas variables

## 🔧 Configuración Alternativa

Si prefieres no usar variables de entorno, la aplicación también funciona:
- 🎮 **Modo Demo**: Solo localStorage (datos locales)
- 🔑 **Configuración Manual**: Formulario en la aplicación

## 🛠️ Build Script para Variables de Entorno

Si necesitas inyectar las variables durante el build, usa el script `inject-env.js`:

```bash
# Durante el build en Digital Ocean
node inject-env.js
```

## 📊 Verificación

Una vez configurado, verás en la aplicación:
- 🟢 **"Conectado a Supabase"** si las variables están correctas
- 🟡 **"Configuración requerida"** si faltan variables
- 🔴 **"Error de conexión"** si las variables son incorrectas

## 🔍 Debug

Si hay problemas, revisa:
1. Consola del navegador (`F12`)
2. Logs de la aplicación en Digital Ocean
3. Configuración de variables en Digital Ocean

---

¿Necesitas ayuda? Contacta al soporte técnico: 📧 soporte@pampero.com
