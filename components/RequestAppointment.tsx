
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RequestAppointment() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Solicitud enviada correctamente');
    navigate('/');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main dark:text-white transition-colors duration-200">
      <main className="flex-grow w-full max-w-[800px] mx-auto px-6 py-12">
        <div className="mb-8">
          <Link className="inline-flex items-center text-sm text-text-sub hover:text-primary mb-4 transition-colors" to="/">
            <span className="material-symbols-outlined text-lg mr-1">arrow_back</span>
            Volver al Panel
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Solicitar Cita</h2>
          <p className="text-text-sub dark:text-gray-400 mt-2">Complete el formulario a continuación para programar una visita con nuestros especialistas.</p>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Nombre del Paciente</label>
              <div className="relative">
                <select className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                  <option>Mateo Rodríguez (Tú)</option>
                  <option>Agregar familiar...</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Nombre</label>
                <input className="w-full bg-gray-50 dark:bg-background-dark/50 border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-gray-400 focus:ring-primary focus:border-primary" readOnly type="text" value="Mateo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Apellido</label>
                <input className="w-full bg-gray-50 dark:bg-background-dark/50 border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-gray-400 focus:ring-primary focus:border-primary" readOnly type="text" value="Rodríguez" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Documento de Identidad / Cédula</label>
                <input className="w-full bg-gray-50 dark:bg-background-dark/50 border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-gray-400 focus:ring-primary focus:border-primary" readOnly type="text" value="1098234112" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Edad</label>
                <input className="w-full bg-gray-50 dark:bg-background-dark/50 border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-gray-400 focus:ring-primary focus:border-primary" readOnly type="number" value="28" />
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Especialidad</label>
              <div className="relative">
                <select required className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                  <option disabled selected value="">Seleccione especialidad...</option>
                  <option value="general">Medicina General</option>
                  <option value="nutrition">Nutrición y Dietética</option>
                  <option value="psychology">Psicología</option>
                  <option value="cardiology">Cardiología</option>
                  <option value="physiotherapy">Fisioterapia</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub">
                  <span className="material-symbols-outlined">medical_services</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Profesional de la Salud</label>
              <div className="relative">
                <select required className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                  <option disabled selected value="">Seleccione un médico...</option>
                  <option value="dr-sarah">Dra. Sarah Jimenez</option>
                  <option value="dr-luis">Dr. Luis Briceño</option>
                  <option value="dr-ana">Dra. Ana Torres</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Fecha Preferida</label>
                <div className="relative">
                  <input required className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent [color-scheme:light] dark:[color-scheme:dark]" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Horario Preferido</label>
                <div className="relative">
                  <select required className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                    <option disabled selected value="">Seleccione hora...</option>
                    <option>08:00 AM</option>
                    <option>08:30 AM</option>
                    <option>09:00 AM</option>
                    <option>09:30 AM</option>
                    <option>10:00 AM</option>
                    <option>10:30 AM</option>
                    <option>02:00 PM</option>
                    <option>02:30 PM</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Tipo de Visita</label>
              <div className="relative">
                <select required className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                  <option value="first-time">Consulta de Primera Vez</option>
                  <option value="follow-up">Seguimiento / Control</option>
                  <option value="results">Revisión de Resultados</option>
                  <option value="emergency">Urgencia</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Notas Adicionales (Opcional)</label>
              <textarea className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Describa brevemente sus síntomas o el motivo de la visita..." rows={3}></textarea>
            </div>

            <div className="pt-6">
              <button className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-lg" type="submit">
                <span className="material-symbols-outlined">send</span>
                Confirmar Solicitud de Cita
              </button>
              <p className="text-center text-xs text-text-sub mt-4">Al reservar, usted acepta nuestra política de cancelación de citas.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
