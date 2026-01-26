
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';

export default function UserProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profile, setProfile] = useState({
        full_name: '',
        cedula: '',
        birth_date: '',
        gender: '',
        blood_type: '',
        allergies: '',
        avatar_url: '',
        role: ''
    });
    const [allSpecialties, setAllSpecialties] = useState<any[]>([]);
    const [mySpecialties, setMySpecialties] = useState<string[]>([]);
    const [profDetails, setProfDetails] = useState({
        mpps_registry: '',
        college_number: '',
        bio: '',
        consultation_modality: 'presencial',
        signature_url: '',
        working_hours: {} as any
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error('No session');

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            if (data) {
                // Fetch Health Profile data
                const { data: healthData } = await supabase
                    .from('perfil_actual_salud')
                    .select('blood_type, allergies')
                    .eq('patient_id', session.user.id)
                    .single();

                setProfile({
                    full_name: data.full_name || '',
                    cedula: data.cedula || '',
                    birth_date: data.birth_date || '',
                    gender: data.gender || 'Masculino',
                    avatar_url: data.avatar_url || '',
                    role: data.role || '',
                    blood_type: healthData?.blood_type || 'O+',
                    allergies: healthData?.allergies || ''
                });

                if (data.role === 'doctor' || data.role === 'nutri' || data.role === 'nutritionist') {
                    setProfDetails({
                        mpps_registry: data.mpps_registry || '',
                        college_number: data.college_number || '',
                        bio: data.bio || '',
                        consultation_modality: data.consultation_modality || 'presencial',
                        signature_url: data.signature_url || '',
                        working_hours: data.working_hours || {}
                    });
                    getSpecialties(session.user.id);
                }
            }
        } catch (error: any) {
            console.error('Error loading user data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getSpecialties = async (userId: string) => {
        // Fetch Dictionary
        const { data: specs } = await supabase.from('specialties').select('*').order('name');
        if (specs) setAllSpecialties(specs);

        // Fetch User Specialties
        const { data: userSpecs } = await supabase
            .from('doctor_specialties')
            .select('specialty_id')
            .eq('doctor_id', userId);

        if (userSpecs) {
            setMySpecialties(userSpecs.map(us => us.specialty_id));
        }
    };

    const toggleSpecialty = (id: string) => {
        setMySpecialties(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const profileUpdates = {
                id: session.user.id,
                full_name: profile.full_name,
                birth_date: profile.birth_date,
                gender: profile.gender,
                avatar_url: profile.avatar_url,
                ...(profile.role !== 'paciente' ? profDetails : {}),
                updated_at: new Date()
            };

            const { error: profileError } = await supabase.from('profiles').upsert(profileUpdates);
            if (profileError) throw profileError;


            // Update Health Profile
            const healthUpdates = {
                patient_id: session.user.id,
                blood_type: profile.blood_type,
                allergies: profile.allergies,
                updated_at: new Date()
            };

            const { error: healthError } = await supabase
                .from('perfil_actual_salud')
                .upsert(healthUpdates);

            if (healthError) throw healthError;

            // Update Specialties if doctor
            if (profile.role === 'doctor' || profile.role === 'nutri' || profile.role === 'nutritionist') {
                // Delete all existing
                await supabase.from('doctor_specialties').delete().eq('doctor_id', session.user.id);

                // Insert new ones
                if (mySpecialties.length > 0) {
                    // Filter duplicates to prevent 409 Conflict
                    const uniqueSpecs = [...new Set(mySpecialties)];
                    const specialtyInserts = uniqueSpecs.map(sid => ({
                        doctor_id: session.user.id,
                        specialty_id: sid
                    }));
                    await supabase.from('doctor_specialties').insert(specialtyInserts);
                }
            }

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });

            // Refresh Header data by reloading or notifying
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al actualizar: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-background-light dark:bg-background-dark p-4 md:p-8 font-display">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Mi Perfil</h1>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-500/20"></div>

                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-between items-end">
                            <div className="size-32 rounded-2xl border-4 border-white dark:border-card-dark shadow-lg bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-slate-300">person</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </div>
                                {/* TODO: Implement Image Upload */}
                                <input
                                    type="text"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const url = prompt("Ingresa URL de la imagen de perfil:", profile.avatar_url);
                                        if (url !== null) setProfile({ ...profile, avatar_url: url });
                                    }}
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={updateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cédula</label>
                                    <input
                                        type="text"
                                        value={profile.cedula}
                                        disabled
                                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Fecha Nacimiento</label>
                                    <input
                                        type="date"
                                        value={profile.birth_date}
                                        onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Género</label>
                                    <select
                                        value={profile.gender}
                                        onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                    >
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tipo de Sangre</label>
                                    <select
                                        value={profile.blood_type}
                                        onChange={e => setProfile({ ...profile, blood_type: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                    >
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Alergias Conocidas</label>
                                <textarea
                                    value={profile.allergies}
                                    onChange={e => setProfile({ ...profile, allergies: e.target.value })}
                                    placeholder="Ej. Penicilina, Nueces..."
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                />
                            </div>

                            {(profile.role === 'doctor' || profile.role === 'nutri' || profile.role === 'nutritionist') && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Especialidades Médicas</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {allSpecialties.map((spec) => (
                                            <label key={spec.id} className={`
                                                cursor-pointer p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between
                                                ${mySpecialties.includes(spec.id)
                                                    ? 'bg-primary/10 border-primary text-primary-dark dark:text-primary'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50'}
                                            `}>
                                                <span>{spec.name}</span>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={mySpecialties.includes(spec.id)}
                                                    onChange={() => toggleSpecialty(spec.id)}
                                                />
                                                {mySpecialties.includes(spec.id) && (
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Seleccione todas las que apliquen.</p>
                                </div>
                            )}

                            {(profile.role === 'doctor' || profile.role === 'nutri' || profile.role === 'nutritionist') && (
                                <div className="space-y-6 animate-fade-in border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined">settings_suggest</span>
                                        Configuración Profesional
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Registro MPPS</label>
                                            <input
                                                type="text"
                                                value={profDetails.mpps_registry}
                                                onChange={e => setProfDetails({ ...profDetails, mpps_registry: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cómite Elector / Colegio</label>
                                            <input
                                                type="text"
                                                value={profDetails.college_number}
                                                onChange={e => setProfDetails({ ...profDetails, college_number: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Biografía Médica</label>
                                        <textarea
                                            value={profDetails.bio}
                                            onChange={e => setProfDetails({ ...profDetails, bio: e.target.value })}
                                            rows={3}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Sello y Firma Digital</label>
                                            <div
                                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => {
                                                    const url = prompt("URL del sello digital (PNG sugerido):", profDetails.signature_url);
                                                    if (url !== null) setProfDetails({ ...profDetails, signature_url: url });
                                                }}
                                            >
                                                {profDetails.signature_url ? (
                                                    <img src={profDetails.signature_url} alt="Firma" className="h-20 object-contain" />
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-slate-300 text-3xl">draw</span>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Subir Sello / Firma</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Modalidad</label>
                                            <div className="flex flex-col gap-2">
                                                {['presencial', 'virtual', 'both'].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setProfDetails({ ...profDetails, consultation_modality: m })}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all ${profDetails.consultation_modality === m
                                                            ? 'bg-primary/10 border-primary text-primary-dark'
                                                            : 'bg-white border-slate-200 text-slate-500'
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            {m === 'virtual' ? 'videocam' : m === 'presencial' ? 'home_health' : 'all_inclusive'}
                                                        </span>
                                                        {m === 'virtual' ? 'Sólo Virtual' : m === 'presencial' ? 'Sólo Presencial' : 'Híbrida (Ambas)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    {!saving && <span className="material-symbols-outlined">save</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
