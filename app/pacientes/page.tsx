'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Phone, Mail, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientForm } from '@/components/patients/PatientForm';
import { PatientHistory } from '@/components/patients/PatientHistory';
import { getPacientes, deletePaciente, getTurnosByPacienteId } from '@/lib/database';

import { useToast } from '@/hooks/use-toast';
import { calculateAge } from '@/lib/dateUtils';
import type { Paciente } from '@/types';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObraSocial, setFilterObraSocial] = useState('all');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pacientesActivos, setPacientesActivos] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const data = await getPacientes();
        setPacientes(data);
        setFilteredPacientes(data);
        
        // Calcular pacientes activos de forma asíncrona
        let activos = 0;
        for (const paciente of data) {
          try {
            const turnos = await getTurnosByPacienteId(paciente.id);
            const tieneProximosTurnos = turnos.some(t => new Date(t.fecha) >= new Date());
            if (tieneProximosTurnos) activos++;
          } catch (error) {
            console.error(`Error verificando turnos para paciente ${paciente.id}:`, error);
          }
        }
        setPacientesActivos(activos);
      } catch (error) {
        console.error('Error cargando pacientes:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los pacientes',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarPacientes();
  }, [toast]);

  useEffect(() => {
    let filtered = pacientes;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm) ||
        p.telefono.includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por obra social
    if (filterObraSocial !== 'all') {
      filtered = filtered.filter(p => p.obraSocial === filterObraSocial);
    }

    setFilteredPacientes(filtered);
  }, [pacientes, searchTerm, filterObraSocial]);

  const handleDeletePaciente = async (paciente: Paciente) => {
    try {
      // Verificar si tiene turnos asociados
      const turnos = await getTurnosByPacienteId(paciente.id);
      if (turnos.length > 0) {
        toast({
          title: 'No se puede eliminar',
          description: 'El paciente tiene turnos asociados. Cancele o complete los turnos primero.',
          variant: 'destructive'
        });
        return;
      }

      const success = await deletePaciente(paciente.id);
      if (success) {
        setPacientes(prev => prev.filter(p => p.id !== paciente.id));
        toast({
          title: 'Paciente eliminado',
          description: 'El paciente se ha eliminado correctamente'
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el paciente',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el paciente',
        variant: 'destructive'
      });
    }
  };

  const handlePacienteCreated = (nuevoPaciente: Paciente) => {
    setPacientes(prev => [...prev, nuevoPaciente]);
    setIsCreateDialogOpen(false);
    toast({
      title: 'Paciente creado',
      description: 'El paciente se ha creado correctamente'
    });
  };



  const handlePacienteUpdated = (pacienteActualizado: Paciente) => {
    setPacientes(prev => prev.map(p => p.id === pacienteActualizado.id ? pacienteActualizado : p));
    setIsEditDialogOpen(false);
    setSelectedPaciente(null);
    toast({
      title: 'Paciente actualizado',
      description: 'Los datos del paciente se han actualizado correctamente'
    });
  };

  const getObrasSociales = () => {
    const obras = Array.from(new Set(pacientes.map(p => p.obraSocial)));
    return obras.filter(obra => obra.trim() !== '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de pacientes y sus datos
          </p>
        </div>
        <div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Paciente</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo paciente
                </DialogDescription>
              </DialogHeader>
              <PatientForm onSuccess={handlePacienteCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Activos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientesActivos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Obras Sociales
            </CardTitle>
            <Badge variant="outline" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getObrasSociales().length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={filterObraSocial} onValueChange={setFilterObraSocial}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por obra social" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las obras sociales</SelectItem>
            {getObrasSociales().map((obra) => (
              <SelectItem key={obra} value={obra}>
                {obra}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de pacientes */}
      <div className="grid gap-6">
        {filteredPacientes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || filterObraSocial !== 'all' ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterObraSocial !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer paciente'
                }
              </p>
              {!searchTerm && filterObraSocial === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPacientes.map((paciente) => (
              <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {paciente.nombre} {paciente.apellido}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPaciente(paciente);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPaciente(paciente);
                            setIsHistoryDialogOpen(true);
                          }}
                        >
                          Ver Historial
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePaciente(paciente)}
                          className="text-destructive"
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    DNI: {paciente.dni} • {calculateAge(paciente.fechaNacimiento)} años
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {paciente.telefono}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {paciente.email}
                  </div>
                  {paciente.direccion && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {paciente.direccion}
                    </div>
                  )}
                  {paciente.obraSocial && (
                    <Badge variant="secondary" className="text-xs">
                      {paciente.obraSocial}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Modifique los datos del paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <PatientForm 
              paciente={selectedPaciente} 
              onSuccess={handlePacienteUpdated} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historial del Paciente</DialogTitle>
            <DialogDescription>
              Historial médico y turnos
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <PatientHistory pacienteId={selectedPaciente.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}