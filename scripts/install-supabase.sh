#!/bin/bash

# Script para instalar las dependencias de Supabase
echo "🚀 Instalando dependencias de Supabase..."

# Instalar el cliente de Supabase
npm install @supabase/supabase-js

echo "✅ Dependencias instaladas correctamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Crear archivo .env.local con las variables de Supabase:"
echo "   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase"
echo ""
echo "2. Ejecutar las migraciones SQL en tu proyecto Supabase"
echo "3. Actualizar los componentes para usar las nuevas funciones"
echo ""
echo "🎉 ¡Migración a Supabase lista!" 