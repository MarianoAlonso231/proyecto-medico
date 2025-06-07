import type { Paciente, Turno } from '@/types';
import type { ConfiguracionMedico } from './database/configuracion';
import { existsPacienteByDni, existsPacienteByEmail } from './database/pacientes';
import { checkTurnoConflict } from './database/turnos';
import { esDiaLaboral, estaEnHorarioLaboral } from './database/configuracion';

// Resultado de validación
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validaciones para Paciente con verificación en BD
export const validatePacienteSupabase = async (
  paciente: Partial<Paciente>, 
  isUpdate: boolean = false
): Promise<ValidationResult> => {
  const errors: string[] = [];
  
  // Validaciones básicas
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
  } else {
    // Verificar DNI único en BD
    try {
      const existeDni = await existsPacienteByDni(paciente.dni, isUpdate ? paciente.id : undefined);
      if (existeDni) {
        errors.push('Ya existe un paciente con este DNI');
      }
    } catch (error) {
      errors.push('Error verificando DNI único');
    }
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
  } else {
    // Verificar email único en BD
    try {
      const existeEmail = await existsPacienteByEmail(paciente.email, isUpdate ? paciente.id : undefined);
      if (existeEmail) {
        errors.push('Ya existe un paciente con este email');
      }
    } catch (error) {
      errors.push('Error verificando email único');
    }
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

// Validaciones para Turno con verificación en BD
export const validateTurnoSupabase = async (
  turno: Partial<Turno>, 
  isUpdate: boolean = false
): Promise<ValidationResult> => {
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
    } else {
      // Verificar si es día laboral
      try {
        const esLaboral = await esDiaLaboral(turno.fecha);
        if (!esLaboral) {
          errors.push('La fecha seleccionada no es un día laboral');
        }
      } catch (error) {
        errors.push('Error verificando día laboral');
      }
    }
  }
  
  if (!turno.hora?.trim()) {
    errors.push('La hora es obligatoria');
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(turno.hora)) {
    errors.push('El formato de hora no es válido (HH:MM)');
  } else {
    // Verificar si está en horario laboral
    try {
      const estaEnHorario = await estaEnHorarioLaboral(turno.hora);
      if (!estaEnHorario) {
        errors.push('La hora está fuera del horario laboral');
      }
    } catch (error) {
      errors.push('Error verificando horario laboral');
    }
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
  
  // Verificar conflictos de horario en BD
  if (turno.fecha && turno.hora && turno.duracion) {
    try {
      const hayConflicto = await checkTurnoConflict(
        turno.fecha, 
        turno.hora, 
        turno.duracion, 
        isUpdate ? turno.id : undefined
      );
      if (hayConflicto) {
        errors.push('Ya existe un turno en ese horario');
      }
    } catch (error) {
      errors.push('Error verificando conflicto de horarios');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validaciones para Configuración del Médico
export const validateConfiguracionMedico = (config: Partial<ConfiguracionMedico>): ValidationResult => {
  const errors: string[] = [];
  
  if (!config.nombre?.trim()) {
    errors.push('El nombre es obligatorio');
  }
  
  if (!config.apellido?.trim()) {
    errors.push('El apellido es obligatorio');
  }
  
  if (!config.especialidad?.trim()) {
    errors.push('La especialidad es obligatoria');
  }
  
  if (!config.telefono?.trim()) {
    errors.push('El teléfono es obligatorio');
  } else if (!/^[\+]?[\d\s\-\(\)]{8,15}$/.test(config.telefono)) {
    errors.push('El formato del teléfono no es válido');
  }
  
  if (!config.email?.trim()) {
    errors.push('El email es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    errors.push('El formato del email no es válido');
  }
  
  if (!config.matricula?.trim()) {
    errors.push('La matrícula es obligatoria');
  }
  
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

// Función auxiliar para validar múltiples fechas como días no laborables
export const validateDiasNoLaborables = (fechas: string[]): ValidationResult => {
  const errors: string[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  fechas.forEach((fecha, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      errors.push(`Fecha ${index + 1}: formato inválido (debe ser YYYY-MM-DD)`);
    } else {
      const fechaObj = new Date(fecha);
      if (fechaObj < hoy) {
        errors.push(`Fecha ${index + 1}: no se pueden agregar fechas pasadas`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para validar rango de fechas
export const validateRangoFechas = (fechaInicio: string, fechaFin: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!fechaInicio) {
    errors.push('La fecha de inicio es obligatoria');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
    errors.push('Formato de fecha de inicio inválido');
  }
  
  if (!fechaFin) {
    errors.push('La fecha de fin es obligatoria');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
    errors.push('Formato de fecha de fin inválido');
  }
  
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (inicio > fin) {
      errors.push('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }
    
    const diferenciaMeses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
    if (diferenciaMeses > 12) {
      errors.push('El rango no puede ser mayor a 12 meses');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 