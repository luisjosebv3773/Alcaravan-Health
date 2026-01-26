import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

export default function NutritionPatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [healthProfile, setHealthProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        if (id) {
            fetchPatient();
            fetchEvaluations();
            fetchHealthProfile();
        }
    }, [id]);

    async function fetchHealthProfile() {
        try {
            const { data, error } = await supabase
                .from('perfil_actual_salud')
                .select('*')
                .eq('patient_id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setHealthProfile(data);
        } catch (error) {
            console.error('Error fetching health profile:', error);
        }
    }

    async function fetchEvaluations() {
        try {
            const { data, error } = await supabase
                .from('nutritional_evaluations')
                .select('*')
                .eq('patient_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEvaluations(data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
        }
    }

    async function fetchPatient() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPatient(data);
        } catch (error) {
            console.error('Error fetching patient:', error);
        } finally {
            setLoading(false);
        }
    }

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const month = today.getMonth() - birth.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getBMR = (weight: number, height: number, birthDate: string, gender: string) => {
        if (!weight || !height || !birthDate) return 0;
        const age = calculateAge(birthDate);
        if (gender?.toLowerCase() === 'femenino' || gender?.toLowerCase() === 'mujer') {
            return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500">Cargando detalles del paciente...</p>
                </div>
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="bg-slate-50 text-slate-900 h-screen flex flex-col overflow-hidden">
            <header className="w-full bg-white border-b border-slate-200 z-10 shadow-sm shrink-0">
                <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="size-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-full border-2 border-primary/30 p-0.5">
                                <div className="size-full rounded-full bg-cover bg-center bg-slate-100 flex items-center justify-center" style={{ backgroundImage: patient.avatar_url ? `url('${patient.avatar_url}')` : 'none' }}>
                                    {!patient.avatar_url && <span className="text-xl font-bold text-slate-400">{patient.full_name?.charAt(0)}</span>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{patient.full_name}</h2>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <span>{calculateAge(patient.birth_date)} años</span> • <span>ID: {patient.cedula || 'N/A'}</span> • <span className="text-primary font-bold">Programa Activo</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/nutrition/evaluate/${patient.id}`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            Nuevo Registro de Evolución
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-72 border-r border-slate-200 flex flex-col bg-white shrink-0">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">history</span>
                            Historial de Consultas
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {evaluations.slice(0, pageSize).map((ev, index) => {
                            const date = new Date(ev.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                            return (
                                <div
                                    key={ev.id}
                                    onClick={() => navigate(`/nutrition/evaluate/${id}/${ev.id}`)}
                                    className="p-4 rounded-xl border border-transparent cursor-pointer transition-colors shadow-sm hover:bg-slate-100 group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{date}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {ev.diet_habits?.lunch_place || 'Seguimiento Regular'}
                                    </p>
                                </div>
                            );
                        })}
                        {evaluations.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8 italic">No hay registros previos</p>
                        )}
                    </div>
                    {evaluations.length > pageSize && (
                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={() => setPageSize(prev => prev + 5)}
                                className="w-full text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 hover:text-slate-800"
                            >
                                Mostrar registros anteriores <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                        </div>
                    )}
                </aside>

                <div className="flex-1 overflow-y-auto p-8 pb-20 bg-slate-50/50">
                    <div className="max-w-[1200px] mx-auto space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {(() => {
                                const latestMetrics = healthProfile || (evaluations[0]?.metrics) || {};
                                const prevMetrics = evaluations[1]?.metrics || {};
                                const prevDate = evaluations[1] ? new Date(evaluations[1].created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : null;

                                const renderCard = (title: string, currentVal: number, prevVal: number, unit: string) => {
                                    const diff = currentVal - prevVal;
                                    const improved = title.includes('Cintura') || title.includes('Peso') || title.includes('Grasa') ? diff < 0 : diff > 0;
                                    const hasPrev = evaluations.length > 1;
                                    const diffColor = !hasPrev || diff === 0 ? 'text-slate-400 bg-slate-50' : improved ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50';
                                    const icon = diff === 0 ? 'horizontal_rule' : improved ? 'arrow_downward' : 'arrow_upward';

                                    return (
                                        <div key={title} className="bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
                                            <div className="flex items-end gap-3">
                                                <h4 className="text-4xl font-bold font-mono tracking-tighter text-slate-900">{Number(currentVal)?.toFixed(currentVal % 1 === 0 ? 0 : 1) || '---'}<span className="text-lg font-normal text-slate-400 ml-1">{unit}</span></h4>
                                                {hasPrev && diff !== 0 && (
                                                    <div className={`flex items-center text-xs font-bold ${diffColor} px-2 py-1 rounded-lg mb-1`}>
                                                        <span className="material-symbols-outlined text-[16px]">{icon}</span> {Math.abs(diff).toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-tight">
                                                {prevDate ? `Anterior: ${prevVal}${unit} (${prevDate})` : 'Sin registros previos'}
                                            </p>
                                        </div>
                                    );
                                };

                                return (
                                    <>
                                        {renderCard('Peso Corporal', latestMetrics.weight, prevMetrics.weight, 'kg')}
                                        {renderCard('% Grasa Estimado', latestMetrics.body_fat_pct || latestMetrics.body_fat, prevMetrics.body_fat, '%')}
                                        {renderCard('Riesgo (Cintura)', latestMetrics.whr ? latestMetrics.whr * 100 : 0, (prevMetrics.waist / (prevMetrics.hip || 1)) * 100, 'pts')}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
                                        Composición Corporal
                                    </h3>
                                </div>
                                <div className="flex-1 min-h-[250px] w-full">
                                    {healthProfile ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                { subject: 'Grasa (%)', A: healthProfile.body_fat_pct, B: patient?.gender === 'Femenino' ? 22 : 15, fullMark: 40 },
                                                { subject: 'Agua (%)', A: healthProfile.body_water_pct, B: patient?.gender === 'Femenino' ? 55 : 60, fullMark: 100 },
                                                { subject: 'Músculo (%)', A: (healthProfile.muscle_mass_kg / healthProfile.weight) * 100, B: patient?.gender === 'Femenino' ? 35 : 45, fullMark: 60 },
                                                { subject: 'Proteína (%)', A: healthProfile.protein_pct, B: patient?.gender === 'Femenino' ? 15 : 18, fullMark: 25 },
                                                { subject: 'Visceral', A: healthProfile.visceral_fat_level * 2, B: 10, fullMark: 50 },
                                            ]}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                                <Radar name="Actual" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                                <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-20">analytics</span>
                                            Sin perfil de salud
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                                        Evolución del Peso
                                    </h3>
                                </div>
                                <div className="h-56 w-full relative">
                                    {evaluations.length > 0 ? (
                                        <>
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                                {(() => {
                                                    const last5 = [...evaluations.slice(0, 10)].reverse();
                                                    if (last5.length < 2) return null;
                                                    const weights = last5.map(e => Number(e.metrics?.weight) || 0);
                                                    const min = Math.min(...weights) * 0.98;
                                                    const max = Math.max(...weights) * 1.02;
                                                    const range = max - min || 1;
                                                    const points = weights.map((w, i) => ({
                                                        x: (i / (last5.length - 1)) * 1000,
                                                        y: 100 - ((w - min) / range) * 80 - 10
                                                    }));
                                                    const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
                                                    return (
                                                        <>
                                                            <path d={path} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>
                                                            {points.map((p, i) => (
                                                                <circle key={i} cx={p.x} cy={p.y} fill="#10b981" r={i === points.length - 1 ? 6 : 4}></circle>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {healthProfile && (
                                <>
                                    <MetricCard title="Metabolismo Basal" value={healthProfile.bmr_kcal} unit="kcal" icon="bolt" color="amber" />
                                    <MetricCard title="Masa Muscular" value={healthProfile.muscle_mass_kg} unit="kg" icon="fitness_center" color="emerald" />
                                    <MetricCard title="Grasa Visceral" value={healthProfile.visceral_fat_level} unit="nivel" icon="warning" color="red" />
                                    <MetricCard title="Agua Corporal" value={healthProfile.body_water_pct} unit="%" icon="opacity" color="blue" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, unit, icon, color }: any) {
    const bgColors: any = { amber: 'bg-amber-50', emerald: 'bg-emerald-50', red: 'bg-red-50', blue: 'bg-blue-50' };
    const iconColors: any = { amber: 'text-amber-500', emerald: 'text-emerald-500', red: 'text-red-500', blue: 'text-blue-500' };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</p>
            <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${iconColors[color]} ${bgColors[color]} rounded-lg p-2`}>{icon}</span>
                <div>
                    <h4 className="text-2xl font-black text-slate-900">{value}<span className="text-xs font-bold text-slate-400 ml-1">{unit}</span></h4>
                </div>
            </div>
        </div>
    );
}
