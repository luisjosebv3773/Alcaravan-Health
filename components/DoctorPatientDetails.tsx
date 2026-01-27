import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import PatientClinicalProfile from './PatientClinicalProfile';
import Modal from './Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorPatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [vitals, setVitals] = useState({
        ta: '---',
        fc: '---',
        temp: '---',
        spo2: '---'
    });
    const [history, setHistory] = useState<any[]>([]);
    const [weightTrend, setWeightTrend] = useState<any[]>([]);
    const [healthProfile, setHealthProfile] = useState<any>(null);
    const [showFullProfile, setShowFullProfile] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);

            // 1. Fetch Patient Info
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
            if (profileError) throw profileError;
            setPatient(profile);

            // 2. Fetch Latest Consultation for Vitals
            const { data: latestConsultation } = await supabase
                .from('consultations')
                .select('vital_signs')
                .eq('patient_id', id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (latestConsultation?.vital_signs) {
                setVitals({
                    ta: latestConsultation.vital_signs.ta || '---',
                    fc: latestConsultation.vital_signs.fc || '---',
                    temp: latestConsultation.vital_signs.temp || '---',
                    spo2: latestConsultation.vital_signs.spo2 || '---'
                });
            }

            // 3. Fetch Health Profile
            const { data: healthData } = await supabase
                .from('perfil_actual_salud')
                .select('*')
                .eq('patient_id', id)
                .single();
            setHealthProfile(healthData);

            // 4. Fetch Unified History
            const [consultationsRes, evalsRes] = await Promise.all([
                supabase.from('consultations')
                    .select('*, appointments(visit_type)')
                    .eq('patient_id', id)
                    .order('created_at', { ascending: false }),
                supabase.from('nutritional_evaluations')
                    .select('*')
                    .eq('patient_id', id)
                    .order('created_at', { ascending: false })
            ]);

            const combinedHistory = [
                ...(consultationsRes.data || []).map(c => ({
                    ...c,
                    type: 'clinical',
                    visit_type: c.appointments?.visit_type
                })),
                ...(evalsRes.data || []).map(e => ({ ...e, type: 'nutrition' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setHistory(combinedHistory);

            // 4. Weight Trend (last 6 entries)
            const weights = (evalsRes.data || [])
                .map(e => ({
                    date: new Date(e.created_at).toLocaleDateString('es-ES', { month: 'short' }),
                    // Support both top-level weight/bmi and nested metrics
                    weight: e.weight || (e.metrics && typeof e.metrics === 'object' ? e.metrics.weight : null) || 0,
                    bmi: e.bmi || (e.metrics && typeof e.metrics === 'object' ? e.metrics.bmi : null) || 0
                }))
                .filter(w => w.weight > 0) // Only include entries with valid weight
                .slice(0, 6)
                .reverse();

            setWeightTrend(weights);
            console.log('Evaluaciones encontradas:', (evalsRes.data || []).length);
            console.log('Tendencia de peso procesada:', weights);

        } catch (error) {
            console.error('Error fetching patient data:', error);
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
        <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    if (!patient) return (
        <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
            <p className="text-red-500 font-bold">Paciente no encontrado</p>
        </div>
    );

    const age = calculateAge(patient.birth_date);
    const lastWeight = healthProfile?.weight || weightTrend[weightTrend.length - 1]?.weight || '---';
    const prevWeight = weightTrend[weightTrend.length - 2]?.weight;
    const weightDiff = prevWeight ? ((Number(lastWeight) - prevWeight) / prevWeight * 100).toFixed(1) : null;

    // Use BMI from health profile as requested
    const imc = healthProfile?.bmi || 0;

    // Position of marker on BMI bar (15 to 40 scale)
    const imcPosition = imc === 0 ? 0 : Math.min(Math.max((imc - 15) / (40 - 15) * 100, 0), 100);

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark no-scrollbar">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

                {/* Header Information */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={() => navigate('/clinical')}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                                    title="Regresar"
                                >
                                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                                </button>
                                <div className="size-20 md:size-24 rounded-2xl bg-cover bg-center ring-4 ring-slate-50 dark:ring-slate-800 shadow-lg"
                                    style={{ backgroundImage: `url(${patient.avatar_url || 'https://www.gravatar.com/avatar/0?d=mp'})` }}></div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{patient.full_name}</h2>
                                <p className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">ID: {patient.cedula || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <VitalCard icon="monitor_heart" label="Presión Arterial" value={vitals.ta} unit="mmHg" />
                                <VitalCard icon="thermostat" label="Temperatura" value={vitals.temp} unit="°C" />
                                <VitalCard icon="respiratory_rate" label="Frecuencia Card." value={vitals.fc} unit="BPM" />
                                <VitalCard icon="air" label="Sat. Oxígeno" value={vitals.spo2} unit="%" />
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setShowFullProfile(true)}
                                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all text-xs"
                                >
                                    <span className="material-symbols-outlined text-lg">clinical_notes</span>
                                    Ver Expediente Completo
                                </button>
                            </div>
                        </div>

                        <div className="md:border-l border-slate-100 dark:border-slate-800 md:pl-6 text-sm text-slate-500 space-y-2 self-center md:self-start">
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">person</span> {patient.gender}, {age} años</p>
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">height</span> {healthProfile?.height || '---'} cm</p>
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">bloodtype</span> RH {healthProfile?.blood_type || '---'}</p>
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span> {patient.address || 'Venezuela'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Timeline Column */}
                    <div className="xl:col-span-7 space-y-6">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    Historial de Consultas & Evolución
                                </h3>
                            </div>

                            <div className="p-6 relative">
                                {/* Timeline line decoration */}
                                <div className="absolute left-[43px] top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                                <div className="space-y-8">
                                    {history.map((item, idx) => (
                                        <HistoryItem key={idx} item={item} navigate={navigate} />
                                    ))}
                                    {history.length === 0 && (
                                        <div className="text-center py-12 text-slate-400 italic text-sm">
                                            No se registran actividades previas para este paciente.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trends Column */}
                    <div className="xl:col-span-5 space-y-6">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">monitoring</span>
                                    Evolución y Tendencias
                                </h3>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Weight Trend */}
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tendencia de Peso</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{lastWeight} <span className="text-sm font-normal text-slate-500">kg</span></p>
                                        </div>
                                        {weightDiff !== null && (
                                            <div className="text-right">
                                                <span className={`text-xs font-bold flex items-center gap-1 justify-end ${Number(weightDiff) < 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    <span className="material-symbols-outlined text-sm">{Number(weightDiff) < 0 ? 'arrow_downward' : 'arrow_upward'}</span> {Math.abs(Number(weightDiff))}%
                                                </span>
                                                <p className="text-[10px] text-slate-400">vs última visita</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-40 w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={weightTrend}>
                                                <defs>
                                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#fcc131" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#fcc131" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                <XAxis
                                                    dataKey="date"
                                                    hide={true}
                                                />
                                                <YAxis
                                                    hide={true}
                                                    domain={['dataMin - 5', 'dataMax + 5']}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '12px'
                                                    }}
                                                    itemStyle={{ color: '#fcc131' }}
                                                    labelStyle={{ display: 'none' }}
                                                    formatter={(value: any) => [`${value} kg`, 'Peso']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="weight"
                                                    stroke="#fcc131"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorWeight)"
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400 uppercase">
                                        <span>{weightTrend[0]?.date}</span>
                                        <span>{weightTrend[weightTrend.length - 1]?.date}</span>
                                    </div>
                                </div>

                                {/* BMI Bar */}
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Análisis IMC</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{imc === 0 ? '---' : imc} <span className="text-sm font-normal text-slate-500">kg/m²</span></p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${imc < 18.5 ? 'bg-blue-100 text-blue-600' :
                                                imc < 25 ? 'bg-green-100 text-green-600' :
                                                    imc < 30 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {imc < 18.5 ? 'Bajo Peso' : imc < 25 ? 'Saludable' : imc < 30 ? 'Sobrepeso' : 'Obesidad'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible flex relative mt-4">
                                        <div className="h-full bg-blue-400 w-[17.5%] rounded-l-full"></div>
                                        <div className="h-full bg-green-400 w-[32.5%]"></div>
                                        <div className="h-full bg-orange-400 w-[25%]"></div>
                                        <div className="h-full bg-red-400 w-[25%] rounded-r-full"></div>

                                        {/* IMC Indicator Bubble */}
                                        <div
                                            className="absolute top-0 bottom-0 size-4 bg-slate-900 dark:bg-white rounded-full border-2 border-white dark:border-slate-900 -mt-1 shadow-md transition-all duration-500"
                                            style={{ left: `${imcPosition}%`, transform: 'translateX(-50%)' }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400">
                                        <span>15</span>
                                        <span className="ml-4">18.5</span>
                                        <span>25</span>
                                        <span>30</span>
                                        <span>40</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones Rápidas</p>

                            <button
                                onClick={() => navigate('/book-appointment', { state: { patient } })}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                            >
                                <span className="material-symbols-outlined icon-filled">add_circle</span>
                                <span>Iniciar Nueva Consulta</span>
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <QuickActionButton icon="prescriptions" label="Recetar" color="slate" />
                                <QuickActionButton icon="labs" label="Exámenes" color="slate" />
                            </div>

                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
                                    <span>Contacto de Emergencia</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-sm">call</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Familiar Directo</p>
                                        <p className="text-xs text-slate-500">Consulte ficha social para más detalles</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Profile Modal */}
            {patient?.id && (
                <Modal
                    isOpen={showFullProfile}
                    onClose={() => setShowFullProfile(false)}
                    title={`Expediente Clínico: ${patient.full_name}`}
                    maxWidth="full"
                >
                    <div className="h-[85vh] w-full">
                        <PatientClinicalProfile
                            patientId={patient.id}
                            onClose={() => setShowFullProfile(false)}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}

function VitalCard({ icon, label, value, unit }: any) {
    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span className="text-[10px] uppercase font-bold tracking-tight">{label}</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{value} <span className="text-xs font-normal text-slate-500">{unit}</span></p>
        </div>
    );
}

function Tag({ color, icon, label }: any) {
    const colors: any = {
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${colors[color]}`}>
            <span className="material-symbols-outlined text-base">{icon}</span>
            {label}
        </span>
    );
}

function QuickActionButton({ icon, label, color }: any) {
    return (
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-sm">
            <span className="material-symbols-outlined text-slate-500 mb-1">{icon}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
        </button>
    );
}

function HistoryItem({ item, navigate }: any) {
    const isClinical = item.type === 'clinical';
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const getVisitTypeStyles = (type: string, isClinical: boolean) => {
        if (!isClinical) return {
            icon: 'nutrition',
            label: 'Nutrición',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-900/50'
        };

        switch (type) {
            case 'first-time':
                return {
                    icon: 'person_add',
                    label: 'Primera Vez',
                    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    border: 'border-emerald-200 dark:border-emerald-900/50'
                };
            case 'follow-up':
                return {
                    icon: 'stethoscope',
                    label: 'Control',
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-900/50'
                };
            case 'results':
                return {
                    icon: 'analytics',
                    label: 'Resultados',
                    bg: 'bg-purple-100 dark:bg-purple-900/30',
                    text: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-200 dark:border-purple-900/50'
                };
            case 'emergency':
                return {
                    icon: 'emergency',
                    label: 'Urgencia',
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-red-200 dark:border-red-900/50'
                };
            default:
                return {
                    icon: 'medical_services',
                    label: 'Consulta',
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    text: 'text-slate-600 dark:text-slate-400',
                    border: 'border-slate-200 dark:border-slate-700'
                };
        }
    };

    const styles = getVisitTypeStyles(item.visit_type, isClinical);

    return (
        <div className="relative pl-12 group">
            {/* Timeline Circle */}
            <div className={`absolute left-0 top-0 size-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-light dark:border-surface-dark ${styles.bg} ${styles.text}`}>
                <span className="material-symbols-outlined text-lg icon-filled">
                    {styles.icon}
                </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {isClinical ? (item.reason || 'Consulta Médica') : 'Evaluación Nutricional'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">{formattedDate} • {formattedTime}</p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 italic line-clamp-2 mb-4">
                    {isClinical ?
                        (item.diagnosis ? "Diagnóstico: " + (item.diagnosis.startsWith('[') ? JSON.parse(item.diagnosis).map((d: any) => d.name).join(', ') : item.diagnosis) : "Sin diagnóstico registrado.")
                        : (item.ai_summary || "Evolución nutricional registrada.")}
                </p>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        isClinical ? navigate(`/consultation/${item.appointment_id}`) : navigate(`/nutrition/evaluate/${item.patient_id}/${item.id}`);
                    }}
                    className="w-full py-2 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                    Ver Detalles <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
            </div>
        </div>
    );
}
