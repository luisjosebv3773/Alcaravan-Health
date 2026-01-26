
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function PatientDirectory() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, [search]);

    async function fetchPatients() {
        try {
            setLoading(true);
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'paciente')
                .order('full_name');

            if (search) {
                query = query.ilike('full_name', `%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-[1200px] mx-auto h-full flex flex-col">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Directorio de Pacientes</h2>
                    <p className="text-slate-500 font-medium">Gestiona los expedientes y la evolución de tus pacientes.</p>
                </div>
            </header>

            <div className="mb-8 relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined !text-[20px]">search</span>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                    placeholder="Buscar paciente por nombre..."
                    type="text"
                />
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-10 no-scrollbar">
                    {patients.length > 0 ? (
                        patients.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/patient-details/${p.id}`)}
                                className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-primary overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} alt={p.full_name} className="size-full object-cover" />
                                        ) : (
                                            p.full_name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{p.full_name}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Cédula: {p.cedula || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">cake</span>
                                        {p.birth_date ? new Date(p.birth_date).toLocaleDateString() : 'No registrada'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                        {p.email || 'Sin correo'}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                        Ver Expediente
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">search_off</span>
                            <p className="text-slate-400 font-medium italic">No se encontraron pacientes que coincidan con la búsqueda.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
