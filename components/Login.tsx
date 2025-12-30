
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

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
      desc: 'Gestionar agenda y fichas de pacientes',
      color: 'bg-blue-500/10 border-blue-500'
    },
    {
      id: UserRole.NUTRITIONIST,
      title: 'Nutricionista',
      icon: 'restaurant',
      desc: 'Evaluaciones nutricionales y planes de dieta',
      color: 'bg-orange-500/10 border-orange-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-card-light dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        <div className="bg-primary p-12 flex flex-col justify-between text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined !text-[200px]">health_and_safety</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined !text-4xl">health_and_safety</span>
              <h1 className="text-2xl font-black tracking-tight italic">Alcaraván Health</h1>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-4">Gestión de Salud <br/> Personalizada.</h2>
            <p className="font-medium opacity-80">Bienvenido de nuevo. Por favor selecciona tu espacio de trabajo para continuar gestionando tus datos de salud.</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-60">
            Impulsado por el Motor de IA Gemini
          </div>
        </div>

        <div className="p-8 lg:p-12">
          <div className="mb-10">
            <h3 className="text-2xl font-bold mb-2">Iniciar Sesión</h3>
            <p className="text-text-sub dark:text-gray-400">Elige tu perfil para proceder al panel de control.</p>
          </div>

          <div className="space-y-4 mb-10">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedRole === role.id 
                    ? `${role.color} border-current scale-[1.02] shadow-lg` 
                    : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`p-3 rounded-xl ${selectedRole === role.id ? 'bg-white/50' : 'bg-white dark:bg-gray-700 shadow-sm'}`}>
                  <span className={`material-symbols-outlined ${selectedRole === role.id ? 'text-black' : 'text-gray-500'}`}>{role.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold">{role.title}</h4>
                  <p className="text-xs text-text-sub dark:text-gray-400">{role.desc}</p>
                </div>
                {selectedRole === role.id && (
                  <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                )}
              </button>
            ))}
          </div>

          <button
            disabled={!selectedRole}
            onClick={() => selectedRole && onLogin(selectedRole)}
            className="w-full py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Entrar al Panel
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
