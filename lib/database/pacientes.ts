import { supabase, mapPacienteFromDB, type DatabasePaciente } from '../supabase';
import type { Paciente } from '@/types';

// Re-exportar tipos para facilitar importación
export type { Paciente } from '@/types';

// Obtener todos los pacientes
export const getPacientes = async (): Promise<Paciente[]> => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('apellido', { ascending: true });

    if (error) throw error;
    
    return data.map(mapPacienteFromDB);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    throw error;
  }
};

// Obtener paciente por ID
export const getPacienteById = async (id: string): Promise<Paciente | null> => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    
    return mapPacienteFromDB(data);
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    throw error;
  }
};

// Crear nuevo paciente
export const addPaciente = async (pacienteData: Omit<Paciente, 'id' | 'createdAt'>): Promise<Paciente> => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        nombre: pacienteData.nombre,
        apellido: pacienteData.apellido,
        dni: pacienteData.dni,
        telefono: pacienteData.telefono,
        email: pacienteData.email,
        fecha_nacimiento: pacienteData.fechaNacimiento,
        direccion: pacienteData.direccion || null,
        obra_social: pacienteData.obraSocial,
        numero_afiliado: pacienteData.numeroAfiliado,
        observaciones: pacienteData.observaciones,
      })
      .select()
      .single();

    if (error) throw error;
    
    return mapPacienteFromDB(data);
  } catch (error) {
    console.error('Error creando paciente:', error);
    throw error;
  }
};

// Actualizar paciente
export const updatePaciente = async (id: string, updates: Partial<Omit<Paciente, 'id' | 'createdAt'>>): Promise<Paciente> => {
  try {
    const updateData: Partial<DatabasePaciente> = {};
    
    if (updates.nombre) updateData.nombre = updates.nombre;
    if (updates.apellido) updateData.apellido = updates.apellido;
    if (updates.dni) updateData.dni = updates.dni;
    if (updates.telefono) updateData.telefono = updates.telefono;
    if (updates.email) updateData.email = updates.email;
    if (updates.fechaNacimiento) updateData.fecha_nacimiento = updates.fechaNacimiento;
    if (updates.direccion !== undefined) updateData.direccion = updates.direccion || null;
    if (updates.obraSocial !== undefined) updateData.obra_social = updates.obraSocial;
    if (updates.numeroAfiliado !== undefined) updateData.numero_afiliado = updates.numeroAfiliado;
    if (updates.observaciones !== undefined) updateData.observaciones = updates.observaciones;

    const { data, error } = await supabase
      .from('pacientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return mapPacienteFromDB(data);
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    throw error;
  }
};

// Eliminar paciente
export const deletePaciente = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    return false;
  }
};

// Buscar pacientes por término
export const searchPacientes = async (searchTerm: string): Promise<Paciente[]> => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`)
      .order('apellido', { ascending: true });

    if (error) throw error;
    
    return data.map(mapPacienteFromDB);
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    throw error;
  }
};

// Verificar si existe un paciente con el mismo DNI
export const existsPacienteByDni = async (dni: string, excludeId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('pacientes')
      .select('id')
      .eq('dni', dni);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data.length > 0;
  } catch (error) {
    console.error('Error verificando DNI:', error);
    return false;
  }
};

// Verificar si existe un paciente con el mismo email
export const existsPacienteByEmail = async (email: string, excludeId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('pacientes')
      .select('id')
      .eq('email', email);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data.length > 0;
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
}; 