import { createClient } from '@supabase/supabase-js';

// Configuración temporal - reemplaza con tus valores reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validar que las variables de entorno estén configuradas
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

if (!isConfigured) {
  const errorMessage = '⚠️ ERROR: Variables de entorno de Supabase no configuradas.\n\n' +
    '📝 Para configurar Supabase:\n' +
    '1. Crea un archivo .env en la raíz del proyecto\n' +
    '2. Agrega: VITE_SUPABASE_URL=tu_url_aqui\n' +
    '3. Agrega: VITE_SUPABASE_ANON_KEY=tu_clave_aqui\n' +
    '4. Reinicia el servidor de desarrollo\n\n' +
    'Puedes copiar el archivo env.example como .env y reemplazar los valores.';
  
  console.error(errorMessage);
  
  // En desarrollo, mostrar alerta visual también
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    setTimeout(() => {
      alert(errorMessage);
    }, 100);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exportar función para verificar si está configurado
export const isSupabaseConfigured = () => isConfigured;
