
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function ProfessionalAppointmentHistory() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchHistory();
    }, [filter, page, search]);

    async function fetchHistory() {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            let query = supabase
                .from('appointments')
                .select(`
          *,
          patient:patient_id(full_name, avatar_url, cedula)
        `, { count: 'exact' })
                .eq('doctor_id', session.user.id);

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            if (search) {
                // En Supabase, para filtrar por tablas relacionadas en el mismo query es mas complejo 
                // pero podemos filtrar por patient_id si buscamos el id primero o usar or
                query = query.or(`status.ilike.%${search}%`);
            }

            // Pagination
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to).order('appointment_date', { ascending: false });

            const { data, count, error } = await query;
            if (error) throw error;

            setAppointments(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    }

    const statusMap: any = {
        'completed': { text: 'Completada', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'confirmed': { text: 'Confirmada', bg: 'bg-blue-50 text-blue-600 border-blue-100' },
        'pending': { text: 'Pendiente', bg: 'bg-orange-50 text-orange-600 border-orange-100' },
        'cancelled': { text: 'Cancelada', bg: 'bg-red-50 text-red-600 border-red-100' },
        'no-show': { text: 'Ausente', bg: 'bg-slate-50 text-slate-600 border-slate-100' },
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto h-full flex flex-col">
            <header className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Historial General de Citas</h2>
                <p className="text-slate-500 font-medium">Revisa el histórico de todas tus consultas y pacientes.</p>
            </header>

            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-primary text-slate-900 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'confirmed' ? 'Confirmadas' : f === 'completed' ? 'Completadas' : 'Canceladas'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined !text-[18px]">search</span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="Buscar por estado..."
                        type="text"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">
                                        <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                                    </td>
                                </tr>
                            ) : appointments.length > 0 ? (
                                appointments.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-primary">
                                                    {app.patient?.avatar_url ? (
                                                        <img src={app.patient.avatar_url} className="size-full rounded-full object-cover" />
                                                    ) : (
                                                        app.patient?.full_name?.charAt(0)
                                                    )}
                                                </div>
                                                <div
                                                    className="cursor-pointer group"
                                                    onClick={() => navigate(`/patient-details/${app.patient_id}`)}
                                                >
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{app.patient?.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">CI: {app.patient?.cedula || '---'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(app.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-xs text-slate-400">{app.appointment_time}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${statusMap[app.status]?.bg || 'bg-slate-50 text-slate-400'}`}>
                                                {statusMap[app.status]?.text || app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/consultation/${app.id}`)}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                title="Ver Consulta"
                                            >
                                                <span className="material-symbols-outlined text-xl">medical_information</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">event_busy</span>
                                        <p className="text-sm text-slate-400 italic">No se encontraron registros de citas.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalCount > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                        <p className="text-xs text-slate-400 font-bold">Página {page} de {Math.ceil(totalCount / PAGE_SIZE)}</p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-1 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold disabled:opacity-30"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={page * PAGE_SIZE >= totalCount}
                                onClick={() => setPage(page + 1)}
                                className="p-1 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold disabled:opacity-30"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
