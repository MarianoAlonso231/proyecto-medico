import { supabase } from './supabase';

export const debugSupabase = async () => {
  console.log('🔍 Iniciando diagnóstico de Supabase...');
  
  // 1. Verificar configuración
  console.log('📋 Configuración:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...');
  
  // 2. Verificar conexión
  try {
    const { data, error } = await supabase.from('pacientes').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conexión:', error);
      console.log('💡 Solución sugerida: Verificar políticas RLS');
      return { connected: false, error };
    }
    console.log('✅ Conexión exitosa');
  } catch (err) {
    console.error('❌ Error de conexión:', err);
    return { connected: false, error: err };
  }
  
  // 3. Verificar usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  console.log('👤 Usuario actual:', user ? `Autenticado (${user.email})` : 'No autenticado');
  
  // 4. Intentar insertar un registro de prueba
  console.log('🧪 Probando inserción...');
  try {
    const testPaciente = {
      nombre: 'Test',
      apellido: 'Debug',
      dni: '99999999',
      telefono: '1234567890',
      email: 'test@debug.com',
      fecha_nacimiento: '1990-01-01',
      direccion: 'Test Address',
      obra_social: 'Test OS',
      numero_afiliado: '123',
      observaciones: 'Test patient for debugging'
    };

    const { data, error } = await supabase
      .from('pacientes')
      .insert(testPaciente)
      .select()
      .single();

    if (error) {
      console.error('❌ Error en inserción:', error);
      console.log('💡 Código de error:', error.code);
      console.log('💡 Mensaje:', error.message);
      
      if (error.code === '42501' || error.message.includes('RLS')) {
        console.log('🚨 PROBLEMA IDENTIFICADO: Políticas RLS muy restrictivas');
        console.log('🔧 SOLUCIONES:');
        console.log('1. Implementar autenticación en la app');
        console.log('2. Modificar políticas RLS temporalmente para desarrollo');
        console.log('3. Usar service_role key para desarrollo (no recomendado para producción)');
      }
      
      return { success: false, error };
    }

    console.log('✅ Inserción exitosa:', data);
    
    // Limpiar: eliminar el registro de prueba
    await supabase.from('pacientes').delete().eq('dni', '99999999');
    console.log('🧹 Registro de prueba eliminado');
    
    return { success: true, data };
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return { success: false, error: err };
  }
};

// Función para probar diferentes configuraciones
export const testSupabaseConfig = async () => {
  console.log('⚙️ Probando configuraciones de Supabase...');
  
  // Probar con diferentes configuraciones del cliente
  const configs = [
    {
      name: 'Cliente actual (anon key)',
      client: supabase
    }
  ];

  for (const config of configs) {
    console.log(`\n🧪 Probando: ${config.name}`);
    try {
      const { data, error } = await config.client
        .from('pacientes')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error(`❌ ${config.name} falló:`, error.message);
      } else {
        console.log(`✅ ${config.name} exitoso`);
      }
    } catch (err) {
      console.error(`❌ ${config.name} error:`, err);
    }
  }
};

// Función para generar comando SQL para deshabilitar RLS temporalmente
export const generateDisableRLSScript = () => {
  const script = `
-- ⚠️  SOLO PARA DESARROLLO - Deshabilitar RLS temporalmente
-- Ejecutar en Supabase SQL Editor:

ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_medico DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_auditoria DISABLE ROW LEVEL SECURITY;

-- Para rehabilitar más tarde:
-- ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE configuracion_medico ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE turnos_auditoria ENABLE ROW LEVEL SECURITY;
`;

  console.log('📋 Script SQL para deshabilitar RLS:');
  console.log(script);
  return script;
};

// Función para generar políticas RLS más permisivas
export const generatePermissivePolicies = () => {
  const script = `
-- 🔓 Políticas RLS más permisivas para desarrollo
-- Ejecutar en Supabase SQL Editor:

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated user can manage pacientes" ON pacientes;
DROP POLICY IF EXISTS "Authenticated user can manage turnos" ON turnos;
DROP POLICY IF EXISTS "Authenticated user can manage all" ON configuracion_medico;
DROP POLICY IF EXISTS "Authenticated user can view auditoria" ON turnos_auditoria;

-- Crear políticas permisivas (permitir todo)
CREATE POLICY "Allow all operations" ON pacientes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON turnos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON configuracion_medico FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON turnos_auditoria FOR ALL USING (true);
`;

  console.log('📋 Script SQL para políticas permisivas:');
  console.log(script);
  return script;
};

// Función para mostrar información de la sesión
export const showSessionInfo = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('📄 Información de sesión:', session);
}; 