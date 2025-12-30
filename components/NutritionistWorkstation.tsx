
import React from 'react';

export default function NutritionistWorkstation() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Encabezado de Contexto del Paciente */}
        <div className="mb-8 bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-20 shadow-inner ring-4 ring-background-light dark:ring-background-dark" style={{ backgroundImage: "url('https://picsum.photos/seed/juan/200/200')" }}></div>
              <span className="absolute bottom-0 right-0 bg-primary size-5 rounded-full border-2 border-white dark:border-card-dark flex items-center justify-center"></span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Juan Pérez</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">EMPLEADO</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">badge</span> ID: 98765432</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>Masculino</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>34 Años</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Historial</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Editar Perfil</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: Entradas Antropométricas e Historial */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Evaluación Nutricional</h2>
                <p className="text-text-sub text-sm">Protocolo ISAK y Anamnesis Integral de Estilo de Vida.</p>
              </div>
              <button className="flex items-center gap-1.5 text-primary text-sm font-bold hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined !text-lg">history</span>
                Cargar Previas
              </button>
            </div>

            {/* Mediciones Básicas e ISAK */}
            <div className="space-y-6">
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">straighten</span>
                  Mediciones Básicas e ISAK
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <ISAKInput label="Masa Corporal (kg)" placeholder="0.0" />
                  <ISAKInput label="Estatura (cm)" placeholder="0.0" />
                  <ISAKInput label="Envergadura (cm)" placeholder="0.0" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ISAKInput label="Tríceps (mm)" placeholder="0.0" />
                  <ISAKInput label="Subescapular (mm)" placeholder="0.0" />
                  <ISAKInput label="Abdominal (mm)" placeholder="0.0" />
                  <ISAKInput label="Muslo (mm)" placeholder="0.0" />
                </div>
              </section>

              {/* 1. Hábitos de Consumo */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-status-amber">wine_bar</span>
                  Hábitos de Consumo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Alcohol</p>
                    <select className="form-select w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm">
                      <option>Nunca</option>
                      <option>Ocasional (Eventos)</option>
                      <option>Semanal (Fines de semana)</option>
                      <option>Diario</option>
                    </select>
                    <input type="text" placeholder="Bebida predominante..." className="form-input w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary text-xs h-10" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Tabaquismo</p>
                    <select className="form-select w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm">
                      <option>Nunca ha fumado</option>
                      <option>Ex-fumador</option>
                      <option>Fumador activo</option>
                    </select>
                    <input type="number" placeholder="Cigarrillos al día" className="form-input w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary text-xs h-10" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Cafeína</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Tazas/día" className="form-input w-20 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-center font-mono" />
                      <select className="form-select flex-1 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm">
                        <option>Café</option>
                        <option>Té</option>
                        <option>Energéticas</option>
                        <option>Refrescos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Sueño y Estrés */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-blue-500">bedtime</span>
                  Higiene del Sueño y Estrés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Horas Sueño</p>
                    <input type="number" placeholder="0.0" className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-center font-mono" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Calidad</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Reparador</option>
                      <option>Interrumpido</option>
                      <option>Insomnio</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Estrés</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Bajo</option>
                      <option>Medio</option>
                      <option>Alto</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                      <span className="text-xs font-bold text-text-sub uppercase">Pantallas antes de dormir</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. Hábitos Alimentarios Detallados */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">restaurant</span>
                  Hábitos Alimentarios Detallados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Comidas al día</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} comidas</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Lugar comida principal</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Comedor Empresa</option>
                      <option>Casa (Preparado)</option>
                      <option>Restaurante</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Consumo Ultraprocesados</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Rara vez</option>
                      <option>2-3 veces por semana</option>
                      <option>Diaria</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Alergias o Intolerancias</p>
                  <input type="text" placeholder="Ej: Lactosa, Gluten, Frutos Secos..." className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4" />
                </div>
              </section>

              {/* 4. Actividad Física y Sedentarismo */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">fitness_center</span>
                  Actividad Física y Sedentarismo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Horas sentado al día</p>
                    <div className="relative">
                      <input type="number" className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4 font-mono" placeholder="0" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-sub">horas</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Pasos diarios aproximados</p>
                    <input type="number" className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4 font-mono" placeholder="10,000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Frecuencia de ejercicio</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Sedentario</option>
                      <option>1-2 días/semana</option>
                      <option>3-5 días/semana</option>
                      <option>Atleta / Diario</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Tipo predominante</p>
                    <select className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm">
                      <option>Fuerza (Pesas/Calistenia)</option>
                      <option>Cardio (Running/Ciclismo)</option>
                      <option>Flexibilidad / Yoga</option>
                      <option>Deporte de Equipo</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 5. Antecedentes Médicos Relacionados */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-status-red">medical_information</span>
                  Antecedentes Médicos y Suplementación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Medicamentos actuales</p>
                    <textarea placeholder="Cualquiera que afecte peso o apetito..." className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4 text-sm" rows={2}></textarea>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Suplementación</p>
                    <textarea placeholder="Proteína, Creatina, Multivitamínicos..." className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4 text-sm" rows={2}></textarea>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Diagnósticos Previos</p>
                  <div className="flex flex-wrap gap-3">
                    {['Diabetes', 'Hipertensión', 'Hipotiroidismo', 'Dislipidemia', 'SOP'].map(d => (
                      <label key={d} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-primary/5 transition-colors">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                        <span className="text-xs font-bold">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* COLUMNA DERECHA: Análisis en Tiempo Real */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Análisis en Tiempo Real</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <span className="material-symbols-outlined text-red-500">warning</span>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">Alerta de Riesgo Metabólico</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">La circunferencia de cintura excede el umbral de la OMS para riesgo cardiovascular.</p>
                  </div>
                </div>
              </div>
              <AnalysisCard label="IMC / BMI" value="26.6" unit="kg/m²" status="Sobrepeso" statusColor="yellow" progress={65} target="18.5 - 24.9" icon="monitor_weight" />
              <AnalysisCard label="ICC (Cintura/Cadera)" value="0.95" unit="Ratio" status="Riesgo Alto" statusColor="red" progress={85} icon="accessibility" />
              <AnalysisCard label="Complexión Ósea" value="10.1" unit="Valor R" status="Complexión Media" statusColor="primary" progress={50} icon="skeleton" />
              
              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-xs font-bold text-primary-dark uppercase mb-2">Resumen de Riesgos AI</p>
                <p className="text-sm text-text-main dark:text-white leading-relaxed italic">"Paciente con sedentarismo laboral alto (8h sentado) y calidad de sueño baja. Riesgo metabólico aumentado por ICC > 0.94."</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full bg-card-light/90 dark:bg-card-dark/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-4 px-8 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-500">Último guardado: hace 2 minutos</span>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 transition-colors">Guardar Borrador</button>
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-black bg-primary hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span> Generar Diagnóstico
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ISAKInput({ label, placeholder }: { label: string, placeholder: string }) {
  return (
    <label className="group block text-left">
      <span className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-2 group-focus-within:text-primary transition-colors">
        {label}
      </span>
      <input 
        type="number" 
        step="0.1"
        placeholder={placeholder}
        className="block w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:border-primary focus:ring-primary focus:bg-white sm:text-lg h-14 font-mono transition-all text-center placeholder:text-gray-300" 
      />
    </label>
  );
}

function AnalysisCard({ label, value, unit, status, statusColor, progress, target, icon }: any) {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-4xl font-bold font-mono tracking-tighter">{value}</span>
        <span className="text-sm font-medium text-gray-500 mb-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2 text-left">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-300`}>{status}</span>
        {target && <span className="text-xs text-gray-400">Objetivo: {target}</span>}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
        <div className={`bg-${statusColor === 'primary' ? 'primary' : statusColor + '-400'} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
