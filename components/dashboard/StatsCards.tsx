'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import type { EstadisticasDashboard } from '@/types';

interface StatsCardsProps {
  estadisticas: EstadisticasDashboard;
}

export function StatsCards({ estadisticas }: StatsCardsProps) {
  const stats = [
    {
      title: 'Turnos Hoy',
      value: estadisticas.turnosHoy,
      icon: CalendarDays,
      color: 'text-blue-600'
    },
    {
      title: 'Total Pacientes',
      value: estadisticas.pacientesTotal,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Ingresos del Mes',
      value: `$${estadisticas.ingresosMes.toLocaleString('es-AR')}`,
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Ausentismo',
      value: `${estadisticas.tasaAusentismo}%`,
      icon: AlertTriangle,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}