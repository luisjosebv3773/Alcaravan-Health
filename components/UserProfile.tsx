
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
        avatar_url: ''
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
                .select('full_name, cedula, birth_date, gender, blood_type, allergies, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.warn('Error fetching profile extras:', error);
            }

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    cedula: data.cedula || '',
                    birth_date: data.birth_date || '',
                    gender: data.gender || 'Masculino',
                    blood_type: data.blood_type || 'O+',
                    allergies: data.allergies || '',
                    avatar_url: data.avatar_url || ''
                });
            }
        } catch (error: any) {
            console.error('Error loading user data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const updates = {
                id: session.user.id,
                ...profile,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
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
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8 font-display">
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
