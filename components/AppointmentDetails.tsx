
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';

interface AppointmentDetail {
  id: string;
  created_at: string;
  status: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  modality?: string;
  meet_link?: string;
  location?: string;
  reason: string;
  notes: string;
  doctor_id: string;
  doctor: {
    full_name: string;
    doctor_specialties: Array<{
      specialties: {
        name: string;
      }
    }>;
    user_metadata?: any;
  };
  consultation?: {
    reason: string;
    current_illness: string;
    vital_signs: any;
    diagnosis: string;
    diagnosis_type: string;
    prescription: any;
    medical_rest: any;
    exams_requested: any;
  };
}

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm' // Default
  });

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (!id) return;
    fetchAppointmentDetails();
  }, [id]);


  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_id (
            full_name,
            doctor_specialties (
              specialties ( name )
            )
          ),
          consultation:consultations (
            id,
            reason,
            current_illness,
            vital_signs,
            bp_systolic,
            bp_diastolic,
            heart_rate,
            temp_c,
            oxygen_sat,
            diagnosis,
            diagnosis_type,
            prescription,
            medical_rest,
            exams_requested,
            prescriptions_data:prescriptions (
              medication_name,
              dosage,
              frequency,
              duration
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Unificar datos (Nuevo esquema > Viejo esquema)
      const consultation = Array.isArray(data.consultation) ? data.consultation[0] : data.consultation;

      if (consultation) {
        // Normalizar Signos Vitales para la vista
        consultation.vital_signs = {
          ta: (consultation.bp_systolic && consultation.bp_diastolic)
            ? `${consultation.bp_systolic}/${consultation.bp_diastolic}`
            : (consultation.vital_signs?.ta || ''),
          fc: consultation.heart_rate || consultation.vital_signs?.fc || '',
          temp: consultation.temp_c || consultation.vital_signs?.temp || '',
          spo2: consultation.oxygen_sat || consultation.vital_signs?.spo2 || ''
        };

        // Normalizar Recetas (Priorizar tabla prescriptions_data)
        if (consultation.prescriptions_data && consultation.prescriptions_data.length > 0) {
          consultation.prescription = {
            items: consultation.prescriptions_data.map((rx: any) => ({
              name: rx.medication_name,
              dose: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration
            })),
            visible: true
          };
        }
      }

      const safeData = {
        ...data,
        doctor: Array.isArray(data.doctor) ? data.doctor[0] : data.doctor,
        consultation: consultation
      };

      setAppointment(safeData);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Cancelar Cita',
      message: '¿Estás seguro que deseas cancelar esta cita? Esta acción no se puede deshacer.',
      type: 'confirm',
      onConfirm: confirmCancel
    });
  };

  const confirmCancel = async () => {
    if (!appointment) return;
    closeDialog(); // Close confirmation dialog

    try {
      setLoading(true);

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      // Notify Doctor
      const { data: { session } } = await supabase.auth.getSession();
      if (session && appointment.doctor_id) {
        // Fetch patient name (current user)
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        const patientName = profile?.full_name || 'Un paciente';

        await supabase.from('notificaciones').insert({
          user_id: appointment.doctor_id,
          titulo: 'Cita Cancelada por Paciente',
          mensaje: `${patientName} ha cancelado la cita programada para el ${appointment.appointment_date} a las ${appointment.appointment_time}.`,
          tipo: 'cita'
        });
      }

      await fetchAppointmentDetails();

      // Show success dialog
      setDialogConfig({
        isOpen: true,
        title: 'Cita Cancelada',
        message: 'La cita ha sido cancelada exitosamente.',
        type: 'success'
      });

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setDialogConfig({
        isOpen: true,
        title: 'Error',
        message: 'Hubo un error al cancelar la cita. Por favor intenta de nuevo.',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: 'Confirmada', color: 'text-primary-dark dark:text-primary', bg: 'bg-primary/10', ping: true };
      case 'completed': return { text: 'Completada', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', ping: false };
      case 'cancelled': return { text: 'Cancelada', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', ping: false };
      default: return { text: 'Pendiente', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', ping: false };
    }
  };


  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">event_busy</span>
        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">Cita no encontrada</h2>
        <p className="text-text-sub dark:text-gray-400 mb-6">No pudimos encontrar los detalles de la cita solicitada.</p>
        <Link to="/appointment-history" className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors">
          Volver al historial
        </Link>
      </div>
    );
  }

  // Helper date formatting
  const dateObj = new Date(appointment.appointment_date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('es-ES', { month: 'short' });
  const weekday = dateObj.toLocaleString('es-ES', { weekday: 'long' });

  const statusStyle = getStatusStyle(appointment.status);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main dark:text-white overflow-x-hidden transition-colors duration-200">

      <AppDialog
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onConfirm={dialogConfig.onConfirm}
      />

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
            <div className={`px-6 py-4 ${statusStyle.bg} border-b border-primary/10 flex flex-wrap gap-4 justify-between items-center`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {statusStyle.ping && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${statusStyle.ping ? 'bg-primary' : 'bg-gray-400'}`}></span>
                </span>
                <span className={`text-sm font-bold uppercase tracking-wider ${statusStyle.color}`}>
                  {statusStyle.text} • {appointment.appointment_time}
                </span>
              </div>
              <span className="text-xs font-mono text-text-sub/70 truncate max-w-[200px]" title={appointment.id}>ID: {appointment.id}</span>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-700 min-w-[140px]">
                  <span className="text-sm font-bold text-text-sub uppercase mb-1 capitalize">{month}</span>
                  <span className="text-5xl font-black text-text-main dark:text-white mb-1">{day}</span>
                  <span className="text-lg font-medium text-text-sub capitalize">{weekday}</span>
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-3"></div>
                  <span className="text-xl font-bold text-primary-dark dark:text-primary">{appointment.appointment_time}</span>
                </div>

                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {appointment.visit_type === 'general' ? 'Consulta Medicina General' :
                        appointment.visit_type === 'specialist' ? 'Consulta Especializada' :
                          appointment.visit_type === 'followup' ? 'Control de Seguimiento' :
                            'Consulta Médica'}
                    </h3>
                    <p className="text-text-sub dark:text-gray-400">
                      {appointment.reason ? appointment.reason : 'Chequeo médico programado.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-primary/10 shrink-0 flex items-center justify-center text-primary font-bold text-lg">
                        {appointment.doctor?.full_name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Especialista</p>
                        <p className="font-bold text-lg">{appointment.doctor?.full_name || 'No asignado'}</p>
                        <p className="text-sm text-text-sub capitalize">
                          {appointment.doctor?.doctor_specialties?.map(s => s.specialties?.name).join(', ') || 'Medicina General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div>
                        {appointment.modality === 'virtual' ? (
                          <>
                            <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Enlace de Videollamada</p>
                            {appointment.meet_link ? (
                              <div className="inline-flex items-center gap-2 text-text-main dark:text-white font-medium">
                                <span className="material-symbols-outlined text-lg text-text-sub">videocam</span>
                                <span>Enlace disponible</span>
                              </div>
                            ) : (
                              <p className="font-bold text-base text-gray-500 italic">Pendiente por asignar</p>
                            )}
                            <p className="text-sm text-text-sub">
                              {appointment.meet_link ? 'Use el botón inferior para unirse' : 'El doctor enviará el enlace pronto'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Ubicación</p>
                            <p className="font-bold text-base">Centro Médico Alcaraván</p>
                            <p className="text-sm text-text-sub">{appointment.location || 'Consultorio Principal'}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">
                          {appointment.modality === 'virtual' ? 'cloud' : 'sensor_door'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Tipo de Visita</p>
                        <p className="font-bold text-base capitalize">{appointment.modality || 'Presencial'}</p>
                        <p className="text-sm text-text-sub">
                          {appointment.modality === 'virtual' ? 'Enlace disponible 30 min antes' : 'Presentarse 15 min antes'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-sub shrink-0">
                        <span className="material-symbols-outlined">notes</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-sub uppercase font-bold mb-0.5">Notas del Paciente</p>
                        <p className="text-sm text-text-sub italic">
                          {appointment.notes ? `"${appointment.notes}"` : "Sin notas adicionales"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <button
                    onClick={handleCancelClick}
                    className="px-5 py-2.5 rounded-lg border border-red-200 text-status-red hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    Cancelar Cita
                  </button>
                )}
                {appointment.status === 'pending' ? (
                  <button
                    onClick={() => navigate('/request-appointment', {
                      state: { rescheduleId: appointment.id, initialReason: appointment.visit_type }
                    })}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-main dark:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">edit_calendar</span>
                    Reprogramar
                  </button>
                ) : (
                  appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-main dark:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                      <span className="material-symbols-outlined text-lg">edit_calendar</span>
                      Reserva Confirmada
                    </button>
                  )
                )}




                {appointment.modality === 'virtual' && appointment.status === 'confirmed' && (
                  appointment.meet_link ? (
                    <a
                      href={appointment.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">videocam</span>
                      Unirse a Google Meet
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-bold text-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 cursor-not-allowed"
                      title="El enlace se habilitará cuando el doctor lo asigne"
                    >
                      <span className="material-symbols-outlined text-lg">videocam_off</span>
                      Enlace Pendiente
                    </button>
                  )
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Clinical Summary Section - Only if appointment is completed and selected clinical data exists */}
        {appointment.status === 'completed' && appointment.consultation && (() => {
          const hasDiagnosis = appointment.consultation.diagnosis && appointment.consultation.diagnosis !== '[]' && appointment.consultation.diagnosis !== '""';
          const hasPrescription = appointment.consultation.prescription?.items?.length > 0 && appointment.consultation.prescription?.visible !== false;
          const hasVitalSigns = appointment.consultation.vital_signs && (
            appointment.consultation.vital_signs.ta ||
            appointment.consultation.vital_signs.fc ||
            appointment.consultation.vital_signs.temp ||
            appointment.consultation.vital_signs.spo2
          );
          const hasExams = appointment.consultation.exams_requested?.items?.length > 0 && appointment.consultation.exams_requested?.visible !== false;

          if (!hasDiagnosis && !hasPrescription && !hasVitalSigns && !hasExams) return null;

          return (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-lg font-bold uppercase tracking-wider text-text-sub dark:text-gray-400 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">clinical_notes</span>
                Resumen Clínico
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {/* Diagnosis */}
                {hasDiagnosis && (
                  <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined">diagnosis</span>
                      </div>
                      <h5 className="font-bold text-lg">Diagnóstico</h5>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        try {
                          const diags = JSON.parse(appointment.consultation.diagnosis || '[]');
                          if (Array.isArray(diags) && diags.length > 0) {
                            return diags.map((d: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-1.5 size-1.5 rounded-full bg-current shrink-0"></span>
                                <p className="text-text-main dark:text-gray-200">
                                  <span className="font-bold text-primary mr-2">{d.code}</span>
                                  {d.name}
                                </p>
                              </div>
                            ));
                          }
                          return <p className="text-text-main dark:text-gray-200">{appointment.consultation.diagnosis}</p>;
                        } catch (e) {
                          return <p className="text-text-main dark:text-gray-200">{appointment.consultation.diagnosis}</p>;
                        }
                      })()}
                      {appointment.consultation.diagnosis_type && (
                        <p className="text-xs font-bold text-text-sub uppercase mt-2">Tipo: {appointment.consultation.diagnosis_type}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Prescription / Medications */}
                {hasPrescription && (
                  <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                        <span className="material-symbols-outlined">prescriptions</span>
                      </div>
                      <h5 className="font-bold text-lg">Receta / Medicamentos</h5>
                    </div>
                    <ul className="space-y-3">
                      {appointment.consultation.prescription.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex-grow">
                            <p className="font-bold text-text-main dark:text-white">{item.name}</p>
                            <p className="text-sm text-text-sub dark:text-gray-400">{item.dose} • {item.frequency} • {item.duration}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Vital Signs / Anthropometry */}
                {hasVitalSigns && (
                  <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
                        <span className="material-symbols-outlined">vital_signs</span>
                      </div>
                      <h5 className="font-bold text-lg">Signos Vitales</h5>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {appointment.consultation.vital_signs.ta && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-text-sub mb-1">P. Arterial</p>
                          <p className="text-base font-black text-text-main dark:text-white">{appointment.consultation.vital_signs.ta}</p>
                          <p className="text-[8px] text-text-sub">mmHg</p>
                        </div>
                      )}
                      {appointment.consultation.vital_signs.fc && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-text-sub mb-1">Frecuencia</p>
                          <p className="text-base font-black text-text-main dark:text-white">{appointment.consultation.vital_signs.fc}</p>
                          <p className="text-[8px] text-text-sub">BPM</p>
                        </div>
                      )}
                      {appointment.consultation.vital_signs.temp && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-text-sub mb-1">Temp</p>
                          <p className="text-base font-black text-text-main dark:text-white">{appointment.consultation.vital_signs.temp}</p>
                          <p className="text-[8px] text-text-sub">°C</p>
                        </div>
                      )}
                      {appointment.consultation.vital_signs.spo2 && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-text-sub mb-1">SpO2</p>
                          <p className="text-base font-black text-text-main dark:text-white">{appointment.consultation.vital_signs.spo2}%</p>
                          <p className="text-[8px] text-text-sub">Saturación</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exams Requested */}
                {hasExams && (
                  <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined">lab_research</span>
                      </div>
                      <h5 className="font-bold text-lg">Exámenes Solicitados</h5>
                    </div>
                    <ul className="space-y-3">
                      {appointment.consultation.exams_requested.items.map((exam: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                          <span className="material-symbols-outlined text-blue-500">biometry</span>
                          <div className="flex-grow">
                            <p className="font-bold text-text-main dark:text-white capitalize">{exam.name}</p>
                            <p className="text-xs text-text-sub dark:text-gray-400">{exam.type}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
