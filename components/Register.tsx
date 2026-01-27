
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import AppDialog from './AppDialog';
import { Logo } from './Logo';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'role' | 'details'>('role');
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        cedula: '',
        birthDate: '',
        role: null as UserRole | null
    });

    const [cedulaError, setCedulaError] = useState<string | null>(null);

    const roles = [
        {
            id: UserRole.PATIENT,
            title: 'Paciente',
            icon: 'person',
            desc: 'Acceder a mis resultados y citas',
            color: 'bg-primary/10 border-primary'
        },
        {
            id: UserRole.DOCTOR,
            title: 'Médico',
            icon: 'medical_services',
            desc: 'Gestionar agenda y fichas',
            color: 'bg-blue-500/10 border-blue-500'
        },
        {
            id: UserRole.NUTRITIONIST,
            title: 'Nutricionista',
            icon: 'restaurant',
            desc: 'Evaluaciones y dietas',
            color: 'bg-orange-500/10 border-orange-500'
        }
    ];


    const checkCedula = async (cedula: string) => {
        if (cedula.length > 5) {
            const { data, error } = await supabase
                .rpc('check_cedula', { cedula_input: cedula });

            if (data === true) {
                setCedulaError('Esta cédula ya está registrada y asociada a otro usuario.');
            } else {
                setCedulaError(null);
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.role || !formData.email || !formData.password || !formData.fullName || !formData.cedula || !formData.birthDate) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (cedulaError) return;

        setLoading(true);
        setError(null);

        try {
            // Check cedula uniqueness again before submit
            const { data: cedulaExists } = await supabase.rpc('check_cedula', { cedula_input: formData.cedula });
            if (cedulaExists === true) {
                throw new Error('Esta cédula ya está registrada en el sistema.');
            }

            // Map App UserRole to Database Role string
            let dbRole = 'paciente'; // default
            if (formData.role === UserRole.DOCTOR) dbRole = 'doctor';
            else if (formData.role === UserRole.NUTRITIONIST) dbRole = 'nutri';
            else if (formData.role === UserRole.PATIENT) dbRole = 'paciente';

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: dbRole,
                        cedula: formData.cedula,
                        birth_date: formData.birthDate
                    },
                    emailRedirectTo: `${window.location.origin}/login`
                }
            });

            if (signUpError) throw signUpError;

            // CRITICAL CHECK: if identities is empty array, it means user already exists (but Supabase returned fake 200 for security)
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                throw new Error('Este correo electrónico ya está registrado. Por favor inicia sesión.');
            }

            if (data.user) {
                setShowSuccessDialog(true);
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrarte');
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        setShowSuccessDialog(false);
        navigate('/login');
    };

    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
            <AppDialog
                isOpen={showSuccessDialog}
                onClose={handleDialogClose}
                title="Registro Exitoso"
                message="Tu cuenta ha sido creada correctamente en el ecosistema Alcaraván Health. Por favor revisa tu bandeja de entrada para confirmar tu correo electrónico antes de iniciar sesión."
                primaryButtonText="Aceptar"
                onPrimaryAction={handleDialogClose}
            />

            <div className="w-full max-w-2xl bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

                <div className="p-8 lg:p-12 relative">
                    <Link to="/login" className="absolute top-8 right-8 text-sm font-bold text-primary hover:underline">
                        ¿Ya tienes cuenta?
                    </Link>

                    <div className="mb-8">
                        <div className="flex justify-center mb-6">
                            <Logo className="size-20" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-center">Crear Cuenta</h3>
                        <p className="text-text-sub dark:text-gray-400 text-center">
                            {step === 'role' ? 'Selecciona tu tipo de perfil' : 'Ingresa tus datos personales'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === 'role' ? (
                        <div className="space-y-4">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${formData.role === role.id
                                        ? `${role.color} border-current scale-[1.02] shadow-lg`
                                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${formData.role === role.id ? 'bg-white/50' : 'bg-white dark:bg-gray-700 shadow-sm'}`}>
                                        <span className={`material-symbols-outlined ${formData.role === role.id ? 'text-black' : 'text-gray-500'}`}>{role.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{role.title}</h4>
                                        <p className="text-xs text-text-sub dark:text-gray-400">{role.desc}</p>
                                    </div>
                                    {formData.role === role.id && (
                                        <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                                    )}
                                </button>
                            ))}
                            <button
                                disabled={!formData.role}
                                onClick={() => setStep('details')}
                                className="w-full mt-6 py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continuar
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Cédula de Identidad</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.cedula}
                                        onChange={(e) => {
                                            setFormData({ ...formData, cedula: e.target.value });
                                            if (cedulaError) setCedulaError(null);
                                        }}
                                        onBlur={(e) => checkCedula(e.target.value)}
                                        className={`w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none ${cedulaError ? 'ring-2 ring-red-500' : ''}`}
                                        placeholder="Ej. 12345678"
                                    />
                                    {cedulaError && <p className="text-xs text-red-500 mt-1 font-bold">{cedulaError}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        required
                                        max={todayDate}
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="ejemplo@alcaravan.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('role')}
                                    className="px-6 py-4 bg-gray-100 dark:bg-gray-800 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !!cedulaError}
                                    className="flex-1 py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Creando cuenta...' : 'Completar Registro'}
                                    {!loading && <span className="material-symbols-outlined">check_circle</span>}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
