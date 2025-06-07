export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  direccion: string;
  obraSocial: string;
  numeroAfiliado: string;
  observaciones: string;
  createdAt: string;
}

export interface Turno {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  duracion: number;
  tipoConsulta: 'primera_vez' | 'control' | 'seguimiento';
  estado: 'programado' | 'confirmado' | 'completado' | 'cancelado' | 'no_asistio';
  notas: string;
  precio: number;
  createdAt: string;
}

// DEPRECATED: Usar ConfiguracionMedico de lib/database/configuracion en su lugar
export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  email: string;
  direccion: string;
  matricula: string;
  createdAt: string;
}

// DEPRECATED: Usar ConfiguracionMedico de lib/database/configuracion en su lugar
export interface ConfiguracionHorarios {
  id: string;
  diasLaborales: number[]; // 0-6 (domingo-sábado)
  horaInicio: string;
  horaFin: string;
  duracionDefaultTurno: number;
  precioConsulta: number;
  diasNoLaborables: string[]; // fechas en formato YYYY-MM-DD
}

export interface EstadisticasDashboard {
  turnosHoy: number;
  pacientesTotal: number;
  proximosTurnos: Turno[];
  ingresosMes: number;
  tasaAusentismo: number;
  turnosPorEstado: {
    programado: number;
    confirmado: number;
    completado: number;
    cancelado: number;
    no_asistio: number;
  };
}

export interface Usuario {
  id: string;
  email: string;
  rol: 'medico' | 'admin';
  medicoId?: string;
}

export type TipoConsulta = 'primera_vez' | 'control' | 'seguimiento';
export type EstadoTurno = 'programado' | 'confirmado' | 'completado' | 'cancelado' | 'no_asistio';
export type VistaCalendario = 'dia' | 'semana' | 'mes';