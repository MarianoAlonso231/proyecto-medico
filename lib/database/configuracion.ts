import { supabase, mapConfiguracionFromDB, type DatabaseConfiguracionMedico } from '../supabase';

// Interfaces para la aplicación
export interface ConfiguracionMedico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  email: string;
  direccion: string;
  matricula: string;
  diasLaborales: number[];
  horaInicio: string;
  horaFin: string;
  duracionDefaultTurno: number;
  precioConsulta: number;
  diasNoLaborables: string[];
  createdAt: string;
}

// Obtener configuración del médico (solo debe haber una)
export const getConfiguracionMedico = async (): Promise<ConfiguracionMedico | null> => {
  try {
    const { data, error } = await supabase
      .from('configuracion_medico')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    throw error;
  }
};

// Crear o actualizar configuración del médico
export const saveConfiguracionMedico = async (config: Omit<ConfiguracionMedico, 'id' | 'createdAt'>): Promise<ConfiguracionMedico> => {
  try {
    // Primero verificar si ya existe una configuración
    const existingConfig = await getConfiguracionMedico();
    
    const configData = {
      nombre: config.nombre,
      apellido: config.apellido,
      especialidad: config.especialidad,
      telefono: config.telefono,
      email: config.email,
      direccion: config.direccion || null,
      matricula: config.matricula,
      dias_laborales: config.diasLaborales,
      hora_inicio: config.horaInicio,
      hora_fin: config.horaFin,
      duracion_default_turno: config.duracionDefaultTurno,
      precio_consulta: config.precioConsulta,
      dias_no_laborables: config.diasNoLaborables,
    };

    let data, error;

    if (existingConfig) {
      // Actualizar configuración existente
      const result = await supabase
        .from('configuracion_medico')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Crear nueva configuración
      const result = await supabase
        .from('configuracion_medico')
        .insert(configData)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error guardando configuración:', error);
    throw error;
  }
};

// Actualizar solo los horarios de trabajo
export const updateHorariosLabor = async (
  diasLaborales: number[],
  horaInicio: string,
  horaFin: string,
  duracionDefaultTurno: number
): Promise<ConfiguracionMedico> => {
  try {
    const existingConfig = await getConfiguracionMedico();
    
    if (!existingConfig) {
      throw new Error('No existe configuración del médico');
    }

    const { data, error } = await supabase
      .from('configuracion_medico')
      .update({
        dias_laborales: diasLaborales,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        duracion_default_turno: duracionDefaultTurno,
      })
      .eq('id', existingConfig.id)
      .select()
      .single();

    if (error) throw error;
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error actualizando horarios:', error);
    throw error;
  }
};

// Actualizar precio de consulta
export const updatePrecioConsulta = async (precio: number): Promise<ConfiguracionMedico> => {
  try {
    const existingConfig = await getConfiguracionMedico();
    
    if (!existingConfig) {
      throw new Error('No existe configuración del médico');
    }

    const { data, error } = await supabase
      .from('configuracion_medico')
      .update({ precio_consulta: precio })
      .eq('id', existingConfig.id)
      .select()
      .single();

    if (error) throw error;
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error actualizando precio:', error);
    throw error;
  }
};

// Agregar días no laborables (feriados/vacaciones)
export const addDiasNoLaborables = async (fechas: string[]): Promise<ConfiguracionMedico> => {
  try {
    const existingConfig = await getConfiguracionMedico();
    
    if (!existingConfig) {
      throw new Error('No existe configuración del médico');
    }

    const diasActuales = existingConfig.diasNoLaborables;
    const diasUnicos = Array.from(new Set([...diasActuales, ...fechas]));

    const { data, error } = await supabase
      .from('configuracion_medico')
      .update({ dias_no_laborables: diasUnicos })
      .eq('id', existingConfig.id)
      .select()
      .single();

    if (error) throw error;
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error agregando días no laborables:', error);
    throw error;
  }
};

// Quitar días no laborables
export const removeDiasNoLaborables = async (fechas: string[]): Promise<ConfiguracionMedico> => {
  try {
    const existingConfig = await getConfiguracionMedico();
    
    if (!existingConfig) {
      throw new Error('No existe configuración del médico');
    }

    const diasFiltrados = existingConfig.diasNoLaborables.filter(dia => !fechas.includes(dia));

    const { data, error } = await supabase
      .from('configuracion_medico')
      .update({ dias_no_laborables: diasFiltrados })
      .eq('id', existingConfig.id)
      .select()
      .single();

    if (error) throw error;
    
    return mapConfiguracionFromDB(data);
  } catch (error) {
    console.error('Error removiendo días no laborables:', error);
    throw error;
  }
};

// Verificar si una fecha es día laboral
export const esDiaLaboral = async (fecha: string): Promise<boolean> => {
  try {
    const config = await getConfiguracionMedico();
    
    if (!config) return false;

    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    
    // Verificar si es día laboral según configuración
    if (!config.diasLaborales.includes(diaSemana)) {
      return false;
    }
    
    // Verificar si no está en días no laborables
    return !config.diasNoLaborables.includes(fecha);
  } catch (error) {
    console.error('Error verificando día laboral:', error);
    return false;
  }
};

// Verificar si una hora está en horario laboral
export const estaEnHorarioLaboral = async (hora: string): Promise<boolean> => {
  try {
    const config = await getConfiguracionMedico();
    
    if (!config) return false;

    const horaObj = new Date(`1970-01-01T${hora}`);
    const horaInicio = new Date(`1970-01-01T${config.horaInicio}`);
    const horaFin = new Date(`1970-01-01T${config.horaFin}`);
    
    return horaObj >= horaInicio && horaObj < horaFin;
  } catch (error) {
    console.error('Error verificando horario laboral:', error);
    return false;
  }
}; 