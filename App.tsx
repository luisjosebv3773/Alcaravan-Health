
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import PatientDashboard from './components/PatientDashboard';
import ClinicalDashboard from './components/ClinicalDashboard';
import NutritionistWorkstation from './components/NutritionistWorkstation';
import RequestAppointment from './components/RequestAppointment';
import AppointmentHistory from './components/AppointmentHistory';
import AppointmentDetails from './components/AppointmentDetails';
import AIChatbot from './components/AIChatbot';
import Login from './components/Login';
import { UserRole } from './types';

const Header: React.FC<{ role: UserRole; onLogout: () => void }> = ({ role, onLogout }) => {
  const roleLabels: Record<UserRole, string> = {
    [UserRole.PATIENT]: 'Paciente',
    [UserRole.DOCTOR]: 'Médico',
    [UserRole.NUTRITIONIST]: 'Nutricionista'
  };

  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-[#f0f4f2] dark:border-gray-800 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-4">
            <div className="size-8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined !text-[32px]">health_and_safety</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Alcaraván Health</h1>
          </Link>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary text-[10px] font-bold uppercase">
            {roleLabels[role]}
          </span>
        </div>

        {role === UserRole.PATIENT && (
          <nav className="hidden md:flex items-center gap-8">
            <Link className={`text-sm py-1 px-1 transition-colors ${location.pathname === '/' ? 'font-semibold border-b-2 border-primary text-text-main dark:text-white' : 'font-medium text-text-sub hover:text-primary dark:text-gray-400 dark:hover:text-primary'}`} to="/">Dashboard</Link>
            <a className="text-sm font-medium text-text-sub hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors px-1 py-1" href="#">Resultados</a>
            <Link className={`text-sm py-1 px-1 transition-colors ${location.pathname.startsWith('/appointment-history') || location.pathname.startsWith('/appointment-details') ? 'font-semibold border-b-2 border-primary text-text-main dark:text-white' : 'font-medium text-text-sub hover:text-primary dark:text-gray-400 dark:hover:text-primary'}`} to="/appointment-history">Citas</Link>
            <a className="text-sm font-medium text-text-sub hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors px-1 py-1" href="#">Educación</a>
          </nav>
        )}
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-text-main dark:text-white">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-status-red rounded-full ring-2 ring-white dark:ring-card-dark"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">Mateo R.</p>
              <button onClick={onLogout} className="text-[10px] text-status-red font-bold hover:underline">Cerrar Sesión</button>
            </div>
            <div className="size-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-primary/20 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBmUb2IUQ1CIHg-c9s8cD7KBCPl50QAMNl8sHpKOTElyDzm8Q6Hb3tSqwx2PJQ3eiW--MwOy11jWlzEAdlJUf4oRmeF_kL3579UToFFc3PcI_Pa2Tn-1RNhm32MpUpHldkzoM42hqXpAK6U9aIvk1iagZiIaXyFAO9-6YBXnD3NaQWbljCLE57MfqhOhIPjKQDYXFkw6SSWverUG1RwLG02-xjzgpcikR-Oq-cORlRS1JiIfSjwKfSUe9f9UrsO-anFM3O1W5rVv5Y')" }}></div>
          </div>
        </div>
      </div>
    </header>
  );
};

function AppContent() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
    
    if (selectedRole === UserRole.PATIENT) navigate('/');
    else if (selectedRole === UserRole.DOCTOR) navigate('/clinical');
    else if (selectedRole === UserRole.NUTRITIONIST) navigate('/nutrition');
  };

  const handleLogout = () => {
    setRole(null);
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (!isLoggedIn && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isLoggedIn && role && <Header role={role} onLogout={handleLogout} />}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={role === UserRole.PATIENT ? <PatientDashboard /> : <Navigate to="/login" />} />
          <Route path="/clinical" element={role === UserRole.DOCTOR ? <ClinicalDashboard /> : <Navigate to="/login" />} />
          <Route path="/nutrition" element={role === UserRole.NUTRITIONIST ? <NutritionistWorkstation /> : <Navigate to="/login" />} />
          <Route path="/request-appointment" element={role === UserRole.PATIENT ? <RequestAppointment /> : <Navigate to="/login" />} />
          <Route path="/appointment-history" element={role === UserRole.PATIENT ? <AppointmentHistory /> : <Navigate to="/login" />} />
          <Route path="/appointment-details/:id" element={role === UserRole.PATIENT ? <AppointmentDetails /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      {isLoggedIn && <AIChatbot />}
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
