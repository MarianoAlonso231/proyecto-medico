# 🚀 Migración de localStorage a Supabase

## Resumen de Cambios

Tu esquema de base de datos SQL está **excelente**, pero tu código actual en `/lib` está usando `localStorage` en lugar de Supabase. He reestructurado completamente la carpeta `/lib` para aprovechar al máximo tu base de datos.

## 📁 Nueva Estructura de `/lib`

```
lib/
├── supabase.ts                 # Cliente y tipos de Supabase
├── database/
│   ├── index.ts               # Exportaciones centralizadas
│   ├── pacientes.ts           # Operaciones CRUD de pacientes
│   ├── turnos.ts              # Operaciones CRUD de turnos
│   └── configuracion.ts       # Configuración del médico
├── validations-supabase.ts    # Validaciones asíncronas con BD
├── validations.ts             # [DEPRECADO] Validaciones locales
├── storage.ts                 # [DEPRECADO] localStorage
├── auth.ts                    # Autenticación
├── statistics.ts              # Estadísticas
├── dateUtils.ts               # Utilidades de fecha
└── utils.ts                   # Utilidades generales
```

## 🔧 Pasos para Completar la Migración

### 1. Instalar Dependencias de Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 3. Ejecutar la Migración SQL

El archivo `supabase/migrations/20250607193553_humble_cottage.sql` ya está perfecto. Solo asegúrate de que esté aplicado en tu proyecto Supabase.

### 4. Actualizar Componentes

Cambia las importaciones en tus componentes:

**❌ Antes:**
```typescript
import { getPacientes, addPaciente } from '@/lib/storage';
```

**✅ Ahora:**
```typescript
import { getPacientes, addPaciente } from '@/lib/database';
```

### 5. Manejar Operaciones Asíncronas

**❌ Antes (síncrono):**
```typescript
const pacientes = getPacientes();
```

**✅ Ahora (asíncrono):**
```typescript
const pacientes = await getPacientes();
```

### 6. Usar Nuevas Validaciones

**✅ Validaciones mejoradas con verificación en BD:**
```typescript
import { validatePacienteSupabase, validateTurnoSupabase } from '@/lib/validations-supabase';

// Validar paciente con verificación de DNI/email únicos
const validation = await validatePacienteSupabase(pacienteData);
if (!validation.isValid) {
  console.log(validation.errors);
}
```

## 🎯 Ventajas de la Nueva Estructura

### 1. **Base de Datos Real**
- ✅ Persistencia garantizada
- ✅ Backup automático
- ✅ Sincronización entre dispositivos
- ✅ Consultas SQL optimizadas

### 2. **Validaciones Inteligentes**
- ✅ Verificación de DNI/email únicos en tiempo real
- ✅ Validación de días laborales contra configuración
- ✅ Verificación de conflictos de horarios en BD
- ✅ Validación de horarios laborales

### 3. **Aprovecha las Vistas SQL**
- ✅ `vista_turnos_completa` - Turnos con datos del paciente
- ✅ `vista_estadisticas_diarias` - Estadísticas automáticas  
- ✅ `vista_horarios_disponibles` - Horarios libres calculados

### 4. **Funciones Avanzadas**
```typescript
// Estadísticas del dashboard usando vistas SQL
const stats = await getDashboardStats();

// Horarios disponibles para una fecha
const horarios = await getHorariosDisponibles('2024-01-15');

// Verificar conflictos de horario
const hayConflicto = await checkTurnoConflict('2024-01-15', '10:00', 30);
```

## ⚠️ Mejoras Sugeridas al Esquema SQL

### 1. **Horarios Dinámicos**

Tu vista `vista_horarios_disponibles` tiene horarios hardcodeados. Sería mejor hacerla dinámica:

```sql
-- Reemplazar la vista actual con horarios basados en configuración
CREATE OR REPLACE VIEW vista_horarios_disponibles AS
WITH configuracion AS (
  SELECT hora_inicio, hora_fin, duracion_default_turno 
  FROM configuracion_medico 
  LIMIT 1
),
horas_generadas AS (
  SELECT 
    generate_series(
      (SELECT hora_inicio FROM configuracion)::time,
      (SELECT hora_fin FROM configuracion)::time - interval '30 minutes',
      (SELECT duracion_default_turno FROM configuracion || ' minutes')::interval
    )::time as hora
)
-- resto de la vista...
```

### 2. **Campos Adicionales Útiles**

```sql
-- Agregar campos útiles a la tabla turnos
ALTER TABLE turnos ADD COLUMN recordatorio_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE turnos ADD COLUMN metodo_pago TEXT;
ALTER TABLE turnos ADD COLUMN observaciones_medicas TEXT;

-- Agregar configuración de notificaciones
ALTER TABLE configuracion_medico ADD COLUMN enviar_recordatorios BOOLEAN DEFAULT TRUE;
ALTER TABLE configuracion_medico ADD COLUMN tiempo_recordatorio INTEGER DEFAULT 24; -- horas antes
```

## 🔄 Migración de Datos Existentes

Si tienes datos en localStorage, puedes migrarlos:

```typescript
// Función para migrar datos de localStorage a Supabase
import { initializeDatabase } from '@/lib/database';
import { getPacientes as getLocalPacientes } from '@/lib/storage'; // archivo viejo

async function migrarDatos() {
  // Obtener datos del localStorage
  const pacientesLocal = getLocalPacientes();
  
  // Migrar a Supabase
  for (const paciente of pacientesLocal) {
    await addPaciente(paciente);
  }
  
  console.log('✅ Migración completada');
}
```

## 🎉 Resultado Final

Con estos cambios tendrás:

1. **Sistema robusto** con base de datos real
2. **Validaciones inteligentes** que verifican contra la BD
3. **Aprovechamiento completo** de las vistas SQL que creaste
4. **Código escalable** y mantenible
5. **Funcionalidades avanzadas** como estadísticas automáticas

Tu esquema SQL estaba muy bien pensado desde el principio, solo necesitaba conectarlo correctamente con el frontend. ¡Ahora tienes un sistema profesional completo! 🚀 