-- Esquema SQL para Turso Database (libSQL/SQLite)
-- Sistema de Gestión de Turnos Médicos

/*
  # Schema para Sistema de Turnos Médicos

  1. Tablas principales
    - `medicos` - Información de los médicos
    - `pacientes` - Información de los pacientes  
    - `turnos` - Turnos programados
    - `configuracion_horarios` - Configuración de horarios de trabajo
    - `usuarios` - Usuarios del sistema (autenticación)

  2. Características
    - Claves primarias UUID
    - Timestamps automáticos
    - Índices para optimizar consultas
    - Restricciones de integridad referencial
    - Validaciones a nivel de base de datos
*/

-- Tabla de médicos
CREATE TABLE IF NOT EXISTS medicos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  direccion TEXT,
  matricula TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  direccion TEXT,
  obra_social TEXT DEFAULT '',
  numero_afiliado TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turnos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  paciente_id TEXT NOT NULL,
  medico_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion INTEGER NOT NULL DEFAULT 30,
  tipo_consulta TEXT NOT NULL CHECK (tipo_consulta IN ('primera_vez', 'control', 'seguimiento')),
  estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'confirmado', 'completado', 'cancelado', 'no_asistio')),
  notas TEXT DEFAULT '',
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Tabla de configuración de horarios
CREATE TABLE IF NOT EXISTS configuracion_horarios (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  medico_id TEXT NOT NULL,
  dias_laborales TEXT NOT NULL DEFAULT '1,2,3,4,5', -- JSON array como string: días de la semana (0=domingo, 6=sábado)
  hora_inicio TIME NOT NULL DEFAULT '08:00',
  hora_fin TIME NOT NULL DEFAULT '18:00',
  duracion_default_turno INTEGER NOT NULL DEFAULT 30,
  precio_consulta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  dias_no_laborables TEXT DEFAULT '[]', -- JSON array como string: fechas en formato YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Tabla de usuarios (autenticación)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'medico' CHECK (rol IN ('medico', 'admin')),
  medico_id TEXT,
  activo BOOLEAN DEFAULT TRUE,
  ultimo_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE SET NULL
);

-- Tabla de auditoría para turnos (opcional)
CREATE TABLE IF NOT EXISTS turnos_auditoria (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  turno_id TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  usuario_id TEXT,
  motivo TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_apellido ON pacientes(nombre, apellido);

CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_paciente_id ON turnos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_medico_id ON turnos(medico_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos(fecha, hora);

CREATE INDEX IF NOT EXISTS idx_medicos_email ON medicos(email);
CREATE INDEX IF NOT EXISTS idx_medicos_matricula ON medicos(matricula);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS tr_medicos_updated_at
  AFTER UPDATE ON medicos
  BEGIN
    UPDATE medicos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_pacientes_updated_at
  AFTER UPDATE ON pacientes
  BEGIN
    UPDATE pacientes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_turnos_updated_at
  AFTER UPDATE ON turnos
  BEGIN
    UPDATE turnos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_configuracion_updated_at
  AFTER UPDATE ON configuracion_horarios
  BEGIN
    UPDATE configuracion_horarios SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_usuarios_updated_at
  AFTER UPDATE ON usuarios
  BEGIN
    UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Trigger para auditoría de cambios de estado en turnos
CREATE TRIGGER IF NOT EXISTS tr_turnos_auditoria
  AFTER UPDATE OF estado ON turnos
  WHEN OLD.estado != NEW.estado
  BEGIN
    INSERT INTO turnos_auditoria (turno_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END;

-- Datos de ejemplo para testing (opcional)
-- Médico de ejemplo
INSERT OR IGNORE INTO medicos (id, nombre, apellido, especialidad, telefono, email, direccion, matricula)
VALUES ('medico-1', 'Dr. Carlos', 'Martínez', 'Medicina General', '+54 11 5555-5555', 'dr.martinez@clinica.com', 'Consultorio Médico - Av. Santa Fe 1234', 'MP 12345');

-- Usuario de ejemplo
INSERT OR IGNORE INTO usuarios (id, email, password_hash, rol, medico_id)
VALUES ('usuario-1', 'medico@clinica.com', '$2b$10$dummy.hash.for.admin123', 'medico', 'medico-1');

-- Configuración de horarios de ejemplo
INSERT OR IGNORE INTO configuracion_horarios (id, medico_id, dias_laborales, hora_inicio, hora_fin, duracion_default_turno, precio_consulta)
VALUES ('config-1', 'medico-1', '1,2,3,4,5', '08:00', '18:00', 30, 5000.00);

-- Pacientes de ejemplo
INSERT OR IGNORE INTO pacientes (id, nombre, apellido, dni, telefono, email, fecha_nacimiento, direccion, obra_social, numero_afiliado, observaciones)
VALUES 
  ('paciente-1', 'María', 'González', '12345678', '+54 11 1234-5678', 'maria.gonzalez@email.com', '1985-03-15', 'Av. Corrientes 1234, CABA', 'OSDE', '123456789', 'Hipertensión controlada'),
  ('paciente-2', 'Juan', 'Pérez', '87654321', '+54 11 8765-4321', 'juan.perez@email.com', '1978-11-22', 'Rivadavia 5678, CABA', 'Swiss Medical', '987654321', 'Diabetes tipo 2'),
  ('paciente-3', 'Ana', 'López', '11223344', '+54 11 1122-3344', 'ana.lopez@email.com', '1992-07-08', 'Santa Fe 2468, CABA', 'Galeno', '112233445', 'Sin antecedentes relevantes');

-- Vistas útiles para consultas comunes
-- Vista de turnos con información del paciente
CREATE VIEW IF NOT EXISTS vista_turnos_completa AS
SELECT 
  t.*,
  p.nombre || ' ' || p.apellido as paciente_nombre,
  p.dni as paciente_dni,
  p.telefono as paciente_telefono,
  p.obra_social as paciente_obra_social,
  m.nombre || ' ' || m.apellido as medico_nombre,
  m.especialidad as medico_especialidad
FROM turnos t
JOIN pacientes p ON t.paciente_id = p.id
JOIN medicos m ON t.medico_id = m.id;

-- Vista de estadísticas diarias
CREATE VIEW IF NOT EXISTS vista_estadisticas_diarias AS
SELECT 
  fecha,
  COUNT(*) as total_turnos,
  COUNT(CASE WHEN estado = 'programado' THEN 1 END) as programados,
  COUNT(CASE WHEN estado = 'confirmado' THEN 1 END) as confirmados,
  COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
  COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
  COUNT(CASE WHEN estado = 'no_asistio' THEN 1 END) as no_asistieron,
  SUM(CASE WHEN estado = 'completado' THEN precio ELSE 0 END) as ingresos_dia
FROM turnos
GROUP BY fecha
ORDER BY fecha DESC;

-- Consultas útiles de ejemplo:

/*
-- Obtener turnos de un día específico
SELECT * FROM vista_turnos_completa 
WHERE fecha = '2024-01-15' 
ORDER BY hora;

-- Estadísticas del mes actual
SELECT 
  COUNT(*) as total_turnos,
  SUM(CASE WHEN estado = 'completado' THEN precio ELSE 0 END) as ingresos_mes,
  ROUND(AVG(CASE WHEN estado = 'no_asistio' THEN 1.0 ELSE 0.0 END) * 100, 2) as tasa_ausentismo
FROM turnos 
WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now');

-- Pacientes más frecuentes
SELECT 
  p.nombre || ' ' || p.apellido as paciente,
  COUNT(t.id) as cantidad_turnos,
  MAX(t.fecha) as ultimo_turno
FROM pacientes p
JOIN turnos t ON p.id = t.paciente_id
GROUP BY p.id, p.nombre, p.apellido
ORDER BY cantidad_turnos DESC
LIMIT 5;

-- Horarios disponibles para un día
SELECT DISTINCT hora
FROM turnos 
WHERE fecha = '2024-01-15' 
  AND estado NOT IN ('cancelado')
ORDER BY hora;
*/