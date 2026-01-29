
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';
import { Link, useNavigate } from 'react-router-dom';

interface VerificationProfile {
    id: string; // This will be the request ID
    professional_id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    mpps_registry: string | null;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState('Administrador');
    const [adminAvatar, setAdminAvatar] = useState('https://lh3.googleusercontent.com/a/default-user=s120-c');
    const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingVerifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('verification_requests')
                .select(`
                    id,
                    professional_id,
                    mpps_registry,
                    status,
                    professional:professional_id (
                        full_name,
                        role,
                        avatar_url
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingVerifications(data || []);
        } catch (err) {
            console.error('Error fetching verifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected', feedback?: string) => {
        try {
            const { error } = await supabase
                .from('verification_requests')
                .update({
                    status,
                    admin_feedback: feedback,
                    updated_at: new Date()
                })
                .eq('id', requestId);

            if (error) throw error;
            setPendingVerifications(prev => prev.filter(v => v.id !== requestId));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar la solicitud.');
        }
    };

    useEffect(() => {
        const fetchAdminProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setAdminName(profile.full_name || 'Administrador');
                    setAdminAvatar(profile.avatar_url || 'https://lh3.googleusercontent.com/a/default-user=s120-c');
                }
            }
        };
        fetchAdminProfile();
        fetchPendingVerifications();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
            {/* Sidebar */}
            <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
                <div className="p-6 flex items-center gap-3">
                    <Logo className="size-8" showText={false} />
                    <h1 className="text-lg font-bold tracking-tight">Alcaraván</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Menú Principal</div>
                    <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary group">
                        <span className="material-symbols-outlined filled-icon">dashboard</span>
                        <span className="text-sm font-medium">Panel</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">group</span>
                        <span className="text-sm font-medium">Gestión de Usuarios</span>
                    </Link>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">monitoring</span>
                        <span className="text-sm font-medium">Monitoreo de IA</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">event_available</span>
                        <span className="text-sm font-medium">Citas Globales</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">send_and_archive</span>
                        <span className="text-sm font-medium">Consola Push</span>
                    </a>

                    <div className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Sistema</div>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Ajustes del Sistema</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">security</span>
                        <span className="text-sm font-medium">Registros y Seguridad</span>
                    </a>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                        <div
                            className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20"
                            style={{ backgroundImage: adminAvatar ? `url('${adminAvatar}')` : 'url(https://lh3.googleusercontent.com/a/default-user=s120-c)' }}
                        ></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{adminName}</p>
                            <p className="text-xs text-slate-500 truncate">Admin de Plataforma</p>
                        </div>
                        <span onClick={logout} className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-status-red transition-colors">logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                            <input
                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white"
                                placeholder="Buscar pacientes, doctores o registros..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-[1px] bg-slate-200 dark:border-white/10 mx-2"></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                            <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold text-primary uppercase">Modo En Vivo</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Medical Verifications */}
                        <div className="lg:col-span-8 space-y-8">
                            <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verificaciones Médicas <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{pendingVerifications.length} Pendientes</span></h2>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loading ? (
                                        <div className="p-12 text-center text-slate-500 italic text-sm">Cargando solicitudes...</div>
                                    ) : pendingVerifications.length > 0 ? (
                                        pendingVerifications.map((v) => (
                                            <div key={v.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-slate-100">
                                                <div className="size-12 rounded-lg bg-cover bg-center border border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                    {v.professional?.avatar_url ? (
                                                        <img src={v.professional.avatar_url} alt={v.professional.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-400">person</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{v.professional?.full_name}</h4>
                                                    <p className="text-sm text-slate-500">
                                                        {v.professional?.role === 'doctor' ? 'Médico' : 'Nutricionista'} • {v.mpps_registry || 'Pendiente de registro'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateRequestStatus(v.id, 'rejected', 'Documentación incompleta o inválida')}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => updateRequestStatus(v.id, 'approved')}
                                                        className="px-3 py-1.5 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 transition-all shadow-sm shadow-primary/20"
                                                    >
                                                        Aprobar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-500 italic text-sm">No hay verificaciones pendientes.</div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                                    <span className="text-xs text-slate-500">Mostrando {pendingVerifications.length} de {pendingVerifications.length} verificaciones</span>
                                    <div className="flex gap-1">
                                        <button className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        <button className="size-8 flex items-center justify-center rounded bg-primary text-background-dark text-xs font-bold shadow-sm shadow-primary/20">1</button>
                                        <button className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Side Panels */}
                        <div className="lg:col-span-4 space-y-8">
                            <section className="bg-primary/10 border border-primary/20 rounded-xl p-6 shadow-sm">
                                <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Modo Mantenimiento</h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">Programar tiempo de inactividad del sistema para migraciones de base de datos o actualizaciones de IA.</p>
                                <button className="w-full py-2 bg-primary text-background-dark font-bold rounded-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary/20">
                                    Configurar Mantenimiento
                                </button>
                            </section>

                            <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                                <h2 className="text-sm font-bold mb-4 uppercase tracking-widest text-slate-400">Registros del Sistema</h2>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                                        <div className="text-[11px]">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">Copia de seguridad completada</p>
                                            <p className="text-slate-500">2:15 AM • 1.2GB comprimido</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-yellow-500 text-sm mt-0.5">warning</span>
                                        <div className="text-[11px]">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">Pico de latencia de API</p>
                                            <p className="text-slate-500">1:40 AM • Respuesta Gemini-1.5 &gt; 5s</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">info</span>
                                        <div className="text-[11px]">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">Nuevo Rol de Personal Añadido</p>
                                            <p className="text-slate-500">Ayer • Añadido por Alex R.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
