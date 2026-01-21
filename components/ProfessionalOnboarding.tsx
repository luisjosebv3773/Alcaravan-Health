import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AppDialog from './AppDialog';

export default function ProfessionalOnboarding({ onOnboardingComplete }: { onOnboardingComplete?: () => void }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Form Data
    const [fullName, setFullName] = useState('');
    const [mpps, setMpps] = useState('');
    const [collegeNum, setCollegeNum] = useState('');
    const [bio, setBio] = useState('');
    const [modality, setModality] = useState('both');
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
    const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
    const [documentUrls, setDocumentUrls] = useState<string[]>([]);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signatureUrl, setSignatureUrl] = useState<string>('');

    // Data Sources
    const [availableSpecialties, setAvailableSpecialties] = useState<any[]>([]);

    // Role State
    const [userRole, setUserRole] = useState<string>('');

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const isNutritionist = userRole === 'nutri' || userRole === 'nutritionist';
    const totalSteps = isNutritionist ? 2 : 3;
    const currentStepDisplay = isNutritionist && step === 3 ? 2 : step;

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // 1. Get Profile Name & Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, mpps_registry, college_number, bio, consultation_modality, documents_url, signature_url')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || 'Dr. Alcaraván');
                setUserRole(profile.role || '');
                if (profile.mpps_registry) setMpps(profile.mpps_registry);
                if (profile.college_number) setCollegeNum(profile.college_number);
                if (profile.bio) setBio(profile.bio);
                if (profile.consultation_modality) setModality(profile.consultation_modality);
                if (profile.documents_url) setDocumentUrls(profile.documents_url);
                if (profile.signature_url) setSignatureUrl(profile.signature_url);
            }

            // 2. Load Specialties List
            const { data: specs } = await supabase
                .from('specialties')
                .select('*')
                .order('name');

            if (specs) setAvailableSpecialties(specs);

            // 3. Load User's existing specialties
            const { data: mySpecs } = await supabase
                .from('doctor_specialties')
                .select('specialty_id')
                .eq('doctor_id', session.user.id);

            if (mySpecs) {
                setSelectedSpecialties(mySpecs.map(s => s.specialty_id));
            }

        } catch (error) {
            console.error('Error loading onboarding data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSpecialty = (id: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(id)
                ? prev.filter(sid => sid !== id)
                : [...prev, id]
        );
    };

    const nextStep = () => {
        if (saving) return;
        if (step === 1 && isNutritionist) {
            setStep(3); // Skip specialties for nutritionist
        } else {
            setStep(p => Math.min(p + 1, 3));
        }
    };
    const prevStep = () => {
        if (saving) return;
        if (step === 3 && isNutritionist) {
            setStep(1); // Go back to identity
        } else {
            setStep(p => Math.max(p - 1, 1));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setVerificationFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setVerificationFiles(prev => prev.filter((_, i) => i !== index));
    };

    const filteredSpecialties = availableSpecialties.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedSpecialties.includes(s.id)
    );

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Basic Validation
        if (!mpps || !collegeNum) {
            alert('Por favor completa tu número de registro médico y colegio.');
            setStep(1);
            return;
        }

        if (!isNutritionist && selectedSpecialties.length === 0) {
            alert('Por favor selecciona al menos una especialidad.');
            setStep(2);
            return;
        }

        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            // 1. Upload Documents if any
            let uploadedUrls: string[] = [...documentUrls]; // Keep existing ones if we were editing (not implemented yet for existing)

            if (verificationFiles.length > 0) {
                for (const file of verificationFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${session.user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);

                    uploadedUrls.push(publicUrl);
                }
            }

            // Upload Signature if any
            let finalSignatureUrl = signatureUrl;
            if (signatureFile) {
                const fileExt = signatureFile.name.split('.').pop();
                const fileName = `${session.user.id}/signature_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: signatureUploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, signatureFile);

                if (signatureUploadError) throw signatureUploadError;

                const { data: { publicUrl: sigPublicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                finalSignatureUrl = sigPublicUrl;
            }

            // 2. Update Profile Fields
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    mpps_registry: mpps,
                    college_number: collegeNum,
                    bio: bio,
                    consultation_modality: modality,
                    documents_url: uploadedUrls,
                    signature_url: finalSignatureUrl,
                    // is_verified remains false until admin approves
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

            if (profileError) throw profileError;

            // 3. Update Specialties (Delete all & Insert new)
            // Ideally we'd optimize this but this is safe for consistency
            if (!isNutritionist) {
                await supabase.from('doctor_specialties').delete().eq('doctor_id', session.user.id);

                if (selectedSpecialties.length > 0) {
                    const specsToInsert = selectedSpecialties.map(sid => ({
                        doctor_id: session.user.id,
                        specialty_id: sid
                    }));
                    const { error: specError } = await supabase.from('doctor_specialties').insert(specsToInsert);
                    if (specError) throw specError;
                }
            }

            setShowSuccess(true);

        } catch (error: any) {
            alert('Error al guardar perfil: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Helper to get specialty name by ID
    const getSpecName = (id: string) => availableSpecialties.find(s => s.id === id)?.name || 'Unknown';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <span className="loader">Cargando...</span>
        </div>
    );

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased min-h-screen flex flex-col transition-colors duration-200">
            <AppDialog
                isOpen={showSuccess}
                onClose={() => onOnboardingComplete ? onOnboardingComplete() : navigate('/clinical')}
                title="¡Perfil Completado!"
                message="Tus datos han sido enviados para validación. Mientras tanto, puedes acceder a tu panel principal."
                primaryButtonText="Ir al Dashboard"
                onPrimaryAction={() => onOnboardingComplete ? onOnboardingComplete() : navigate('/clinical')}
                type="success"
            />

            <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-end px-4 lg:px-8 shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-400 uppercase">Onboarding Status</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Paso {currentStepDisplay} de {totalSteps}</span>
                    </div>
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${(currentStepDisplay / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-2xl w-full bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${((currentStepDisplay - 1) / (totalSteps - 1 || 1)) * 100}%` }}
                        ></div>
                    </div>
                    <div className="p-6 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Completa tu perfil profesional</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Para comenzar a ejercer dentro del ecosistema Alcaraván, necesitamos verificar tus credenciales médicas.</p>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            {/* Step 1: Identity & Credentials */}
                            {step === 1 && (
                                <section className="animate-fade-in">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary text-3xl">badge</span>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identidad y Credenciales</h2>
                                            <p className="text-xs text-slate-500">Información básica para tu perfil profesional</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Nombre Completo</label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-600 dark:text-slate-400 font-medium focus:ring-0 focus:border-slate-200 cursor-not-allowed"
                                                readOnly
                                                type="text"
                                                value={fullName}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">N° Registro Médico (MPPS)</label>
                                                <input
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                                    placeholder="Ej. 123456"
                                                    type="text"
                                                    value={mpps}
                                                    onChange={e => setMpps(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Colegio de Médicos</label>
                                                <input
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                                    placeholder="Ej. Distrito Capital"
                                                    type="text"
                                                    value={collegeNum}
                                                    onChange={e => setCollegeNum(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Biografía Profesional (Breve)</label>
                                            <textarea
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none resize-none"
                                                placeholder="Ej. Especialista en salud preventiva con 10 años de experiencia..."
                                                rows={3}
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Step 2: Specializations */}
                            {step === 2 && (
                                <section className="animate-fade-in">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Especialidades</h2>
                                            <p className="text-xs text-slate-500">Selecciona todas las áreas en las que ejerces</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                                            {selectedSpecialties.length > 0 ? selectedSpecialties.map(sid => (
                                                <span key={sid} className="inline-flex items-center gap-1.5 bg-primary/10 text-slate-900 dark:text-white text-xs font-bold py-1.5 px-3 rounded-full border border-primary/20">
                                                    {getSpecName(sid)}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSpecialty(sid)}
                                                        className="material-symbols-outlined text-sm hover:text-red-500 transition-colors"
                                                    >
                                                        close
                                                    </button>
                                                </span>
                                            )) : (
                                                <span className="text-sm text-slate-400 italic py-2">No has seleccionado ninguna especialidad</span>
                                            )}
                                        </div>
                                        <div className="relative mb-4">
                                            <span className="absolute left-3 top-3 material-symbols-outlined text-gray-400">search</span>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                                placeholder="Buscar especialidad (ej. Cardiología)..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                            />
                                        </div>

                                        {/* Dropdown Suggestions */}
                                        {searchTerm && (
                                            <div className="mt-2 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-white dark:bg-slate-800 shadow-lg">
                                                {filteredSpecialties.length > 0 ? (
                                                    filteredSpecialties.map(spec => (
                                                        <div
                                                            key={spec.id}
                                                            onClick={() => {
                                                                toggleSpecialty(spec.id);
                                                                setSearchTerm('');
                                                            }}
                                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between group border-b border-slate-50 dark:border-slate-700 last:border-0"
                                                        >
                                                            <span className="font-medium text-slate-700 dark:text-slate-200">{spec.name}</span>
                                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">add_circle</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-slate-500 p-4 text-center">No se encontraron resultados.</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Add Badges */}
                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Sugerencias Populares</p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSpecialties.slice(0, 6).filter(s => !selectedSpecialties.includes(s.id)).map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleSpecialty(s.id)}
                                                        className="text-xs font-medium py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                                    >
                                                        + {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Step 3: Documents & Modality */}
                            {step === 3 && (
                                <section className="animate-fade-in">
                                    <div className="space-y-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined text-primary">upload_file</span>
                                                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Documentos de Verificación</h2>
                                            </div>
                                            <div
                                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-primary/50 transition-all cursor-pointer group"
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    multiple
                                                    className="hidden"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={handleFileSelect}
                                                />
                                                <div className="size-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-3xl">cloud_upload</span>
                                                </div>
                                                <p className="text-base font-bold text-slate-900 dark:text-white">Haz clic para seleccionar archivos</p>
                                                <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">Sube tu Título de Especialista o Carnet del Colegio de Médicos (PDF, JPG hasta 10MB)</p>
                                            </div>

                                            {/* File List */}
                                            {verificationFiles.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {verificationFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary/10 p-2 rounded text-primary">
                                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{file.name}</p>
                                                                    <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(idx)}
                                                                className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined">delete</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined text-primary">draw</span>
                                                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Sello Húmedo / Firma</h2>
                                            </div>
                                            <div
                                                className="relative group border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                                                onClick={() => document.getElementById('signature-upload')?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="signature-upload"
                                                    className="hidden"
                                                    accept=".png,.jpg,.jpeg"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setSignatureFile(e.target.files[0]);
                                                    }}
                                                />
                                                {signatureFile || signatureUrl ? (
                                                    <div className="relative w-full flex flex-col items-center">
                                                        <img
                                                            src={signatureFile ? URL.createObjectURL(signatureFile) : signatureUrl}
                                                            alt="Sello/Firma"
                                                            className="h-24 object-contain mb-2"
                                                        />
                                                        <p className="text-[10px] text-slate-500 font-medium">Click para cambiar imagen</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-slate-400 mb-2 text-3xl">add_photo_alternate</span>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Subir firma o sello</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Sugerido: PNG con fondo transparente</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined text-primary">video_chat</span>
                                                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Modalidad de Consulta</h2>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'virtual', label: 'Virtual', sub: 'Google Meet', icon: 'videocam' },
                                                    { id: 'presencial', label: 'Presencial', sub: 'En Consultorio', icon: 'meeting_room' },
                                                    { id: 'both', label: 'Ambas', sub: 'Híbrido', icon: 'all_inclusive' }
                                                ].map(m => (
                                                    <label key={m.id} className={`
                                                    relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border rounded-xl cursor-pointer hover:border-primary/50 transition-all group
                                                    ${modality === m.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 dark:border-slate-700'}
                                                `}>
                                                        <input
                                                            type="radio"
                                                            name="modality"
                                                            className="sr-only"
                                                            checked={modality === m.id}
                                                            onChange={() => setModality(m.id)}
                                                        />
                                                        <span className={`material-symbols-outlined mb-2 transition-colors ${modality === m.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
                                                            {m.icon}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.label}</span>
                                                        <span className="text-[10px] text-slate-400">{m.sub}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Navigation Actions */}
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                                {currentStepDisplay > 1 ? (
                                    <button
                                        className="flex-1 order-2 sm:order-1 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        type="button"
                                        onClick={prevStep}
                                    >
                                        Atrás
                                    </button>
                                ) : (
                                    <div className="flex-1 sm:order-1"></div>
                                )}

                                {currentStepDisplay < totalSteps ? (
                                    <button
                                        className="flex-[2] order-1 sm:order-2 bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 px-8 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                        type="button"
                                        onClick={nextStep}
                                    >
                                        Siguiente Paso
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled={saving}
                                        className="flex-[2] order-1 sm:order-2 bg-primary text-slate-900 font-black py-4 px-8 rounded-xl shadow-lg shadow-green-500/20 hover:bg-[#0fdc52] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                        type="button"
                                        onClick={() => handleSubmit()}
                                    >
                                        {saving ? 'Guardando...' : 'Finalizar Perfil'}
                                        {!saving && <span className="material-symbols-outlined">rocket_launch</span>}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <footer className="p-6 text-center text-slate-400 text-xs">
                <p>© 2026 Sistemas Tecnológicos Alcaraván. All clinical data is encrypted and HIPAA compliant.</p>
            </footer>
        </div>
    );
}
