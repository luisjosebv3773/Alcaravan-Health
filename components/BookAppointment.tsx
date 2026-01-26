import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';

export default function BookAppointment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { patient: preSelectedPatient, oldAppointmentId, initialReason } = location.state || {};

    const [searchTerm, setSearchTerm] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [visitType, setVisitType] = useState('presencial');
    const [consultationType, setConsultationType] = useState('consultation');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const [doctorProfile, setDoctorProfile] = useState<any>(null);

    // Dialog state
    const [dialog, setDialog] = useState<{ isOpen: boolean, type: 'success' | 'error', title: string, message: string }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    useEffect(() => {
        // Pre-fill if rescheduling
        if (preSelectedPatient) {
            setSelectedPatient(preSelectedPatient);
            setSearchTerm(preSelectedPatient.full_name);
        }
        if (initialReason) {
            setReason(initialReason);
        }

        const fetchDoctor = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setDoctorProfile(data);

                // Auto-select modality based on doctor's preference
                if (data?.consultation_modality === 'presencial') {
                    setVisitType('presencial');
                } else if (data?.consultation_modality === 'virtual') {
                    setVisitType('virtual');
                }
                // If 'both', keep default 'presencial'
            }
        };
        fetchDoctor();
    }, [preSelectedPatient, initialReason]);

    // Patient Search Logic
    useEffect(() => {
        const searchPatients = async () => {
            if (searchTerm.length < 2) {
                setPatientResults([]);
                return;
            }

            setLoadingPatients(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'paciente')
                .ilike('full_name', `%${searchTerm}%`)
                .limit(5);

            if (!error && data) {
                setPatientResults(data);
                setShowResults(true);
            }
            setLoadingPatients(false);
        };

        const timeoutId = setTimeout(searchPatients, 400);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient);
        setSearchTerm(patient.full_name);
        setShowResults(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !date || !time) {
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Campos Incompletos',
                message: 'Por favor seleccione un paciente, fecha y hora.'
            });
            return;
        }

        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Since doctor schedules it, it is automatically confirmed
        const { error: insertError } = await supabase.from('appointments').insert({
            doctor_id: session.user.id,
            patient_id: selectedPatient.id,
            appointment_date: date,
            appointment_time: time,
            visit_type: consultationType,
            modality: visitType,
            status: 'confirmed',
            notes: reason,
            created_at: new Date()
        });

        // Handle Rescheduling (Cancel old appointment)
        if (!insertError && oldAppointmentId) {
            await supabase.from('appointments')
                .update({ status: 'cancelled', notes: `${reason} (Reprogramada)` })
                .eq('id', oldAppointmentId);
        }

        setSaving(false);

        if (insertError) {
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo agendar la cita: ' + insertError.message
            });
        } else {
            // Notify Patient
            const doctorName = doctorProfile?.full_name || 'Tu doctor';
            const { error: notificationError } = await supabase.from('notificaciones').insert({
                user_id: selectedPatient.id,
                titulo: oldAppointmentId ? 'Cita Reprogramada' : 'Nueva Cita Agendada',
                mensaje: oldAppointmentId
                    ? `${doctorName} ha reprogramado tu cita para el ${date} a las ${time}.`
                    : `${doctorName} ha agendado una nueva cita para ti el ${date} a las ${time}.`,
                tipo: 'cita'
            });

            if (notificationError) {
                console.error('Error creating notification:', notificationError);
            }

            setDialog({
                isOpen: true,
                type: 'success',
                title: oldAppointmentId ? 'Cita Reprogramada' : 'Cita Agendada',
                message: oldAppointmentId
                    ? 'La cita anterior ha sido cancelada y la nueva cita se ha programado exitosamente.'
                    : 'La cita ha sido programada y confirmada exitosamente.'
            });
            // Redirect after delay ? OR let user close dialog
        }
    };

    const handleDialogClose = () => {
        setDialog({ ...dialog, isOpen: false });
        if (dialog.type === 'success') {
            navigate('/clinical');
        }
    };

    // Time slots generation (simple 30 min intervals)
    const timeSlots = [
        "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM"
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 bg-background-light dark:bg-background-dark min-h-full">
            <AppDialog
                isOpen={dialog.isOpen}
                onClose={handleDialogClose}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{oldAppointmentId ? 'Reprogramar Cita' : 'Programar Nueva Cita'}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{oldAppointmentId ? 'Seleccione la nueva fecha y hora para la cita.' : 'Crear una consulta para un paciente en el sistema.'}</p>
                    </div>
                    <button
                        onClick={() => navigate('/clinical')}
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span> Cancelar & Volver
                    </button>
                </div>

                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 lg:p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                        {/* Patient Search */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Seleccionar Paciente <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400">person_search</span>
                                </span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedPatient(null);
                                    }}
                                    onFocus={() => {
                                        if (patientResults.length > 0) setShowResults(true);
                                    }}
                                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-10 pr-12 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white placeholder:text-slate-400 shadow-sm transition-all"
                                    placeholder="Buscar por Nombre del Paciente..."
                                />
                                {selectedPatient && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500">
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </span>
                                )}

                                {/* Dropdown Results */}
                                {showResults && patientResults.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {patientResults.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                                            >
                                                <p className="font-bold text-slate-800 dark:text-gray-200">{p.full_name}</p>
                                                <p className="text-xs text-slate-500">{p.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {!selectedPatient && <p className="text-xs text-slate-500">Comience a escribir para buscar pacientes registrados.</p>}
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Doctor Info */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Médico Especialista (Usted)
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark dark:text-primary">
                                    <span className="material-symbols-outlined text-2xl">person</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{doctorProfile?.full_name || 'Dr. Alcaraván'}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Médico General</p>
                                </div>
                                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded uppercase">
                                    Principal
                                </div>
                            </div>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                    Fecha <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                                    </span>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                    Hora Preferida <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400">schedule</span>
                                    </span>
                                    <select
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white shadow-sm"
                                    >
                                        <option value="" disabled>Seleccionar bloque</option>
                                        {timeSlots.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Consultation Type */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Tipo de Consulta <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: 'first-time', label: 'Primera Vez', icon: 'person_add' },
                                    { value: 'follow-up', label: 'Control', icon: 'history' },
                                    { value: 'emergency', label: 'Urgencia', icon: 'medical_services' },
                                    { value: 'check-up', label: 'Chequeo', icon: 'fact_check' }
                                ].map((type) => (
                                    <label key={type.value} className="cursor-pointer group relative">
                                        <input
                                            type="radio"
                                            name="consultationType"
                                            value={type.value}
                                            checked={consultationType === type.value}
                                            onChange={() => setConsultationType(type.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary-dark dark:peer-checked:text-primary transition-all flex flex-col items-center justify-center gap-2 text-center h-full hover:border-slate-300 dark:hover:border-slate-600">
                                            <span className="material-symbols-outlined text-2xl text-slate-400 peer-checked:text-primary">{type.icon}</span>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 peer-checked:text-primary-dark dark:peer-checked:text-primary">{type.label}</span>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 text-primary transition-opacity">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Visit Type */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Modalidad
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Presencial Option */}
                                {(!doctorProfile || doctorProfile.consultation_modality === 'presencial' || doctorProfile.consultation_modality === 'both') && (
                                    <label className="flex-1 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="visitType"
                                            value="presencial"
                                            checked={visitType === 'presencial'}
                                            onChange={() => setVisitType('presencial')}
                                            className="peer sr-only"
                                        />
                                        <div className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all flex items-center gap-3">
                                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 peer-checked:bg-primary peer-checked:text-slate-900 transition-colors">
                                                <span className="material-symbols-outlined">medical_services</span>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Presencial</span>
                                                <span className="block text-xs text-slate-500">Consulta en consultorio</span>
                                            </div>
                                            <div className="ml-auto opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                                                <span className="material-symbols-outlined">check_circle</span>
                                            </div>
                                        </div>
                                    </label>
                                )}

                                {/* Virtual Option */}
                                {(!doctorProfile || doctorProfile.consultation_modality === 'virtual' || doctorProfile.consultation_modality === 'both') && (
                                    <label className="flex-1 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="visitType"
                                            value="virtual"
                                            checked={visitType === 'virtual'}
                                            onChange={() => setVisitType('virtual')}
                                            className="peer sr-only"
                                        />
                                        <div className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all flex items-center gap-3">
                                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 peer-checked:bg-primary peer-checked:text-slate-900 transition-colors">
                                                <span className="material-symbols-outlined">videocam</span>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Consulta Virtual</span>
                                                <span className="block text-xs text-slate-500">Videollamada remota</span>
                                            </div>
                                            <div className="ml-auto opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                                                <span className="material-symbols-outlined">check_circle</span>
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Motivo de Visita / Notas Clínicas
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white placeholder:text-slate-400 shadow-sm resize-none"
                                placeholder="Describa el motivo principal de la cita..."
                                rows={4}
                            ></textarea>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-end border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => navigate('/clinical')}
                                className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold shadow-lg shadow-green-500/20 hover:bg-[#0fdc52] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <span className="size-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span className="material-symbols-outlined">calendar_add_on</span>
                                )}
                                {saving ? 'Programando...' : 'Programar Cita'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
