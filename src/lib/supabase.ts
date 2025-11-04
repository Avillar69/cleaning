import { createClient } from '@supabase/supabase-js';

// Configuración temporal - reemplaza con tus valores reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Solo mostrar warning si las variables no están configuradas
if (import.meta.env.DEV && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key')) {
  console.warn('⚠️ Variables de entorno de Supabase no configuradas.');
  console.warn('📝 Para configurar Supabase:');
  console.warn('1. Crea un archivo .env en la raíz del proyecto');
  console.warn('2. Agrega: VITE_SUPABASE_URL=tu_url_aqui');
  console.warn('3. Agrega: VITE_SUPABASE_ANON_KEY=tu_clave_aqui');
  console.warn('4. Reinicia el servidor de desarrollo');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
