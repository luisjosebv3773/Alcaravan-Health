
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';

import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            toast.success('📧 Enlace enviado. Revisa tu bandeja de entrada.', { duration: 6000 });
        } catch (err: any) {
            toast.error(err.message || 'Error al solicitar recuperación');
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
                        <h3 className="text-2xl font-bold mb-2 text-center">Recuperar Contraseña</h3>
                        <p className="text-text-sub dark:text-gray-400 text-center">Ingresa tu correo para recibir un enlace de recuperación</p>
                    </div>

                    <form onSubmit={handleResetRequest} className="space-y-4 mb-8">
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            {!loading && <span className="material-symbols-outlined">send</span>}
                        </button>
                    </form>

                    <div className="text-center">
                        <Link to="/login" className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
