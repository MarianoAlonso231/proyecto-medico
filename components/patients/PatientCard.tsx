'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Paciente } from '@/types';
import { calculateAge } from '@/lib/dateUtils';

interface PatientCardProps {
  paciente: Paciente;
  cantidadTurnos?: number;
  ultimoTurno?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  onCreateTurno?: () => void;
}

export function PatientCard({ 
  paciente, 
  cantidadTurnos,
  ultimoTurno,
  onEdit, 
  onDelete, 
  onViewHistory,
  onCreateTurno 
}: PatientCardProps) {
  const edad = calculateAge(paciente.fechaNacimiento);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {paciente.nombre} {paciente.apellido}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span>DNI: {paciente.dni}</span>
              <span>{edad} años</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCreateTurno && (
                <DropdownMenuItem onClick={onCreateTurno}>
                  Nuevo Turno
                </DropdownMenuItem>
              )}
              {onViewHistory && (
                <DropdownMenuItem onClick={onViewHistory}>
                  Ver Historial
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{paciente.telefono}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{paciente.email}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{paciente.direccion}</span>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div>
            <Badge variant="secondary">
              {paciente.obraSocial}
            </Badge>
          </div>
          
          {(cantidadTurnos !== undefined || ultimoTurno) && (
            <div className="text-right text-xs text-muted-foreground">
              {cantidadTurnos !== undefined && (
                <div>{cantidadTurnos} turnos</div>
              )}
              {ultimoTurno && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(ultimoTurno).toLocaleDateString('es-AR')}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {paciente.observaciones && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Observaciones:</strong> {paciente.observaciones}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}