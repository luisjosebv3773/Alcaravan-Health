
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function NutritionistDashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        riskHigh: 0,
        riskMedium: 0,
        riskLow: 0,
        avgBMI: 0,
        bmiNormal: 0,
        bmiUnderweight: 0,
        bmiOverweight: 0,
        bmiObese: 0
    });
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchPatients();
        fetchPopulationStats();
    }, [currentPage, searchTerm]);

    async function fetchPopulationStats() {
        try {
            const { data, error } = await supabase
                .from('perfil_actual_salud')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const total = data.length;
                const high = data.filter(p => p.risk_status === 'Alto').length;
                const med = data.filter(p => p.risk_status === 'Moderado').length;
                const low = data.filter(p => p.risk_status === 'Bajo').length;

                const bmiValues = data.map(p => p.bmi || 0);
                const avgBMI = bmiValues.reduce((a, b) => a + b, 0) / total;

                const normal = data.filter(p => p.bmi >= 18.5 && p.bmi < 25).length;
                const under = data.filter(p => p.bmi < 18.5).length;
                const over = data.filter(p => p.bmi >= 25 && p.bmi < 30).length;
                const obese = data.filter(p => p.bmi >= 30).length;

                setStats({
                    total,
                    riskHigh: high,
                    riskMedium: med,
                    riskLow: low,
                    avgBMI,
                    bmiNormal: Math.round((normal / total) * 100),
                    bmiUnderweight: Math.round((under / total) * 100),
                    bmiOverweight: Math.round((over / total) * 100),
                    bmiObese: Math.round((obese / total) * 100)
                });
            }
        } catch (error) {
            console.error('Error fetching population stats:', error);
        }
    }

    async function fetchPatients() {
        try {
            setIsLoading(true);
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .eq('role', 'paciente');

            if (searchTerm) {
                query = query.ilike('full_name', `%${searchTerm}%`);
            }

            const { data, count, error } = await query
                .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)
                .order('full_name', { ascending: true });

            if (error) throw error;
            setPatients(data || []);
            setTotalPatients(count || 0);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const totalPages = Math.ceil(totalPatients / PAGE_SIZE);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden selection:bg-primary/30">
            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">


                <div className="flex-1 overflow-y-auto p-8 pb-32">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resumen de Riesgo Metabólico</h3>
                                <span className="material-symbols-outlined text-gray-400">cardiology</span>
                            </div>
                            <div className="flex items-end justify-between mb-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total} <span className="text-sm font-medium text-gray-400 font-sans">Empleados</span></div>
                                <div className="text-xs font-medium text-primary">Actualizado hoy</div>
                            </div>
                            <div className="space-y-3 mt-2">
                                <RiskProgress label="Alto" percentage={Math.round((stats.riskHigh / stats.total) * 100) || 0} color="bg-red-500" />
                                <RiskProgress label="Medio" percentage={Math.round((stats.riskMedium / stats.total) * 100) || 0} color="bg-yellow-400" />
                                <RiskProgress label="Bajo" percentage={Math.round((stats.riskLow / stats.total) * 100) || 0} color="bg-primary" />
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                                <span className="material-symbols-outlined text-9xl">monitor_weight</span>
                            </div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">IMC Promedio Empresa</h3>
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded font-bold">Rango Saludable</span>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-5xl font-bold text-gray-900 dark:text-white">{stats.avgBMI.toFixed(1)}</span>
                                <span className="text-sm font-medium text-gray-500">kg/m²</span>
                            </div>
                            <div className="mt-6 relative z-10">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>18.5</span>
                                    <span>25</span>
                                    <span>30</span>
                                </div>
                                <div className="h-2 w-full bg-gradient-to-r from-blue-400 via-primary to-red-400 rounded-full relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 bg-white ring-4 ring-black/10 dark:ring-white/20 w-4 h-4 rounded-full shadow-lg transition-all duration-500" style={{ left: `${Math.min(Math.max((stats.avgBMI - 15) / 20 * 100, 0), 100)}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Meta: Mantener por debajo de 25.0 global.</p>
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col h-full justify-between py-1">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Logro de Objetivos</h3>
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">78%</div>
                                    <p className="text-xs text-gray-500">Empleados cumpliendo metas trimestrales</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                                    </span>
                                </div>
                            </div>
                            <div className="relative size-32 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#13ec5b 78%, #e5e7eb 78%)', maskImage: 'radial-gradient(transparent 60%, black 61%)', WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)' }}></div>
                                <span className="material-symbols-outlined text-4xl text-primary">emoji_events</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        <div className="xl:col-span-8 flex flex-col gap-8">
                            {/* BMI Distribution */}
                            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                                        Distribución de IMC Poblacional
                                    </h3>
                                    <button className="text-sm text-primary hover:underline font-medium">Ver Informe Detallado</button>
                                </div>
                                <div className="flex items-end gap-4 h-48 border-b border-gray-200 dark:border-gray-700 pb-2 px-4">
                                    <Bar height={`${stats.bmiUnderweight}%`} label="Bajo Peso" p={`${stats.bmiUnderweight}%`} color="bg-blue-400" />
                                    <Bar height={`${stats.bmiNormal}%`} label="Saludable" p={`${stats.bmiNormal}%`} color="bg-primary" />
                                    <Bar height={`${stats.bmiOverweight}%`} label="Sobrepeso" p={`${stats.bmiOverweight}%`} color="bg-yellow-400" />
                                    <Bar height={`${stats.bmiObese}%`} label="Obeso" p={`${stats.bmiObese}%`} color="bg-red-500" />
                                </div>
                                <div className="flex justify-between px-4 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                                    <div className="flex-1">Bajo Peso<br /><span className="font-normal opacity-70">&lt;18.5</span></div>
                                    <div className="flex-1">Saludable<br /><span className="font-normal opacity-70">18.5 - 24.9</span></div>
                                    <div className="flex-1">Sobrepeso<br /><span className="font-normal opacity-70">25 - 29.9</span></div>
                                    <div className="flex-1">Obeso<br /><span className="font-normal opacity-70">&gt;30</span></div>
                                </div>
                            </div>

                            {/* Active Monitoring Table */}
                            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monitoreo Activo</h3>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-gray-400 text-[18px]">search</span>
                                        </span>
                                        <input
                                            className="pl-10 pr-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm focus:ring-primary focus:border-primary w-64"
                                            placeholder="Buscar empleado..."
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                                            <tr>
                                                <th className="px-6 py-4">Empleado</th>
                                                <th className="px-6 py-4">Peso Actual</th>
                                                <th className="px-6 py-4">% Grasa Corporal</th>
                                                <th className="px-6 py-4">Estado</th>
                                                <th className="px-6 py-4">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                        Cargando pacientes...
                                                    </td>
                                                </tr>
                                            ) : patients.length > 0 ? (
                                                patients.map((patient) => (
                                                    <EmployeeRow
                                                        key={patient.id}
                                                        name={patient.full_name || 'Sin nombre'}
                                                        lastVisit="hace 2 días"
                                                        weight="--"
                                                        prevWeight="--"
                                                        fat="--"
                                                        fatTrend="0.0"
                                                        status="En Meta"
                                                        initials={patient.full_name ? patient.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'P'}
                                                        onEdit={() => navigate(`/nutrition/patient-details/${patient.id}`)}
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                        No se encontraron pacientes.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalPatients)} a {Math.min(currentPage * PAGE_SIZE, totalPatients)} de {totalPatients}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`size-7 rounded text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Today's Agenda */}
                        <div className="xl:col-span-4 flex flex-col h-full">
                            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agenda de Hoy</h3>
                                    <button className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </button>
                                </div>
                                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-10 flex-1">
                                    <AgendaItem
                                        time="09:00 AM"
                                        name="Juan Pérez"
                                        subject="Seguimiento: Semana 4"
                                        status="En Sala"
                                        img="https://picsum.photos/seed/juan/200/200"
                                        active
                                    />
                                    <AgendaItem
                                        time="10:30 AM"
                                        name="Laura Torres"
                                        subject="Evaluación Inicial"
                                        status="Confirmado"
                                        initials="LT"
                                        color="bg-pink-100 text-pink-600"
                                    />
                                    <AgendaItem
                                        time="02:00 PM"
                                        name="David Ruiz"
                                        subject="Revisión Metabólica"
                                        status="Pendiente Conf."
                                        initials="DR"
                                        color="bg-purple-100 text-purple-600"
                                    />
                                    <div className="relative">
                                        <span className="absolute -left-[29px] top-3 size-3 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                                        <div className="flex items-center gap-3 opacity-50">
                                            <span className="text-xs font-mono text-gray-400">03:00 PM</span>
                                            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                                            <span className="text-xs uppercase font-bold text-gray-400">Descanso Equipo</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                    Ver Calendario Completo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function RiskProgress({ label, percentage, color }: { label: string, percentage: number, color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold w-12 text-gray-600 dark:text-gray-400">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{percentage}%</span>
        </div>
    );
}

function Bar({ height, label, p, color }: { height: string, label: string, p: string, color: string }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-end gap-2 group h-full">
            <div className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{p}</div>
            <div className={`w-full max-w-[60px] ${color} opacity-80 hover:opacity-100 rounded-t-lg transition-all relative min-h-[4px]`} style={{ height }}></div>
        </div>
    );
}

function EmployeeRow({ name, lastVisit, weight, prevWeight, fat, fatTrend, status, img, onEdit, initials }: any) {
    const isGreen = parseFloat(fatTrend) < 0 || (prevWeight && parseFloat(weight) < parseFloat(prevWeight));
    const statusClasses = status === 'En Meta'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {img ? (
                        <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }}></div>
                    ) : (
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold bg-indigo-100 text-indigo-600`}>{initials}</div>
                    )}
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white">{name}</div>
                        <div className="text-xs text-gray-500">Última visita: {lastVisit}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{weight} kg</span>
                    {prevWeight && (
                        <span className={`flex items-center text-xs font-bold ${isGreen ? 'text-green-500 bg-green-100 dark:bg-green-900/30' : 'text-red-500 bg-red-100 dark:bg-red-900/30'} px-1.5 py-0.5 rounded`}>
                            <span className="material-symbols-outlined text-[14px]">{isGreen ? 'arrow_downward' : 'arrow_upward'}</span>
                            {(Math.abs(parseFloat(weight) - parseFloat(prevWeight))).toFixed(1)}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-400 mt-1">Prev: {prevWeight} kg</div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{fat}%</span>
                    {fatTrend !== '0.0' && (
                        <span className={`flex items-center text-xs font-bold ${parseFloat(fatTrend) < 0 ? 'text-green-500 bg-green-100 dark:bg-green-900/30' : 'text-red-500 bg-red-100 dark:bg-red-900/30'} px-1.5 py-0.5 rounded`}>
                            <span className="material-symbols-outlined text-[14px]">{parseFloat(fatTrend) < 0 ? 'trending_down' : 'trending_up'}</span>
                            {Math.abs(parseFloat(fatTrend))}%
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-4">
                <button onClick={onEdit} className="text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">edit_document</span>
                </button>
            </td>
        </tr>
    );
}

function MacroItem({ color, label, percentage }: any) {
    return (
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
                <span className={`size-3 rounded-full ${color}`}></span>
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
            </div>
            <span className="font-mono font-bold">{percentage}</span>
        </div>
    );
}

function AgendaItem({ time, name, subject, status, img, initials, color, active }: any) {
    return (
        <div className="relative">
            <span className={`absolute -left-[31px] top-4 size-4 rounded-full border-4 border-white dark:border-surface-dark ${active ? 'bg-primary shadow-sm' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <div className={`mb-1 text-sm font-medium ${active ? 'text-primary' : 'text-gray-500'}`}>{time}</div>
            <div
                className={`rounded-xl p-4 border transition-all group cursor-pointer relative overflow-hidden ${active ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700 hover:border-primary/50' : 'bg-surface-light dark:bg-surface-dark border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <div className="flex items-center gap-4">
                    {img ? (
                        <div className="size-14 rounded-full bg-cover bg-center shrink-0 shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundImage: `url("${img}")` }}></div>
                    ) : (
                        <div className={`size-12 rounded-full shrink-0 flex items-center justify-center font-bold text-lg ${color}`}>
                            {initials}
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{name}</h4>
                        <p className="text-xs text-gray-500 truncate">{subject}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${status === 'En Sala' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{status}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
