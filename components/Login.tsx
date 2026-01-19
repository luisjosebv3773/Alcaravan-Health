
import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';


interface LoginProps {
  onLogin: (role: UserRole, name?: string, avatarUrl?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (data.user) {
        // Fetch user role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          // Handle case where profile might not exist immediately if trigger failed
          // Fallback or error
          throw new Error('No se pudo obtener el perfil del usuario.');
        }

        if (profile?.role) {
          // Map string role to UserRole enum... (existing logic)
          let appRole: UserRole;
          switch (profile.role) {
            case 'doctor': appRole = UserRole.DOCTOR; break;
            case 'nutri':
            case 'nutritionist': appRole = UserRole.NUTRITIONIST; break;
            case 'paciente':
            default: appRole = UserRole.PATIENT; break;
          }
          onLogin(appRole, profile.full_name, profile.avatar_url);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

        <div className="bg-primary p-12 flex flex-col justify-between text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined !text-[200px]">health_and_safety</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined !text-4xl">health_and_safety</span>
              <h1 className="text-2xl font-black tracking-tight italic">Alcaraván Health</h1>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-4">Gestión de Salud <br /> Personalizada.</h2>
            <p className="font-medium opacity-80">Bienvenido de nuevo. Por favor ingresa tus credenciales para continuar.</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-60">
            Impulsado por el Motor de IA Gemini
          </div>
        </div>

        <div className="p-8 lg:p-12 relative">
          <Link to="/register" className="absolute top-8 right-8 text-sm font-bold text-primary hover:underline">
            Crear cuenta
          </Link>

          <div className="mb-10">
            <h3 className="text-2xl font-bold mb-2">Iniciar Sesión</h3>
            <p className="text-text-sub dark:text-gray-400">Ingresa a tu cuenta</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                placeholder="ejemplo@alcaravan.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Iniciando...' : 'Entrar al Panel'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
