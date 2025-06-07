'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticatedAsync, onAuthStateChange } from '@/lib/auth';
import type { Usuario } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación inicial
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticatedAsync();
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setIsAuthenticated(false);
        router.push('/login');
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      
      if (!user) {
        router.push('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Mostrar loading mientras se verifica
  if (isAuthenticated === null) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      )
    );
  }

  // Mostrar loading si no está autenticado (redirigiendo)
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Redirigiendo al login...</p>
          </div>
        </div>
      )
    );
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
} 