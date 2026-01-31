
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';

import toast from 'react-hot-toast';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // Check if we have a recovery session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Sesión inválida o expirada. Solicita un nuevo enlace.', { duration: 5000 });
                navigate('/forgot-password');
            }
        };
        checkSession();
    }, []);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            toast.success('¡Contraseña actualizada! Redirigiendo...', { duration: 3000 });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
            <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-8 lg:p-12">
                    <div className="mb-10">
                        <div className="flex justify-center mb-8">
                            <Logo className="w-80 h-auto" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-center">Nueva Contraseña</h3>
                        <p className="text-text-sub dark:text-gray-400 text-center">Ingresa tu nueva contraseña para acceder a tu cuenta</p>
                    </div>

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Confirmar Contraseña</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                            {!loading && <span className="material-symbols-outlined">lock_reset</span>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
