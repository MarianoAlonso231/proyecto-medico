import { supabase, mapTurnoFromDB, type DatabaseTurno } from '../supabase';
import type { Turno, EstadoTurno } from '@/types';

// Re-exportar tipos para facilitar importación
export type { Turno, EstadoTurno } from '@/types';

// Obtener todos los turnos
export const getTurnos = async (): Promise<Turno[]> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) throw error;
    
    return data.map(mapTurnoFromDB);
  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    throw error;
  }
};

// Obtener turno por ID
export const getTurnoById = async (id: string): Promise<Turno | null> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return mapTurnoFromDB(data);
  } catch (error) {
    console.error('Error obteniendo turno:', error);
    throw error;
  }
};

// Obtener turnos por paciente
export const getTurnosByPacienteId = async (pacienteId: string): Promise<Turno[]> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (error) throw error;
    
    return data.map(mapTurnoFromDB);
  } catch (error) {
    console.error('Error obteniendo turnos del paciente:', error);
    throw error;
  }
};

// Obtener turnos por fecha
export const getTurnosByFecha = async (fecha: string): Promise<Turno[]> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .order('hora', { ascending: true });

    if (error) throw error;
    
    return data.map(mapTurnoFromDB);
  } catch (error) {
    console.error('Error obteniendo turnos por fecha:', error);
    throw error;
  }
};

// Obtener turnos por rango de fechas
export const getTurnosByRangoFechas = async (fechaInicio: string, fechaFin: string): Promise<Turno[]> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) throw error;
    
    return data.map(mapTurnoFromDB);
  } catch (error) {
    console.error('Error obteniendo turnos por rango:', error);
    throw error;
  }
};

// Crear nuevo turno
export const addTurno = async (turnoData: Omit<Turno, 'id' | 'createdAt'>): Promise<Turno> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .insert({
        paciente_id: turnoData.pacienteId,
        fecha: turnoData.fecha,
        hora: turnoData.hora,
        duracion: turnoData.duracion,
        tipo_consulta: turnoData.tipoConsulta,
        estado: turnoData.estado,
        notas: turnoData.notas,
        precio: turnoData.precio,
      })
      .select()
      .single();

    if (error) throw error;
    
    return mapTurnoFromDB(data);
  } catch (error) {
    console.error('Error creando turno:', error);
    throw error;
  }
};

// Actualizar turno
export const updateTurno = async (id: string, updates: Partial<Omit<Turno, 'id' | 'createdAt'>>): Promise<Turno> => {
  try {
    const updateData: Partial<DatabaseTurno> = {};
    
    if (updates.pacienteId) updateData.paciente_id = updates.pacienteId;
    if (updates.fecha) updateData.fecha = updates.fecha;
    if (updates.hora) updateData.hora = updates.hora;
    if (updates.duracion) updateData.duracion = updates.duracion;
    if (updates.tipoConsulta) updateData.tipo_consulta = updates.tipoConsulta;
    if (updates.estado) updateData.estado = updates.estado;
    if (updates.notas !== undefined) updateData.notas = updates.notas;
    if (updates.precio !== undefined) updateData.precio = updates.precio;

    const { data, error } = await supabase
      .from('turnos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return mapTurnoFromDB(data);
  } catch (error) {
    console.error('Error actualizando turno:', error);
    throw error;
  }
};

// Eliminar turno
export const deleteTurno = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error eliminando turno:', error);
    return false;
  }
};

// Cambiar estado del turno
export const changeEstadoTurno = async (id: string, nuevoEstado: EstadoTurno): Promise<Turno> => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .update({ estado: nuevoEstado })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return mapTurnoFromDB(data);
  } catch (error) {
    console.error('Error cambiando estado del turno:', error);
    throw error;
  }
};

// Verificar si existe conflicto de horario
export const checkTurnoConflict = async (
  fecha: string, 
  hora: string, 
  duracion: number, 
  excludeId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('turnos')
      .select('id, hora, duracion')
      .eq('fecha', fecha)
      .neq('estado', 'cancelado');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular horas de inicio y fin del nuevo turno
    const nuevaHoraInicio = new Date(`1970-01-01T${hora}`);
    const nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + duracion * 60000);

    // Verificar solapamientos
    return data.some((turno: { hora: string; duracion: number }) => {
      const existenteInicio = new Date(`1970-01-01T${turno.hora}`);
      const existenteFin = new Date(existenteInicio.getTime() + turno.duracion * 60000);
      
      return (nuevaHoraInicio < existenteFin && nuevaHoraFin > existenteInicio);
    });
  } catch (error) {
    console.error('Error verificando conflicto de turno:', error);
    return false;
  }
};

// Obtener turnos completos con información del paciente (usando la vista)
export const getTurnosCompletos = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('vista_turnos_completa')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error obteniendo turnos completos:', error);
    throw error;
  }
};

// Obtener turnos de hoy
export const getTurnosHoy = async (): Promise<Turno[]> => {
  const hoy = new Date().toISOString().split('T')[0];
  return getTurnosByFecha(hoy);
};

// Obtener próximos turnos (siguiente semana)
export const getProximosTurnos = async (limit: number = 10): Promise<Turno[]> => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .gte('fecha', hoy)
      .in('estado', ['programado', 'confirmado'])
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .limit(limit);

    if (error) throw error;
    
    return data.map(mapTurnoFromDB);
  } catch (error) {
    console.error('Error obteniendo próximos turnos:', error);
    throw error;
  }
};

// Obtener estadísticas completas de turnos
export const getEstadisticasTurnos = async (fechaInicio?: string, fechaFin?: string) => {
  try {
    let query = supabase
      .from('turnos')
      .select('estado, precio, fecha');

    if (fechaInicio && fechaFin) {
      query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw error;

    const turnosPorEstado = {
      programado: 0,
      confirmado: 0,
      completado: 0,
      cancelado: 0,
      no_asistio: 0,
    };

    let ingresosMes = 0;
    let turnosHoy = 0;
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01

    data.forEach((turno: { estado: string; precio: number; fecha: string }) => {
      // Contar por estado
      turnosPorEstado[turno.estado as keyof typeof turnosPorEstado]++;
      
      // Contar turnos de hoy
      if (turno.fecha === hoy) {
        turnosHoy++;
      }
      
      // Calcular ingresos del mes de turnos completados
      if (turno.estado === 'completado' && turno.fecha >= inicioMes) {
        ingresosMes += turno.precio;
      }
    });

    const totalTurnos = data.length;
    const completados = turnosPorEstado.completado;
    const promedioConsulta = completados > 0 ? Math.round(ingresosMes / completados) : 0;

    return {
      turnosPorEstado,
      totalTurnos,
      turnosHoy,
      completados,
      ingresosMes: Math.round(ingresosMes),
      promedioConsulta,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}; 