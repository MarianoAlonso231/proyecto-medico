// Importar y exportar cliente de Supabase
import { supabase } from '../supabase';
export { supabase };

// Exportar funciones de pacientes
export * from './pacientes';

// Exportar funciones de turnos
export * from './turnos';

// Exportar funciones de configuración
export * from './configuracion';

// Exportar tipos de base de datos
export type {
  DatabasePaciente,
  DatabaseTurno,
  DatabaseConfiguracionMedico,
} from '../supabase';

// Funciones de utilidad combinadas
export const initializeDatabase = async () => {
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase.from('configuracion_medico').select('id').limit(1);
    
    if (error) {
      console.error('Error conectando a Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    return false;
  }
};

// Función para obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  try {
    const { data: estadisticasVista, error } = await supabase
      .from('vista_estadisticas_diarias')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(30);

    if (error) throw error;

    const hoy = new Date().toISOString().split('T')[0];
    const estadisticasHoy = estadisticasVista.find((stat: any) => stat.fecha === hoy);

    return {
      turnosHoy: estadisticasHoy?.total_turnos || 0,
      ingresosMes: estadisticasVista.reduce((total: number, stat: any) => total + (stat.ingresos_dia || 0), 0),
      estadisticasDiarias: estadisticasVista,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    throw error;
  }
};

// Función para obtener horarios disponibles usando la vista
export const getHorariosDisponibles = async (fecha: string) => {
  try {
    const { data, error } = await supabase
      .from('vista_horarios_disponibles')
      .select('*')
      .eq('fecha', fecha)
      .eq('disponible', true)
      .order('hora', { ascending: true });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error obteniendo horarios disponibles:', error);
    throw error;
  }
}; 