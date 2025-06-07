'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Turno, EstadoTurno } from '@/lib/database/turnos';
import type { Paciente } from '@/lib/database/pacientes';
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  FileText,
  Heart,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoDetailsProps {
  turno: Turno;
  paciente?: Paciente;
  onEstadoChange?: (nuevoEstado: EstadoTurno) => void;
}

const ESTADOS_TURNO: { value: EstadoTurno; label: string; color: string; icon: React.ComponentType<any> }[] = [
  { value: 'programado', label: 'Programado', color: 'bg-blue-100 text-blue-800', icon: Clock },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'completado', label: 'Completado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'no_asistio', label: 'No asistió', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
];

const TIPOS_CONSULTA = {
  'primera_vez': 'Primera vez',
  'control': 'Control',
  'seguimiento': 'Seguimiento'
};

function calculateAge(fechaNacimiento: string): number {
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function TurnoDetails({ turno, paciente, onEstadoChange }: TurnoDetailsProps) {
  const estadoActual = ESTADOS_TURNO.find(e => e.value === turno.estado);
  const IconoEstado = estadoActual?.icon || Clock;

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const formatearHora = (hora: string) => {
    return format(new Date(`2000-01-01T${hora}`), 'HH:mm', { locale: es });
  };

  return (
    <div className="space-y-6">
      {/* Información del turno */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Información del Turno
            </CardTitle>
            <div className="flex items-center gap-2">
              <IconoEstado className="h-4 w-4" />
              <Badge className={estadoActual?.color}>
                {estadoActual?.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fecha</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {formatearFecha(turno.fecha)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Hora</p>
                  <p className="text-sm text-muted-foreground">
                    {formatearHora(turno.hora)} ({turno.duracion} minutos)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tipo de consulta</p>
                  <p className="text-sm text-muted-foreground">
                    {TIPOS_CONSULTA[turno.tipoConsulta as keyof typeof TIPOS_CONSULTA] || turno.tipoConsulta}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Precio</p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    ${turno.precio}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Creado</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(turno.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              {onEstadoChange && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cambiar estado</p>
                  <Select value={turno.estado} onValueChange={onEstadoChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_TURNO.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          <div className="flex items-center gap-2">
                            <estado.icon className="h-4 w-4" />
                            {estado.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {turno.notas && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notas</p>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {turno.notas}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Información del paciente */}
      {paciente && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre completo</p>
                  <p className="text-lg font-semibold">
                    {paciente.nombre} {paciente.apellido}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {paciente.telefono}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {paciente.email}
                    </p>
                  </div>
                </div>

                {paciente.direccion && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dirección</p>
                      <p className="text-sm text-muted-foreground">
                        {paciente.direccion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">DNI</p>
                  <p className="text-sm">{paciente.dni}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Edad</p>
                  <p className="text-sm">
                    {calculateAge(paciente.fechaNacimiento)} años
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de nacimiento</p>
                  <p className="text-sm">
                    {format(new Date(paciente.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>

                {paciente.obraSocial && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Obra Social</p>
                      <p className="text-sm text-muted-foreground">
                        {paciente.obraSocial}
                        {paciente.numeroAfiliado && (
                          <span className="ml-2 text-xs">
                            (N° {paciente.numeroAfiliado})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {paciente.observaciones && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Observaciones médicas</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {paciente.observaciones}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 