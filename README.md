# 🎟️ Sistema de Rifas Pampero

Sistema completo de administración de rifas desarrollado para el Club Náutico Pampero. Permite gestionar ventas, reservas, compradores y generar reportes detallados.

## 📁 Estructura del Proyecto

```
pampero/
├── index.html              # Archivo principal de la aplicación
├── admin-mejorado.html     # Versión anterior (monolítica) - DEPRECIADO
├── admin.html              # Versión básica anterior
├── css/
│   └── styles.css          # Estilos completos de la aplicación
├── js/
│   ├── utils.js            # Utilidades compartidas y estado global
│   ├── app.js              # Punto de entrada y configuración principal
│   ├── numbers.js          # Gestión de números, selección y compras
│   ├── admin.js            # Panel de administración y estadísticas
│   ├── reports.js          # Generación de reportes detallados
│   └── backup.js           # Gestión de copias de seguridad
└── data/                   # Directorio para archivos de datos (vacío)
```

## 🚀 Características Principales

### ⚙️ Configuración de Rifas
- Configuración completa de rifas (nombre, premio, cantidad de números, precio)
- Gestión de organización y datos de contacto
- Configuración de tiempo límite para reservas

### 🔢 Gestión de Números
- Grid visual interactivo de números disponibles
- Sistema de selección múltiple
- Estados: Disponible, Seleccionado, Reservado, Vendido
- Reservas temporales con expiración automática

### 💰 Procesamiento de Ventas
- Registro completo de compradores (datos personales, intereses, membresía)
- Múltiples métodos de pago (efectivo, transferencia)
- Autocompletado de compradores recurrentes
- Generación automática de mensajes de WhatsApp

### 📊 Panel de Administración
- Estadísticas en tiempo real
- Gestión de reservas activas
- Lista completa de ventas con filtros
- Acciones administrativas (confirmar pagos, eliminar ventas)

### 📈 Reportes Detallados
- Reporte general con métricas clave
- Análisis de compradores (top 10, consolidación)
- Estadísticas de números vendidos
- Análisis de interés en navegación
- Reporte de membresía del club
- Exportación a CSV

### 💾 Sistema de Backup
- Backup completo en formato JSON
- Importación y restauración de datos
- Validación de integridad de datos
- Exportación selectiva (solo configuración, solo ventas)

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con Grid y Flexbox
- **JavaScript ES6+**: Funcionalidad modular
- **LocalStorage API**: Persistencia de datos local (fallback)
- **Firebase/Supabase**: Bases de datos en la nube (opcional)
- **Web APIs**: File API para import/export
- **PWA Ready**: Funciona offline y es instalable

## 🚀 Despliegue y Configuración

### 📁 Versiones Disponibles:
- **`index.html`** - Versión local (localStorage)
- **`index-firebase.html`** - Con Firebase (Google)
- **`index-supabase.html`** - Con Supabase (PostgreSQL)

### 🌊 Subir a Digital Ocean:
1. **App Platform** (recomendado): Conectar GitHub, deploy automático
2. **Droplet + Nginx**: Control total del servidor
3. **Spaces**: Storage estático con CDN

### 💾 Opciones de Base de Datos:
- **Local**: Solo localStorage (desarrollo/pruebas)
- **Firebase**: Fácil, escalable, tiempo real
- **Supabase**: PostgreSQL, open source, potente
- **JSONBin**: API REST simple para prototipos

## 🎯 Uso de la Aplicación

### Configuración Inicial
1. Elegir versión de archivo (local/Firebase/Supabase)
2. Abrir en navegador web
3. Ir a la pestaña "Configurar"
4. Completar todos los campos requeridos
5. Hacer clic en "Crear Rifa"

### Gestión de Ventas
1. Ir a la pestaña "Números"
2. Seleccionar números disponibles
3. Elegir "Comprar Ahora" o "Reservar"
4. Completar datos del comprador
5. Confirmar la transacción

### Administración
1. Ir a la pestaña "Administrar"
2. Ver estadísticas en tiempo real
3. Gestionar reservas activas
4. Buscar y filtrar ventas
5. Exportar datos

### Reportes
1. Ir a la pestaña "Reportes"
2. Aplicar filtros según necesidad
3. Ver análisis detallados
4. Exportar reportes específicos

### Backup y Seguridad
1. Ir a la pestaña "Backup"
2. Realizar backups regulares
3. Validar integridad de datos
4. Restaurar desde backup si es necesario

## 🔧 Arquitectura Modular

### Estado Global (`AppState`)
```javascript
{
    raffleConfig: null,      // Configuración de la rifa
    selectedNumbers: [],     // Números seleccionados actualmente
    sales: [],              // Array de ventas realizadas
    reservations: [],       // Array de reservas activas/expiradas
    currentAction: 'buy',   // Acción actual ('buy' o 'reserve')
    selectedBuyer: null     // Comprador seleccionado del autocompletado
}
```

### Módulos Principales

#### `Utils` - Utilidades Compartidas
- Validaciones de datos
- Formateo de números y fechas
- Gestión de notificaciones
- Manejo de almacenamiento local

#### `RaffleApp` - Aplicación Principal
- Configuración inicial de rifas
- Inicialización de módulos
- Gestión del ciclo de vida

#### `NumbersManager` - Gestión de Números
- Creación del grid de números
- Manejo de selecciones
- Procesamiento de compras y reservas
- Generación de mensajes de WhatsApp

#### `AdminManager` - Panel de Administración
- Actualización de estadísticas
- Gestión de reservas
- Lista de ventas con filtros
- Acciones administrativas

#### `ReportsManager` - Generación de Reportes
- Reportes con filtros temporales
- Análisis estadístico
- Exportación de datos

#### `BackupManager` - Gestión de Backups
- Exportación/importación completa
- Validación de datos
- Limpieza de datos

## 📱 Responsive Design

La aplicación está optimizada para dispositivos móviles y tablets:
- Grid de números adaptable
- Navegación por pestañas táctil
- Formularios optimizados para móviles
- Botones de tamaño adecuado para touch

## 🔒 Seguridad y Persistencia

- Todos los datos se almacenan localmente en el navegador
- No hay transmisión de datos sensibles
- Validación de entrada en todos los formularios
- Confirmaciones para acciones destructivas
- Sistema de backup para prevenir pérdida de datos

## 🎨 Características de UX

- Interfaz intuitiva con iconos descriptivos
- Notificaciones visuales para acciones importantes
- Estados visuales claros para números (colores y símbolos)
- Autocompletado para compradores recurrentes
- Validación en tiempo real de formularios

## 🚀 Rendimiento

- Carga asíncrona de módulos
- Actualización eficiente del DOM
- Debounce en búsquedas
- Verificación periódica optimizada de reservas expiradas

## 🔄 Migración desde Versión Anterior

Para migrar desde `admin-mejorado.html`:
1. Exportar backup desde la versión anterior
2. Abrir `index.html` (nueva versión modular)
3. Importar el backup desde la pestaña "Backup"
4. Verificar que todos los datos se migraron correctamente

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Mantener la estructura modular
2. Seguir las convenciones de nomenclatura
3. Documentar nuevas funciones
4. Probar en múltiples navegadores
5. Mantener compatibilidad con versiones anteriores

## 📞 Soporte

Sistema desarrollado para Club Náutico Pampero.
Para soporte técnico, contactar al desarrollador.

---

✨ **¡Gracias por usar el Sistema de Rifas Pampero!** ✨