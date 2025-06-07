'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  addTurno, 
  updateTurno, 
  checkTurnoConflict 
} from '@/lib/database/turnos';
import { 
  getConfiguracionMedico,
  esDiaLaboral,
  estaEnHorarioLaboral 
} from '@/lib/database/configuracion';
import type { Turno, Paciente, TipoConsulta, EstadoTurno } from '@/types';
import { CalendarIcon, Clock, User, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoFormProps {
  pacientes: Paciente[];
  turno?: Turno;
  onSuccess: (turno: Turno) => void;
  fechaInicial?: Date;
}

const TIPOS_CONSULTA: { value: TipoConsulta; label: string }[] = [
  { value: 'primera_vez', label: 'Primera vez' },
  { value: 'control', label: 'Control' },
  { value: 'seguimiento', label: 'Seguimiento' },
];

const ESTADOS_TURNO: { value: EstadoTurno; label: string }[] = [
  { value: 'programado', label: 'Programado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'no_asistio', label: 'No asistió' },
];

// Generar horarios cada 30 minutos
const generateTimeSlots = (inicio: string = '08:00', fin: string = '18:00') => {
  const slots = [];
  const start = parseInt(inicio.split(':')[0]) * 60 + parseInt(inicio.split(':')[1]);
  const end = parseInt(fin.split(':')[0]) * 60 + parseInt(fin.split(':')[1]);
  
  for (let minutes = start; minutes < end; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
};

export function TurnoForm({ pacientes, turno, onSuccess, fechaInicial }: TurnoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: turno?.pacienteId || '',
    fecha: turno?.fecha || (fechaInicial ? format(fechaInicial, 'yyyy-MM-dd') : ''),
    hora: turno?.hora || '',
    duracion: turno?.duracion || 30,
    tipoConsulta: turno?.tipoConsulta || 'primera_vez' as TipoConsulta,
    estado: turno?.estado || 'programado' as EstadoTurno,
    notas: turno?.notas || '',
    precio: turno?.precio || 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    turno?.fecha ? new Date(turno.fecha) : fechaInicial
  );
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const fechaStr = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, fecha: fechaStr }));
      generarHorarios();
    }
  }, [selectedDate, configuracion]);

  const cargarConfiguracion = async () => {
    try {
      const config = await getConfiguracionMedico();
      setConfiguracion(config);
      if (config && !turno) {
        setFormData(prev => ({
          ...prev,
          precio: config.precioConsulta,
          duracion: config.duracionDefaultTurno
        }));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const generarHorarios = () => {
    if (!configuracion) return;

    const horaInicio = configuracion.horaInicio || '08:00';
    const horaFin = configuracion.horaFin || '18:00';
    const slots = generateTimeSlots(horaInicio, horaFin);
    setHorariosDisponibles(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pacienteId || !formData.fecha || !formData.hora) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Validar que sea día laboral
      const esLaboral = await esDiaLaboral(formData.fecha);
      if (!esLaboral) {
        toast({
          title: 'Día no laboral',
          description: 'No se pueden crear turnos en este día. Verifique la configuración de días laborales.',
          variant: 'destructive'
        });
        return;
      }

      // Validar que esté en horario laboral
      const enHorario = await estaEnHorarioLaboral(formData.hora);
      if (!enHorario) {
        toast({
          title: 'Fuera de horario',
          description: 'La hora seleccionada está fuera del horario laboral.',
          variant: 'destructive'
        });
        return;
      }

      // Verificar conflictos de horario solo para turnos nuevos o si cambió la fecha/hora
      if (!turno || turno.fecha !== formData.fecha || turno.hora !== formData.hora) {
        const hayConflicto = await checkTurnoConflict(
          formData.fecha, 
          formData.hora, 
          formData.duracion,
          turno?.id
        );

        if (hayConflicto) {
          toast({
            title: 'Conflicto de horario',
            description: 'Ya existe un turno en ese horario',
            variant: 'destructive'
          });
          return;
        }
      }

      let resultado: Turno;

      if (turno) {
        // Actualizar turno existente
        resultado = await updateTurno(turno.id, {
          pacienteId: formData.pacienteId,
          fecha: formData.fecha,
          hora: formData.hora,
          duracion: formData.duracion,
          tipoConsulta: formData.tipoConsulta,
          estado: formData.estado,
          notas: formData.notas,
          precio: formData.precio,
        });
      } else {
        // Crear nuevo turno
        resultado = await addTurno({
          pacienteId: formData.pacienteId,
          fecha: formData.fecha,
          hora: formData.hora,
          duracion: formData.duracion,
          tipoConsulta: formData.tipoConsulta,
          estado: formData.estado,
          notas: formData.notas,
          precio: formData.precio,
        });
      }

      onSuccess(resultado);
    } catch (error) {
      console.error('Error guardando turno:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${turno ? 'actualizar' : 'crear'} el turno`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPacienteNombre = (pacienteId: string) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : '';
  };

  const isDiaDeshabilitado = (date: Date) => {
    if (!configuracion) return false;
    
    // Fecha anterior a hoy
    if (date < new Date()) return true;
    
    const diaSemana = date.getDay();
    const fechaStr = format(date, 'yyyy-MM-dd');
    
    // No es día laboral
    if (!configuracion.diasLaborales.includes(diaSemana)) return true;
    
    // Es día no laboral específico
    if (configuracion.diasNoLaborables.includes(fechaStr)) return true;
    
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selección de paciente */}
      <div className="space-y-2">
        <Label htmlFor="paciente">Paciente *</Label>
        <Select value={formData.pacienteId} onValueChange={(value) => setFormData(prev => ({ ...prev, pacienteId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar paciente">
              {formData.pacienteId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {getPacienteNombre(formData.pacienteId)}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((paciente) => (
              <SelectItem key={paciente.id} value={paciente.id}>
                <div className="flex flex-col">
                  <span>{paciente.nombre} {paciente.apellido}</span>
                  <span className="text-xs text-muted-foreground">
                    DNI: {paciente.dni} • {paciente.telefono}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha */}
        <div className="space-y-2">
          <Label>Fecha *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDiaDeshabilitado}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Hora */}
        <div className="space-y-2">
          <Label htmlFor="hora">Hora *</Label>
          <Select value={formData.hora} onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar hora">
                {formData.hora && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formData.hora}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {horariosDisponibles.map((hora) => (
                <SelectItem key={hora} value={hora}>
                  {hora}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo de consulta */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Consulta</Label>
          <Select value={formData.tipoConsulta} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoConsulta: value as TipoConsulta }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CONSULTA.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duración */}
        <div className="space-y-2">
          <Label htmlFor="duracion">Duración (min)</Label>
          <Input
            id="duracion"
            type="number"
            min="15"
            max="120"
            step="15"
            value={formData.duracion}
            onChange={(e) => setFormData(prev => ({ ...prev, duracion: parseInt(e.target.value) || 30 }))}
          />
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label htmlFor="precio">Precio ($)</Label>
          <Input
            id="precio"
            type="number"
            min="0"
            step="0.01"
            value={formData.precio}
            onChange={(e) => setFormData(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      {/* Estado (solo para edición) */}
      {turno && (
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value as EstadoTurno }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_TURNO.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Notas (opcional)</Label>
        <Textarea
          id="notas"
          placeholder="Notas adicionales sobre la consulta..."
          value={formData.notas}
          onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        <Save className="h-4 w-4 mr-2" />
        {isLoading ? 'Guardando...' : turno ? 'Actualizar Turno' : 'Crear Turno'}
      </Button>
    </form>
  );
} 