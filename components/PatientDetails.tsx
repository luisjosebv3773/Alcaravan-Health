
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function PatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        if (id) {
            fetchPatient();
            fetchEvaluations();
        }
    }, [id]);

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500">Cargando detalles del paciente...</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-lg font-bold text-red-500 mb-4">No se encontró el paciente.</p>
                    <button onClick={() => navigate('/nutrition')} className="text-primary hover:underline font-bold">Volver al Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 text-slate-900 h-screen flex flex-col overflow-hidden">
            <header className="w-full bg-white border-b border-slate-200 z-10 shadow-sm shrink-0">
                <div className="max-w-[1200px] mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/nutrition')}
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
                {/* Consultation History Sidebar */}
                <aside className="w-72 border-r border-slate-200 flex flex-col bg-white">
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
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors shadow-sm ${index === 0 ? 'bg-primary/10 border-primary/30' : 'border-transparent hover:bg-slate-100 group'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-bold ${index === 0 ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{index === 0 ? 'Hoy (Actual)' : date}</span>
                                        {index === 0 && <span className="size-2 rounded-full bg-primary animate-pulse"></span>}
                                    </div>
                                    <p className={`text-xs ${index === 0 ? 'text-slate-500' : 'text-slate-400'}`}>
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

                        {/* Quick Summary Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {(() => {
                                const latest = evaluations[0]?.metrics || {};
                                const prev = evaluations[1]?.metrics || {};
                                const prevDate = evaluations[1] ? new Date(evaluations[1].created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : null;

                                const renderCard = (title: string, currentVal: number, prevVal: number, unit: string) => {
                                    const diff = currentVal - prevVal;
                                    const improved = title.includes('Cintura') || title.includes('Peso') || title.includes('Grasa') ? diff < 0 : diff > 0;
                                    const diffColor = diff === 0 ? 'text-slate-400 bg-slate-50' : improved ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50';
                                    const icon = diff === 0 ? 'horizontal_rule' : improved ? 'arrow_downward' : 'arrow_upward';

                                    return (
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</p>
                                            <div className="flex items-end gap-3">
                                                <h4 className="text-4xl font-bold text-slate-900">{currentVal || '---'}<span className="text-lg font-normal text-slate-400 ml-1">{unit}</span></h4>
                                                {evaluations.length > 1 && (
                                                    <div className={`flex items-center text-xs font-bold ${diffColor} px-2 py-1 rounded-lg mb-1`}>
                                                        <span className="material-symbols-outlined text-[16px]">{icon}</span> {Math.abs(diff).toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-3 font-medium">
                                                {prevDate ? `Prev: ${prevVal}${unit} (${prevDate})` : 'Sin registros previos'}
                                            </p>
                                        </div>
                                    );
                                };

                                return (
                                    <>
                                        {renderCard('Peso Actual', latest.weight, prev.weight, 'kg')}
                                        {renderCard('% Grasa Corporal', latest.body_fat, prev.body_fat, '%')}
                                        {renderCard('Perímetro de Cintura', latest.waist, prev.waist, 'cm')}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                                        Evolución del Peso (Últimas 5 visitas)
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">TENDENCIA</span>
                                </div>
                                <div className="h-40 w-full relative">
                                    {evaluations.length > 0 ? (
                                        <>
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                                                {(() => {
                                                    const last5 = [...evaluations.slice(0, 5)].reverse();
                                                    if (last5.length < 2) return null;
                                                    const weights = last5.map(e => e.metrics?.weight || 0);
                                                    const min = Math.min(...weights) * 0.95;
                                                    const max = Math.max(...weights) * 1.05;
                                                    const range = max - min || 1;

                                                    const points = weights.map((w, i) => {
                                                        const x = (i / (last5.length - 1)) * 400;
                                                        const y = 100 - ((w - min) / range) * 80 - 10;
                                                        return { x, y };
                                                    });

                                                    const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
                                                    return (
                                                        <>
                                                            <path d={path} fill="none" stroke="#13ec5b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                                                            {points.map((p, i) => (
                                                                <circle key={i} cx={p.x} cy={p.y} fill="#13ec5b" r={i === points.length - 1 ? 5 : 4} className={i === points.length - 1 ? 'animate-pulse' : ''}></circle>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
                                                {[...evaluations.slice(0, 5)].reverse().map((e, i) => (
                                                    <span key={i}>{new Date(e.created_at).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">Sin datos suficientes</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-[20px]">query_stats</span>
                                        Tendencia Circunferencia Cintura
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">TENDENCIA</span>
                                </div>
                                <div className="h-40 w-full relative">
                                    {evaluations.length > 0 ? (
                                        <>
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                                                {(() => {
                                                    const last5 = [...evaluations.slice(0, 5)].reverse();
                                                    if (last5.length < 2) return null;
                                                    const waist = last5.map(e => e.metrics?.waist || 0);
                                                    const min = Math.min(...waist) * 0.95;
                                                    const max = Math.max(...waist) * 1.05;
                                                    const range = max - min || 1;

                                                    const points = waist.map((w, i) => {
                                                        const x = (i / (last5.length - 1)) * 400;
                                                        const y = 100 - ((w - min) / range) * 80 - 10;
                                                        return { x, y };
                                                    });

                                                    const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
                                                    return (
                                                        <>
                                                            <path d={path} fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                                                            {points.map((p, i) => (
                                                                <circle key={i} cx={p.x} cy={p.y} fill="#3b82f6" r={i === points.length - 1 ? 5 : 4} className={i === points.length - 1 ? 'animate-pulse' : ''}></circle>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
                                                {[...evaluations.slice(0, 5)].reverse().map((e, i) => (
                                                    <span key={i}>{new Date(e.created_at).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">Sin datos suficientes</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Session Memory / Notes */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500">psychology</span>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Memoria de Sesión: {evaluations[0] ? `Última Cita (${new Date(evaluations[0].created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})` : 'Sin registros'}
                                    </h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Clínico Nutricional</span>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Categoría</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Dato</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Clasificación / Meta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {evaluations[0] ? (() => {
                                            const ev = evaluations[0];
                                            const m = ev.metrics || {};
                                            const age = calculateAge(patient.birth_date);
                                            const heightM = m.height / 100;
                                            const imc = m.weight / (heightM * heightM);
                                            const fatKg = (m.body_fat / 100) * m.weight;
                                            const leanKg = m.weight - fatKg;
                                            const whr = m.waist / m.hip;
                                            const ice = m.waist / m.height;
                                            const waterGoal = Math.round(m.weight * 35 / 250); // vasos de 250ml
                                            const bmrValue = getBMR(m.weight, m.height, patient.birth_date, patient.gender);

                                            return (
                                                <>
                                                    <tr>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm text-primary">analytics</span>
                                                                <span className="text-xs font-bold text-slate-600 uppercase">Antropometría</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-slate-900">IMC: {imc.toFixed(1)}</p>
                                                                <p className="text-xs text-slate-500">Masa Muscular est: {leanKg.toFixed(1)}kg</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${imc < 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {imc < 18.5 ? 'Bajo Peso' : imc < 25 ? 'Peso Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">Masa Grasa: {fatKg.toFixed(1)}kg</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm text-red-500">favorite</span>
                                                                <span className="text-xs font-bold text-slate-600 uppercase">Riesgo Salud</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-slate-900">ICC: {whr.toFixed(2)}</p>
                                                                <p className="text-xs text-slate-500">ICE (Cintura/Talla): {ice.toFixed(2)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${ice < 0.5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {ice < 0.5 ? 'Riesgo Cardiovascular Bajo' : 'Riesgo Cardiovascular Aumentado'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">GEB: {Math.round(bmrValue)} kcal/día</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm text-blue-500">water_drop</span>
                                                                <span className="text-xs font-bold text-slate-600 uppercase">Hábitos</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-bold text-slate-900">Agua: {ev.habits?.water_glasses || 0} vasos</p>
                                                                <p className="text-xs text-slate-500">Actividad: {ev.physical_activity?.frequency}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 w-fit">
                                                                    Meta: {waterGoal} vasos/día
                                                                </span>
                                                                <span className="text-[10px] text-red-400 font-black uppercase">
                                                                    {ev.physical_activity?.frequency === 'Sedentario' ? 'Obstáculo: Inactividad' : 'Buen nivel de actividad'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })() : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                    Complete la primera evaluación para generar el resumen médico.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {evaluations[0] && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Observación de Resumen AI</p>
                                    <p className="text-sm text-slate-600 italic leading-relaxed border-l-4 border-primary/30 pl-4">
                                        {evaluations[0]?.ai_summary || '"No hay un resumen disponible para esta evaluación."'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
