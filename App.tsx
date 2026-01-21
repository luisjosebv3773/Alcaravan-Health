
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import PatientDashboard from './components/PatientDashboard';
import ClinicalDashboard from './components/ClinicalDashboard';
import NutritionistDashboard from './components/NutritionistDashboard';
import NutritionistEvaluation from './components/NutritionistEvaluation';
import RequestAppointment from './components/RequestAppointment';
import AppointmentHistory from './components/AppointmentHistory';
import AppointmentDetails from './components/AppointmentDetails';
import PatientDetails from './components/PatientDetails';
import ProfessionalOnboarding from './components/ProfessionalOnboarding';


import AIChatbot from './components/AIChatbot';
import Login from './components/Login';
import Register from './components/Register';
import Consultation from './components/Consultation';
import UserProfile from './components/UserProfile';
import BookAppointment from './components/BookAppointment';
import { supabase } from './services/supabase';
import { UserRole } from './types';
import { messaging, requestNotificationPermission } from './services/firebase';
import { onMessage } from 'firebase/messaging';


const Header: React.FC<{ role: UserRole; userName: string; avatarUrl: string; onLogout: () => void; needsOnboarding?: boolean }> = ({ role, userName, avatarUrl, onLogout, needsOnboarding }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const roleLabels: Record<UserRole, string> = {
    [UserRole.PATIENT]: 'Paciente',
    [UserRole.DOCTOR]: 'Médico',
    [UserRole.NUTRITIONIST]: 'Nutricionista'
  };

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
      default: return '/';
    }
  };


  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-[#f0f4f2] dark:border-gray-800 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={getDashboardPath()} className="flex items-center gap-4">

            <div className="size-8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined !text-[32px]">health_and_safety</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Alcaraván Health</h1>
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
            <Link to="/profile">
              <div
                className="size-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-primary/20 bg-cover bg-center cursor-pointer hover:ring-primary transition-all flex items-center justify-center"
                style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'none' }}
              >
                {!avatarUrl && <span className="material-symbols-outlined text-gray-400">person</span>}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};


function AppContent() {

  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Fetch role if session exists
        supabase
          .from('profiles')
          .select('full_name, role, avatar_url, mpps_registry')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.role) {
              let appRole: UserRole;
              switch (profile.role) {
                case 'doctor': appRole = UserRole.DOCTOR; break;
                case 'nutri':
                case 'nutritionist': appRole = UserRole.NUTRITIONIST; break;
                case 'paciente':
                default: appRole = UserRole.PATIENT; break;
              }
              setRole(appRole);
              if (profile.full_name) setUserName(profile.full_name);
              if (profile.avatar_url) setAvatarUrl(profile.avatar_url);

              // Check onboarding status for professionals
              const isOnboardingCreate = (appRole === UserRole.DOCTOR || appRole === UserRole.NUTRITIONIST) && !profile.mpps_registry;
              setNeedsOnboarding(isOnboardingCreate);

              setIsLoggedIn(true);

              // Redirect if needed and not already there
              if (isOnboardingCreate && location.pathname !== '/onboarding') {
                navigate('/onboarding');
              }

              // Request notification permission and save token
              requestNotificationPermission().then(token => {
                if (token) {
                  console.log('FCM Token generated successfully:', token);
                  supabase
                    .from('profiles')
                    .update({ fcm_token: token })
                    .eq('id', session.user.id)
                    .then(({ error, data }) => {
                      if (error) console.error('Error saving FCM token to DB:', error);
                      else console.log('FCM Token saved to DB successfully');
                    });
                } else {
                  console.warn('FCM Token could not be generated (permission denied or error)');
                }
              });

              // Handle FCM messages in foreground
              if (messaging) {
                onMessage(messaging, (payload) => {
                  console.log('FCM Message received in foreground:', payload);

                  // Show system notification even in foreground
                  if (Notification.permission === 'granted') {
                    const notification = new Notification(payload.notification?.title || 'Nueva Notificación', {
                      body: payload.notification?.body,
                      icon: '/pwa-192x192.png',
                      tag: payload.messageId // Avoid spam
                    });

                    notification.onclick = () => {
                      window.focus();
                      notification.close();
                    };
                  }
                });
              }
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false);
        setRole(null);
        setUserName('');
        setAvatarUrl('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (selectedRole: UserRole, name?: string, avatarUrl?: string, isOnboardingRequired?: boolean) => {
    setRole(selectedRole);
    if (name) setUserName(name);
    if (avatarUrl) setAvatarUrl(avatarUrl);
    setNeedsOnboarding(!!isOnboardingRequired);
    setIsLoggedIn(true);

    // Request notification permission and save token after manual login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        requestNotificationPermission().then(token => {
          if (token) {
            supabase
              .from('profiles')
              .update({ fcm_token: token })
              .eq('id', session.user.id)
              .then(({ error }) => {
                if (error) console.error('Error saving FCM token:', error);
              });
          }
        });
      }
    });

    if (isOnboardingRequired) {
      navigate('/onboarding');
      return;
    }

    if (selectedRole === UserRole.PATIENT) navigate('/');
    else if (selectedRole === UserRole.DOCTOR) navigate('/clinical');
    else if (selectedRole === UserRole.NUTRITIONIST) navigate('/nutrition');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setUserName('');
    setAvatarUrl('');
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (!isLoggedIn && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isLoggedIn && role && <Header role={role} userName={userName} avatarUrl={avatarUrl} onLogout={handleLogout} needsOnboarding={needsOnboarding} />}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            role === UserRole.PATIENT ? <PatientDashboard userName={userName} /> :
              role === UserRole.DOCTOR ? <Navigate to="/clinical" replace /> :
                role === UserRole.NUTRITIONIST ? <Navigate to="/nutrition" replace /> :
                  <Navigate to="/login" replace />
          } />

          <Route path="/clinical" element={role === UserRole.DOCTOR ? <ClinicalDashboard /> : <Navigate to="/login" />} />
          <Route path="/book-appointment" element={role === UserRole.DOCTOR ? <BookAppointment /> : <Navigate to="/login" />} />
          <Route path="/consultation/:id" element={role === UserRole.DOCTOR ? <Consultation /> : <Navigate to="/login" />} />
          <Route path="/nutrition" element={role === UserRole.NUTRITIONIST ? <NutritionistDashboard /> : <Navigate to="/login" />} />
          <Route path="/nutrition/patient-details/:id" element={role === UserRole.NUTRITIONIST ? <PatientDetails /> : <Navigate to="/login" />} />
          <Route path="/nutrition/evaluate/:id/:evaluationId?" element={role === UserRole.NUTRITIONIST ? <NutritionistEvaluation /> : <Navigate to="/login" />} />
          <Route path="/request-appointment" element={role === UserRole.PATIENT ? <RequestAppointment /> : <Navigate to="/login" />} />
          <Route path="/appointment-history" element={role === UserRole.PATIENT ? <AppointmentHistory /> : <Navigate to="/login" />} />
          <Route path="/appointment-details/:id" element={role === UserRole.PATIENT ? <AppointmentDetails /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isLoggedIn ? <UserProfile /> : <Navigate to="/login" />} />
          <Route path="/onboarding" element={isLoggedIn && (role === UserRole.DOCTOR || role === UserRole.NUTRITIONIST) ? <ProfessionalOnboarding onOnboardingComplete={() => { setNeedsOnboarding(false); if (role === UserRole.DOCTOR) navigate('/clinical'); else if (role === UserRole.NUTRITIONIST) navigate('/nutrition'); }} /> : <Navigate to="/login" />} />
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
