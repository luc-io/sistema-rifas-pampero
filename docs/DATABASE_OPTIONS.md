# 💾 Opciones de Base de Datos Frontend

## 🔥 Firebase (Google) - Recomendado

### ✅ Pros:
- **Gratuito** hasta 50k lecturas/día
- **Tiempo real** automático
- **Escalable** masivamente
- **Fácil** configuración
- **Autenticación** incluida

### 📋 Setup:
1. **Crear proyecto**: [Firebase Console](https://console.firebase.google.com)
2. **Activar Firestore Database**
3. **Obtener credenciales**:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "proyecto.firebaseapp.com",
     projectId: "proyecto-id",
     // ...
   };
   ```
4. **Agregar a index.html**:
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"></script>
   <script src="js/firebase.js"></script>
   ```

### 💰 Costo: 
- **Gratis**: 50k lecturas/día, 20k escrituras/día
- **Pagado**: $0.06 por 100k operaciones

---

## 🚀 Supabase - Open Source

### ✅ Pros:
- **Open source** (puedes self-host)
- **PostgreSQL** real
- **API REST** automática
- **Tiempo real** incluido
- **Dashboard SQL** completo

### 📋 Setup:
1. **Crear proyecto**: [Supabase](https://supabase.com)
2. **Crear tablas**:
   ```sql
   -- Tabla configuraciones
   CREATE TABLE raffles (
     id TEXT PRIMARY KEY,
     config JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Tabla ventas
   CREATE TABLE sales (
     id SERIAL PRIMARY KEY,
     numbers INTEGER[],
     buyer JSONB,
     payment_method TEXT,
     total DECIMAL,
     status TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Tabla reservas
   CREATE TABLE reservations (
     id SERIAL PRIMARY KEY,
     numbers INTEGER[],
     buyer JSONB,
     total DECIMAL,
     status TEXT,
     expires_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Agregar a index.html**:
   ```html
   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   ```

### 💰 Costo: 
- **Gratis**: 500MB DB, 2GB bandwidth
- **Pro**: $25/mes por proyecto

---

## 🗄️ PocketBase - Ultra Simple

### ✅ Pros:
- **Un solo archivo** ejecutable
- **Admin UI** incluido
- **Tiempo real** WebSockets
- **Self-hosted** en tu servidor
- **SQLite** embebido

### 📋 Setup:
1. **Descargar**: [PocketBase](https://pocketbase.io)
2. **Ejecutar en servidor**:
   ```bash
   ./pocketbase serve --http=0.0.0.0:8080
   ```
3. **Configurar colecciones** via Admin UI
4. **Usar JS SDK**:
   ```html
   <script src="https://unpkg.com/pocketbase@latest/dist/pocketbase.umd.js"></script>
   ```

### 💰 Costo: **Gratis** (solo hosting)

---

## 📦 JSONBin - Súper Simple

### ✅ Pros:
- **Setup inmediato** (5 minutos)
- **API REST** simple
- **Sin configuración** de servidor
- **Perfecto** para prototipos

### 📋 Setup:
1. **Registrarse**: [JSONBin](https://jsonbin.io)
2. **Crear bin** para cada tipo de dato
3. **Usar API**:
   ```javascript
   // Guardar
   fetch('https://api.jsonbin.io/v3/b/TU-BIN-ID', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'X-Master-Key': 'TU-API-KEY'
     },
     body: JSON.stringify(datos)
   });
   ```

### 💰 Costo: 
- **Gratis**: 10k requests/mes
- **Pro**: $5/mes

---

## 🏠 IndexedDB - Local Mejorado

### ✅ Pros:
- **Completamente local**
- **Sin límites** de tamaño
- **Más rápido** que localStorage
- **Transacciones** ACID

### 📋 Setup:
- Ya incluido en navegadores modernos
- Solo necesitas una librería como **Dexie.js**

### 💰 Costo: **Gratis**

---

## 🎯 Recomendación por Caso de Uso

### 🔰 **Empezando / Prototipo**:
**JSONBin** - Setup en 5 minutos

### 🏢 **Producción Pequeña/Mediana**:
**Firebase** - Confiable y escalable

### 🛠️ **Control Total**:
**Supabase** - Open source y potente

### 💰 **Presupuesto Mínimo**:
**PocketBase** - Self-hosted gratis

### 🚀 **Máximo Rendimiento**:
**IndexedDB + Firebase** - Híbrido local/nube