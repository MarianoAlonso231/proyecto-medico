import { supabase } from './supabase';
import type { Usuario } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

// Login con Supabase Authentication
export const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: error.message === 'Invalid login credentials' 
          ? 'Credenciales incorrectas' 
          : error.message 
      };
    }

    console.log('✅ Login exitoso:', data.user?.email);
    return { success: true };
  } catch (error) {
    console.error('Error en login:', error);
    return { 
      success: false, 
      error: 'Error al iniciar sesión' 
    };
  }
};

// Logout con Supabase
export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error en logout:', error);
      throw error;
    }
    console.log('✅ Logout exitoso');
  } catch (error) {
    console.error('Error en logout:', error);
    throw error;
  }
};

// Obtener usuario actual (mantiene compatibilidad con la interfaz anterior)
export const getCurrentUser = async (): Promise<Usuario | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
    
    if (!user) return null;

    // Mapear al formato Usuario existente
    return {
      id: user.id,
      email: user.email || '',
      rol: 'medico',
      medicoId: user.id
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
};

// Versión síncrona para mantener compatibilidad (deprecated - usar getCurrentUser async)
export const getCurrentUserSync = (): Usuario | null => {
  // Esta función no puede ser completamente síncrona con Supabase
  // Retorna null y el componente debe usar getCurrentUser() async
  console.warn('getCurrentUserSync está deprecated. Usar getCurrentUser() async.');
  return null;
};

// Verificar autenticación (async)
export const isAuthenticatedAsync = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return false;
  }
};

// Versión síncrona para mantener compatibilidad con login page existente
export const isAuthenticated = (): boolean => {
  // Para mantener compatibilidad, retorna false
  // El componente deberá usar isAuthenticatedAsync para funcionalidad real
  console.warn('isAuthenticated síncrono está deprecated. Usar isAuthenticatedAsync() async.');
  return false;
};

// RequireAuth actualizado
export const requireAuth = async (): Promise<Usuario> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return user;
};

// Hook para escuchar cambios de autenticación
export const onAuthStateChange = (callback: (user: Usuario | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user && event === 'SIGNED_IN') {
      const usuario: Usuario = {
        id: session.user.id,
        email: session.user.email || '',
        rol: 'medico',
        medicoId: session.user.id
      };
      callback(usuario);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
};