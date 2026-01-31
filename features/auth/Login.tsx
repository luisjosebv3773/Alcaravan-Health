
import React, { useState } from 'react';
import { UserRole } from '../../types';
import { supabase } from '../../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';

import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: (role: UserRole, name?: string, avatarUrl?: string, isOnboardingRequired?: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Iniciando sesión...');

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
          .select('role, full_name, avatar_url, mpps_registry')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw new Error('No se pudo obtener el perfil del usuario.');
        }

        if (profile?.role) {
          let appRole: UserRole;
          switch (profile.role) {
            case 'doctor': appRole = UserRole.DOCTOR; break;
            case 'admin': appRole = UserRole.ADMIN; break;
            case 'nutri':
            case 'nutritionist': appRole = UserRole.NUTRITIONIST; break;
            case 'paciente':
            default: appRole = UserRole.PATIENT; break;
          }
          const needsOnboarding = (appRole === UserRole.DOCTOR || appRole === UserRole.NUTRITIONIST) && !profile.mpps_registry;

          toast.success(`Bienvenido de nuevo, ${profile.full_name || 'Usuario'}`, { id: toastId });
          onLogin(appRole, profile.full_name, profile.avatar_url, needsOnboarding);
        }
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Error al iniciar sesión';

      if (err.message?.includes('Email not confirmed')) {
        errorMessage = '📧 Correo no verificado. Revisa tu bandeja de entrada.';
      } else if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Correo o contraseña incorrectos.';
      } else if (err.message?.includes('User not found')) {
        errorMessage = 'No existe una cuenta con este correo.';
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

        <div className="p-8 lg:p-12 relative">
          <Link to="/register" className="absolute top-8 right-8 text-sm font-bold text-primary hover:underline">
            Crear cuenta
          </Link>

          <div className="mb-10">
            <div className="flex justify-center mb-8">
              <Logo className="w-64 h-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-center">Iniciar Sesión</h3>
            <p className="text-text-sub dark:text-gray-400 text-center">Ingresa a tu cuenta</p>
          </div>

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
              <div className="mt-2 text-right">
                <Link to="/forgot-password" title="Recuperar contraseña" className="text-xs font-bold text-text-sub hover:text-primary transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
