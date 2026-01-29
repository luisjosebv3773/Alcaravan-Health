
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';
import { VerificationStatus } from '../types';

const PendingVerification: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.PENDING);
    const [feedback, setFeedback] = useState<string>('');

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('verification_status')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setStatus(data.verification_status as VerificationStatus);
                }

                if (data?.verification_status === 'rejected') {
                    const { data: reqData } = await supabase
                        .from('verification_requests')
                        .select('admin_feedback')
                        .eq('professional_id', user.id)
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (reqData) setFeedback(reqData.admin_feedback || '');
                }
            }
            setLoading(false);
        };
        checkStatus();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleRetry = () => {
        // Clearing mpps to trigger onboarding again logic if needed, 
        // but easier to just navigate to onboarding
        navigate('/onboarding');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    const isRejected = status === VerificationStatus.REJECTED;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 animate-fade-in">
            <div className="max-w-md w-full bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 lg:p-12 text-center">
                <div className="flex justify-center mb-8">
                    <Logo className="w-48 h-auto" />
                </div>

                <div className={`size-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-status-red/10' : 'bg-primary/10'}`}>
                    <span className={`material-symbols-outlined text-4xl ${isRejected ? 'text-status-red' : 'text-primary animate-pulse'}`}>
                        {isRejected ? 'error' : 'verified_user'}
                    </span>
                </div>

                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                    {isRejected ? 'Solicitud Rechazada' : 'Verificación en Proceso'}
                </h2>

                <p className="text-text-sub dark:text-gray-400 mb-8 leading-relaxed text-sm">
                    {isRejected ? (
                        <>
                            Lo sentimos, tu solicitud de verificación no ha sido aprobada por el equipo administrativo.
                            {feedback && (
                                <div className="mt-4 p-4 bg-status-red/5 border border-status-red/10 rounded-xl text-status-red text-xs font-medium text-left">
                                    <span className="font-bold block mb-1">Motivo:</span>
                                    {feedback}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            Hemos recibido tus credenciales profesionales correctamente. Nuestro equipo está validando tu registro **MPPS** y documentos.
                            <br /><br />
                            Suele tomar entre **24 a 48 horas hábiles**.
                        </>
                    )}
                </p>

                {!isRejected && (
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-8 text-left border border-slate-100 dark:border-white/5">
                        <div className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Recibirás una notificación por correo electrónico una vez que tu perfil sea aprobado.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {isRejected && (
                        <button
                            onClick={handleRetry}
                            className="w-full py-4 bg-primary text-slate-900 font-black rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <span className="material-symbols-outlined">edit_note</span>
                            Corregir Información
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 ${isRejected
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xl hover:opacity-90'
                            }`}
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PendingVerification;
