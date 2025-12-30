
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AppointmentHistory() {
  const navigate = useNavigate();
  const appointments = [
    { id: 'APP-2024-882', name: 'Dra. Sarah Jimenez', specialty: 'Consulta Nutricional', date: 'Oct 24, 2023', time: '10:00 AM', status: 'Completed', color: 'primary', initial: 'SJ' },
    { id: 'APP-2024-966', name: 'Marydee Rondon Alvarado', specialty: 'Medicina General', date: 'Nov 10, 2023', time: '09:00 AM', status: 'Completed', color: 'primary', initial: 'MR' },
    { id: 'APP-2024-965', name: 'Sarah Jimenez', specialty: 'Consulta Nutricional', date: 'Nov 10, 2023', time: '09:00 AM', status: 'Missed', color: 'status-amber', initial: 'SJ' },
    { id: 'APP-2024-960', name: 'Marydee Rondon Alvarado', specialty: 'Medicina General', date: 'Nov 10, 2023', time: '09:00 AM', status: 'Canceled', color: 'status-red', initial: 'MR', opacity: true },
    { id: 'APP-2024-945', name: 'Marydee Rondon Alvarado', specialty: 'Medicina General', date: 'Oct 10, 2023', time: '14:00 PM', status: 'Completed', color: 'primary', initial: 'MR' },
    { id: 'APP-2024-933', name: 'Alejandro Martinez', specialty: 'Cardiología', date: 'Nov 08, 2023', time: '11:30 AM', status: 'Missed', color: 'blue', initial: 'AM' },
  ];

  const statusMap: Record<string, { text: string, bg: string, textCol: string, border: string }> = {
    'Completed': { text: 'Completada', bg: 'bg-green-100 dark:bg-green-900/30', textCol: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    'Missed': { text: 'No asistió', bg: 'bg-yellow-100 dark:bg-yellow-900/30', textCol: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
    'Canceled': { text: 'Cancelada', bg: 'bg-red-100 dark:bg-red-900/30', textCol: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main dark:text-white overflow-x-hidden transition-colors duration-200">
      <main className="flex-grow w-full max-w-[1000px] mx-auto px-6 py-8">
        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Historial de Citas</h2>
            <p className="text-text-sub dark:text-gray-400">Gestiona y revisa tus consultas pasadas y próximas.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/request-appointment" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-black rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-colors">
              <span className="material-symbols-outlined !text-[20px]">calendar_add_on</span>
              Nueva Cita
            </Link>
          </div>
        </section>

        <div className="mb-8 bg-card-light dark:bg-card-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400" placeholder="Buscar por médico, especialidad o ID..." type="text" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button className="px-4 py-2 bg-primary text-black font-bold text-sm rounded-lg whitespace-nowrap">Todas</button>
            <button className="px-4 py-2 bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 font-medium text-sm rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors whitespace-nowrap">Próximas</button>
            <button className="px-4 py-2 bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 font-medium text-sm rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors whitespace-nowrap">Completadas</button>
            <button className="px-4 py-2 bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 font-medium text-sm rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors whitespace-nowrap">Canceladas</button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {appointments.map((app, idx) => {
            const status = statusMap[app.status];
            return (
              <div 
                key={idx} 
                onClick={() => navigate(`/appointment-details/${app.id}`)}
                className={`bg-card-light dark:bg-card-dark rounded-xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md cursor-pointer transition-shadow group flex flex-col md:flex-row gap-4 md:items-center justify-between ${app.opacity ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`size-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${app.color === 'primary' ? 'bg-primary/10 text-primary' : app.color === 'status-amber' ? 'bg-status-amber/10 text-status-amber' : app.color === 'status-red' ? 'bg-status-red/10 text-status-red' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                    {app.initial}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                      <h3 className="font-bold text-lg text-text-main dark:text-white">{app.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{app.id}</span>
                    </div>
                    <p className="text-text-sub dark:text-gray-400 font-medium">{app.specialty}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-text-sub dark:text-gray-500 md:hidden">
                      <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                      {app.date} • {app.time}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pl-16 md:pl-0">
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-text-main dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg">
                    <span className="material-symbols-outlined !text-[18px] text-gray-500">schedule</span>
                    {app.date} • {app.time}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.textCol} border ${status.border}`}>
                    {status.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6">
          <p className="text-sm text-text-sub dark:text-gray-400">Mostrando <span className="font-bold text-text-main dark:text-white">1</span> a <span className="font-bold text-text-main dark:text-white">6</span> de <span className="font-bold text-text-main dark:text-white">12</span> resultados</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed">Anterior</button>
            <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Siguiente</button>
          </div>
        </div>
      </main>
    </div>
  );
}
