'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  getConfiguracionMedico, 
  saveConfiguracionMedico, 
  updateHorariosLabor,
  updatePrecioConsulta,
  addDiasNoLaborables,
  removeDiasNoLaborables,
  type ConfiguracionMedico 
} from '@/lib/database/configuracion';
import { 
  User, 
  Clock, 
  DollarSign, 
  CalendarDays, 
  Settings,
  Trash2,
  Plus,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export default function ConfiguracionPage() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionMedico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { toast } = useToast();

  // Estados para formularios
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    especialidad: '',
    telefono: '',
    email: '',
    direccion: '',
    matricula: '',
    diasLaborales: [1, 2, 3, 4, 5] as number[],
    horaInicio: '08:00',
    horaFin: '18:00',
    duracionDefaultTurno: 30,
    precioConsulta: 0,
  });

  const [nuevaFechaNoLaboral, setNuevaFechaNoLaboral] = useState<Date>();

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setIsLoading(true);
      const config = await getConfiguracionMedico();
      
      if (config) {
        setConfiguracion(config);
        setFormData({
          nombre: config.nombre,
          apellido: config.apellido,
          especialidad: config.especialidad,
          telefono: config.telefono,
          email: config.email,
          direccion: config.direccion,
          matricula: config.matricula,
          diasLaborales: config.diasLaborales,
          horaInicio: config.horaInicio,
          horaFin: config.horaFin,
          duracionDefaultTurno: config.duracionDefaultTurno,
          precioConsulta: config.precioConsulta,
        });
      } else {
        // Si no hay configuración, mostrar formulario para crear una nueva
        toast({
          title: 'Configuración inicial',
          description: 'Complete sus datos para comenzar a usar el sistema',
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    try {
      setIsSaving(true);
      const config = await saveConfiguracionMedico({
        nombre: formData.nombre,
        apellido: formData.apellido,
        especialidad: formData.especialidad,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        matricula: formData.matricula,
        diasLaborales: formData.diasLaborales,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        duracionDefaultTurno: formData.duracionDefaultTurno,
        precioConsulta: formData.precioConsulta,
        diasNoLaborables: configuracion?.diasNoLaborables || [],
      });

      setConfiguracion(config);
      toast({
        title: 'Configuración guardada',
        description: 'Los datos personales se han actualizado correctamente'
      });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHorarios = async () => {
    try {
      setIsSaving(true);
      const config = await updateHorariosLabor(
        formData.diasLaborales,
        formData.horaInicio,
        formData.horaFin,
        formData.duracionDefaultTurno
      );

      setConfiguracion(config);
      toast({
        title: 'Horarios actualizados',
        description: 'Los horarios de trabajo se han actualizado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando horarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los horarios',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrecio = async () => {
    try {
      setIsSaving(true);
      const config = await updatePrecioConsulta(formData.precioConsulta);

      setConfiguracion(config);
      toast({
        title: 'Precio actualizado',
        description: 'El precio de consulta se ha actualizado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando precio:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el precio',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFechaNoLaboral = async () => {
    if (!nuevaFechaNoLaboral) return;

    try {
      setIsSaving(true);
      // Usar método que no depende de zona horaria
      const year = nuevaFechaNoLaboral.getFullYear();
      const month = String(nuevaFechaNoLaboral.getMonth() + 1).padStart(2, '0');
      const day = String(nuevaFechaNoLaboral.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;
      const config = await addDiasNoLaborables([fechaStr]);

      setConfiguracion(config);
      setNuevaFechaNoLaboral(undefined);
      toast({
        title: 'Fecha agregada',
        description: 'La fecha no laboral se ha agregado correctamente'
      });
    } catch (error) {
      console.error('Error agregando fecha:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la fecha',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFechaNoLaboral = async (fecha: string) => {
    try {
      setIsSaving(true);
      const config = await removeDiasNoLaborables([fecha]);

      setConfiguracion(config);
      toast({
        title: 'Fecha eliminada',
        description: 'La fecha no laboral se ha eliminado correctamente'
      });
    } catch (error) {
      console.error('Error eliminando fecha:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la fecha',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiaLaboralChange = (dia: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        diasLaborales: [...prev.diasLaborales, dia].sort()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        diasLaborales: prev.diasLaborales.filter(d => d !== dia)
      }));
    }
  };

  // Función para formatear fechas sin problemas de zona horaria
  const formatDateSafe = (dateInput: Date | string): string => {
    const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuración del consultorio
          </p>
          {!configuracion && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Primera vez:</strong> Complete la configuración inicial para comenzar a usar el sistema
              </p>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger 
              value="personal" 
              className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-medium">Personal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="horarios" 
              className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Horarios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="precios" 
              className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">Precios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendario" 
              className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm font-medium">Calendario</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Personal */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Datos básicos del médico y del consultorio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del médico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                    placeholder="Apellido del médico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                    placeholder="Ej: Cardiología, Pediatría"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                    placeholder="Número de matrícula"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección del Consultorio</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección completa del consultorio"
                />
              </div>
              <Button onClick={handleSavePersonal} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Datos Personales'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Horarios */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de Trabajo</CardTitle>
              <CardDescription>
                Configura los días y horarios de atención
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Días laborales */}
              <div>
                <Label className="text-base font-medium mb-3 block">Días Laborales</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <div key={dia.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia.value}`}
                        checked={formData.diasLaborales.includes(dia.value)}
                        onCheckedChange={(checked) => 
                          handleDiaLaboralChange(dia.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`dia-${dia.value}`} className="text-sm">
                        {dia.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora de Inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora de Fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaFin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración por Turno (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={formData.duracionDefaultTurno}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duracionDefaultTurno: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveHorarios} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Horarios'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Precios */}
        <TabsContent value="precios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Precios</CardTitle>
              <CardDescription>
                Establece el precio base de las consultas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio de Consulta ($)</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precioConsulta}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    precioConsulta: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  Este será el precio base que se usará para nuevos turnos
                </p>
              </div>

              <Button onClick={handleSavePrecio} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Precio'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Calendario */}
        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Días No Laborables</CardTitle>
              <CardDescription>
                Gestiona feriados, vacaciones y días especiales sin atención
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agregar nueva fecha */}
              <div>
                <Label className="text-base font-medium mb-3 block">Agregar Día No Laboral</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {nuevaFechaNoLaboral ? formatDateSafe(nuevaFechaNoLaboral) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nuevaFechaNoLaboral}
                        onSelect={setNuevaFechaNoLaboral}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    onClick={handleAddFechaNoLaboral} 
                    disabled={!nuevaFechaNoLaboral || isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Lista de fechas no laborables */}
              <div>
                <Label className="text-base font-medium mb-3 block">Fechas No Laborables</Label>
                {configuracion?.diasNoLaborables && configuracion.diasNoLaborables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {configuracion.diasNoLaborables.map((fecha) => (
                      <div key={fecha} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">
                          {formatDateSafe(fecha)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFechaNoLaboral(fecha)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No hay fechas no laborables configuradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 