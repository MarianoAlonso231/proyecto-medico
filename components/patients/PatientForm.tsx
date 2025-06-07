'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addPaciente, updatePaciente } from '@/lib/database';
import { validatePacienteSupabase } from '@/lib/validations-supabase';
import type { Paciente } from '@/types';

interface PatientFormProps {
  paciente?: Paciente;
  onSuccess: (paciente: Paciente) => void;
}

interface FormData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  direccion: string;
  obraSocial: string;
  numeroAfiliado: string;
  observaciones: string;
}

export function PatientForm({ paciente, onSuccess }: PatientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors }
  } = useForm<FormData>({
    defaultValues: paciente ? {
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni,
      telefono: paciente.telefono,
      email: paciente.email,
      fechaNacimiento: paciente.fechaNacimiento,
      direccion: paciente.direccion,
      obraSocial: paciente.obraSocial,
      numeroAfiliado: paciente.numeroAfiliado,
      observaciones: paciente.observaciones
    } : {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      direccion: '',
      obraSocial: '',
      numeroAfiliado: '',
      observaciones: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrors([]);

    try {
      // Validar datos con verificación en BD
      const validation = await validatePacienteSupabase(data, !!paciente);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      let resultado: Paciente;

      if (paciente) {
        // Actualizar paciente existente
        resultado = await updatePaciente(paciente.id, data);
      } else {
        // Crear nuevo paciente
        resultado = await addPaciente(data);
      }

      onSuccess(resultado);
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      setErrors(['Error al guardar el paciente. Verifique su conexión e intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">Errores de validación:</h4>
          <ul className="list-disc list-inside text-sm text-destructive">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            {...register('nombre', { required: 'El nombre es obligatorio' })}
            placeholder="Nombre del paciente"
          />
          {formErrors.nombre && (
            <p className="text-sm text-destructive">{formErrors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            {...register('apellido', { required: 'El apellido es obligatorio' })}
            placeholder="Apellido del paciente"
          />
          {formErrors.apellido && (
            <p className="text-sm text-destructive">{formErrors.apellido.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dni">DNI *</Label>
          <Input
            id="dni"
            {...register('dni', { required: 'El DNI es obligatorio' })}
            placeholder="12345678"
          />
          {formErrors.dni && (
            <p className="text-sm text-destructive">{formErrors.dni.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            {...register('telefono', { required: 'El teléfono es obligatorio' })}
            placeholder="+54 11 1234-5678"
          />
          {formErrors.telefono && (
            <p className="text-sm text-destructive">{formErrors.telefono.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'El email es obligatorio' })}
            placeholder="paciente@email.com"
          />
          {formErrors.email && (
            <p className="text-sm text-destructive">{formErrors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
          <Input
            id="fechaNacimiento"
            type="date"
            {...register('fechaNacimiento', { required: 'La fecha de nacimiento es obligatoria' })}
          />
          {formErrors.fechaNacimiento && (
            <p className="text-sm text-destructive">{formErrors.fechaNacimiento.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            {...register('direccion')}
            placeholder="Dirección completa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="obraSocial">Obra Social</Label>
          <Input
            id="obraSocial"
            {...register('obraSocial')}
            placeholder="OSDE, Swiss Medical, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numeroAfiliado">Número de Afiliado</Label>
          <Input
            id="numeroAfiliado"
            {...register('numeroAfiliado')}
            placeholder="123456789"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observaciones">Observaciones Médicas</Label>
          <Textarea
            id="observaciones"
            {...register('observaciones')}
            placeholder="Antecedentes, alergias, medicamentos, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : (paciente ? 'Actualizar' : 'Crear')} Paciente
        </Button>
      </div>
    </form>
  );
}