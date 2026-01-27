
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';

// --- TRANSLATION MAPS ---
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  cancelled: 'Cancelado',
  completed: 'Completado',
  'no-show': 'No Asistió'
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  'first-time': 'Primera Vez',
  'follow-up': 'Control',
  'emergency': 'Urgencia',
  'check-up': 'Chequeo',
  'consultation': 'Consulta General'
};

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual'
};

const t = (key: string, map: Record<string, string>) => map[key] || key;

// Helper to get local YYYY-MM-DD
const getLocalISODate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ClinicalDashboard() {
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState('Dr. Alcaraván');
  const [stats, setStats] = useState({ total: 0, pending: 0, urgent: 0 });

  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const [agendaAppointments, setAgendaAppointments] = useState<any[]>([]);
  // Use strictly local date to avoid timezone offset issues (UTC rollover)
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);

  const [approvingAppt, setApprovingAppt] = useState<any | null>(null);
  const [meetLink, setMeetLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ show: boolean, id: string | null }>({ show: false, id: null });

  // CONSTANTS FOR AGENDA
  const START_HOUR = 8;
  const END_HOUR = 17; // 5 PM
  const PIXELS_PER_MINUTE = 1.5; // 30 min = 45px height
  const SLOT_HEIGHT = 45; // 30 min slot height

  // 1. Fetch Basic Info & Stats
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      if (profile?.full_name) setDoctorName(profile.full_name);

      try {
        const { count: total } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', session.user.id);
        const { count: pending } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', session.user.id).eq('status', 'pending');
        const { count: urgent } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', session.user.id).eq('visit_type', 'emergency');
        setStats({ total: total || 0, pending: pending || 0, urgent: urgent || 0 });
      } catch (e) { console.error(e); }

      fetchPendingRequests(session.user.id);
    };
    fetchProfileAndStats();
  }, []);

  // 2. Fetch Agenda
  const fetchAgenda = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: agenda } = await supabase
      .from('appointments')
      .select(`
                id, appointment_time, appointment_date, visit_type, modality, status, notes, patient_id,
                patient:patient_id ( full_name )
            `)
      .eq('doctor_id', session.user.id)
      .eq('status', 'confirmed')
      .eq('appointment_date', selectedDate)
      .order('appointment_time', { ascending: true });

    if (agenda) setAgendaAppointments(agenda);
  };

  useEffect(() => {
    fetchAgenda();
  }, [selectedDate]);

  // 3. Live Current Time Line
  useEffect(() => {
    const updateTimeLine = () => {
      const now = new Date();
      const todayString = getLocalISODate();

      if (selectedDate !== todayString) {
        setCurrentTimePos(null);
        return;
      }

      const hours = now.getHours();
      const minutes = now.getMinutes();

      if (hours < START_HOUR || hours >= END_HOUR) {
        setCurrentTimePos(null);
        return;
      }

      const totalMinutesFromStart = ((hours - START_HOUR) * 60) + minutes;
      const top = totalMinutesFromStart * PIXELS_PER_MINUTE;

      setCurrentTimePos(top);
    };

    updateTimeLine();
    const interval = setInterval(updateTimeLine, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchPendingRequests = async (userId: string) => {
    const { data: requests } = await supabase
      .from('appointments')
      .select(`
                id, appointment_date, appointment_time, visit_type, modality, notes, patient_id,
                patient:patient_id ( full_name )
            `)
      .eq('doctor_id', userId)
      .eq('status', 'pending')
      .order('appointment_date', { ascending: true });

    if (requests) setPendingAppointments(requests);
    setLoadingPending(false);
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate + 'T00:00:00'); // Ensure parsed as local date start
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleRejectClick = (id: string) => {
    setRejectDialog({ show: true, id });
  };

  const confirmReject = async () => {
    if (!rejectDialog.id) return;

    // Find appointment details before updating
    const appt = pendingAppointments.find(a => a.id === rejectDialog.id);

    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', rejectDialog.id);
    setRejectDialog({ show: false, id: null });

    if (!error) {
      // Notify Patient
      if (appt) {
        await supabase.from('notificaciones').insert({
          user_id: appt.patient_id,
          titulo: 'Solicitud de Cita Rechazada',
          mensaje: `Lo sentimos, su solicitud de cita para el ${appt.appointment_date} ha sido rechazada por el profesional.`,
          tipo: 'cita'
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchPendingRequests(session.user.id);
    } else alert('Error: ' + error.message);
  };

  const initApprove = (appt: any) => {
    if (appt.modality === 'virtual') {
      setApprovingAppt(appt);
      setMeetLink('');
      setShowLinkModal(true);
    } else {
      performApprove(appt.id);
    }
  };

  const performApprove = async (id: string, link?: string) => {
    const updateData: any = { status: 'confirmed' };
    if (link) updateData.meet_link = link;

    const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
    if (!error) {
      // Notify Patient
      const appt = pendingAppointments.find(a => a.id === id);
      if (appt) {
        await supabase.from('notificaciones').insert({
          user_id: appt.patient_id,
          titulo: 'Cita Confirmada',
          mensaje: `Tu cita para el ${appt.appointment_date} a las ${appt.appointment_time} ha sido confirmada por el ${doctorName}.`,
          tipo: 'cita'
        });
      }

      setShowLinkModal(false);
      setApprovingAppt(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchPendingRequests(session.user.id);
    } else {
      alert('Error al aprobar: ' + error.message);
    }
  };

  const getAppointmentPosition = (timeString: string) => {
    if (!timeString) return { top: 0, height: 0, visible: false };

    let [timePart, modifier] = timeString.split(' ');
    let [hoursStr, minutesStr] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10);

    if (modifier) {
      modifier = modifier.toUpperCase();
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
    }

    if (hours < START_HOUR || hours >= END_HOUR) return { top: 0, height: 0, visible: false };

    const totalMinutesFromStart = ((hours - START_HOUR) * 60) + minutes;
    const top = totalMinutesFromStart * PIXELS_PER_MINUTE;

    return { top: top + 1, height: 58, visible: true };
  };

  const formatDateDisplay = (isoDate: string) => {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const isToday = selectedDate === getLocalISODate();

  const timeLabels: string[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const hour = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;

    if (h !== END_HOUR) {
      timeLabels.push(`${hourStr}:00 ${ampm}`);
      timeLabels.push(`${hourStr}:30 ${ampm}`);
    } else {
      timeLabels.push(`${hourStr}:00 ${ampm}`);
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 bg-background-light dark:bg-background-dark relative">
      <AppDialog
        isOpen={rejectDialog.show}
        onClose={() => setRejectDialog({ show: false, id: null })}
        title="Rechazar Solicitud"
        message="¿Estás seguro de que deseas rechazar esta solicitud de cita? Esta acción no se puede deshacer."
        type="confirm"
        primaryButtonText="Sí, Rechazar"
        onPrimaryAction={confirmReject}
      />

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-border-dark">
            <h3 className="text-lg font-bold mb-2">Aprobar Cita Virtual</h3>
            <p className="text-sm text-gray-500 mb-4">Ingresa el enlace de Google Meet para la cita de {approvingAppt?.patient?.full_name}.</p>

            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enlace de Reunión</label>
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-primary"
              value={meetLink}
              onChange={e => setMeetLink(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={() => performApprove(approvingAppt.id, meetLink)}
                className="px-4 py-2 text-sm font-bold bg-primary text-black rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!meetLink}
              >
                Confirmar y Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Buenos Días, {doctorName}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {formatDateDisplay(new Date().toISOString().split('T')[0])} • <span className="text-slate-900 dark:text-white font-semibold">{stats.total} citas</span> en total.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined">print</span> Reporte Diario
          </button>
          <button
            onClick={() => navigate('/book-appointment')}
            className="flex-1 md:flex-none bg-primary text-slate-900 hover:bg-[#0fdc52] font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined">add_circle</span> Consulta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard icon="calendar_month" color="blue" label="Total de Citas" value={stats.total.toString()} trend="+5%" />
        <StatCard icon="hourglass_top" color="orange" label="Solicitudes Pendientes" value={stats.pending.toString()} />
        <StatCard icon="monitor_heart" color="red" label="Casos Urgentes" value={stats.urgent.toString()} alert={stats.urgent > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-[880px]">

        {/* AGENDA VISUAL */}
        <div className="xl:col-span-8 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 dark:border-border-dark flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">calendar_view_day</span> Agenda
              </h3>

              {/* Date Navigation */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                <button onClick={() => changeDate(-1)} className="size-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <div className="text-sm font-bold px-3 min-w-[120px] text-center capitalize">
                  {isToday ? 'Hoy' : formatDateDisplay(selectedDate)}
                </div>
                <button onClick={() => changeDate(1)} className="size-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
                <div className="relative">
                  <input
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <button className="size-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:shadow-sm transition-all">
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-sm font-medium">
              <button className="px-4 py-1.5 bg-white dark:bg-surface-dark shadow-sm rounded-md text-slate-900 dark:text-white border border-slate-200 dark:border-border-dark">Citas</button>
              <button className="px-4 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white">Disponibilidad</button>
            </div>
          </div>

          <div className="flex-1 relative p-0 bg-slate-50/50 dark:bg-black/10">
            <div className="grid grid-cols-[80px_1fr] h-full min-w-[600px]">
              {/* Time Column */}
              <div className="flex flex-col border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-xs font-medium text-slate-400">
                {timeLabels.map((time, i) => (
                  <div key={i} className="flex items-start justify-center pt-2 border-b border-white dark:border-transparent bg-background-light/30 dark:bg-black/10" style={{ height: i === timeLabels.length - 1 ? 'auto' : `${SLOT_HEIGHT}px` }}>
                    {time}
                  </div>
                ))}
              </div>

              {/* Grid Column */}
              <div className="relative bg-white dark:bg-surface-dark">
                {/* Background Lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {timeLabels.slice(0, -1).map((_, i) => (
                    <div key={i} className="" style={{ height: `${SLOT_HEIGHT}px`, borderBottom: '1px dashed var(--tw-border-opacity, #e2e8f0)' }}>
                      <div className="w-full h-full border-b border-slate-100 dark:border-border-dark border-dashed"></div>
                    </div>
                  ))}
                </div>

                {/* Current Time Indicator */}
                {currentTimePos !== null && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none transition-all duration-1000 ease-linear"
                    style={{ top: `${currentTimePos}px` }}
                  >
                    <div className="absolute -left-1.5 top-[-6px] size-3 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>
                  </div>
                )}

                {/* APPOINTMENTS ITEMS */}
                {agendaAppointments.length > 0 ? (
                  agendaAppointments.map((appt) => {
                    const { top, height, visible } = getAppointmentPosition(appt.appointment_time);
                    if (!visible) return null;

                    const color = appt.modality === 'virtual' ? 'blue' : 'primary';

                    return (
                      <ScheduleItem
                        key={appt.id}
                        top={top}
                        height={height}
                        color={color}
                        name={appt.patient?.full_name || 'Paciente'}
                        type={appt.visit_type}
                        status={appt.status}
                        isSelected={selectedAppointment?.id === appt.id}
                        onClick={() => setSelectedAppointment(appt)}
                      />
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full opacity-50 pointer-events-none">
                    <span className="text-sm text-slate-400 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-lg bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">event_busy</span>
                      Sin citas para el {isToday ? 'hoy' : formatDateDisplay(selectedDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <NextPatientCard
            appointment={selectedAppointment}
            onRefresh={fetchAgenda}
          />
          <PendingRequests
            requests={pendingAppointments}
            loading={loadingPending}
            onApprove={initApprove}
            onReject={handleRejectClick}
          />
        </div>
      </div>
    </div>
  );
}

// ... Keep other components same ... 
function StatCard({ icon, color, label, value, trend, alert }: any) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12`}>
        <span className="material-symbols-outlined text-8xl">{icon}</span>
      </div>
      <div className="flex justify-between items-start z-10">
        <div className={`p-2 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg text-${color}-600 dark:text-${color}-400`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && <span className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-xs">trending_up</span> {trend}</span>}
        {alert && <span className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full animate-pulse">Alerta</span>}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

function PendingRequests({ requests, loading, onApprove, onReject }: any) {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span className={`size-2 bg-orange-500 rounded-full ${requests.length > 0 ? 'animate-pulse' : ''}`}></span>
          Solicitudes ({requests.length})
        </h3>
      </div>

      <div className="p-3 overflow-y-auto flex flex-col gap-3 flex-1 min-h-0">
        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">No hay solicitudes pendientes.</div>
        ) : (
          requests.map((r: any) => (
            <div key={r.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase shrink-0 cursor-pointer hover:bg-primary hover:text-white transition-all"
                  onClick={() => navigate(`/patient-details/${r.patient_id}`)}
                >
                  {r.patient?.full_name?.substring(0, 2) || 'NN'}
                </div>
                <div>
                  <p
                    className="text-sm font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/patient-details/${r.patient_id}`)}
                  >
                    {r.patient?.full_name || 'Paciente sin nombre'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                      {r.appointment_date}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {r.appointment_time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${r.modality === 'virtual' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {t(r.modality || 'presencial', MODALITY_LABELS)}
                </span>
                <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold uppercase border border-slate-100 dark:border-slate-700">
                  {t(r.visit_type, VISIT_TYPE_LABELS)}
                </span>
              </div>

              {r.notes && <p className="text-xs text-slate-500 italic mb-3 pl-1 border-l-2 border-slate-200 dark:border-slate-600 line-clamp-2">"{r.notes}"</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(r)}
                  className="flex-1 bg-primary text-slate-900 text-xs font-bold py-2 rounded-md hover:bg-green-400 transition flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check</span> Aprobar
                </button>
                <button
                  onClick={() => onReject(r.id)}
                  className="px-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center"
                  title="Rechazar"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



function NextPatientCard({ appointment, onRefresh }: { appointment: any | null, onRefresh?: () => void }) {
  const navigate = useNavigate();

  const handleNoShow = async () => {
    if (!appointment) return;
    if (!confirm('¿Marcar como "No Asistió"? Esto liberará el cupo.')) return;

    const { error } = await supabase.from('appointments').update({ status: 'no-show' }).eq('id', appointment.id);
    if (!error) {
      // Notify Patient
      await supabase.from('notificaciones').insert({
        user_id: appointment.patient_id,
        titulo: 'Inasistencia Registrada',
        mensaje: `Se ha registrado que no asististe a tu cita del ${appointment.appointment_date}. Si crees que es un error, contacta a soporte.`,
        tipo: 'cita'
      });

      if (onRefresh) onRefresh();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleReschedule = () => {
    if (!appointment) return;
    navigate('/book-appointment', {
      state: {
        patient: appointment.patient,
        oldAppointmentId: appointment.id,
        initialReason: appointment.notes
      }
    });
  };

  if (!appointment) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[200px] gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
          <span className="material-symbols-outlined text-3xl text-slate-300">touch_app</span>
        </div>
        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-200">Sin cita seleccionada</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            Selecciona una cita de la agenda para ver los detalles y comenzar la consulta.
          </p>
        </div>
      </div>
    );
  }

  const isVirtual = appointment.modality === 'virtual';

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
      <div className="absolute top-0 right-0 size-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles de la Cita</h4>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${appointment.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400' :
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
          {appointment.status === 'confirmed' ? 'Confirmada' : appointment.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div
          className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform"
          onClick={() => navigate(`/patient-details/${appointment.patient_id}`)}
        >
          {appointment.patient?.full_name?.substring(0, 2) || 'NN'}
        </div>
        <div>
          <p
            className="text-lg font-bold leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/patient-details/${appointment.patient_id}`)}
          >
            {appointment.patient?.full_name || 'Paciente'}
          </p>
          <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-1">
            Hora: {appointment.appointment_time}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo de Visita</p>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {VISIT_TYPE_LABELS[appointment.visit_type] || appointment.visit_type}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Modalidad</p>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-blue-500">
              {isVirtual ? 'videocam' : 'person_pin_circle'}
            </span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {appointment.modality || 'Presencial'}
            </p>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <div className="mb-5 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
          <p className="text-[10px] text-yellow-600 dark:text-yellow-500 uppercase font-bold mb-1">Notas / Motivo</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{appointment.notes}"</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 relative z-10 mb-2">
        <button
          onClick={handleReschedule}
          className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">edit_calendar</span> Reprogramar
        </button>
        <button
          onClick={handleNoShow}
          className="bg-white dark:bg-slate-800 text-red-500 border border-slate-200 dark:border-slate-700 font-bold py-2 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">person_off</span> No Asistió
        </button>
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <button
          className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-[#0fdc52] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          onClick={() => navigate(`/consultation/${appointment.id}`)}
        >
          <span className="material-symbols-outlined group-hover:animate-pulse">play_circle</span>
          Iniciar Consulta
        </button>
        {isVirtual && appointment.meet_link && (
          <a
            href={appointment.meet_link} target="_blank" rel="noreferrer"
            className="w-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">videocam</span>
            Unirse a Reunión
          </a>
        )}
      </div>
    </div>
  );
}

function ScheduleItem({ top, height, color, name, type, status, onClick, isSelected }: any) {
  const bgClass = isSelected
    ? 'bg-primary/20 ring-2 ring-primary z-20 shadow-md'
    : color === 'primary'
      ? 'bg-primary/10 hover:bg-primary/20'
      : color === 'blue'
        ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
        : 'bg-slate-50 hover:bg-slate-100';

  const borderClass = color === 'primary' ? 'border-primary' : color === 'blue' ? 'border-blue-500' : 'border-slate-400';
  const textClass = color === 'primary' ? 'text-primary-dark dark:text-primary' : color === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700';

  return (
    <div
      onClick={onClick}
      className={`absolute left-2 right-2 border-l-[6px] rounded-r-lg p-3 cursor-pointer transition-all group z-10 shadow-sm ${bgClass} ${borderClass}`}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <div className="flex justify-between items-start h-full overflow-hidden">
        <div className="flex flex-col justify-between h-full">
          <p className="text-sm font-bold truncate pr-2">{name}</p>
          <p className={`text-xs ${textClass} flex items-center gap-1 opacity-80`}><span className="material-symbols-outlined text-[10px]">stethoscope</span> {t(type, VISIT_TYPE_LABELS)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`bg-white/80 dark:bg-black/20 ${textClass} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-transparent`}>{t(status, STATUS_LABELS)}</span>
        </div>
      </div>
    </div>
  );
}
