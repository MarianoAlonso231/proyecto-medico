'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateTurno, type Turno } from '@/lib/database/turnos';
import { Save, FileText, Stethoscope, Pill } from 'lucide-react';

interface NotasYSeguimientoProps {
  turno: Turno;
  onSuccess: (turnoActualizado: Turno) => void;
}

export function NotasYSeguimiento({ turno, onSuccess }: NotasYSeguimientoProps) {
  const [notas, setNotas] = useState(turno.notas || '');
  const [seguimiento, setSeguimiento] = useState(turno.seguimiento || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      const turnoActualizado = await updateTurno(turno.id, {
        notas: notas.trim(),
        seguimiento: seguimiento.trim(),
      });

      toast({
        title: 'Información guardada',
        description: 'Las notas y seguimiento se han actualizado correctamente'
      });

      onSuccess(turnoActualizado);
    } catch (error) {
      console.error('Error actualizando información:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la información',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vista previa si ya existen datos */}
      {(turno.notas || turno.seguimiento) && (
        <div className="space-y-4">
          {turno.notas && (
            <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-md">
              <div className="flex items-start gap-2">
                <Stethoscope className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800 mb-1">Notas Actuales:</h4>
                  <p className="text-sm text-orange-700">{turno.notas}</p>
                </div>
              </div>
            </div>
          )}
          
          {turno.seguimiento && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
              <div className="flex items-start gap-2">
                <Pill className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Seguimiento Actual:</h4>
                  <p className="text-sm text-blue-700">{turno.seguimiento}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Stethoscope className="h-5 w-5" />
              Notas del Paciente
            </CardTitle>
            <CardDescription>
              Describe síntomas, estado actual, observaciones clínicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Paciente refiere dolor de cabeza desde hace 3 días, fiebre intermitente, presión arterial 140/90..."
              className="min-h-[100px] border-orange-200 focus:border-orange-400"
            />
          </CardContent>
        </Card>

        {/* Seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Pill className="h-5 w-5" />
              Seguimiento Médico
            </CardTitle>
            <CardDescription>
              Tratamiento prescrito, medicamentos, próximos pasos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={seguimiento}
              onChange={(e) => setSeguimiento(e.target.value)}
              placeholder="Ej: Paracetamol 500mg c/8hs por 5 días, reposo relativo, control en 1 semana, derivación a cardiólogo..."
              className="min-h-[100px] border-blue-200 focus:border-blue-400"
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? 'Guardando...' : 'Guardar Todo'}
          </Button>
        </div>
      </form>
    </div>
  );
} 