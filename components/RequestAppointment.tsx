
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
}

export default function RequestAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState({
    fullName: '',
    cedula: '',
    age: ''
  });

  // Data States
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);

  // Form States
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [visitType, setVisitType] = useState('first-time');
  const [modality, setModality] = useState<'presencial' | 'virtual'>('presencial');
  const [notes, setNotes] = useState('');

  // UI States
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch Patient Data & Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, cedula, birth_date')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
          let ageString = 'No registrada';

          if (birthDate) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            ageString = age.toString();
          }

          setPatientData({
            fullName: profile.full_name || 'Usuario',
            cedula: profile.cedula || 'No registrada',
            age: ageString
          });
        }
      }


      // 2. Fetch Doctors using RPC to bypass RLS and ensure we get specialties
      const { data: doctorsData, error: doctorsError } = await supabase.rpc('get_doctors');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
      }

      if (doctorsData) {
        setDoctors(doctorsData);
        // Extract unique specialties from the validated RPC response
        const uniqueSpecialties = Array.from(new Set(doctorsData.map((d: any) => d.specialty).filter(Boolean)));
        setSpecialties(uniqueSpecialties);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter doctors when specialty changes
  useEffect(() => {
    if (selectedSpecialty) {
      const filtered = doctors.filter(d => d.specialty === selectedSpecialty);
      setAvailableDoctors(filtered);
      setSelectedDoctor(''); // Reset doctor selection
    } else {
      setAvailableDoctors([]);
    }
  }, [selectedSpecialty, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: userId,
        doctor_id: selectedDoctor,
        specialty: selectedSpecialty,
        appointment_date: date,
        appointment_time: time,
        visit_type: visitType,
        modality: modality,
        notes: notes
      });

      if (error) throw error;

      // Notify Doctor
      if (selectedDoctor) {
        const { error: notificationError } = await supabase.from('notificaciones').insert({
          user_id: selectedDoctor,
          titulo: 'Nueva Solicitud de Cita',
          mensaje: `${patientData.fullName} ha solicitado una cita para el ${date} a las ${time}.`,
          tipo: 'cita'
        });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          // We don't throw here to at least show the success of the appointment request
        }
      }

      setShowSuccessDialog(true);
    } catch (err: any) {
      alert('Error al solicitar la cita: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display text-text-main dark:text-white transition-colors duration-200">

      <AppDialog
        isOpen={showSuccessDialog}
        onClose={handleDialogClose}
        title="Solicitud Enviada"
        message="Tu solicitud de cita ha sido recibida correctamente. Nos pondremos en contacto contigo pronto para confirmar los detalles."
        primaryButtonText="Volver al Inicio"
        onPrimaryAction={handleDialogClose}
      />

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

            {/* Read-only Patient Data Block */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-sub mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">person</span>
                Datos del Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-sub uppercase">Nombre Completo</label>
                  <div className="font-bold text-lg">{patientData.fullName}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-sub uppercase">Cédula</label>
                  <div className="font-medium">{patientData.cedula}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-sub uppercase">Edad</label>
                  <div className="font-medium">{patientData.age} años</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Especialidad Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Especialidad</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">medical_services</span>
                  </div>
                  <select
                    required
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-10 pr-10 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none relative z-0"
                  >
                    <option disabled value="">Seleccione especialidad...</option>
                    {specialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                    {specialties.length === 0 && <option disabled>No hay especialidades disponibles</option>}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Doctor Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Profesional</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">person_search</span>
                  </div>
                  <select
                    required
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    disabled={!selectedSpecialty}
                    className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-10 pr-10 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed relative z-0"
                  >
                    <option disabled value="">
                      {selectedSpecialty ? 'Seleccione un médico...' : 'Primero seleccione especialidad'}
                    </option>
                    {availableDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Fecha Preferida</label>
                <div className="relative">
                  <input
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent [color-scheme:light] dark:[color-scheme:dark]"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main dark:text-gray-200">Horario Preferido</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <select
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-10 pr-10 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                  >
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-sub z-10">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200 block">Modalidad de la Consulta</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                        cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all
                        ${modality === 'presencial'
                    ? 'bg-primary/10 border-primary text-primary-dark dark:text-primary ring-1 ring-primary'
                    : 'bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 text-text-sub hover:border-gray-300 dark:hover:border-gray-600'}
                    `}>
                  <input
                    type="radio"
                    name="modality"
                    value="presencial"
                    checked={modality === 'presencial'}
                    onChange={() => setModality('presencial')}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-3xl">location_on</span>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Presencial</span>
                    <span className="text-xs opacity-80">En consultorio</span>
                  </div>
                </label>

                <label className={`
                        cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all
                        ${modality === 'virtual'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                    : 'bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 text-text-sub hover:border-gray-300 dark:hover:border-gray-600'}
                    `}>
                  <input
                    type="radio"
                    name="modality"
                    value="virtual"
                    checked={modality === 'virtual'}
                    onChange={() => setModality('virtual')}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-3xl">videocam</span>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Virtual</span>
                    <span className="text-xs opacity-80">Google Meet</span>
                  </div>
                </label>
              </div>
              {modality === 'virtual' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg mt-2">
                  <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">info</span>
                  <p>El enlace de Google Meet se habilitará cuando el doctor confirme la cita.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Tipo de Visita</label>
              <div className="relative">
                <select
                  required
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 pr-10 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="first-time">Consulta de Primera Vez</option>
                  <option value="follow-up">Seguimiento / Control</option>
                  <option value="results">Revisión de Resultados</option>
                  <option value="emergency">Urgencia</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-sub z-10">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-text-main dark:text-gray-200">Notas Adicionales (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Describa brevemente sus síntomas o el motivo de la visita..."
                rows={3}
              ></textarea>
            </div>

            <div className="pt-6">
              <button
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    Confirmar Solicitud de Cita
                  </>
                )}
              </button>
              <p className="text-center text-xs text-text-sub mt-4">Al reservar, usted acepta nuestra política de cancelación de citas.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
