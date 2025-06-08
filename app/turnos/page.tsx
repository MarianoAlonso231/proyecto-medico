'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  getTurnos, 
  getTurnosByFecha, 
  getTurnosHoy,
  getProximosTurnos,
  getEstadisticasTurnos,
  deleteTurno,
  changeEstadoTurno,
  type Turno,
  type EstadoTurno 
} from '@/lib/database/turnos';
import { getPacientes, type Paciente } from '@/lib/database/pacientes';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  TrendingUp,
  CalendarDays,
  FileText,
  Stethoscope,
  Pill
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente para crear/editar turnos
import { TurnoForm } from '@/components/turnos/TurnoForm';
// Componente para vista detallada del turno
import { TurnoDetails } from '@/components/turnos/TurnoDetails';
// Componente para notas y seguimiento
import { NotasYSeguimiento } from '@/components/turnos/NotasYSeguimiento';

const ESTADOS_TURNO: { value: EstadoTurno; label: string; color: string }[] = [
  { value: 'programado', label: 'Programado', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  { value: 'completado', label: 'Completado', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'no_asistio', label: 'No asistió', color: 'bg-orange-100 text-orange-800' },
];

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [turnosDia, setTurnosDia] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendario');
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSeguimientoDialogOpen, setIsSeguimientoDialogOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState<EstadoTurno | 'todos'>('todos');
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      cargarTurnosDia(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, turnos]);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [turnosData, pacientesData, estadisticasData] = await Promise.all([
        getTurnos(),
        getPacientes(),
        getEstadisticasTurnos()
      ]);
      
      setTurnos(turnosData);
      setPacientes(pacientesData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarTurnosDia = async (fecha: string) => {
    try {
      const turnosData = await getTurnosByFecha(fecha);
      setTurnosDia(turnosData);
    } catch (error) {
      console.error('Error cargando turnos del día:', error);
    }
  };

  const handleDeleteTurno = async (turno: Turno) => {
    if (!confirm(`¿Está seguro de que desea eliminar el turno de ${getPacienteNombre(turno.pacienteId)}?`)) {
      return;
    }

    try {
      const success = await deleteTurno(turno.id);
      if (success) {
        setTurnos(prev => prev.filter(t => t.id !== turno.id));
        toast({
          title: 'Turno eliminado',
          description: 'El turno se ha eliminado correctamente'
        });
      }
    } catch (error) {
      console.error('Error eliminando turno:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el turno',
        variant: 'destructive'
      });
    }
  };

  const handleChangeEstado = async (turno: Turno, nuevoEstado: EstadoTurno) => {
    try {
      const turnoActualizado = await changeEstadoTurno(turno.id, nuevoEstado);
      setTurnos(prev => prev.map(t => t.id === turno.id ? turnoActualizado : t));
      toast({
        title: 'Estado actualizado',
        description: `El turno se marcó como ${getEstadoLabel(nuevoEstado)}`
      });
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  const handleTurnoCreated = (nuevoTurno: Turno) => {
    setTurnos(prev => [...prev, nuevoTurno]);
    setIsCreateDialogOpen(false);
    toast({
      title: 'Turno creado',
      description: 'El turno se ha creado correctamente'
    });
  };

  const handleTurnoUpdated = (turnoActualizado: Turno) => {
    setTurnos(prev => prev.map(t => t.id === turnoActualizado.id ? turnoActualizado : t));
    setIsEditDialogOpen(false);
    setIsSeguimientoDialogOpen(false);
    setSelectedTurno(null);
    toast({
      title: 'Turno actualizado',
      description: 'El turno se ha actualizado correctamente'
    });
  };

  const getPacienteNombre = (pacienteId: string): string => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente no encontrado';
  };

  const getPaciente = (pacienteId: string): Paciente | undefined => {
    return pacientes.find(p => p.id === pacienteId);
  };

  const getEstadoLabel = (estado: EstadoTurno): string => {
    return ESTADOS_TURNO.find(e => e.value === estado)?.label || estado;
  };

  const getEstadoColor = (estado: EstadoTurno): string => {
    return ESTADOS_TURNO.find(e => e.value === estado)?.color || 'bg-gray-100 text-gray-800';
  };

  const turnosFiltrados = turnos.filter(turno => 
    filterEstado === 'todos' || turno.estado === filterEstado
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Visitas</h1>
          <p className="text-muted-foreground">
            Administra citas, horarios y estados de consultas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Turno</DialogTitle>
              <DialogDescription>
                Complete los datos para agendar una nueva cita
              </DialogDescription>
            </DialogHeader>
            <TurnoForm 
              pacientes={pacientes}
              onSuccess={handleTurnoCreated}
              fechaInicial={selectedDate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.turnosHoy || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalTurnos || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.completados || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${estadisticas.ingresosMes || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab Calendario */}
        <TabsContent value="calendario" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Calendario */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fecha</CardTitle>
                <CardDescription>
                  Haga clic en una fecha para ver los turnos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  locale={es}
                />
              </CardContent>
            </Card>

            {/* Turnos del día seleccionado */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Turnos - {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
                </CardTitle>
                <CardDescription>
                  {turnosDia.length} turno{turnosDia.length !== 1 ? 's' : ''} agendado{turnosDia.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {turnosDia.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay turnos para esta fecha</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Turno
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {turnosDia.map((turno) => (
                      <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{turno.hora}</span>
                            <Badge className={getEstadoColor(turno.estado)}>
                              {getEstadoLabel(turno.estado)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getPacienteNombre(turno.pacienteId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {turno.tipoConsulta} • {turno.duracion} min • ${turno.precio}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTurno(turno);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTurno(turno);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {turno.estado === 'programado' && (
                              <DropdownMenuItem
                                onClick={() => handleChangeEstado(turno, 'confirmado')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {turno.estado === 'confirmado' && (
                              <DropdownMenuItem
                                onClick={() => handleChangeEstado(turno, 'completado')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleChangeEstado(turno, 'cancelado')}
                              className="text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTurno(turno)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Lista */}
        <TabsContent value="lista" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoTurno | 'todos')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_TURNO.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {turnosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No hay turnos {filterEstado !== 'todos' ? `con estado "${getEstadoLabel(filterEstado as EstadoTurno)}"` : ''}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {filterEstado !== 'todos' 
                      ? 'Intenta cambiar el filtro o crear un nuevo turno'
                      : 'Comienza creando tu primer turno'
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Turno
                  </Button>
                </CardContent>
              </Card>
            ) : (
              turnosFiltrados.map((turno) => {
                const paciente = getPaciente(turno.pacienteId);
                return (
                  <Card key={turno.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(turno.fecha), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{turno.hora}</span>
                            </div>
                            <Badge className={getEstadoColor(turno.estado)}>
                              {getEstadoLabel(turno.estado)}
                            </Badge>
                            {turno.notas && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Con Notas
                              </Badge>
                            )}
                            {turno.seguimiento && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                <Pill className="h-3 w-3 mr-1" />
                                Con Seguimiento
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{getPacienteNombre(turno.pacienteId)}</span>
                          </div>
                          
                          {paciente && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {paciente.telefono}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {paciente.email}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              <strong>Tipo:</strong> {turno.tipoConsulta}
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Duración:</strong> {turno.duracion} min
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Precio:</strong> ${turno.precio}
                            </span>
                          </div>
                          
                          {(turno.notas || turno.seguimiento) && (
                            <div className="mt-3 space-y-2">
                              {turno.notas && (
                                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <Stethoscope className="h-4 w-4 text-orange-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">Notas:</p>
                                      <p className="text-sm text-orange-700 mt-1">{turno.notas}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {turno.seguimiento && (
                                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <Pill className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800">Seguimiento:</p>
                                      <p className="text-sm text-blue-700 mt-1">{turno.seguimiento}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTurno(turno);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTurno(turno);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTurno(turno);
                                setIsSeguimientoDialogOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Agregar Seguimiento
                            </DropdownMenuItem>
                            {turno.estado === 'programado' && (
                              <DropdownMenuItem
                                onClick={() => handleChangeEstado(turno, 'confirmado')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {turno.estado === 'confirmado' && (
                              <DropdownMenuItem
                                onClick={() => handleChangeEstado(turno, 'completado')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleChangeEstado(turno, 'cancelado')}
                              className="text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTurno(turno)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-4">
          {estadisticas && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Estadísticas por estado */}
              <Card>
                <CardHeader>
                  <CardTitle>Turnos por Estado</CardTitle>
                  <CardDescription>
                    Distribución de turnos según su estado actual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ESTADOS_TURNO.map((estado) => {
                      const count = estadisticas.turnosPorEstado?.[estado.value] || 0;
                      const percentage = estadisticas.totalTurnos > 0 
                        ? Math.round((count / estadisticas.totalTurnos) * 100) 
                        : 0;
                      
                      return (
                        <div key={estado.value} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={estado.color}>{estado.label}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {count} turnos ({percentage}%)
                            </span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen financiero */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen Financiero</CardTitle>
                  <CardDescription>
                    Ingresos y estadísticas monetarias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ingresos del mes</span>
                      <span className="text-lg font-bold text-green-600">
                        ${estadisticas.ingresosMes || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Promedio por consulta</span>
                      <span className="text-lg font-bold">
                        ${estadisticas.promedioConsulta || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Consultas completadas</span>
                      <span className="text-lg font-bold">
                        {estadisticas.completados || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
            <DialogDescription>
              Modifique los datos del turno
            </DialogDescription>
          </DialogHeader>
          {selectedTurno && (
            <TurnoForm 
              pacientes={pacientes}
              turno={selectedTurno}
              onSuccess={handleTurnoUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Turno</DialogTitle>
            <DialogDescription>
              Información completa del turno y paciente
            </DialogDescription>
          </DialogHeader>
          {selectedTurno && (
            <TurnoDetails 
              turno={selectedTurno}
              paciente={getPaciente(selectedTurno.pacienteId)}
              onEstadoChange={(nuevoEstado) => handleChangeEstado(selectedTurno, nuevoEstado)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSeguimientoDialogOpen} onOpenChange={setIsSeguimientoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notas y Seguimiento</DialogTitle>
            <DialogDescription>
              Gestione las notas del paciente y el seguimiento médico
            </DialogDescription>
          </DialogHeader>
          {selectedTurno && (
            <NotasYSeguimiento 
              turno={selectedTurno}
              onSuccess={handleTurnoUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 