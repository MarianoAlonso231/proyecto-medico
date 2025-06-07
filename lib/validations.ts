import type { Paciente, Turno, ConfiguracionHorarios } from '@/types';

// Validaciones para Paciente
export const validatePaciente = (paciente: Partial<Paciente>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!paciente.nombre?.trim()) {
    errors.push('El nombre es obligatorio');
  }
  
  if (!paciente.apellido?.trim()) {
    errors.push('El apellido es obligatorio');
  }
  
  if (!paciente.dni?.trim()) {
    errors.push('El DNI es obligatorio');
  } else if (!/^\d{7,8}$/.test(paciente.dni.replace(/\D/g, ''))) {
    errors.push('El DNI debe tener 7 u 8 dígitos');
  }
  
  if (!paciente.telefono?.trim()) {
    errors.push('El teléfono es obligatorio');
  } else if (!/^[\+]?[\d\s\-\(\)]{8,15}$/.test(paciente.telefono)) {
    errors.push('El formato del teléfono no es válido');
  }
  
  if (!paciente.email?.trim()) {
    errors.push('El email es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paciente.email)) {
    errors.push('El formato del email no es válido');
  }
  
  if (!paciente.fechaNacimiento) {
    errors.push('La fecha de nacimiento es obligatoria');
  } else {
    const fechaNac = new Date(paciente.fechaNacimiento);
    const hoy = new Date();
    if (fechaNac > hoy) {
      errors.push('La fecha de nacimiento no puede ser futura');
    }
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad > 120) {
      errors.push('La edad no puede ser mayor a 120 años');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validaciones para Turno
export const validateTurno = (turno: Partial<Turno>, existingTurnos: Turno[] = []): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!turno.pacienteId?.trim()) {
    errors.push('Debe seleccionar un paciente');
  }
  
  if (!turno.fecha) {
    errors.push('La fecha es obligatoria');
  } else {
    const fechaTurno = new Date(turno.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaTurno < hoy) {
      errors.push('No se pueden crear turnos en fechas pasadas');
    }
  }
  
  if (!turno.hora?.trim()) {
    errors.push('La hora es obligatoria');
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(turno.hora)) {
    errors.push('El formato de hora no es válido (HH:MM)');
  }
  
  if (!turno.duracion || turno.duracion < 15 || turno.duracion > 120) {
    errors.push('La duración debe estar entre 15 y 120 minutos');
  }
  
  if (!turno.tipoConsulta) {
    errors.push('Debe seleccionar el tipo de consulta');
  }
  
  if (typeof turno.precio !== 'number' || turno.precio < 0) {
    errors.push('El precio debe ser un número válido');
  }
  
  // Validar solapamiento de horarios
  if (turno.fecha && turno.hora && turno.duracion) {
    const conflicto = checkTurnoConflict(turno as Pick<Turno, 'fecha' | 'hora' | 'duracion'>, existingTurnos, turno.id);
    if (conflicto) {
      errors.push('Ya existe un turno en ese horario');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Verificar conflictos de horarios
export const checkTurnoConflict = (
  newTurno: Pick<Turno, 'fecha' | 'hora' | 'duracion'>,
  existingTurnos: Turno[],
  excludeId?: string
): boolean => {
  const newStart = new Date(`${newTurno.fecha}T${newTurno.hora}`);
  const newEnd = new Date(newStart.getTime() + newTurno.duracion * 60000);
  
  return existingTurnos.some(turno => {
    if (excludeId && turno.id === excludeId) return false;
    if (turno.fecha !== newTurno.fecha) return false;
    if (turno.estado === 'cancelado') return false;
    
    const existingStart = new Date(`${turno.fecha}T${turno.hora}`);
    const existingEnd = new Date(existingStart.getTime() + turno.duracion * 60000);
    
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

// Validaciones para Configuración
export const validateConfiguracion = (config: Partial<ConfiguracionHorarios>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.diasLaborales || config.diasLaborales.length === 0) {
    errors.push('Debe seleccionar al menos un día laboral');
  }
  
  if (!config.horaInicio?.trim()) {
    errors.push('La hora de inicio es obligatoria');
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.horaInicio)) {
    errors.push('El formato de hora de inicio no es válido');
  }
  
  if (!config.horaFin?.trim()) {
    errors.push('La hora de fin es obligatoria');
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.horaFin)) {
    errors.push('El formato de hora de fin no es válido');
  }
  
  if (config.horaInicio && config.horaFin) {
    const inicio = new Date(`2000-01-01T${config.horaInicio}`);
    const fin = new Date(`2000-01-01T${config.horaFin}`);
    if (inicio >= fin) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin');
    }
  }
  
  if (!config.duracionDefaultTurno || config.duracionDefaultTurno < 15 || config.duracionDefaultTurno > 120) {
    errors.push('La duración por defecto debe estar entre 15 y 120 minutos');
  }
  
  if (typeof config.precioConsulta !== 'number' || config.precioConsulta < 0) {
    errors.push('El precio de consulta debe ser un número válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validar horario laboral
export const isHorarioLaboral = (fecha: string, hora: string, config: ConfiguracionHorarios): boolean => {
  const fechaObj = new Date(fecha);
  const diaSemana = fechaObj.getDay();
  
  // Verificar si es día laboral
  if (!config.diasLaborales.includes(diaSemana)) {
    return false;
  }
  
  // Verificar si no es día no laboral
  if (config.diasNoLaborables.includes(fecha)) {
    return false;
  }
  
  // Verificar horario
  const horaInicio = new Date(`2000-01-01T${config.horaInicio}`);
  const horaFin = new Date(`2000-01-01T${config.horaFin}`);
  const horaTurno = new Date(`2000-01-01T${hora}`);
  
  return horaTurno >= horaInicio && horaTurno < horaFin;
};