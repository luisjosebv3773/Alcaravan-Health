
import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function AppointmentDetails() {
  const { id } = useParams();

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main dark:text-white overflow-x-hidden transition-colors duration-200">
      <main className="flex-grow w-full max-w-[1000px] mx-auto px-6 py-8">
        <div className="mb-8">
          <Link className="inline-flex items-center gap-2 text-text-sub hover:text-primary transition-colors mb-4 text-sm font-medium" to="/appointment-history">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver a Citas
          </Link>
          <h2 className="text-3xl font-black tracking-tight">Detalles de la Cita</h2>
        </div>
        
        <div className="mb-10">
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 bg-primary/10 border-b border-primary/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-sm font-bold text-primary-dark dark:text-primary uppercase tracking-wider">Confirmada • Próxima</span>
              </div>
              <span className="text-sm font-mono text-text-sub">{id || '#APT-2024-882'}</span>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-700 min-w-[140px]">
                  <span className="text-sm font-bold text-text-sub uppercase mb-1">Oct</span>
                  <span className="text-5xl font-black text-text-main dark:text-white mb-1">24</span>
                  <span className="text-lg font-medium text-text-sub">Jueves</span>
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-3"></div>
                  <span className="text-xl font-bold text-primary-dark dark:text-primary">10:00 AM</span>
                </div>
                
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Consulta Nutricional</h3>
                    <p className="text-text-sub dark:text-gray-400">Chequeo trimestral y ajuste del plan de dieta.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-200 shrink-0 bg-cover" style={{ backgroundImage: "url('https://picsum.photos/seed/doc-sarah/100/100')" }}></div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Especialista</p>
                        <p className="font-bold text-lg">Dra. Sarah Jimenez</p>
                        <p className="text-sm text-text-sub">Nutricionista Clínica</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Ubicación</p>
                        <p className="font-bold text-base">Centro Médico Alcaraván</p>
                        <p className="text-sm text-text-sub">Edificio B, Consultorio 302</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">videocam</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Tipo de Visita</p>
                        <p className="font-bold text-base">Presencial</p>
                        <p className="text-sm text-text-sub">Enlace de videollamada disponible si es necesario</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">notes</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Notas del Paciente</p>
                        <p className="text-sm text-text-sub italic">"Discutir el aumento de la ingesta de proteínas para la rutina de gimnasio."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
                <button className="px-5 py-2.5 rounded-lg border border-red-200 text-status-red hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Cancelar Cita
                </button>
                <button className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-main dark:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">edit_calendar</span>
                  Reprogramar / Editar
                </button>
                <button className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                  Agregar al Calendario
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
