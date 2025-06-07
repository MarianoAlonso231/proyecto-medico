import type { Paciente, Turno, Medico, ConfiguracionHorarios, Usuario } from '@/types';

const STORAGE_KEYS = {
  PACIENTES: 'turnos_medicos_pacientes',
  TURNOS: 'turnos_medicos_turnos',
  MEDICO: 'turnos_medicos_medico',
  CONFIGURACION: 'turnos_medicos_configuracion',
  USUARIO: 'turnos_medicos_usuario'
} as const;

// Pacientes
export const getPacientes = (): Paciente[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PACIENTES);
  return data ? JSON.parse(data) : [];
};

export const savePacientes = (pacientes: Paciente[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes));
};

export const addPaciente = (paciente: Omit<Paciente, 'id' | 'createdAt'>): Paciente => {
  const nuevoPaciente: Paciente = {
    ...paciente,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  const pacientes = getPacientes();
  pacientes.push(nuevoPaciente);
  savePacientes(pacientes);
  
  return nuevoPaciente;
};

export const updatePaciente = (id: string, updates: Partial<Paciente>): Paciente | null => {
  const pacientes = getPacientes();
  const index = pacientes.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  pacientes[index] = { ...pacientes[index], ...updates };
  savePacientes(pacientes);
  
  return pacientes[index];
};

export const deletePaciente = (id: string): boolean => {
  const pacientes = getPacientes();
  const filtered = pacientes.filter(p => p.id !== id);
  
  if (filtered.length === pacientes.length) return false;
  
  savePacientes(filtered);
  return true;
};

export const getPacienteById = (id: string): Paciente | null => {
  const pacientes = getPacientes();
  return pacientes.find(p => p.id === id) || null;
};

// Turnos
export const getTurnos = (): Turno[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TURNOS);
  return data ? JSON.parse(data) : [];
};

export const saveTurnos = (turnos: Turno[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(turnos));
};

export const addTurno = (turno: Omit<Turno, 'id' | 'createdAt'>): Turno => {
  const nuevoTurno: Turno = {
    ...turno,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  const turnos = getTurnos();
  turnos.push(nuevoTurno);
  saveTurnos(turnos);
  
  return nuevoTurno;
};

export const updateTurno = (id: string, updates: Partial<Turno>): Turno | null => {
  const turnos = getTurnos();
  const index = turnos.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  turnos[index] = { ...turnos[index], ...updates };
  saveTurnos(turnos);
  
  return turnos[index];
};

export const deleteTurno = (id: string): boolean => {
  const turnos = getTurnos();
  const filtered = turnos.filter(t => t.id !== id);
  
  if (filtered.length === turnos.length) return false;
  
  saveTurnos(filtered);
  return true;
};

export const getTurnoById = (id: string): Turno | null => {
  const turnos = getTurnos();
  return turnos.find(t => t.id === id) || null;
};

export const getTurnosByPacienteId = (pacienteId: string): Turno[] => {
  const turnos = getTurnos();
  return turnos.filter(t => t.pacienteId === pacienteId);
};

export const getTurnosByFecha = (fecha: string): Turno[] => {
  const turnos = getTurnos();
  return turnos.filter(t => t.fecha === fecha);
};

export const getTurnosByRangoFechas = (fechaInicio: string, fechaFin: string): Turno[] => {
  const turnos = getTurnos();
  return turnos.filter(t => t.fecha >= fechaInicio && t.fecha <= fechaFin);
};

// Médico
export const getMedico = (): Medico | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.MEDICO);
  return data ? JSON.parse(data) : null;
};

export const saveMedico = (medico: Medico): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MEDICO, JSON.stringify(medico));
};

// Configuración
export const getConfiguracion = (): ConfiguracionHorarios | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CONFIGURACION);
  return data ? JSON.parse(data) : null;
};

export const saveConfiguracion = (config: ConfiguracionHorarios): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONFIGURACION, JSON.stringify(config));
};

// Usuario
export const getUsuario = (): Usuario | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USUARIO);
  return data ? JSON.parse(data) : null;
};

export const saveUsuario = (usuario: Usuario): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
};

export const clearUsuario = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USUARIO);
};

// Utilities
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Inicialización con datos de ejemplo
export const initializeExampleData = (): void => {
  if (typeof window === 'undefined') return;
  
  // Verificar si ya hay datos
  if (getPacientes().length > 0) return;
  
  // Datos de ejemplo para pacientes
  const pacientesEjemplo: Omit<Paciente, 'id' | 'createdAt'>[] = [
    {
      nombre: 'María',
      apellido: 'González',
      dni: '12345678',
      telefono: '+54 11 1234-5678',
      email: 'maria.gonzalez@email.com',
      fechaNacimiento: '1985-03-15',
      direccion: 'Av. Corrientes 1234, CABA',
      obraSocial: 'OSDE',
      numeroAfiliado: '123456789',
      observaciones: 'Hipertensión controlada'
    },
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '87654321',
      telefono: '+54 11 8765-4321',
      email: 'juan.perez@email.com',
      fechaNacimiento: '1978-11-22',
      direccion: 'Rivadavia 5678, CABA',
      obraSocial: 'Swiss Medical',
      numeroAfiliado: '987654321',
      observaciones: 'Diabetes tipo 2'
    },
    {
      nombre: 'Ana',
      apellido: 'López',
      dni: '11223344',
      telefono: '+54 11 1122-3344',
      email: 'ana.lopez@email.com',
      fechaNacimiento: '1992-07-08',
      direccion: 'Santa Fe 2468, CABA',
      obraSocial: 'Galeno',
      numeroAfiliado: '112233445',
      observaciones: 'Sin antecedentes relevantes'
    }
  ];
  
  // Agregar pacientes de ejemplo
  const pacientesCreados = pacientesEjemplo.map(p => addPaciente(p));
  
  // Configuración por defecto
  const configDefault: ConfiguracionHorarios = {
    id: generateId(),
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    horaInicio: '08:00',
    horaFin: '18:00',
    duracionDefaultTurno: 30,
    precioConsulta: 5000,
    diasNoLaborables: []
  };
  
  saveConfiguracion(configDefault);
  
  // Médico por defecto
  const medicoDefault: Medico = {
    id: generateId(),
    nombre: 'Dr. Carlos',
    apellido: 'Martínez',
    especialidad: 'Medicina General',
    telefono: '+54 11 5555-5555',
    email: 'dr.martinez@clinica.com',
    direccion: 'Consultorio Médico - Av. Santa Fe 1234',
    matricula: 'MP 12345',
    createdAt: new Date().toISOString()
  };
  
  saveMedico(medicoDefault);
  
  // Turnos de ejemplo
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  
  const turnosEjemplo: Omit<Turno, 'id' | 'createdAt'>[] = [
    {
      pacienteId: pacientesCreados[0].id,
      fecha: hoy.toISOString().split('T')[0],
      hora: '09:00',
      duracion: 30,
      tipoConsulta: 'control',
      estado: 'confirmado',
      notas: 'Control de presión arterial',
      precio: 5000
    },
    {
      pacienteId: pacientesCreados[1].id,
      fecha: hoy.toISOString().split('T')[0],
      hora: '10:30',
      duracion: 45,
      tipoConsulta: 'seguimiento',
      estado: 'programado',
      notas: 'Control de glucemia',
      precio: 5000
    },
    {
      pacienteId: pacientesCreados[2].id,
      fecha: mañana.toISOString().split('T')[0],
      hora: '11:00',
      duracion: 30,
      tipoConsulta: 'primera_vez',
      estado: 'programado',
      notas: 'Consulta inicial',
      precio: 5000
    }
  ];
  
  turnosEjemplo.forEach(t => addTurno(t));
};