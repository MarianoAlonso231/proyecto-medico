import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface DatabasePaciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string;
  direccion: string | null;
  obra_social: string;
  numero_afiliado: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTurno {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string;
  duracion: number;
  tipo_consulta: 'primera_vez' | 'control' | 'seguimiento';
  estado: 'programado' | 'confirmado' | 'completado' | 'cancelado' | 'no_asistio';
  notas: string;
  seguimiento: string;
  precio: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfiguracionMedico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  email: string;
  direccion: string | null;
  matricula: string;
  dias_laborales: number[];
  hora_inicio: string;
  hora_fin: string;
  duracion_default_turno: number;
  precio_consulta: number;
  dias_no_laborables: string[];
  created_at: string;
  updated_at: string;
}

// Función para mapear tipos de BD a tipos de la aplicación
export const mapPacienteFromDB = (dbPaciente: DatabasePaciente) => ({
  id: dbPaciente.id,
  nombre: dbPaciente.nombre,
  apellido: dbPaciente.apellido,
  dni: dbPaciente.dni,
  telefono: dbPaciente.telefono,
  email: dbPaciente.email,
  fechaNacimiento: dbPaciente.fecha_nacimiento,
  direccion: dbPaciente.direccion || '',
  obraSocial: dbPaciente.obra_social,
  numeroAfiliado: dbPaciente.numero_afiliado,
  observaciones: dbPaciente.observaciones,
  createdAt: dbPaciente.created_at,
});

export const mapTurnoFromDB = (dbTurno: DatabaseTurno) => ({
  id: dbTurno.id,
  pacienteId: dbTurno.paciente_id,
  fecha: dbTurno.fecha,
  hora: dbTurno.hora,
  duracion: dbTurno.duracion,
  tipoConsulta: dbTurno.tipo_consulta,
  estado: dbTurno.estado,
  notas: dbTurno.notas,
  seguimiento: dbTurno.seguimiento,
  precio: dbTurno.precio,
  createdAt: dbTurno.created_at,
});

export const mapConfiguracionFromDB = (dbConfig: DatabaseConfiguracionMedico) => ({
  id: dbConfig.id,
  nombre: dbConfig.nombre,
  apellido: dbConfig.apellido,
  especialidad: dbConfig.especialidad,
  telefono: dbConfig.telefono,
  email: dbConfig.email,
  direccion: dbConfig.direccion || '',
  matricula: dbConfig.matricula,
  diasLaborales: dbConfig.dias_laborales,
  horaInicio: dbConfig.hora_inicio,
  horaFin: dbConfig.hora_fin,
  duracionDefaultTurno: dbConfig.duracion_default_turno,
  precioConsulta: dbConfig.precio_consulta,
  diasNoLaborables: dbConfig.dias_no_laborables,
  createdAt: dbConfig.created_at,
}); 