
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: '📧 Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.'
            });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'Error al solicitar la recuperación'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
            <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-8 lg:p-12">
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-2">Recuperar Contraseña</h3>
                        <p className="text-text-sub dark:text-gray-400">Ingresa tu correo para recibir un enlace de recuperación</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${message.type === 'success'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {message.text}
                        </div>
                    )}

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
