# 🎟️ Sistema de Rifas Pampero

Sistema completo de administración de rifas desarrollado para el Club Náutico Pampero. Permite gestionar ventas, reservas, compradores y generar reportes detallados.

## 🚀 **Deploy en Vivo**
**URL:** https://orca-app-3i8d3.ondigitalocean.app/

## 📁 **Estructura del Proyecto (Organizada)**

```
rifas-pampero/
├── index.html              # 🎯 Aplicación principal
├── package.json            # 📦 Configuración Node.js
├── inject-env.js           # 🔧 Script de build para variables de entorno
├── .env.example            # 🔑 Template de variables de entorno
├── css/                    # 🎨 Estilos de la aplicación
│   └── styles.css
├── js/                     # ⚡ Lógica JavaScript (modular)
│   ├── app.js              # Punto de entrada y configuración
│   ├── config.js           # Configuración segura de credenciales
│   ├── supabase.js         # Conexión y operaciones con Supabase
│   ├── assignments.js      # Nuevo: Gestión de asignaciones
│   ├── numbers.js          # Gestión de números y compras
│   ├── admin.js            # Panel de administración
│   ├── reports.js          # Generación de reportes
│   └── utilities.js        # Utilidades y funciones compartidas
├── .github/                # 🚀 CI/CD workflows
│   └── workflows/
├── .do/                    # 🌊 Configuración Digital Ocean App Platform
│   └── app.yaml
├── docs/                   # 📚 Documentación técnica (16 archivos)
├── backups/                # 🗑️ Archivos de versiones anteriores
├── debug/                  # 🐛 Herramientas de debugging
└── scripts/                # 🔧 Scripts de utilidad
```

## 🚀 **Características Principales**

### ⚙️ **Configuración Intuitiva**
- Setup completo de rifas en interfaz gráfica
- Configuración segura de credenciales Supabase
- Validaciones en tiempo real

### 🔢 **Gestión Visual de Números**
- Grid interactivo responsive (móvil-friendly)
- Estados visuales: Disponible, Seleccionado, Reservado, Vendido
- Selección múltiple intuitiva
- Sistema de reservas con expiración automática

### 💰 **Procesamiento de Ventas**
- Múltiples métodos de pago (efectivo/transferencia)
- Autocompletado de compradores recurrentes
- Integración automática con WhatsApp
- Validación completa de datos

### 📊 **Panel de Administración**
- Estadísticas en tiempo real
- Gestión de reservas activas
- Búsqueda y filtros avanzados
- Acciones administrativas (confirmar/eliminar)

### 📈 **Reportes Detallados**
- Análisis de ventas y compradores
- Estadísticas de membresía del club
- Exportación a CSV
- Filtros temporales

### 💾 **Persistencia Dual**
- **Supabase** (PostgreSQL en la nube) como fuente principal
- **localStorage** como fallback automático
- Sincronización transparente entre ambos

## 🛠️ **Tecnologías**

- **Frontend:** HTML5, CSS3, JavaScript ES6+ (vanilla)
- **Base de datos:** Supabase (PostgreSQL) + localStorage fallback
- **Deploy:** Digital Ocean App Platform (static site)
- **Build:** Node.js script para inyección de variables de entorno

## ⚡ **Deploy Rápido**

### **1. Commit los cambios:**
```bash
git add .
git commit -m "Proyecto limpio y organizado"
git push origin main
```

### **2. Digital Ocean hace redeploy automático** 🎉

### **3. Configurar primera rifa en la interfaz**

## 🎯 **Uso de la Aplicación**

1. **Abrir:** https://orca-app-3i8d3.ondigitalocean.app/
2. **Configurar:** Completar datos en pestaña "Configurar"
3. **Vender:** Seleccionar números en pestaña "Números"
4. **Administrar:** Ver estadísticas en "Administrar"
5. **Reportes:** Exportar datos en "Reportes"

## 📱 **Optimización Móvil**

- Diseño responsive mobile-first
- Grid de números adaptable al tamaño de pantalla
- Navegación táctil optimizada
- Formularios adaptados para móviles

## 🔒 **Seguridad**

- Configuración segura de credenciales Supabase
- Validación completa de entrada de datos
- Manejo seguro de transacciones
- No exposición de claves sensibles en el código

## 🚀 **Rendimiento**

- Carga modular de JavaScript
- Actualización eficiente del DOM
- Verificación optimizada de reservas
- Debounce en búsquedas

## 📖 **Documentación Adicional**

- **Deploy:** Ver `docs/DEPLOY.md`
- **Configuración:** Ver `docs/SETUP_RAPIDO.md`
- **Troubleshooting:** Ver `docs/BUILD_FIX.md`
- **Changelog:** Ver `docs/CHANGELOG.md`

## 🤝 **Soporte**

Sistema desarrollado para **Club Náutico Pampero**.
Para soporte técnico, contactar al desarrollador.

## 🎯 **NUEVO: Sistema de Asignaciones**

El sistema ahora incluye una nueva funcionalidad de **asignaciones obligatorias**:

- **Asignación directa**: El organizador asigna números específicos a vendedores
- **Compromiso de pago**: El vendedor se compromete a pagar los números asignados
- **Edición de titulares**: Posibilidad de cambiar nombres hasta antes del sorteo
- **Estados visuales**: Números Asignados (🟡) y Confirmados (🔵)
- **WhatsApp integrado**: Notificaciones automáticas a vendedores
- **Gestión completa**: Desde asignación hasta confirmación final

**📖 Guía completa:** Ver `ASSIGNMENTS_GUIDE.md`

---

✨ **Sistema profesional, seguro y listo para producción** ✨

AIzaSyD-jURMnPjLogmHfyFHncEXw1fP5_SqBUU api key

758158064041-4h6rk4jovr8k82li4k27571cfiu3iitb.apps.googleusercontent.com client id