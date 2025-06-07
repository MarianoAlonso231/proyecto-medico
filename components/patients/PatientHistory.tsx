'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTurnosByPacienteId, getPacienteById } from '@/lib/database';
import { formatDate } from '@/lib/dateUtils';
import type { Turno } from '@/types';

interface PatientHistoryProps {
  pacienteId: string;
}

export function PatientHistory({ pacienteId }: PatientHistoryProps) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const turnosData = await getTurnosByPacienteId(pacienteId);
        const turnosOrdenados = turnosData.sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora}`);
          const fechaB = new Date(`${b.fecha}T${b.hora}`);
          return fechaB.getTime() - fechaA.getTime();
        });
        setTurnos(turnosOrdenados);
      } catch (error) {
        console.error('Error cargando historial del paciente:', error);
        setTurnos([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarHistorial();
  }, [pacienteId]);

  const getEstadoColor = (estado: string) => {
    const colors = {
      programado: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      confirmado: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      completado: 'bg-green-100 text-green-800 hover:bg-green-200',
      cancelado: 'bg-red-100 text-red-800 hover:bg-red-200',
      no_asistio: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    return colors[estado as keyof typeof colors] || colors.programado;
  };

  const getEstadoText = (estado: string) => {
    const estados = {
      programado: 'Programado',
      confirmado: 'Confirmado',
      completado: 'Completado',
      cancelado: 'Cancelado',
      no_asistio: 'No asistió'
    };
    return estados[estado as keyof typeof estados] || estado;
  };

  const getTipoConsultaText = (tipo: string) => {
    const tipos = {
      primera_vez: 'Primera vez',
      control: 'Control',
      seguimiento: 'Seguimiento'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getEstadisticas = () => {
    const total = turnos.length;
    const completados = turnos.filter(t => t.estado === 'completado').length;
    const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
    const noAsistio = turnos.filter(t => t.estado === 'no_asistio').length;
    const ingresoTotal = turnos
      .filter(t => t.estado === 'completado')
      .reduce((sum, t) => sum + t.precio, 0);

    return {
      total,
      completados,
      cancelados,
      noAsistio,
      ingresoTotal,
      tasaAsistencia: total > 0 ? Math.round((completados / total) * 100) : 0
    };
  };

  const turnosPasados = turnos.filter(t => new Date(t.fecha) < new Date());
  const turnosFuturos = turnos.filter(t => new Date(t.fecha) >= new Date());
  const estadisticas = getEstadisticas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.completados}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.tasaAsistencia}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estadisticas.ingresoTotal.toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de turnos */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos">Todos ({turnos.length})</TabsTrigger>
          <TabsTrigger value="pasados">Pasados ({turnosPasados.length})</TabsTrigger>
          <TabsTrigger value="futuros">Futuros ({turnosFuturos.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-4">
          <TurnosList turnos={turnos} />
        </TabsContent>
        
        <TabsContent value="pasados" className="space-y-4">
          <TurnosList turnos={turnosPasados} />
        </TabsContent>
        
        <TabsContent value="futuros" className="space-y-4">
          <TurnosList turnos={turnosFuturos} />
        </TabsContent>
      </Tabs>
    </div>
  );

  function TurnosList({ turnos }: { turnos: Turno[] }) {
    if (turnos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No hay turnos en esta categoría
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {turnos.map(turno => (
          <Card key={turno.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(turno.fecha)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{turno.hora}</span>
                      <span className="text-sm text-muted-foreground">
                        ({turno.duracion} min)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      <strong>Tipo:</strong> {getTipoConsultaText(turno.tipoConsulta)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        ${turno.precio.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  
                  {turno.notas && (
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">{turno.notas}</p>
                    </div>
                  )}
                </div>
                
                <Badge className={getEstadoColor(turno.estado)}>
                  {getEstadoText(turno.estado)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}