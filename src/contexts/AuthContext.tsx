import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        error: { 
          message: 'Error de configuración: Las credenciales de Supabase no están configuradas. Por favor, crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Consulta el README.md para más información.' 
        } 
      };
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (err: any) {
      // Detectar errores de red
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return { 
          error: { 
            message: 'Error de conexión: No se pudo conectar con Supabase. Verifica que las credenciales en el archivo .env sean correctas y que el servidor de desarrollo se haya reiniciado después de crear/actualizar el archivo .env.' 
          } 
        };
      }
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        error: { 
          message: 'Error de configuración: Las credenciales de Supabase no están configuradas. Por favor, crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Consulta el README.md para más información.' 
        } 
      };
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err: any) {
      // Detectar errores de red
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return { 
          error: { 
            message: 'Error de conexión: No se pudo conectar con Supabase. Verifica que las credenciales en el archivo .env sean correctas y que el servidor de desarrollo se haya reiniciado después de crear/actualizar el archivo .env.' 
          } 
        };
      }
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
