# 🚀 DEPLOYMENT GUIDE - Sistema de Rifas Pampero

## 📋 PASO A PASO COMPLETO

### 1️⃣ CREAR REPOSITORIO EN GITHUB

1. **Ve a** [GitHub](https://github.com) y logueate
2. **Click** en el botón verde "New repository"
3. **Nombre**: `sistema-rifas-pampero`
4. **Descripción**: `Sistema completo de administración de rifas para Club Náutico Pampero`
5. **Público/Privado**: Como prefieras
6. **NO marques** "Add a README file" (ya tenemos uno)
7. **Click** "Create repository"

### 2️⃣ SUBIR CÓDIGO A GITHUB

Abre tu terminal/comando en la carpeta del proyecto y ejecuta:

```bash
# Inicializar git
git init

# Agregar todos los archivos
git add .

# Hacer primer commit
git commit -m "Initial commit: Sistema de Rifas Pampero v2.0"

# Cambiar a rama main
git branch -M main

# Conectar con tu repo (CAMBIAR TU-USUARIO por tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/sistema-rifas-pampero.git

# Subir código
git push -u origin main
```

### 3️⃣ CONFIGURAR SUPABASE

1. **Ve a** [Supabase](https://supabase.com)
2. **Click** "Start your project" → "Sign in with GitHub"
3. **Click** "New Project"
4. **Nombre**: `rifas-pampero`
5. **Database Password**: Genera una segura
6. **Region**: Closest to you (ej: South America)
7. **Click** "Create new project"

#### Crear las tablas:
1. **Ve a** "SQL Editor" en el dashboard
2. **Copia y pega** este SQL:

```sql
-- Tabla para configuraciones de rifas
CREATE TABLE public.raffles (
    id TEXT PRIMARY KEY DEFAULT 'current',
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para ventas
CREATE TABLE public.sales (
    id BIGSERIAL PRIMARY KEY,
    raffle_id TEXT DEFAULT 'current',
    numbers INTEGER[] NOT NULL,
    buyer JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para reservas
CREATE TABLE public.reservations (
    id BIGSERIAL PRIMARY KEY,
    raffle_id TEXT DEFAULT 'current',
    numbers INTEGER[] NOT NULL,
    buyer JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejor rendimiento
CREATE INDEX idx_sales_raffle_id ON public.sales(raffle_id);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_reservations_raffle_id ON public.reservations(raffle_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_expires_at ON public.reservations(expires_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (ajustar según necesidades de seguridad)
CREATE POLICY "Enable read access for all users" ON public.raffles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.raffles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.raffles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.raffles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.sales FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.reservations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.reservations FOR DELETE USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.raffles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

3. **Click** "Run" para ejecutar el SQL

#### Obtener credenciales:
1. **Ve a** "Settings" → "API"
2. **Copia** el "Project URL" (ej: `https://abcdefg.supabase.co`)
3. **Copia** el "anon public" key

### 4️⃣ CONFIGURAR DIGITAL OCEAN APP PLATFORM

1. **Ve a** [Digital Ocean](https://cloud.digitalocean.com)
2. **Click** "Create" → "Apps"
3. **Selecciona** "GitHub" como source
4. **Autoriza** Digital Ocean a acceder a GitHub
5. **Selecciona** tu repositorio `sistema-rifas-pampero`
6. **Branch**: `main`
7. **Auto-deploy**: ✅ habilitado
8. **Click** "Next"

#### Configurar la app:
1. **Type**: Static Site
2. **Name**: `frontend`
3. **Build Command**: (dejar vacío)
4. **Output Directory**: `/`
5. **Click** "Next"

#### Variables de entorno:
1. **Click** "Edit" junto a tu app
2. **Ve a** "Environment Variables"
3. **Agregar**:
   - `SUPABASE_URL`: tu Project URL de Supabase
   - `SUPABASE_ANON_KEY`: tu anon key de Supabase

4. **App info**:
   - **Name**: `rifas-pampero`
   - **Region**: Closest to you
5. **Click** "Next" → "Create Resources"

### 5️⃣ ACTUALIZAR CREDENCIALES EN EL CÓDIGO

En tu código local, edita el archivo `index.html` y reemplaza:

```javascript
// Líneas 159-165 aproximadamente
const supabaseUrl = 'https://tu-proyecto.supabase.co';  // ← TU PROJECT URL
const supabaseKey = 'tu-anon-key';  // ← TU ANON KEY
```

Luego actualiza en GitHub:

```bash
git add .
git commit -m "Update Supabase credentials"
git push
```

### 6️⃣ VERIFICAR DEPLOYMENT

1. **En Digital Ocean**, espera que termine el build (2-5 minutos)
2. **Click** en tu app para ver la URL live
3. **Abre** la URL en tu navegador
4. **Verifica** que aparezca "🚀 Supabase conectado" en verde

### 🎉 ¡LISTO!

Tu app estará en: `https://rifas-pampero-xxxxx.ondigitalocean.app`

## 🔧 COMANDOS ÚTILES

```bash
# Ver status de git
git status

# Hacer cambios y subirlos
git add .
git commit -m "Descripción del cambio"
git push

# Ver logs de deployment en Digital Ocean
# (desde el dashboard de la app)

# Conectar a Supabase desde terminal (opcional)
npx supabase login
```

## 🚨 TROUBLESHOOTING

### Error de Supabase:
- Verifica las credenciales en `index.html`
- Asegúrate que las tablas estén creadas
- Revisa que RLS esté configurado

### Error de deployment:
- Verifica que el repo esté público o que Digital Ocean tenga permisos
- Revisa los logs en Digital Ocean dashboard
- Asegúrate que `index.html` esté en la raíz del repo

### App no carga:
- Abre Developer Tools (F12) y revisa la consola
- Verifica que todos los archivos JS estén cargando
- Confirma que Supabase responda

## 💰 COSTOS ESTIMADOS

- **Supabase**: Gratis hasta 500MB + 2GB bandwidth
- **Digital Ocean App Platform**: ~$5/mes
- **Total**: ~$5/mes

## 📱 PRÓXIMOS PASOS

1. Personalizar la app según tus necesidades
2. Configurar dominio personalizado en Digital Ocean
3. Configurar SSL (automático en Digital Ocean)
4. Hacer backups regulares
5. Monitorear uso y performance

¡Tu sistema de rifas está ahora en producción! 🚀