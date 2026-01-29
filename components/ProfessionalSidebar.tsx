
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { Logo } from './Logo';

interface ProfessionalSidebarProps {
    role: UserRole;
}

export default function ProfessionalSidebar({ role }: ProfessionalSidebarProps) {
    const location = useLocation();

    const menuItems = [
        {
            label: 'Agenda Hoy',
            icon: 'calendar_today',
            path: role === UserRole.DOCTOR ? '/clinical' : '/nutrition',
        },
        {
            label: 'Directorio Pacientes',
            icon: 'group',
            path: '/patients',
        },
        {
            label: 'Historial General',
            icon: 'history',
            path: '/appointment-history-pro',
        },
        {
            label: 'Configuración',
            icon: 'settings',
            path: '/profile', // Usamos el perfil actual para configuración
        },
    ];

    return (
        <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-100 dark:border-border-dark flex flex-col shrink-0 h-[calc(100vh-73px)] sticky top-[73px]">
            <div className="p-6 flex-1 flex flex-col min-h-0">
                <nav className="flex flex-col gap-3 flex-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold text-sm ${isActive
                                    ? 'bg-primary text-slate-900 shadow-md shadow-primary/20'
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto pt-6 flex flex-col gap-6">
                    <div className="flex justify-center opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Alcaraván Health Logo">
                        <Logo className="h-12 w-auto" />
                    </div>
                    <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-transparent dark:border-white/5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Software Médico</p>
                        <p className="text-[10px] text-slate-400 text-center font-bold">Alcaraván Health v1.2</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
