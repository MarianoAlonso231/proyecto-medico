'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMonthDays, getWeekDays, isSameDay, isToday, getDayName, getMonthName } from '@/lib/dateUtils';
import type { VistaCalendario, Turno } from '@/types';

interface CalendarProps {
  vista: VistaCalendario;
  fechaActual: Date;
  turnos: Turno[];
  onFechaChange: (fecha: Date) => void;
  onTurnoClick?: (turno: Turno) => void;
  onDayClick?: (fecha: Date) => void;
}

export function Calendar({ 
  vista, 
  fechaActual, 
  turnos, 
  onFechaChange, 
  onTurnoClick,
  onDayClick 
}: CalendarProps) {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(fechaActual);
    
    switch (vista) {
      case 'dia':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'semana':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'mes':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    onFechaChange(newDate);
  };

  const getTurnosForDate = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return turnos.filter(t => t.fecha === fechaStr);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      programado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
      completado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200',
      no_asistio: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[estado as keyof typeof colors] || colors.programado;
  };

  const renderVistaDay = () => {
    const turnosDelDia = getTurnosForDate(fechaActual);
    
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          {turnosDelDia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay turnos programados para este día
            </div>
          ) : (
            turnosDelDia
              .sort((a, b) => a.hora.localeCompare(b.hora))
              .map(turno => (
                <div
                  key={turno.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow',
                    getEstadoColor(turno.estado)
                  )}
                  onClick={() => onTurnoClick?.(turno)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{turno.hora}</div>
                      <div className="text-sm opacity-90">
                        Duración: {turno.duracion} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {turno.tipoConsulta.replace('_', ' ')}
                      </div>
                      <div className="text-xs capitalize">
                        {turno.estado.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  {turno.notas && (
                    <div className="mt-2 text-xs opacity-75">
                      {turno.notas}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  const renderVistaWeek = () => {
    const dias = getWeekDays(fechaActual);
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {dias.map(dia => {
          const turnosDelDia = getTurnosForDate(dia);
          const esHoy = isToday(dia);
          
          return (
            <div
              key={dia.toISOString()}
              className={cn(
                'border rounded-lg p-2 min-h-[120px] cursor-pointer hover:bg-muted/50',
                esHoy && 'bg-primary/5 border-primary'
              )}
              onClick={() => onDayClick?.(dia)}
            >
              <div className={cn(
                'text-sm font-medium mb-2',
                esHoy && 'text-primary'
              )}>
                {getDayName(dia).substring(0, 3)} {dia.getDate()}
              </div>
              <div className="space-y-1">
                {turnosDelDia.slice(0, 3).map(turno => (
                  <div
                    key={turno.id}
                    className={cn(
                      'text-xs p-1 rounded border cursor-pointer',
                      getEstadoColor(turno.estado)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTurnoClick?.(turno);
                    }}
                  >
                    {turno.hora}
                  </div>
                ))}
                {turnosDelDia.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{turnosDelDia.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVistaMonth = () => {
    const dias = getMonthDays(fechaActual);
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dias.map(dia => {
            const turnosDelDia = getTurnosForDate(dia);
            const esHoy = isToday(dia);
            const esMesActual = dia.getMonth() === fechaActual.getMonth();
            
            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  'border rounded-lg p-2 min-h-[80px] cursor-pointer hover:bg-muted/50',
                  !esMesActual && 'opacity-50',
                  esHoy && 'bg-primary/5 border-primary'
                )}
                onClick={() => onDayClick?.(dia)}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  esHoy && 'text-primary'
                )}>
                  {dia.getDate()}
                </div>
                <div className="space-y-1">
                  {turnosDelDia.slice(0, 2).map(turno => (
                    <div
                      key={turno.id}
                      className={cn(
                        'text-xs px-1 py-0.5 rounded border cursor-pointer truncate',
                        getEstadoColor(turno.estado)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTurnoClick?.(turno);
                      }}
                      title={`${turno.hora} - ${turno.tipoConsulta}`}
                    >
                      {turno.hora}
                    </div>
                  ))}
                  {turnosDelDia.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{turnosDelDia.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    switch (vista) {
      case 'dia':
        return `${getDayName(fechaActual)}, ${fechaActual.getDate()} de ${getMonthName(fechaActual)} ${fechaActual.getFullYear()}`;
      case 'semana':
        const dias = getWeekDays(fechaActual);
        const inicio = dias[0];
        const fin = dias[6];
        return `${inicio.getDate()} - ${fin.getDate()} de ${getMonthName(fechaActual)} ${fechaActual.getFullYear()}`;
      case 'mes':
        return `${getMonthName(fechaActual)} ${fechaActual.getFullYear()}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {getHeaderTitle()}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onFechaChange(new Date())}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4">
        {vista === 'dia' && renderVistaDay()}
        {vista === 'semana' && renderVistaWeek()}
        {vista === 'mes' && renderVistaMonth()}
      </div>
    </div>
  );
}