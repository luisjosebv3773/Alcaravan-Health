
import React from 'react';
import { Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Músculo', A: 120, B: 110, fullMark: 150 },
  { subject: 'Grasa %', A: 98, B: 130, fullMark: 150 },
  { subject: 'Agua', A: 86, B: 130, fullMark: 150 },
  { subject: 'Hueso', A: 99, B: 100, fullMark: 150 },
  { subject: 'Proteína', A: 85, B: 90, fullMark: 150 },
  { subject: 'Metabolismo', A: 65, B: 85, fullMark: 150 },
];

export default function PatientDashboard() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Buenos días, Mateo</h2>
          <p className="text-text-sub dark:text-gray-400 text-lg">Tus últimas mediciones muestran tendencias prometedoras. Mantengamos tus estadísticas en <span className="text-primary font-bold">verde</span> hoy.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">download</span> Reporte Completo
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-black rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">add</span> Registrar Actividad
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard icon="monitor_weight" label="IMC (Índice de Masa Corporal)" value="24.5" status="Normal" color="status-green" subtext="Tu peso es óptimo para tu altura." />
            <MetricCard icon="straighten" label="ICC (Índice Cintura-Cadera)" value="0.86" status="Moderado" color="status-amber" subtext="Riesgo ligeramente elevado. Monitorear dieta." />
            <MetricCard icon="cardiology" label="Nivel Grasa Visceral" value="9" status="Saludable" color="status-green" subtext="Los niveles de grasa interna están en rango seguro." />
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
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                    <Radar name="Tú" dataKey="A" stroke="#13ec5b" fill="#13ec5b" fillOpacity={0.6} />
                    <Radar name="Objetivo" dataKey="B" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} strokeDasharray="4 4" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 w-full">
                <SubMetric label="Masa Muscular" value="38.2" unit="kg" progress={85} trend="+2.1kg" color="primary" />
                <SubMetric label="Grasa Corporal" value="18.5" unit="%" progress={45} trend="-0.5%" color="status-amber" />
                <SubMetric label="Agua Corporal" value="58.4" unit="%" progress={70} trend="Óptima" color="primary" />
                <SubMetric label="Metabolismo" value="1740" unit="kcal" progress={90} trend="Alto" color="primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <AppointmentCard />
          <WellnessGoals />
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

function AppointmentCard() {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Próxima Cita</h3>
        <Link className="text-sm font-bold text-primary hover:underline" to="/appointment-history">Ver todas</Link>
      </div>
      <div className="relative pl-6 pb-6 border-l-2 border-primary/30 last:pb-0">
        <span className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-white dark:ring-card-dark"></span>
        <p className="text-sm font-bold text-text-sub mb-1">Mañana, 10:00 AM</p>
        <h4 className="font-bold text-lg mb-1">Consulta Nutricionista</h4>
        <div className="flex items-center gap-2 mb-3">
          <div className="size-6 rounded-full bg-gray-200 bg-cover" style={{ backgroundImage: "url('https://picsum.photos/seed/doc1/100/100')" }}></div>
          <span className="text-sm font-medium">Dra. Sarah Jimenez</span>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">Reprogramar</button>
          <button className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors">Detalles</button>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <Link to="/request-appointment" className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">calendar_add_on</span> Reservar Nueva Cita
        </Link>
      </div>
    </div>
  );
}

function WellnessGoals() {
  return (
    <div className="bg-background-light dark:bg-background-dark border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary">task_alt</span>
        <h3 className="text-lg font-bold">Metas Diarias</h3>
      </div>
      {[
        { title: "Beber 2.5L Agua", sub: "Actual: 1.2L", done: false },
        { title: "15 min estiramiento", sub: "Salud de espalda", done: false },
        { title: "Tomar Vitaminas", sub: "Completado a las 8:30 AM", done: true },
      ].map((g, i) => (
        <label key={i} className="flex items-start gap-3 cursor-pointer group">
          <input checked={g.done} readOnly type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" />
          <div className="flex flex-col">
            <span className={`text-sm font-medium transition-colors ${g.done ? 'line-through text-gray-400' : 'group-hover:text-primary'}`}>{g.title}</span>
            <span className={`text-xs ${g.done ? 'text-primary font-bold' : 'text-text-sub'}`}>{g.sub}</span>
          </div>
        </label>
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
