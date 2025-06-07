'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getTurnosHoy, getProximosTurnos, getPacientes } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatTime } from '@/lib/dateUtils';
import type { Turno, Paciente } from '@/types';

interface DashboardStats {
  turnosHoy: number;
  ingresosMes: number;
  estadisticasDiarias: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [turnosHoy, setTurnosHoy] = useState<Turno[]>([]);
  const [proximosTurnos, setProximosTurnos] = useState<Turno[]>([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        // Cargar estadísticas principales
        const [dashboardStats, turnosDeHoy, proximos, pacientes] = await Promise.all([
          getDashboardStats(),
          getTurnosHoy(),
          getProximosTurnos(5),
          getPacientes()
        ]);

        setStats(dashboardStats);
        setTurnosHoy(turnosDeHoy);
        setProximosTurnos(proximos);
        setTotalPacientes(pacientes.length);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar el dashboard',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarDashboard();
  }, [toast]);

  const getEstadoColor = (estado: string) => {
    const colors = {
      programado: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      no_asistio: 'bg-gray-100 text-gray-800'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de su práctica médica
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos Hoy
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.turnosHoy || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPacientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.ingresosMes?.toLocaleString('es-AR') || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Turnos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proximosTurnos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Turnos de hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Turnos de Hoy</span>
            </CardTitle>
            <CardDescription>
              Agenda del día {formatDate(new Date().toISOString().split('T')[0])}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {turnosHoy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay turnos programados para hoy
              </div>
            ) : (
              <div className="space-y-3">
                {turnosHoy.map(turno => (
                  <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{turno.hora}</span>
                        <Badge 
                          className={getEstadoColor(turno.estado)}
                          variant="secondary"
                        >
                          {getEstadoText(turno.estado)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Duración: {turno.duracion} min
                      </p>
                      {turno.notas && (
                        <p className="text-sm text-muted-foreground">
                          Notas: {turno.notas}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${turno.precio}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {turno.tipoConsulta.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos turnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Próximos Turnos</span>
            </CardTitle>
            <CardDescription>
              Turnos programados para los próximos días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximosTurnos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay próximos turnos programados
              </div>
            ) : (
              <div className="space-y-3">
                {proximosTurnos.map(turno => (
                  <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {formatDate(turno.fecha)} - {turno.hora}
                        </span>
                        <Badge 
                          className={getEstadoColor(turno.estado)}
                          variant="secondary"
                        >
                          {getEstadoText(turno.estado)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Duración: {turno.duracion} min
                      </p>
                      {turno.notas && (
                        <p className="text-sm text-muted-foreground">
                          Notas: {turno.notas}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${turno.precio}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {turno.tipoConsulta.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.location.href = '/pacientes'}>
              <Users className="h-4 w-4 mr-2" />
              Ver Pacientes
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/turnos'}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Gestionar Turnos
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/configuracion'}>
              Configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}