import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';
import ExamsModule, { ExamRequest, ExamResult } from './ExamsModule';

type DialogType = 'success' | 'error' | 'confirm' | 'info';

interface PrescriptionItem {
    name: string;
    dose: string;
    frequency: string;
    duration: string;
}

export default function Consultation() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [meetLink, setMeetLink] = useState('');
    const [isEditingLink, setIsEditingLink] = useState(false);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{
        type: DialogType;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ type: 'info', title: '', message: '' });

    // Consultation Form State
    const [reason, setReason] = useState('');
    const [illnessHistory, setIllnessHistory] = useState('');
    const [vitals, setVitals] = useState({ ta: '', fc: '', temp: '', spo2: '' });

    // Diagnosis State
    const [diagnosisSearch, setDiagnosisSearch] = useState('');
    const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
    const [selectedDiagnoses, setSelectedDiagnoses] = useState<{ code: string, name: string }[]>([]);
    const [diagType, setDiagType] = useState('Presuntivo');
    const [internalNotes, setInternalNotes] = useState('');

    // Prescription State
    const [prescriptionList, setPrescriptionList] = useState<PrescriptionItem[]>([]);
    const [showPrescription, setShowPrescription] = useState(true);
    const [rxInput, setRxInput] = useState<PrescriptionItem>({ name: '', dose: '', frequency: '', duration: '' });

    // Medical Rest State
    const [showMedicalRest, setShowMedicalRest] = useState(false);
    const [restDays, setRestDays] = useState('');
    const [restType, setRestType] = useState('Reposo');

    // Exams Module State
    const [examsRequested, setExamsRequested] = useState<ExamRequest[]>([]);
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [showRequestExams, setShowRequestExams] = useState(false); // Default to false
    const [showResultExams, setShowResultExams] = useState(false); // Default to false

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchConsultationData();
    }, [id]);

    const fetchConsultationData = async () => {
        try {
            const { data: appointment, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    appointment_time,
                    visit_type,
                    modality,
                    status,
                    meet_link,
                    patient_id, 
                    patient:patient_id (
                        id,
                        full_name,
                        cedula,
                        birth_date,
                        gender,
                        avatar_url,
                        perfil_actual_salud (
                            blood_type,
                            allergies
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setData(appointment);
            setMeetLink(appointment.meet_link || '');

            // Fetch existing consultation if it exists
            const { data: consultationData, error: consultationError } = await supabase
                .from('consultations')
                .select('*')
                .eq('appointment_id', id)
                .single();

            if (consultationData) {
                setReason(consultationData.reason || '');
                setIllnessHistory(consultationData.current_illness || '');
                if (consultationData.vital_signs) {
                    setVitals({
                        ta: consultationData.vital_signs.ta || '',
                        fc: consultationData.vital_signs.fc || '',
                        temp: consultationData.vital_signs.temp || '',
                        spo2: consultationData.vital_signs.spo2 || ''
                    });
                }

                // Parse diagnosis if safely stored as stringified JSON or plain text
                // Assuming stored as text for now but if we change to JSON structure in future migration:
                if (consultationData.diagnosis && consultationData.diagnosis.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(consultationData.diagnosis);
                        if (Array.isArray(parsed)) setSelectedDiagnoses(parsed);
                    } catch (e) {
                        // fallback usually plain text
                    }
                }
                if (consultationData.diagnosis_type) setDiagType(consultationData.diagnosis_type);
                setInternalNotes(consultationData.internal_notes || '');

                if (consultationData.prescription) {
                    // Check if old format (array) or new format (object with visible)
                    // We will aim for { items: [], visible: boolean }
                    // But if it's just an array, we default visible to true
                    if (Array.isArray(consultationData.prescription)) {
                        setPrescriptionList(consultationData.prescription);
                    } else if (consultationData.prescription.items) {
                        setPrescriptionList(consultationData.prescription.items);
                        if (consultationData.prescription.visible !== undefined) setShowPrescription(consultationData.prescription.visible);
                    }
                }

                if (consultationData.medical_rest) {
                    if (consultationData.medical_rest.days) setRestDays(consultationData.medical_rest.days);
                    if (consultationData.medical_rest.type) setRestType(consultationData.medical_rest.type);
                    if (consultationData.medical_rest.visible !== undefined) setShowMedicalRest(consultationData.medical_rest.visible);
                }

                // Load Exams Data
                if (consultationData.exams_requested) {
                    if (Array.isArray(consultationData.exams_requested)) {
                        // Fallback for old simple arrays if exists
                        // But we want { items: [], visible: boolean }
                    } else {
                        if (consultationData.exams_requested.items) setExamsRequested(consultationData.exams_requested.items);
                        if (consultationData.exams_requested.visible !== undefined) setShowRequestExams(consultationData.exams_requested.visible);
                    }
                }

                if (consultationData.exam_results) {
                    if (consultationData.exam_results.items) setExamResults(consultationData.exam_results.items);
                    if (consultationData.exam_results.visible !== undefined) setShowResultExams(consultationData.exam_results.visible);
                }
            }


        } catch (error) {
            console.error("Error fetching consultation:", error);
            // Don't alert here if it's just that the consultation doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    // Diagnosis Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (diagnosisSearch.length > 1) {
                try {
                    // Search in our local Spanish CIE-10 table (diagnosticos_cie10)
                    // We search if the code starts with the term OR the description contains the term
                    const { data, error } = await supabase
                        .from('diagnosticos_cie10')
                        .select('codigo, descripcion, categoria')
                        .or(`codigo.ilike.${diagnosisSearch}%,descripcion.ilike.%${diagnosisSearch}%`)
                        .limit(10); // Check up to 10 results now that we have categorized local data

                    if (error) throw error;

                    if (data) {
                        const results = data.map((item: any) => ({
                            code: item.codigo,
                            name: item.descripcion,
                            category: item.categoria
                        }));
                        setDiagnosisResults(results);
                    }
                } catch (err) {
                    console.error("Error searching diagnosis:", err);
                    setDiagnosisResults([]);
                }
            } else {
                setDiagnosisResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [diagnosisSearch]);

    const addDiagnosis = (item: { code: string, name: string }) => {
        if (!selectedDiagnoses.some(d => d.code === item.code)) {
            setSelectedDiagnoses([...selectedDiagnoses, item]);
        }
        setDiagnosisSearch('');
        setDiagnosisResults([]);
    };

    const removeDiagnosis = (code: string) => {
        setSelectedDiagnoses(selectedDiagnoses.filter(d => d.code !== code));
    };

    const addPrescriptionItem = () => {
        if (!rxInput.name.trim()) return;
        setPrescriptionList([...prescriptionList, rxInput]);
        setRxInput({ name: '', dose: '', frequency: '', duration: '' }); // Reset input
    };

    const removePrescriptionItem = (index: number) => {
        const newList = [...prescriptionList];
        newList.splice(index, 1);
        setPrescriptionList(newList);
    };

    const handleSave = async () => {
        if (!reason.trim()) {
            setDialogConfig({
                type: 'error',
                title: 'Campo Requerido',
                message: 'El Motivo de Consulta es obligatorio para guardar la consulta.'
            });
            setDialogOpen(true);
            return;
        }

        setSaving(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const doctorId = sessionData.session?.user.id;

            if (!doctorId) throw new Error("No allowed");

            const consultationPayload = {
                appointment_id: id,
                doctor_id: doctorId,
                patient_id: data.patient_id,
                reason: reason,
                current_illness: illnessHistory,
                vital_signs: vitals,
                diagnosis: JSON.stringify(selectedDiagnoses), // Store as JSON string for now since column is TEXT
                diagnosis_type: diagType,
                internal_notes: internalNotes,
                prescription: { items: prescriptionList, visible: showPrescription },
                medical_rest: { days: restDays, type: restType, visible: showMedicalRest },
                exams_requested: { items: examsRequested, visible: showRequestExams },
                exam_results: { items: examResults, visible: showResultExams },
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('consultations')
                .upsert(consultationPayload, { onConflict: 'appointment_id' });

            if (error) throw error;

            // Mark Appointment as Completed
            const { error: apptError } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', id);

            if (apptError) throw apptError;

            // Notify Patient
            await supabase.from('notificaciones').insert({
                user_id: data.patient_id,
                titulo: 'Consulta Finalizada',
                mensaje: `Tu consulta del ${data.appointment_date} ha sido completada. Ya puedes revisar tus resultados y recetas en el portal.`,
                tipo: 'cita'
            });

            setDialogConfig({
                type: 'success',
                title: 'Consulta Finalizada',
                message: 'La consulta ha sido guardada y marcada como completada exitosamente.',
                onConfirm: () => navigate('/clinical')
            });
            setDialogOpen(true);

        } catch (error: any) {
            console.error("Error saving consultation:", error);
            setDialogConfig({
                type: 'error',
                title: 'Error al Guardar',
                message: 'Hubo un problema al guardar los datos: ' + error.message
            });
            setDialogOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const updateMeetLink = async () => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ meet_link: meetLink })
                .eq('id', id);

            if (error) throw error;
            setIsEditingLink(false);
            // Update local data to reflect change if needed, though state is already updated
            setData({ ...data, meet_link: meetLink });
        } catch (error) {
            console.error("Error updating meet link:", error);
            setDialogConfig({
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar el enlace de la reunión.'
            });
            setDialogOpen(true);
        }
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '---';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} Años`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Cargando datos del paciente...</div>;
    if (!data) return <div className="h-screen flex items-center justify-center text-red-500">No se encontró la cita</div>;

    const patientRaw = data.patient || {};
    const healthData = Array.isArray(patientRaw.perfil_actual_salud)
        ? patientRaw.perfil_actual_salud[0]
        : patientRaw.perfil_actual_salud || {};

    const patient = {
        ...patientRaw,
        blood_type: healthData.blood_type,
        allergies: healthData.allergies
    };

    const isReadOnly = data?.status === 'completed';

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased overflow-hidden h-[calc(100vh-64px)] flex transition-colors duration-200">
            <AppDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                type={dialogConfig.type}
                title={dialogConfig.title}
                message={dialogConfig.message}
                onConfirm={dialogConfig.onConfirm}
            />
            {/* Note: Sidebar logic is handled by global header in this app, so we will use the main layout */}

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Internal Header for Consultation Context */}
                <header className="h-16 bg-surface-light dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 transition-colors">
                    <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
                        <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/clinical')}>Clínica</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="hover:text-primary cursor-pointer transition-colors">Pacientes</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-slate-900 dark:text-white font-medium">Nueva Consulta</span>
                    </div>
                    <button className="md:hidden p-2 text-slate-500">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-2 lg:gap-4 ml-auto">
                        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="size-2 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">En línea</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">

                        {/* Patient Header Card */}
                        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => navigate('/clinical')}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Volver al Dashboard"
                                    >
                                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Entrada de Consulta</h2>
                                            {isReadOnly ? (
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-700">Solo Lectura</span>
                                            ) : (
                                                <span className="bg-primary/20 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">En Curso</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registrando datos clínicos para el encuentro actual.</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button className={`flex items-center gap-2 px-4 py-1.5 shadow-sm rounded-md text-sm font-medium transition-all ${data.modality !== 'virtual' ? 'bg-white dark:bg-card-dark text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-sm text-primary">person</span> Presencial
                                    </button>
                                    <button className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-all ${data.modality === 'virtual' ? 'bg-white dark:bg-card-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-sm">videocam</span> Virtual
                                    </button>
                                </div>
                            </div>

                            {/* Virtual Appointment Meet Link Section */}
                            {data.modality === 'virtual' && (
                                <div className="px-6 pb-4 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg" className="size-6" alt="Google Meet" />
                                            </div>
                                            {isEditingLink ? (
                                                <input
                                                    type="text"
                                                    value={meetLink}
                                                    onChange={(e) => setMeetLink(e.target.value)}
                                                    placeholder="https://meet.google.com/..."
                                                    className="flex-1 min-w-[250px] bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Enlace de Reunión</span>
                                                    {meetLink ? (
                                                        <a href={meetLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[300px] flex items-center gap-1">
                                                            {meetLink} <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">No hay enlace configurado</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            {isEditingLink ? (
                                                <>
                                                    <button onClick={() => setIsEditingLink(false)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title="Cancelar">
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                    <button onClick={updateMeetLink} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors" title="Guardar">
                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setIsEditingLink(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar enlace">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                            )}

                                            {meetLink && !isEditingLink && (
                                                <a
                                                    href={meetLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-lg">videocam</span>
                                                    Unirse
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 md:px-6 flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-cover bg-center shadow-sm bg-gray-200 relative overflow-hidden">
                                        {patient.avatar_url ? (
                                            <img src={patient.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-slate-400 text-3xl">person</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{patient.full_name || 'Paciente sin nombre'}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            ID: {patient.cedula || 'N/A'} • {patient.gender || '---'} • {calculateAge(patient.birth_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                                <div className="flex gap-4 text-sm flex-wrap">
                                    <div>
                                        <span className="block text-xs text-slate-400 font-bold uppercase">Fecha</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{data.appointment_date}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-400 font-bold uppercase">Alergias</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">{patient.allergies || 'Ninguna conocida'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-400 font-bold uppercase">Tipo Sangre</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{patient.blood_type || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Grid: Anamnesis + Vitals */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Anamnesis */}
                            <div className="lg:col-span-8 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">history_edu</span> Anamnesis
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo de Consulta <span className="text-red-500">*</span></label>
                                        <input
                                            value={reason}
                                            disabled={isReadOnly}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white placeholder:text-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
                                            placeholder="Ej: Dolor de cabeza persistente y fiebre..."
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enfermedad Actual</label>
                                        <textarea
                                            value={illnessHistory}
                                            disabled={isReadOnly}
                                            onChange={(e) => setIllnessHistory(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white placeholder:text-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
                                            placeholder="Descripción detallada de la condición actual..."
                                            rows={4}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div className="lg:col-span-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">vital_signs</span> Signos Vitales</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tensión (TA)</label>
                                        <div className="relative">
                                            <input
                                                value={vitals.ta}
                                                disabled={isReadOnly}
                                                onChange={(e) => setVitals({ ...vitals, ta: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white disabled:opacity-75"
                                                placeholder="120/80"
                                                type="text"
                                            />
                                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">mmHg</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Frecuencia (FC)</label>
                                        <div className="relative">
                                            <input
                                                value={vitals.fc}
                                                disabled={isReadOnly}
                                                onChange={(e) => setVitals({ ...vitals, fc: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white disabled:opacity-75"
                                                placeholder="72"
                                                type="number"
                                            />
                                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">bpm</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Temp</label>
                                        <div className="relative">
                                            <input
                                                value={vitals.temp}
                                                disabled={isReadOnly}
                                                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white disabled:opacity-75"
                                                placeholder="36.5"
                                                type="number"
                                            />
                                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">°C</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SpO2</label>
                                        <div className="relative">
                                            <input
                                                value={vitals.spo2}
                                                disabled={isReadOnly}
                                                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white disabled:opacity-75"
                                                placeholder="98"
                                                type="number"
                                            />
                                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-2">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">info</span>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">Modalidad presencial seleccionada. Signos vitales requeridos.</p>
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">diagnosis</span> Diagnóstico & Notas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diagnóstico Principal (CIE-10)</label>
                                        <div className="relative group">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-primary transition-colors">
                                                <span className="material-symbols-outlined">search</span>
                                            </span>
                                            <input
                                                value={diagnosisSearch}
                                                disabled={isReadOnly}
                                                onChange={(e) => setDiagnosisSearch(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white disabled:opacity-75"
                                                placeholder="Buscar por código o nombre..."
                                                type="text"
                                            />
                                        </div>

                                        {/* Search Results Dropdown */}
                                        {diagnosisResults.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {diagnosisResults.map((result) => (
                                                    <button
                                                        key={result.code}
                                                        onClick={() => addDiagnosis(result)}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span>
                                                                <span className="font-bold text-primary mr-2">{result.code}</span>
                                                                <span className="text-slate-700 dark:text-slate-300">{result.name}</span>
                                                            </span>
                                                            {result.category && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">{result.category}</span>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedDiagnoses.map((diag) => (
                                                <span key={diag.code} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 animate-in zoom-in-95">
                                                    <span className="font-bold text-primary">{diag.code}</span> - {diag.name}
                                                    {!isReadOnly && <button onClick={() => removeDiagnosis(diag.code)} className="hover:text-red-500 ml-1 flex items-center"><span className="material-symbols-outlined text-xs">close</span></button>}
                                                </span>
                                            ))}
                                            {selectedDiagnoses.length === 0 && <span className="text-xs text-slate-400 italic">Sin diagnósticos seleccionados</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Diagnóstico</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    checked={diagType === 'Presuntivo'}
                                                    onChange={() => setDiagType('Presuntivo')}
                                                    className="text-primary focus:ring-primary"
                                                    name="diagType"
                                                    type="radio"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Presuntivo</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    checked={diagType === 'Definitivo'}
                                                    onChange={() => setDiagType('Definitivo')}
                                                    className="text-primary focus:ring-primary"
                                                    name="diagType"
                                                    type="radio"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Definitivo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
                                        Notas Médicas Internas
                                        <span className="text-xs text-slate-400 font-normal italic flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">lock</span> Privado</span>
                                    </label>
                                    <textarea
                                        value={internalNotes}
                                        disabled={isReadOnly}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        className="w-full bg-amber-50 dark:bg-yellow-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all dark:text-white placeholder:text-slate-400 disabled:opacity-75"
                                        placeholder="Observaciones internas no visibles para el paciente..."
                                        rows={5}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Sections Wrapper */}
                        <div className="flex flex-col gap-4">

                            {/* Prescription */}
                            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <span className="material-symbols-outlined">prescriptions</span>
                                        </span>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Receta Médica</h3>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            checked={showPrescription}
                                            disabled={isReadOnly}
                                            onChange={(e) => setShowPrescription(e.target.checked)}
                                            className="peer absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all duration-300 checked:right-0 checked:border-primary disabled:cursor-not-allowed"
                                            id="toggle-rx"
                                            name="toggle"
                                            type="checkbox"
                                        />
                                        <label className="block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300 peer-checked:bg-primary" htmlFor="toggle-rx"></label>
                                    </div>
                                </div>
                                <div className="p-6 block">
                                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3">Medicamento</th>
                                                    <th className="px-4 py-3">Dosis</th>
                                                    <th className="px-4 py-3">Frecuencia</th>
                                                    <th className="px-4 py-3">Duración</th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-card-dark">
                                                {prescriptionList.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                                        <td className="px-4 py-3">{item.dose}</td>
                                                        <td className="px-4 py-3">{item.frequency}</td>
                                                        <td className="px-4 py-3">{item.duration}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {!isReadOnly && <button onClick={() => removePrescriptionItem(index)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {prescriptionList.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-3 text-center text-slate-400 italic">No hay medicamentos agregados</td>
                                                    </tr>
                                                )}
                                                {!isReadOnly && (
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                                        <td className="px-4 py-2">
                                                            <input
                                                                value={rxInput.name}
                                                                onChange={(e) => setRxInput({ ...rxInput, name: e.target.value })}
                                                                onKeyPress={(e) => e.key === 'Enter' && addPrescriptionItem()}
                                                                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary outline-none py-1 text-sm dark:text-white"
                                                                placeholder="ej. Paracetamol 500mg"
                                                                type="text"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                value={rxInput.dose}
                                                                onChange={(e) => setRxInput({ ...rxInput, dose: e.target.value })}
                                                                onKeyPress={(e) => e.key === 'Enter' && addPrescriptionItem()}
                                                                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary outline-none py-1 text-sm dark:text-white"
                                                                placeholder="ej. 1 tableta"
                                                                type="text"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                value={rxInput.frequency}
                                                                onChange={(e) => setRxInput({ ...rxInput, frequency: e.target.value })}
                                                                onKeyPress={(e) => e.key === 'Enter' && addPrescriptionItem()}
                                                                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary outline-none py-1 text-sm dark:text-white"
                                                                placeholder="ej. Cada 8 horas"
                                                                type="text"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                value={rxInput.duration}
                                                                onChange={(e) => setRxInput({ ...rxInput, duration: e.target.value })}
                                                                onKeyPress={(e) => e.key === 'Enter' && addPrescriptionItem()}
                                                                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary outline-none py-1 text-sm dark:text-white"
                                                                placeholder="ej. 3 días"
                                                                type="text"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button onClick={addPrescriptionItem} disabled={!rxInput.name.trim()} className="text-primary hover:text-green-600 disabled:opacity-50"><span className="material-symbols-outlined">add_circle</span></button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Exams Module */}
                            <ExamsModule
                                examsRequested={examsRequested}
                                setExamsRequested={setExamsRequested}
                                examResults={examResults}
                                setExamResults={setExamResults}
                                requestVisible={showRequestExams}
                                setRequestVisible={setShowRequestExams}
                                resultsVisible={showResultExams}
                                setResultsVisible={setShowResultExams}
                            />

                            {/* Medical Rest */}
                            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <span className="material-symbols-outlined">sick</span>
                                        </span>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Reposo Médico</h3>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            checked={showMedicalRest}
                                            onChange={(e) => setShowMedicalRest(e.target.checked)}
                                            className="peer absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all duration-300 checked:right-0 checked:border-primary"
                                            id="toggle-rest"
                                            name="toggle-rest"
                                            type="checkbox"
                                        />
                                        <label className="block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300 peer-checked:bg-primary" htmlFor="toggle-rest"></label>
                                    </div>
                                </div>
                                <div className={`p-6 block transition-opacity duration-300 ${!showMedicalRest ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Días de Reposo</label>
                                            <input
                                                value={restDays}
                                                onChange={(e) => setRestDays(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                                                placeholder="Ej: 3 días"
                                                type="text"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                                            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        checked={restType === 'Apto'}
                                                        onChange={() => setRestType('Apto')}
                                                        className="text-primary focus:ring-primary"
                                                        name="aptitud"
                                                        type="radio"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Apto (Alta)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        checked={restType === 'Reposo'}
                                                        onChange={() => setRestType('Reposo')}
                                                        className="text-primary focus:ring-primary"
                                                        name="aptitud"
                                                        type="radio"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reposo</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4 mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => navigate('/clinical')}
                                className="w-full md:w-auto px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover text-slate-900 font-bold shadow-lg shadow-green-500/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <span className="size-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span className="material-symbols-outlined">task_alt</span>
                                )}
                                {saving ? 'Finalizando...' : 'Finalizar y Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
