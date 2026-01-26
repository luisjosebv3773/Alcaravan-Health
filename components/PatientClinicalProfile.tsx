import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface PatientClinicalProfileProps {
    patientId: string;
    onClose?: () => void;
}

export default function PatientClinicalProfile({ patientId, onClose }: PatientClinicalProfileProps) {
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [healthProfile, setHealthProfile] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'medical'>('overview');

    useEffect(() => {
        if (patientId) {
            fetchFullProfile();
        }
    }, [patientId]);

    async function fetchFullProfile() {
        try {
            setLoading(true);

            // 1. Fetch Patient Basic Info & Medical History
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', patientId)
                .single();
            if (profileError) throw profileError;
            setPatient(profile);

            // 2. Fetch Aggregated Health Profile (BMI, Fat, etc.)
            const { data: hp } = await supabase
                .from('perfil_actual_salud')
                .select('*')
                .eq('patient_id', patientId)
                .single();
            setHealthProfile(hp);

            // 3. Fetch Unified History (Consultations & Evaluations)
            const [consultationsRes, evalsRes] = await Promise.all([
                supabase.from('consultations').select('id, created_at, reason, diagnosis, doctor_id').eq('patient_id', patientId).order('created_at', { ascending: false }),
                supabase.from('nutritional_evaluations').select('id, created_at, ai_summary, nutritionist_id, metrics').eq('patient_id', patientId).order('created_at', { ascending: false })
            ]);

            const combinedHistory = [
                ...(consultationsRes.data || []).map(c => ({ ...c, type: 'clinical' })),
                ...(evalsRes.data || []).map(e => ({ ...e, type: 'nutrition' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setHistory(combinedHistory);

        } catch (error) {
            console.error('Error fetching clinical profile:', error);
        } finally {
            setLoading(false);
        }
    }

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '---';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    if (!patient) return (
        <div className="p-12 text-center text-red-500 font-bold">
            Paciente no encontrado
        </div>
    );

    const age = calculateAge(patient.birth_date);
    const radarData = healthProfile ? [
        { subject: 'IMC', A: (healthProfile.bmi / 40) * 100, fullMark: 100 },
        { subject: 'Grasa %', A: healthProfile.body_fat_pct || 0, fullMark: 100 },
        { subject: 'Riesgo', A: healthProfile.risk_status === 'Alto' ? 100 : healthProfile.risk_status === 'Moderado' ? 60 : 30, fullMark: 100 },
        { subject: 'Peso (Kg)', A: (healthProfile.weight / 150) * 100, fullMark: 100 },
    ] : [];

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-cover bg-center ring-2 ring-primary/20"
                            style={{ backgroundImage: `url(${patient.avatar_url || 'https://www.gravatar.com/avatar/0?d=mp'})` }}></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{patient.full_name}</h2>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">ID: {patient.cedula || '---'}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${patient.gender === 'Masculino' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                    {patient.gender || '---'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-2 px-1 text-sm font-bold transition-all border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('medical')}
                        className={`pb-2 px-1 text-sm font-bold transition-all border-b-2 ${activeTab === 'medical' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Ficha Médica
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-2 px-1 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Metrics Area */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Estado de Salud</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#94a3b8" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Paciente"
                                            dataKey="A"
                                            stroke="#fcc131"
                                            fill="#fcc131"
                                            fillOpacity={0.6}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">IMC</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{healthProfile?.bmi || '---'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Riesgo</p>
                                    <p className={`text-lg font-black ${healthProfile?.risk_status === 'Alto' ? 'text-red-500' : healthProfile?.risk_status === 'Moderado' ? 'text-orange-500' : 'text-green-500'}`}>
                                        {healthProfile?.risk_status || '---'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-4">
                            <MetricItem icon="height" label="Estatura" value={`${healthProfile?.height || '---'} cm`} />
                            <MetricItem icon="weight" label="Peso Actual" value={`${healthProfile?.weight || '---'} kg`} />
                            <MetricItem icon="bloodtype" label="Grupo Sanguíneo" value={healthProfile?.blood_type || '---'} color="red" />
                            <MetricItem icon="calendar_today" label="Edad" value={`${age} años`} />

                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="text-[10px] font-bold uppercase">Alergias Conocidas</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {healthProfile?.allergies || 'Ninguna registrada'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">medical_information</span>
                                Antecedentes Médicos
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {healthProfile?.medical_history || 'No se han registrado antecedentes médicos crónicos o cirugías previas.'}
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">family_history</span>
                                Antecedentes Familiares
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {healthProfile?.family_history || 'Sin antecedentes familiares de relevancia registrados.'}
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">pill</span>
                                Medicamentos Actuales
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {healthProfile?.medications || 'No hay tratamientos farmacológicos activos reportados.'}
                                </p>
                            </div>
                        </section>
                    </div>
                )}
                分析
                {activeTab === 'history' && (
                    <div className="relative pl-6 space-y-8">
                        <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                        {history.map((item, idx) => (
                            <TimelineItem
                                key={idx}
                                item={item}
                                onClick={() => {
                                    if (item.type === 'clinical') navigate(`/consultation/${item.id}`);
                                    else navigate(`/nutrition/evaluate/${patientId}/${item.id}`);
                                }}
                            />
                        ))}
                        {history.length === 0 && (
                            <div className="text-center py-12 text-slate-400 italic text-sm ml-[-20px]">
                                No hay actividad clínica registrada recientemente.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricItem({ icon, label, value, color = 'primary' }: any) {
    const iconColors: any = {
        primary: 'text-primary',
        red: 'text-red-500',
        blue: 'text-blue-500'
    };
    return (
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${iconColors[color]}`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
                <p className="text-base font-black text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

function TimelineItem({ item, onClick }: any) {
    const isClinical = item.type === 'clinical';
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="relative pl-12">
            <div className={`absolute left-0 top-1 size-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-light dark:border-surface-dark ${isClinical ? 'bg-primary/20 text-primary' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                <span className="material-symbols-outlined text-lg">
                    {isClinical ? 'stethoscope' : 'nutrition'}
                </span>
            </div>
            <div
                onClick={onClick}
                className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/40 cursor-pointer transition-all shadow-sm"
            >
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isClinical ? (item.reason || 'Consulta Médica') : 'Evaluación Nutricional'}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400">{formattedDate}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                    {isClinical
                        ? (item.diagnosis ? "Diag: " + (item.diagnosis.startsWith('[') ? JSON.parse(item.diagnosis).map((d: any) => d.name).join(', ') : item.diagnosis) : "Sin diagnóstico detallado.")
                        : (item.ai_summary || "Evolución nutricional registrada.")}
                </p>
            </div>
        </div>
    );
}
