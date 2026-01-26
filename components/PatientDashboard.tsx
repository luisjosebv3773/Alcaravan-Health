
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabase';
import PatientClinicalProfile from './PatientClinicalProfile';
import Modal from './Modal';

const data = [
  { subject: 'Músculo', A: 120, B: 110, fullMark: 150 },
  { subject: 'Grasa %', A: 98, B: 130, fullMark: 150 },
  { subject: 'Agua', A: 86, B: 130, fullMark: 150 },
  { subject: 'Hueso', A: 99, B: 100, fullMark: 150 },
  { subject: 'Proteína', A: 85, B: 90, fullMark: 150 },
  { subject: 'Metabolismo', A: 65, B: 85, fullMark: 150 },
];

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  doctor: {
    full_name: string;
    doctor_specialties: Array<{
      specialties: {
        name: string;
      }
    }>;
  };
}

export default function PatientDashboard({ userName }: { userName?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [showClinicalProfile, setShowClinicalProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch Profile (for gender)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch Health Profile
      const { data: healthData } = await supabase
        .from('perfil_actual_salud')
        .select('*')
        .eq('patient_id', session.user.id)
        .single();
      setHealthProfile(healthData);
      setLoadingHealth(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          visit_type,
          doctor:doctor_id (
            full_name,
            doctor_specialties (
              specialties ( name )
            )
          )
        `)
        .eq('patient_id', session.user.id)
        .gte('appointment_date', new Date().toISOString().split('T')[0]) // Only future or today
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        // We can't easily sort by time string "08:00 AM" in SQL if mixed, 
        // but typically date sort is enough for "closest days".
        .limit(5); // Fetch a few to sort in memory if needed

      if (data) {
        // Simple client-side sort to ensure time correctness within same day is tricky with AM/PM strings
        // but assuming the user wants rough "next appointments", date order is primary.
        // Let's rely on date order for now.
        // We need to cast the doctor generic because Supabase types might be inferred loosely
        const safeData = data.map((item: any) => ({
          ...item,
          doctor: Array.isArray(item.doctor) ? item.doctor[0] : item.doctor
        }));
        setAppointments(safeData.slice(0, 3));
      }
      setLoadingAppointments(false);
    };

    fetchAppointments();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Buenos días, {userName || 'Usuario'}</h2>
          <p className="text-text-sub dark:text-gray-400 text-lg">
            {healthProfile
              ? `Tu IMC es de ${healthProfile.bmi.toFixed(1)} (${healthProfile.bmi < 25 ? 'Saludable' : 'Monitorear'}). Mantengamos tus estadísticas en verde hoy.`
              : 'Bienvenido a tu portal de salud. Completa tu primera evaluación para ver tus métricas.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowClinicalProfile(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-slate-900 border border-primary rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 transition-all"
          >
            <span className="material-symbols-outlined !text-[20px]">medical_services</span> Perfil Clínico
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">download</span> Reporte
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon="monitor_weight"
              label="IMC (Índice de Masa Corporal)"
              value={healthProfile?.bmi?.toFixed(1) || '---'}
              status={healthProfile?.bmi < 18.5 ? 'Bajo Peso' : healthProfile?.bmi < 25 ? 'Normal' : healthProfile?.bmi < 30 ? 'Sobrepeso' : 'Obesidad'}
              color={healthProfile?.bmi < 25 ? 'primary' : 'status-amber'}
              subtext={healthProfile?.bmi < 25 ? "Tu peso es óptimo para tu altura." : "Considera revisar tu plan nutricional."}
            />
            <MetricCard
              icon="straighten"
              label="ICC (Índice Cintura-Cadera)"
              value={healthProfile?.whr?.toFixed(2) || '---'}
              status={healthProfile?.whr < (profile?.gender === 'Femenino' ? 0.85 : 0.95) ? 'Saludable' : 'Riesgo'}
              color={healthProfile?.whr < (profile?.gender === 'Femenino' ? 0.85 : 0.95) ? 'primary' : 'status-red'}
              subtext="Mide la distribución de grasa abdominal."
            />
            <MetricCard
              icon="cardiology"
              label="Nivel Grasa Visceral"
              value={healthProfile?.visceral_fat_level || '---'}
              status={healthProfile?.visceral_fat_level < 10 ? 'Saludable' : 'Elevado'}
              color={healthProfile?.visceral_fat_level < 10 ? 'primary' : 'status-amber'}
              subtext="Grasa que rodea los órganos internos."
            />
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col min-h-[400px]">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold">Análisis de Composición Corporal</h3>
                <p className="text-sm text-text-sub dark:text-gray-400">Comparación Radar: Tú vs. Objetivos Ideales</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="font-medium">Tú</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Objetivo</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 flex-grow">
              <div className="w-full md:w-1/2 h-[300px]">
                {healthProfile ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Grasa (%)', A: healthProfile.body_fat_pct, B: profile?.gender === 'Femenino' ? 22 : 15, fullMark: 40 },
                      { subject: 'Agua (%)', A: healthProfile.body_water_pct, B: profile?.gender === 'Femenino' ? 55 : 60, fullMark: 100 },
                      { subject: 'Músculo (%)', A: (healthProfile.muscle_mass_kg / (healthProfile.weight || 1)) * 100, B: profile?.gender === 'Femenino' ? 35 : 45, fullMark: 60 },
                      { subject: 'Proteína (%)', A: healthProfile.protein_pct, B: profile?.gender === 'Femenino' ? 15 : 18, fullMark: 25 },
                      { subject: 'Visceral', A: healthProfile.visceral_fat_level * 2, B: 10, fullMark: 50 },
                    ]}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                      <Radar name="Tú" dataKey="A" stroke="#13ec5b" fill="#13ec5b" fillOpacity={0.6} />
                      <Radar name="Objetivo" dataKey="B" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} strokeDasharray="4 4" />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm gap-2">
                    <span className="material-symbols-outlined text-4xl opacity-20">analytics</span>
                    Realiza tu primera evaluación para ver tu radar.
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 w-full">
                <SubMetric label="Masa Muscular" value={healthProfile?.muscle_mass_kg?.toFixed(1) || '---'} unit="kg" progress={85} trend="Estimada" color="primary" />
                <SubMetric label="Grasa Corporal" value={healthProfile?.body_fat_pct?.toFixed(1) || '---'} unit="%" progress={healthProfile?.body_fat_pct * 2} trend="Navy Method" color="status-amber" />
                <SubMetric label="Agua Corporal" value={healthProfile?.body_water_pct?.toFixed(1) || '---'} unit="%" progress={healthProfile?.body_water_pct} trend="Hidratación" color="primary" />
                <SubMetric label="Metabolismo (BMR)" value={healthProfile?.bmr_kcal || '---'} unit="kcal" progress={70} trend="Basal" color="primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <AppointmentCard appointments={appointments} loading={loadingAppointments} />
          <WellnessGoals weight={healthProfile?.weight} />
          <EducationTip />
        </div>
      </div>

      <section className="mt-8">
        <h3 className="text-xl font-bold mb-6">Tendencias de Métricas (Últimos 6 Meses)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TrendCard label="Peso" value="78kg" trend="-2%" color="primary" />
          <TrendCard label="Masa Muscular" value="38.2kg" trend="+1.5%" color="primary" />
          <TrendCard label="Sueño Promedio" value="7h 12m" trend="0%" color="status-amber" />
          <TrendCard label="Grasa Visceral" value="Nivel 9" trend="Bien" color="primary" />
        </div>
      </section>

      {/* Clinical Profile Dialog */}
      {profile?.id && (
        <Modal
          isOpen={showClinicalProfile}
          onClose={() => setShowClinicalProfile(false)}
          title="Mi Perfil Clínico"
          maxWidth="full"
        >
          <div className="h-[85vh] w-full">
            <PatientClinicalProfile
              patientId={profile.id}
              onClose={() => setShowClinicalProfile(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, status, color, subtext }: any) {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 bg-primary/10 rounded-lg text-primary`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`inline-flex rounded-full h-3 w-3 ${status === 'Normal' || status === 'Saludable' ? 'bg-primary' : 'bg-status-amber'}`}></span>
      </div>
      <h3 className="text-sm font-medium text-text-sub dark:text-gray-400 mb-1">{label}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-sm font-bold text-${color}`}>{status}</span>
      </div>
      <p className="text-xs text-text-sub dark:text-gray-500">{subtext}</p>
    </div>
  );
}

function SubMetric({ label, value, unit, progress, trend, color }: any) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold">{value} <span className="text-xs font-normal text-text-sub">{unit}</span></p>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 dark:bg-gray-700">
        <div className={`bg-${color} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className={`text-xs text-${color} mt-1 font-medium`}>{trend}</p>
    </div>
  );
}

function AppointmentCard({ appointments, loading }: { appointments: Appointment[], loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcoming = appointments.length > 0 ? appointments[0] : null;
  const nextAppointments = appointments.slice(1);

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Próximas Citas</h3>
        <Link className="text-sm font-bold text-primary hover:underline" to="/appointment-history">Ver todas</Link>
      </div>

      {upcoming ? (
        <>
          <div className="relative pl-6 pb-6 border-l-2 border-primary/30 last:pb-0">
            <span className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-white dark:ring-card-dark"></span>
            <p className="text-sm font-bold text-text-sub mb-1">
              {new Date(upcoming.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })} • {upcoming.appointment_time}
            </p>
            <h4 className="font-bold text-lg mb-1 capitalize">
              {upcoming.doctor?.doctor_specialties?.map(s => s.specialties?.name).join(', ') || 'Medicina General'}
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {upcoming.doctor?.full_name?.charAt(0) || 'D'}
              </div>
              <span className="text-sm font-medium">{upcoming.doctor?.full_name || 'Doctor'}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">Reprogramar</button>
              <button className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors">Detalles</button>
            </div>
          </div>

          {nextAppointments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
              {nextAppointments.map((appt) => (
                <div key={appt.id} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-text-sub">
                        {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {appt.appointment_time}
                      </p>
                      <p className="text-sm font-semibold">{appt.doctor?.full_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-text-sub">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
          <p>No tienes citas programadas.</p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <Link to="/request-appointment" className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">calendar_add_on</span> Reservar Nueva Cita
        </Link>
      </div>
    </div>
  );
}

function WellnessGoals({ weight }: { weight?: number }) {
  const waterGoal = weight ? Math.round(weight * 35 / 250) : 10;
  return (
    <div className="bg-background-light dark:bg-background-dark border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary">task_alt</span>
        <h3 className="text-lg font-bold">Metas Diarias</h3>
      </div>
      {[
        { title: `Beber ${waterGoal} vasos de Agua`, sub: `Meta personalizada: ${(waterGoal * 0.25).toFixed(1)}L` },
        { title: "15 min estiramiento", sub: "Salud de espalda" },
        { title: "Tomar Vitaminas", sub: "Recomendado por tu nutri" },
      ].map((g, i) => (
        <div key={i} className="flex items-start gap-3 group">
          <div className="relative mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary block"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary dark:text-gray-200">{g.title}</span>
            <span className="text-xs text-text-sub">{g.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationTip() {
  return (
    <div className="bg-gradient-to-br from-[#102216] to-[#1a3826] rounded-xl p-6 text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined !text-[120px]">local_library</span>
      </div>
      <span className="inline-block px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">Tip del día</span>
      <h4 className="font-bold text-lg mb-2 relative z-10">Mejorar Índice Cintura-Cadera</h4>
      <p className="text-sm text-gray-300 mb-4 relative z-10">Agregar 20 minutos de cardio puede mejorar significativamente tus métricas de ICC en 4 semanas.</p>
      <a className="inline-flex items-center text-sm font-bold text-primary hover:text-white transition-colors relative z-10" href="#">
        Leer Artículo <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
      </a>
    </div>
  );
}

function TrendCard({ label, value, trend, color }: any) {
  return (
    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg border border-gray-100 dark:border-gray-800">
      <p className="text-xs text-text-sub font-medium uppercase mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold">{value}</span>
        <span className={`text-xs font-bold text-${color} flex items-center`}>
          <span className="material-symbols-outlined text-sm">{trend.includes('+') ? 'trending_up' : 'trending_down'}</span> {trend}
        </span>
      </div>
      <div className="h-8 mt-2 flex items-end gap-1">
        {[40, 60, 45, 70, 55, 80].map((h, i) => (
          <div key={i} className={`flex-1 bg-${color}/${i === 5 ? '100' : '20'} h-[${h}%] rounded-sm`} style={{ height: `${h}%` }}></div>
        ))}
      </div>
    </div>
  );
}
