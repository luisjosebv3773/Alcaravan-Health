
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PatientDashboard from './components/PatientDashboard';
import ClinicalDashboard from './components/ClinicalDashboard';
import NutritionistWorkstation from './components/NutritionistWorkstation';
import AIChatbot from './components/AIChatbot';
import { UserRole } from './types';

const Header: React.FC<{ role: UserRole; setRole: (r: UserRole) => void }> = ({ role, setRole }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-card-light dark:bg-card-dark border-b border-[#f0f4f2] dark:border-gray-800 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined !text-[32px]">health_and_safety</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Alcaraván Health</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={`text-sm font-semibold transition-colors ${role === UserRole.PATIENT ? 'border-b-2 border-primary text-text-main dark:text-white' : 'text-text-sub hover:text-primary dark:text-gray-400'}`}>Patient</Link>
          <Link to="/clinical" className={`text-sm font-semibold transition-colors ${role === UserRole.DOCTOR ? 'border-b-2 border-primary text-text-main dark:text-white' : 'text-text-sub hover:text-primary dark:text-gray-400'}`}>Clinical</Link>
          <Link to="/nutrition" className={`text-sm font-semibold transition-colors ${role === UserRole.NUTRITIONIST ? 'border-b-2 border-primary text-text-main dark:text-white' : 'text-text-sub hover:text-primary dark:text-gray-400'}`}>Nutrition</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-text-main dark:text-white">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-status-red rounded-full ring-2 ring-white dark:ring-card-dark"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">Mateo R.</p>
              <p className="text-xs text-text-sub dark:text-gray-400">ID: #8839</p>
            </div>
            <div className="size-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-primary/20 bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/seed/mateo/200/200')" }}></div>
          </div>
        </div>
      </div>
    </header>
  );
};

function AppContent() {
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.includes('/clinical')) setRole(UserRole.DOCTOR);
    else if (location.pathname.includes('/nutrition')) setRole(UserRole.NUTRITIONIST);
    else setRole(UserRole.PATIENT);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header role={role} setRole={setRole} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<PatientDashboard />} />
          <Route path="/clinical" element={<ClinicalDashboard />} />
          <Route path="/nutrition" element={<NutritionistWorkstation />} />
        </Routes>
      </main>
      <AIChatbot />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
