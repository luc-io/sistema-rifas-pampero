# 🎯 Sistema de Asignaciones - Guía de Uso

## 📋 ¿Qué cambió?

El sistema de rifas ahora incluye **asignaciones obligatorias** donde el organizador puede asignar números específicos a vendedores que se comprometen a pagarlos.

## ⚡ Inicio Rápido

### 1. Configurar Base de Datos
Ejecuta el script SQL para crear las nuevas tablas:
```sql
-- En tu panel de Supabase, ejecuta:
-- sql/assignments_migration.sql
```

### 2. Crear una Asignación
1. Ve a la pestaña **"Asignaciones"**
2. Completa los datos del vendedor
3. Especifica los números:
   - **Rango**: `001-010` (del 1 al 10)
   - **Específicos**: `001,005,020,025`
4. Haz clic en **"Asignar y Notificar"**

### 3. Gestionar Asignaciones
- **Estado Asignado** 🟡: Vendedor debe confirmar pago
- **Estado Pagado** ✅: Pago confirmado, puede editar titulares
- **Estado Confirmado** 🎯: Listo para sorteo (no se puede modificar)

## 🎨 Estados de Números

| Color | Estado | Descripción |
|-------|--------|-------------|
| 🟢 Verde | Disponible | Sin asignar, libre para venta |
| 🟡 Amarillo | Asignado | Vendedor responsable del pago |
| 🔵 Azul | Confirmado | Pagado y listo para sorteo |
| 🔴 Rojo | Vendido | Vendido directamente (sistema antiguo) |
| ⏰ Beige | Reservado | Reserva temporal (sistema antiguo) |

## 📱 Flujo de Trabajo

### Para el Organizador:
1. **Crear asignación** → Se envía WhatsApp automático al vendedor
2. **Marcar como pagado** → Cuando el vendedor confirma pago
3. **Confirmar para sorteo** → Antes del sorteo, crear ventas finales

### Para el Vendedor:
1. **Recibe WhatsApp** con números asignados
2. **Puede editar titulares** de cada número antes del sorteo
3. **Confirma pago** al organizador
4. **Números quedan confirmados** para el sorteo

## 🔧 Funciones Principales

### Asignar Números
```javascript
AssignmentsManager.createAssignment()
```

### Editar Titulares
```javascript
AssignmentsManager.editOwners(assignmentId)
```

### Confirmar Pago
```javascript
AssignmentsManager.markAsPaid(assignmentId)
```

### Finalizar para Sorteo
```javascript
AssignmentsManager.confirmAssignment(assignmentId)
```

## 🗄️ Estructura de Base de Datos

### Tabla `assignments`
```sql
- id: ID único de la asignación
- seller_name/seller_lastname: Datos del vendedor
- numbers: Array de números asignados
- total_amount: Monto total a pagar
- status: assigned|paid|confirmed
- payment_deadline: Fecha límite de pago
```

### Tabla `number_owners`
```sql
- assignment_id: Referencia a asignación
- number_value: Número específico
- owner_name/owner_lastname: Titular del número
- edited_at: Última modificación
```

## 🚀 Ventajas del Sistema

1. **Control total**: El organizador asigna números específicos
2. **Compromiso claro**: Vendedor se compromete a pagar
3. **Flexibilidad**: Puede cambiar titulares hasta el sorteo
4. **Trazabilidad**: Historial completo de cambios
5. **WhatsApp integrado**: Notificaciones automáticas

## 🔄 Migración

El sistema mantiene **compatibilidad total** con:
- ✅ Ventas directas existentes
- ✅ Reservas temporales (sistema anterior)
- ✅ Todos los datos históricos

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que las tablas estén creadas en Supabase
3. Confirma que las credenciales de Supabase estén configuradas

---
**¡El sistema está listo para gestionar rifas de manera más organizada y eficiente!** 🎉
