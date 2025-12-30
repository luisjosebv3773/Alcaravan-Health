
import React from 'react';

export default function ClinicalDashboard() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 bg-background-light dark:bg-background-dark">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Buenos Días, Dr. Alcaraván</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Lunes, 24 Oct • <span className="text-slate-900 dark:text-white font-semibold">8 citas</span> programadas.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined">print</span> Reporte Diario
          </button>
          <button className="flex-1 md:flex-none bg-primary text-slate-900 hover:bg-[#0fdc52] font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5">
            <span className="material-symbols-outlined">add_circle</span> Consulta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard icon="calendar_month" color="blue" label="Total de Citas" value="8" trend="+20%" />
        <StatCard icon="hourglass_top" color="orange" label="Solicitudes Pendientes" value="3" />
        <StatCard icon="monitor_heart" color="red" label="Casos Urgentes" value="1" alert />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[600px]">
        <div className="xl:col-span-8 bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">calendar_view_day</span> Agenda Visual
            </h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-sm font-medium">
              <button className="px-4 py-1.5 bg-white dark:bg-card-dark shadow-sm rounded-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">Citas</button>
              <button className="px-4 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white">Disponibilidad</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative p-0 bg-slate-50/50 dark:bg-card-dark/50 no-scrollbar">
            <div className="grid grid-cols-[60px_1fr] h-full min-w-[600px]">
              <div className="flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark">
                {['09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM'].map(time => (
                  <div key={time} className="h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">{time}</div>
                ))}
              </div>
              <div className="relative bg-white dark:bg-card-dark">
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {[...Array(7)].map((_, i) => <div key={i} className="h-20 border-b border-slate-100 dark:border-slate-800 w-full border-dashed"></div>)}
                </div>
                <div className="absolute top-[170px] left-0 right-0 border-t-2 border-red-500 z-20"><div className="absolute -left-1.5 size-3 bg-red-500 rounded-full"></div></div>
                
                <ScheduleItem top={4} height={72} color="primary" name="Maria Gonzalez" type="Chequeo General" status="Confirmado" />
                <ScheduleItem top={161} height={78} color="blue" name="Carlos Rodriguez" type="Seguimiento: Hipertensión" status="En Curso" />
                <div className="absolute top-[82px] left-2 right-2 h-[76px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                   <span className="text-sm text-slate-400 group-hover:text-primary font-medium flex items-center gap-1"><span className="material-symbols-outlined text-lg bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">add</span> Espacio Disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <NextPatientCard />
          <PendingRequests />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value, trend, alert }: any) {
  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12`}>
        <span className="material-symbols-outlined text-8xl">{icon}</span>
      </div>
      <div className="flex justify-between items-start z-10">
        <div className={`p-2 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg text-${color}-600 dark:text-${color}-400`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && <span className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-xs">trending_up</span> {trend}</span>}
        {alert && <span className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full animate-pulse">Alerta</span>}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

function ScheduleItem({ top, height, color, name, type, status }: any) {
  return (
    <div className={`absolute top-[${top}px] left-2 right-2 h-[${height}px] bg-${color}-50 dark:bg-${color}-900/20 border-l-[6px] border-${color}-500 rounded-r-lg p-3 cursor-pointer hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-all group z-10 shadow-sm`} style={{ top: `${top}px`, height: `${height}px` }}>
      <div className="flex justify-between items-start h-full">
        <div className="flex flex-col justify-between h-full">
          <p className="text-sm font-bold">{name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">stethoscope</span> {type}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`bg-white/80 dark:bg-black/20 text-${color}-700 dark:text-${color}-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-${color}-200 dark:border-${color}-900`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

function NextPatientCard() {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 size-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Siguiente (11:00 AM)</h4>
      <div className="flex items-center gap-4 mb-5">
        <div className="size-16 rounded-2xl bg-cover bg-center shadow-md" style={{ backgroundImage: "url('https://picsum.photos/seed/patient2/200/200')" }}></div>
        <div>
          <p className="text-lg font-bold">Luis Anderson</p>
          <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-1">ID: 9823-22</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Nivel Riesgo</p>
          <p className="text-sm font-semibold text-orange-500 flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span> Moderado</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Última Visita</p>
          <p className="text-sm font-semibold">Oct 10, 2023</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded font-medium border border-red-100 dark:border-red-900/30">Diabético Tipo 2</span>
        <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded font-medium border border-orange-100 dark:border-orange-900/30">Presión Alta</span>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
        <button className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity">Iniciar Consulta</button>
        <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">description</span></button>
      </div>
    </div>
  );
}

function PendingRequests() {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-[300px]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="font-bold text-sm flex items-center gap-2"><span className="size-2 bg-orange-500 rounded-full animate-pulse"></span> Solicitudes (3)</h3>
        <a className="text-xs text-primary font-bold hover:underline" href="#">Ver todas</a>
      </div>
      <div className="p-3 overflow-y-auto flex flex-col gap-3">
        {[
          { name: "Sarah Lee", time: "Mañana, 9:00 AM", note: "Dolores de cabeza persistentes...", img: "p1" },
          { name: "James Dean", time: "Oct 26, 2:30 PM", img: "p2" }
        ].map((r, i) => (
          <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('https://picsum.photos/seed/${r.img}/100/100')` }}></div>
              <div>
                <p className="text-sm font-bold">{r.name}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500"><span className="material-symbols-outlined text-[10px]">schedule</span> {r.time}</div>
              </div>
            </div>
            {r.note && <p className="text-xs text-slate-500 italic mb-3 pl-1 border-l-2 border-slate-200 dark:border-slate-600 line-clamp-1">"{r.note}"</p>}
            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-slate-900 text-xs font-bold py-2 rounded-md hover:bg-green-400 transition flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">check</span> Aprobar
              </button>
              <button className="px-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
