'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { isAuthenticatedAsync, logout, onAuthStateChange } from '@/lib/auth';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticatedAsync();
        setIsAuth(authenticated);
        setIsLoading(false);

        // Redirigir según el estado de autenticación
        if (!authenticated && pathname !== '/login') {
          router.push('/login');
        } else if (authenticated && pathname === '/login') {
          router.push('/dashboard');
        } else if (authenticated && pathname === '/') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setIsAuth(false);
        setIsLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    // Verificar autenticación inicial
    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange((user) => {
      const authenticated = !!user;
      setIsAuth(authenticated);
      
      if (!authenticated && pathname !== '/login') {
        router.push('/login');
      } else if (authenticated && pathname === '/login') {
        router.push('/dashboard');
      } else if (authenticated && pathname === '/') {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await logout();
      // No necesitamos setIsAuth(false) porque onAuthStateChange lo manejará
      // No necesitamos router.push('/login') porque onAuthStateChange lo manejará
    } catch (error) {
      console.error('Error en logout:', error);
      // En caso de error, forzar redirección
      setIsAuth(false);
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Páginas que no requieren autenticación
  const publicPages = ['/login'];
  const isPublicPage = publicPages.includes(pathname);

  return (
    <html lang="es">
      <body className={inter.className}>
        {isAuth && !isPublicPage ? (
          <div className="flex h-screen bg-background">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 lg:ml-64 overflow-auto">
              <div className="p-6 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
        <Toaster />
      </body>
    </html>
  );
}