
import React from 'react';

export default function NutritionistWorkstation() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="mb-8 bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-20 shadow-inner ring-4 ring-background-light dark:ring-background-dark" style={{ backgroundImage: "url('https://picsum.photos/seed/juan/200/200')" }}></div>
              <span className="absolute bottom-0 right-0 bg-primary size-5 rounded-full border-2 border-white dark:border-card-dark flex items-center justify-center"></span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Juan Pérez</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">EMPLOYEE</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">badge</span> ID: 98765432</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>Male</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>34 Years</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">History</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Edit Profile</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <span className="bg-primary/20 text-emerald-800 dark:text-emerald-400 p-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[20px]">straighten</span>
                </span> Anthropometric Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AssessmentInput label="Weight" unit="kg" value="84.5" />
                <AssessmentInput label="Height" unit="cm" value="178" />
                <AssessmentInput label="Wrist Circ." unit="cm" value="17.5" />
                <AssessmentInput label="Waist Circ." unit="cm" value="98.0" />
                <AssessmentInput label="Hip Circ." unit="cm" value="103.0" />
                <AssessmentInput label="Neck Circ." unit="cm" optional />
              </div>
            </section>

            <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 p-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </span> Lifestyle Anamnesis
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Physical Activity Level</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ActivityOption icon="weekend" label="Sedentary" />
                    <ActivityOption icon="directions_walk" label="Moderate" active />
                    <ActivityOption icon="fitness_center" label="Intense" />
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Toxic Habits</p>
                    <div className="flex flex-col gap-2">
                      <HabitToggle icon="smoking_rooms" label="Tobacco" />
                      <HabitToggle icon="wine_bar" label="Alcohol" active />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Diet Type</p>
                    <select className="form-select block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 focus:border-primary focus:ring-primary h-[50px] transition-all">
                      <option>Omnivore (Unrestricted)</option>
                      <option>Vegetarian</option>
                      <option>Vegan</option>
                      <option>Ketogenic</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Real-time Analysis</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <span className="material-symbols-outlined text-red-500">warning</span>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">Metabolic Risk Alert</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">Waist circumference exceeds WHO threshold for cardiovascular risk.</p>
                  </div>
                </div>
              </div>
              <AnalysisCard label="IMC / BMI" value="26.6" unit="kg/m²" status="Overweight" statusColor="yellow" progress={65} target="18.5 - 24.9" icon="monitor_weight" />
              <AnalysisCard label="ICC (Waist/Hip)" value="0.95" unit="Ratio" status="High Risk" statusColor="red" progress={85} icon="accessibility" />
              <AnalysisCard label="Bone Complexion" value="10.1" unit="R value" status="Medium Frame" statusColor="primary" progress={50} icon="skeleton" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full bg-card-light/90 dark:bg-card-dark/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-4 px-8 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-500">Last saved: 2 minutes ago</span>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 transition-colors">Save Draft</button>
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-black bg-primary hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span> Generate Diagnosis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentInput({ label, unit, value, optional }: any) {
  return (
    <label className={`group block ${optional ? 'opacity-60' : ''}`}>
      <span className="block text-sm font-medium mb-1.5">{label} {optional && <span className="text-xs font-normal text-gray-400">(Optional)</span>}</span>
      <div className="relative">
        <input defaultValue={value} type="number" className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:border-primary focus:ring-primary sm:text-sm h-12 pr-10 font-mono transition-all group-hover:bg-white" />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-400 font-medium sm:text-sm">{unit}</span>
        </div>
      </div>
    </label>
  );
}

function ActivityOption({ icon, label, active }: any) {
  return (
    <div className={`p-4 rounded-xl border transition-all text-center cursor-pointer ${active ? 'bg-primary/10 border-primary text-emerald-900 dark:text-emerald-100 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100'}`}>
      <span className={`material-symbols-outlined block mb-1 text-2xl ${active ? 'text-primary' : 'text-gray-400'}`}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function HabitToggle({ icon, label, active }: any) {
  return (
    <div className="inline-flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-gray-400">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <input type="checkbox" defaultChecked={active} className="form-checkbox rounded text-primary border-gray-300 focus:ring-primary h-5 w-5" />
    </div>
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
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-300`}>{status}</span>
        {target && <span className="text-xs text-gray-400">Target: {target}</span>}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
        <div className={`bg-${statusColor === 'primary' ? 'primary' : statusColor + '-400'} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
