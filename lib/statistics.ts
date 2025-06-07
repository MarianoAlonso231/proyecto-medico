import type { EstadisticasDashboard, Turno, Paciente } from '@/types';
import { getTurnos, getPacientes } from './storage';
import { startOfDay, endOfDay, addDays } from './dateUtils';

export const getEstadisticasDashboard = (): EstadisticasDashboard => {
  const turnos = getTurnos();
  const pacientes = getPacientes();
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  // Turnos de hoy
  const turnosHoy = turnos.filter(t => {
    const fechaTurno = new Date(t.fecha);
    return fechaTurno.toDateString() === hoy.toDateString();
  }).length;
  
  // Próximos turnos (siguientes 7 días)
  const proximosTurnos = turnos
    .filter(t => {
      const fechaTurno = new Date(t.fecha);
      const limite = addDays(hoy, 7);
      return fechaTurno >= hoy && fechaTurno <= limite && 
             t.estado !== 'cancelado' && t.estado !== 'completado';
    })
    .sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.hora}`);
      const fechaB = new Date(`${b.fecha}T${b.hora}`);
      return fechaA.getTime() - fechaB.getTime();
    })
    .slice(0, 5);
  
  // Ingresos del mes
  const turnosCompletadosMes = turnos.filter(t => {
    const fechaTurno = new Date(t.fecha);
    return fechaTurno >= inicioMes && fechaTurno <= finMes && 
           t.estado === 'completado';
  });
  const ingresosMes = turnosCompletadosMes.reduce((sum, t) => sum + t.precio, 0);
  
  // Tasa de ausentismo (últimos 30 días)
  const hace30Dias = addDays(hoy, -30);
  const turnosPasados = turnos.filter(t => {
    const fechaTurno = new Date(t.fecha);
    return fechaTurno >= hace30Dias && fechaTurno < hoy;
  });
  
  const turnosNoAsistidos = turnosPasados.filter(t => t.estado === 'no_asistio').length;
  const tasaAusentismo = turnosPasados.length > 0 
    ? (turnosNoAsistidos / turnosPasados.length) * 100 
    : 0;
  
  // Turnos por estado
  const turnosPorEstado = {
    programado: turnos.filter(t => t.estado === 'programado').length,
    confirmado: turnos.filter(t => t.estado === 'confirmado').length,
    completado: turnos.filter(t => t.estado === 'completado').length,
    cancelado: turnos.filter(t => t.estado === 'cancelado').length,
    no_asistio: turnos.filter(t => t.estado === 'no_asistio').length
  };
  
  return {
    turnosHoy,
    pacientesTotal: pacientes.length,
    proximosTurnos,
    ingresosMes,
    tasaAusentismo: Math.round(tasaAusentismo * 100) / 100,
    turnosPorEstado
  };
};

export const getTurnosPorMes = (año: number): { mes: string; cantidad: number; ingresos: number }[] => {
  const turnos = getTurnos();
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return meses.map((mes, index) => {
    const turnosMes = turnos.filter(t => {
      const fecha = new Date(t.fecha);
      return fecha.getFullYear() === año && fecha.getMonth() === index;
    });
    
    const turnosCompletados = turnosMes.filter(t => t.estado === 'completado');
    
    return {
      mes,
      cantidad: turnosMes.length,
      ingresos: turnosCompletados.reduce((sum, t) => sum + t.precio, 0)
    };
  });
};

export const getPacientesMasFrecuentes = (limite: number = 5): Array<{
  paciente: Paciente;
  cantidadTurnos: number;
  ultimoTurno: string;
}> => {
  const turnos = getTurnos();
  const pacientes = getPacientes();
  
  const frecuencia = new Map<string, number>();
  const ultimosTurnos = new Map<string, string>();
  
  turnos.forEach(turno => {
    const count = frecuencia.get(turno.pacienteId) || 0;
    frecuencia.set(turno.pacienteId, count + 1);
    
    const fechaActual = ultimosTurnos.get(turno.pacienteId);
    if (!fechaActual || turno.fecha > fechaActual) {
      ultimosTurnos.set(turno.pacienteId, turno.fecha);
    }
  });
  
  return Array.from(frecuencia.entries())
    .map(([pacienteId, cantidadTurnos]) => {
      const paciente = pacientes.find(p => p.id === pacienteId);
      const ultimoTurno = ultimosTurnos.get(pacienteId) || '';
      
      return {
        paciente: paciente!,
        cantidadTurnos,
        ultimoTurno
      };
    })
    .filter(item => item.paciente)
    .sort((a, b) => b.cantidadTurnos - a.cantidadTurnos)
    .slice(0, limite);
};

export const getResumenSemanal = (fecha: Date): {
  fecha: string;
  turnos: number;
  ingresos: number;
}[] => {
  const turnos = getTurnos();
  const inicioSemana = new Date(fecha);
  const diaSemana = inicioSemana.getDay();
  const diff = inicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  inicioSemana.setDate(diff);
  
  const resumen = [];
  
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    const fechaStr = dia.toISOString().split('T')[0];
    
    const turnosDia = turnos.filter(t => t.fecha === fechaStr);
    const turnosCompletados = turnosDia.filter(t => t.estado === 'completado');
    
    resumen.push({
      fecha: fechaStr,
      turnos: turnosDia.length,
      ingresos: turnosCompletados.reduce((sum, t) => sum + t.precio, 0)
    });
  }
  
  return resumen;
};