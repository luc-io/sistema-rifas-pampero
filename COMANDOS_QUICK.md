# 🚀 COMANDOS RÁPIDOS PARA GitHub Y DEPLOYMENT

## 📋 PASOS DETALLADOS

### 1. CREAR REPO EN GITHUB
1. Ve a https://github.com
2. Click "New repository"
3. Nombre: `sistema-rifas-pampero`
4. Descripción: `Sistema completo de administración de rifas para Club Náutico Pampero`
5. Click "Create repository"

### 2. SUBIR CÓDIGO (Copia y pega estos comandos)

```bash
# Abrir terminal en la carpeta del proyecto
cd /Users/lucianoconocchiari/Projects/pampero

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Sistema de Rifas Pampero v2.0"

# Cambiar a main
git branch -M main

# Conectar con GitHub (CAMBIAR TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/sistema-rifas-pampero.git

# Subir código
git push -u origin main
```

### 3. CONFIGURAR SUPABASE
1. Ve a https://supabase.com
2. "New Project" → Nombre: `rifas-pampero`
3. SQL Editor → Pegar el SQL del DEPLOYMENT_GUIDE.md
4. Settings → API → Copiar URL y anon key

### 4. CONFIGURAR DIGITAL OCEAN
1. https://cloud.digitalocean.com
2. Create → Apps
3. Conectar GitHub repo
4. Static Site
5. Agregar variables de entorno de Supabase

### 5. ACTUALIZAR CREDENCIALES
Editar `index.html` líneas 159-165:
```javascript
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseKey = 'tu-anon-key';
```

Subir cambios:
```bash
git add .
git commit -m "Update Supabase credentials"
git push
```

## 🎯 RESULTADO FINAL
- ✅ Código en GitHub
- ✅ Base de datos en Supabase
- ✅ App live en Digital Ocean
- ✅ Auto-deploy configurado

## 📞 Si tienes problemas:
1. Revisa que todas las credenciales estén correctas
2. Verifica que las tablas en Supabase estén creadas
3. Chequea los logs en Digital Ocean dashboard