
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface Appointment {
  id: string;
  doctor: {
    full_name: string;
    specialty: string;
  };
  appointment_date: string;
  appointment_time: string;
  status: string;
}

export default function AppointmentHistory() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled', 'no-show'
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchAppointments();
  }, [filter, page, search]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Use !inner if searching to allow filtering on the related table
    const selectQuery = search
      ? `id, status, appointment_date, appointment_time, doctor:doctor_id!inner(full_name, specialty)`
      : `id, status, appointment_date, appointment_time, doctor:doctor_id(full_name, specialty)`;

    let query = supabase
      .from('appointments')
      .select(selectQuery, { count: 'exact' })
      .eq('patient_id', session.user.id);

    // Apply Filters
    const today = new Date().toISOString().split('T')[0];
    if (filter === 'upcoming') {
      query = query.gte('appointment_date', today).in('status', ['pending', 'confirmed']);
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed');
    } else if (filter === 'cancelled') {
      query = query.eq('status', 'cancelled');
    } else if (filter === 'no-show') {
      query = query.eq('status', 'no-show');
    }

    // Apply Search
    if (search) {
      // Search on the related 'doctor' table columns
      query = query.or(`full_name.ilike.%${search}%,specialty.ilike.%${search}%`, { foreignTable: 'doctor' });
    }

    // Apply Sort
    query = query.order('appointment_date', { ascending: filter === 'upcoming' });

    // Apply Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      const safeData = (data || []).map((item: any) => ({
        ...item,
        doctor: Array.isArray(item.doctor) ? item.doctor[0] : item.doctor
      }));
      setAppointments(safeData);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const statusMap: Record<string, { text: string, bg: string, textCol: string, border: string }> = {
    'completed': { text: 'Completada', bg: 'bg-green-100 dark:bg-green-900/30', textCol: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    'pending': { text: 'Pendiente', bg: 'bg-blue-100 dark:bg-blue-900/30', textCol: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    'confirmed': { text: 'Confirmada', bg: 'bg-primary/20', textCol: 'text-primary-dark dark:text-primary', border: 'border-primary/30' },
    'cancelled': { text: 'Cancelada', bg: 'bg-red-100 dark:bg-red-900/30', textCol: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
    'no-show': { text: 'No Asistió', bg: 'bg-gray-100 dark:bg-gray-800', textCol: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
              placeholder="Buscar por médico o especialidad..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button onClick={() => { setFilter('all'); setPage(1); }} className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-primary text-black' : 'bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400'}`}>Todas</button>
            <button onClick={() => { setFilter('upcoming'); setPage(1); }} className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${filter === 'upcoming' ? 'bg-primary text-black' : 'bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400'}`}>Próximas</button>
            <button onClick={() => { setFilter('completed'); setPage(1); }} className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-primary text-black' : 'bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400'}`}>Completadas</button>
            <button onClick={() => { setFilter('cancelled'); setPage(1); }} className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${filter === 'cancelled' ? 'bg-primary text-black' : 'bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400'}`}>Canceladas</button>
            <button onClick={() => { setFilter('no-show'); setPage(1); }} className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${filter === 'no-show' ? 'bg-primary text-black' : 'bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400'}`}>No Asistió</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">event_busy</span>
                <p className="text-text-sub font-medium">No se encontraron citas en esta categoría.</p>
              </div>
            ) : (
              appointments.map((app) => {
                const statusInfo = statusMap[app.status] || { text: app.status, bg: 'bg-gray-100', textCol: 'text-gray-600', border: 'border-gray-200' };
                // Generate initial from doctor name
                const initial = app.doctor?.full_name ? app.doctor.full_name.charAt(0).toUpperCase() : '?';

                return (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/appointment-details/${app.id}`)}
                    className={`bg-card-light dark:bg-card-dark rounded-xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md cursor-pointer transition-shadow group flex flex-col md:flex-row gap-4 md:items-center justify-between ${app.status === 'cancelled' ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`size-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 bg-primary/10 text-primary`}>
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                          <h3 className="font-bold text-lg text-text-main dark:text-white">{app.doctor?.full_name || 'Nombre no disponible'}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 font-mono">
                            {app.id.substring(0, 8)}...
                          </span>
                        </div>
                        <p className="text-text-sub dark:text-gray-400 font-medium capitalize">{app.doctor?.specialty || 'General'}</p>
                        <div className="flex items-center gap-1 mt-2 text-sm text-text-sub dark:text-gray-500 md:hidden">
                          <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                          {new Date(app.appointment_date + 'T00:00:00').toLocaleDateString()} • {app.appointment_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pl-16 md:pl-0">
                      <div className="hidden md:flex items-center gap-1.5 text-sm text-text-main dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined !text-[18px] text-gray-500">schedule</span>
                        {new Date(app.appointment_date + 'T00:00:00').toLocaleDateString()} • {app.appointment_time}
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.textCol} border ${statusInfo.border}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6">
          <p className="text-sm text-text-sub dark:text-gray-400">
            Mostrando <span className="font-bold text-text-main dark:text-white">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="font-bold text-text-main dark:text-white">{Math.min(page * PAGE_SIZE, totalCount)}</span> de <span className="font-bold text-text-main dark:text-white">{totalCount}</span> resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
