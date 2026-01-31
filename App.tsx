
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Logo } from './components/Logo';
import AIChatbot from './components/AIChatbot';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ResetPassword from './features/auth/ResetPassword';
import ForgotPassword from './features/auth/ForgotPassword';
import { supabase } from './services/supabase'; // Used in Header
import { useAuth } from './hooks/useAuth';
import { UserRole, VerificationStatus } from './types';
import { messaging, requestNotificationPermission } from './services/firebase';
import { onMessage } from 'firebase/messaging';

// Lazy loading components for better performance
const PatientDashboard = React.lazy(() => import('./components/PatientDashboard'));
const ClinicalDashboard = React.lazy(() => import('./components/ClinicalDashboard'));
const NutritionistDashboard = React.lazy(() => import('./components/NutritionistDashboard'));
const NutritionistEvaluation = React.lazy(() => import('./components/NutritionistEvaluation'));
const RequestAppointment = React.lazy(() => import('./components/RequestAppointment'));
const AppointmentHistory = React.lazy(() => import('./components/AppointmentHistory'));
const AppointmentDetails = React.lazy(() => import('./components/AppointmentDetails'));
const PatientDetails = React.lazy(() => import('./components/PatientDetails'));
const ProfessionalOnboarding = React.lazy(() => import('./components/ProfessionalOnboarding'));
const ProfessionalSidebar = React.lazy(() => import('./components/ProfessionalSidebar'));
const PatientDirectory = React.lazy(() => import('./components/PatientDirectory'));
const ProfessionalAppointmentHistory = React.lazy(() => import('./components/ProfessionalAppointmentHistory'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const AdminUserManagement = React.lazy(() => import('./components/AdminUserManagement'));
const AdminUserDetail = React.lazy(() => import('./components/AdminUserDetail'));
const PendingVerification = React.lazy(() => import('./components/PendingVerification'));
const Consultation = React.lazy(() => import('./components/Consultation'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
const BookAppointment = React.lazy(() => import('./components/BookAppointment'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando...</p>
    </div>
  </div>
);

import { Toaster } from 'react-hot-toast';


const Header: React.FC<{ role: UserRole; userName: string; avatarUrl: string; onLogout: () => void; needsOnboarding?: boolean }> = ({ role, userName, avatarUrl, onLogout, needsOnboarding }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const roleLabels: Record<UserRole, string> = {
    [UserRole.PATIENT]: 'Paciente',
    [UserRole.DOCTOR]: 'Médico',
    [UserRole.NUTRITIONIST]: 'Nutricionista',
    [UserRole.ADMIN]: 'Administrador'
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      fetchNotifications();

      // Subscribe to new notifications
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            // Notificación nativa movida al listener de FCM para evitar duplicados
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) console.error('Error fetching notifications:', error);
    else setNotifications(data || []);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  const getDashboardPath = () => {
    if (needsOnboarding) return '/onboarding';
    switch (role) {
      case UserRole.DOCTOR: return '/clinical';
      case UserRole.NUTRITIONIST: return '/nutrition';
      case UserRole.ADMIN: return '/admin';
      default: return '/';
    }
  };


  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-light dark:bg-surface-dark backdrop-blur-md border-b border-gray-100 dark:border-border-dark shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={getDashboardPath()} className="flex items-center -ml-2">
            <Logo className="h-16 w-auto" showText={false} />
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
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-text-main dark:text-white"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 size-4 bg-status-red text-[10px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-card-dark animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Notificaciones</h4>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.leida ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`text-sm ${!n.leida ? 'font-bold' : 'font-medium'} text-slate-900 dark:text-white mb-1`}>{n.titulo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.mensaje}</p>
                        <span className="text-[10px] text-slate-300 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">notifications_off</span>
                      <p className="text-xs text-slate-400 italic">No tienes notificaciones</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-center">
                  <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Ver todas</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">{userName || 'Usuario'}</p>
              <button onClick={onLogout} className="text-[10px] text-status-red font-bold hover:underline">Cerrar Sesión</button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                <span className="material-symbols-outlined !text-[20px]">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <Link to="/profile">
                <div
                  className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-primary/20 bg-cover bg-center cursor-pointer hover:ring-primary transition-all flex items-center justify-center relative group"
                  style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'none' }}
                >
                  {!avatarUrl && <span className="material-symbols-outlined text-gray-400">person</span>}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


function AppContent() {
  const {
    role,
    userName,
    avatarUrl,
    isLoggedIn,
    needsOnboarding,
    isVerified,
    loading,
    setNeedsOnboarding,
    setIsVerified,
    handleLogin,
    handleLogout
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect Logic handled in hook mostly, but strict "guards" can remain here for rendering
  const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  if (loading) return <PageLoader />;

  if (!isLoggedIn && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir usuarios autenticados fuera de login/register
  if (isLoggedIn && (location.pathname === '/login' || location.pathname === '/register')) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (!isVerified && (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST)) return <Navigate to="/pending-verification" replace />;
    switch (role) {
      case UserRole.DOCTOR: return <Navigate to="/clinical" replace />;
      case UserRole.NUTRITIONIST: return <Navigate to="/nutrition" replace />;
      case UserRole.ADMIN: return <Navigate to="/admin" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {isLoggedIn && role && <Header role={role} userName={userName} avatarUrl={avatarUrl} onLogout={handleLogout} needsOnboarding={needsOnboarding} />}
      <div className="flex flex-1 relative">
        {isLoggedIn && (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) && !needsOnboarding && isVerified && (
          <Suspense fallback={<div className="w-64 bg-surface-light dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 hidden md:block" />}>
            <ProfessionalSidebar role={role} />
          </Suspense>
        )}
        <main className="flex-grow overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/" element={
                role === UserRole.PATIENT ? <PatientDashboard userName={userName} /> :
                  (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) && !isVerified ? <Navigate to="/pending-verification" replace /> :
                    role === UserRole.DOCTOR ? <Navigate to="/clinical" replace /> :
                      role === UserRole.NUTRITIONIST ? <Navigate to="/nutrition" replace /> :
                        role === UserRole.ADMIN ? <Navigate to="/admin" replace /> :
                          <Navigate to="/login" replace />
              } />

              <Route path="/admin" element={role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/login" />} />
              <Route path="/admin/users" element={role === UserRole.ADMIN ? <AdminUserManagement /> : <Navigate to="/login" />} />
              <Route path="/admin/user/:id" element={role === UserRole.ADMIN ? <AdminUserDetail /> : <Navigate to="/login" />} />

              <Route path="/clinical" element={role === UserRole.DOCTOR ? <ClinicalDashboard /> : <Navigate to="/login" />} />
              <Route path="/book-appointment" element={role === UserRole.DOCTOR ? <BookAppointment /> : <Navigate to="/login" />} />
              <Route path="/consultation/:id" element={role === UserRole.DOCTOR ? <Consultation /> : <Navigate to="/login" />} />
              <Route path="/nutrition" element={role === UserRole.NUTRITIONIST ? <NutritionistDashboard /> : <Navigate to="/login" />} />
              <Route path="/patient-details/:id" element={isLoggedIn ? <PatientDetails /> : <Navigate to="/login" />} />
              <Route path="/patients" element={(role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) ? <PatientDirectory /> : <Navigate to="/login" />} />
              <Route path="/appointment-history-pro" element={(role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) ? <ProfessionalAppointmentHistory /> : <Navigate to="/login" />} />
              <Route path="/nutrition/evaluate/:id/:evaluationId?" element={role === UserRole.NUTRITIONIST ? <NutritionistEvaluation /> : <Navigate to="/login" />} />
              <Route path="/request-appointment" element={role === UserRole.PATIENT ? <RequestAppointment /> : <Navigate to="/login" />} />
              <Route path="/appointment-history" element={role === UserRole.PATIENT ? <AppointmentHistory /> : <Navigate to="/login" />} />
              <Route path="/appointment-details/:id" element={role === UserRole.PATIENT ? <AppointmentDetails /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isLoggedIn ? <UserProfile /> : <Navigate to="/login" />} />
              <Route path="/onboarding" element={isLoggedIn && (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) ? <ProfessionalOnboarding onOnboardingComplete={() => { setNeedsOnboarding(false); setIsVerified(false); navigate('/pending-verification'); }} /> : <Navigate to="/login" />} />
              <Route path="/pending-verification" element={isLoggedIn && (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) && !isVerified ? <PendingVerification /> : <Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {isLoggedIn && <AIChatbot />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
          },
          className: 'dark:bg-card-dark dark:text-white dark:border dark:border-gray-800'
        }}
      />
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
