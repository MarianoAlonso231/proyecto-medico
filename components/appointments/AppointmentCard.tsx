'use client';

import { Clock, User, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Turno, Paciente } from '@/types';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  turno: Turno;
  paciente: Paciente;
  onEdit?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  onConfirm?: () => void;
}

export function AppointmentCard({ 
  turno, 
  paciente, 
  onEdit, 
  onCancel, 
  onComplete, 
  onConfirm 
}: AppointmentCardProps) {
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

  const getTipoConsultaText = (tipo: string) => {
    const tipos = {
      primera_vez: 'Primera vez',
      control: 'Control',
      seguimiento: 'Seguimiento'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
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

  const canEdit = turno.estado === 'programado' || turno.estado === 'confirmado';
  const canConfirm = turno.estado === 'programado';
  const canComplete = turno.estado === 'confirmado';
  const canCancel = turno.estado === 'programado' || turno.estado === 'confirmado';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{turno.hora}</span>
              <span className="text-sm text-muted-foreground">
                ({turno.duracion} min)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(turno.fecha).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
          <Badge className={getEstadoColor(turno.estado)}>
            {getEstadoText(turno.estado)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {paciente.nombre} {paciente.apellido}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Tipo: </span>
            <span className="text-sm font-medium">
              {getTipoConsultaText(turno.tipoConsulta)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium">
              ${turno.precio.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
        
        {turno.notas && (
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                {turno.notas}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2 pt-2 border-t">
          {canConfirm && onConfirm && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onConfirm}
              className="text-blue-600 hover:text-blue-700"
            >
              Confirmar
            </Button>
          )}
          
          {canComplete && onComplete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onComplete}
              className="text-green-600 hover:text-green-700"
            >
              Completar
            </Button>
          )}
          
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
          
          {canCancel && onCancel && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700"
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}