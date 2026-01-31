import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados de datos
    const [profile, setProfile] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [stats, setStats] = useState({ appointmentsCount: 0 });

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);

            // 1. Perfil Base
            const { data: pData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
            if (pError) throw pError;
            setProfile(pData);

            // 2. Perfil de Salud (Si es paciente)
            const { data: hData } = await supabase
                .from('perfil_actual_salud')
                .select('*')
                .eq('patient_id', id)
                .single();
            setHealth(hData);

            // 3. Estadísticas de Citas
            const { count } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .or(`patient_id.eq.${id},doctor_id.eq.${id}`);
            setStats({ appointmentsCount: count || 0 });

        } catch (error: any) {
            toast.error("Error al cargar usuario: " + error.message);
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    role: profile.role,
                    cedula: profile.cedula,
                    email: profile.email,
                    is_verified: profile.is_verified
                })
                .eq('id', id);

            if (error) throw error;
            toast.success("Perfil actualizado correctamente");
        } catch (error: any) {
            toast.error("Error al guardar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-background-dark">
            <div className="animate-spin size-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display">
            {/* Sidebar ficticio para mantener el layout del diseño */}
            <aside className="w-64 hidden lg:flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
                        <span className="material-symbols-outlined font-bold">health_and_safety</span>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight dark:text-white">Alcaraván</h1>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Administración</div>
                    <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Panel Admin</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary group">
                        <span className="material-symbols-outlined filled-icon">group</span>
                        <span className="text-sm font-medium font-bold">Gestión de Usuarios</span>
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Consola de Administración</h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Breadcrumb & Title */}
                        <div className="mb-6">
                            <Link to="/admin/users" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary mb-2 transition-colors">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Volver a Usuarios
                            </Link>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Detalle de Usuario</h2>
                                    <p className="text-sm text-slate-500">Perfil técnico y configuración del sistema.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-black rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top Card: Info Principal */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-8 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="size-24 rounded-2xl bg-cover bg-center border-4 border-slate-100 dark:border-white/5 shadow-xl relative"
                                        style={{ backgroundImage: `url(${profile?.avatar_url || 'https://www.gravatar.com/avatar/0?d=mp'})` }}>
                                        {profile?.is_verified && (
                                            <div className="absolute -bottom-2 -right-2 p-1 bg-white dark:bg-background-dark rounded-full border border-slate-100 dark:border-white/10">
                                                <span className="material-symbols-outlined text-blue-500 text-sm filled-icon">verified</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{profile?.full_name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${profile?.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    profile?.role === 'doctor' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                {profile?.role}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{profile?.email}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">badge</span>
                                                Cédula: {profile?.cedula || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                Desde: {new Date(profile?.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verificación</label>
                                    <select
                                        value={profile?.is_verified ? 'true' : 'false'}
                                        onChange={(e) => setProfile({ ...profile, is_verified: e.target.value === 'true' })}
                                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold py-2 focus:ring-primary focus:border-primary px-3"
                                    >
                                        <option value="true">Usuario Verificado</option>
                                        <option value="false">Pendiente / Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Información Detallada */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
                                        <span className="material-symbols-outlined text-primary">person_edit</span>
                                        Información y Acceso
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Nombre Completo</label>
                                            <input
                                                value={profile?.full_name || ''}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                                                type="text"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Documento / Cédula</label>
                                            <input
                                                value={profile?.cedula || ''}
                                                onChange={(e) => setProfile({ ...profile, cedula: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                                                type="text"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Correo Electrónico</label>
                                            <input
                                                value={profile?.email || ''}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                                                type="email"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Rol RBAC</label>
                                            <select
                                                value={profile?.role || ''}
                                                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary font-bold"
                                            >
                                                <option value="paciente">Paciente</option>
                                                <option value="doctor">Doctor</option>
                                                <option value="nutri">Nutricionista</option>
                                                <option value="admin">Administrador Sistema</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Salud (Solo si tiene perfil de salud) */}
                                {health && (
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-emerald-500">
                                            <span className="material-symbols-outlined">health_metrics</span>
                                            Perfil de Salud Actual
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <HealthMetric label="Peso" value={`${health.weight} kg`} icon="weight" />
                                            <HealthMetric label="Estatura" value={`${health.height} cm`} icon="height" />
                                            <HealthMetric label="Sangre" value={health.blood_type} icon="bloodtype" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar de Resumen */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Métricas de Actividad</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Citas Totales</p>
                                                <p className="text-3xl font-black text-primary">{stats.appointmentsCount}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-4xl text-primary/30">event_available</span>
                                        </div>

                                        {health && (
                                            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Índice Masa Corporal (IMC)</p>
                                                        <p className="text-2xl font-black text-orange-500">{health.bmi}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded uppercase">
                                                        {health.risk_status}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(health.bmi / 40) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Seguridad */}
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Seguridad</h3>
                                    <div className="space-y-3">
                                        <button className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all group">
                                            <span>Restablecer Contraseña</span>
                                            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors">lock_reset</span>
                                        </button>
                                        <button className="w-full flex items-center justify-between p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-xs font-bold text-red-500 transition-all border border-red-500/10">
                                            <span>Inactivar Cuenta</span>
                                            <span className="material-symbols-outlined text-sm">block</span>
                                        </button>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Metadata Técnica</p>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-mono text-slate-500">ID: {id}</p>
                                            <p className="text-[10px] font-mono text-slate-500">PROVIDER: supabase.auth</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function HealthMetric({ label, value, icon }: { label: string, value: string, icon: string }) {
    return (
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
            <span className="material-symbols-outlined text-primary mb-2">{icon}</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
