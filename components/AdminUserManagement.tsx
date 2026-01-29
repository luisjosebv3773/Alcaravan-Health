import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';
import { Link, useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url: string | null;
    created_at: string;
}

const AdminUserManagement: React.FC = () => {
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState('Alex Rivera');
    const [adminAvatar, setAdminAvatar] = useState('https://lh3.googleusercontent.com/a/default-user=s120-c');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' });

            if (roleFilter !== 'all') {
                query = query.eq('role', roleFilter);
            }

            if (searchQuery) {
                query = query.ilike('full_name', `%${searchQuery}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAdminProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.full_name) setAdminName(profile.full_name);
                    if (profile.avatar_url) setAdminAvatar(profile.avatar_url);
                }
            }
        };
        fetchAdminProfile();
        fetchUsers();
    }, [roleFilter, searchQuery]);

    const getRoleLabel = (role: string) => {
        switch (role.toLowerCase()) {
            case 'doctor': return 'Doctor';
            case 'paciente': return 'Paciente';
            case 'nutri':
            case 'nutritionist': return 'Nutricionista';
            case 'admin': return 'Administrador';
            default: return role;
        }
    };

    const formatLastActive = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMins < 60) return `hace ${diffInMins} min`;
        if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
            {/* Sidebar */}
            <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
                <div className="p-6 flex items-center gap-3">
                    <Logo className="size-8" showText={false} />
                    <h1 className="text-lg font-bold tracking-tight">Alcaraván</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Menú Principal</div>
                    <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Panel</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary group">
                        <span className="material-symbols-outlined filled-icon">group</span>
                        <span className="text-sm font-medium font-bold">Gestión de Usuarios</span>
                    </Link>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">query_stats</span>
                        <span className="text-sm font-medium">Monitoreo de IA</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">calendar_month</span>
                        <span className="text-sm font-medium">Citas Globales</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">send</span>
                        <span className="text-sm font-medium">Consola Push</span>
                    </a>

                    <div className="py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Sistema</div>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Ajustes del Sistema</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" href="#">
                        <span className="material-symbols-outlined">security</span>
                        <span className="text-sm font-medium">Registros y Seguridad</span>
                    </a>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                        <div
                            className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20"
                            style={{ backgroundImage: `url('${adminAvatar}')` }}
                        ></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{adminName}</p>
                            <p className="text-xs text-slate-500 truncate">Admin de Plataforma</p>
                        </div>
                        <span onClick={handleLogout} className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-white transition-colors">logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark">
                <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                            <input
                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white"
                                placeholder="Buscar usuarios por nombre..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-slate-100 dark:bg-white/5 border-none rounded-lg text-xs font-semibold py-2 px-3 focus:ring-1 focus:ring-primary min-w-[120px] text-slate-700 dark:text-slate-300"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">Filtrar por Rol</option>
                                <option value="admin">Administrador</option>
                                <option value="doctor">Doctor</option>
                                <option value="paciente">Paciente</option>
                                <option value="nutritionist">Nutricionista</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                            <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold text-primary uppercase">Modo En Vivo</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold">Administración de Usuarios</h2>
                            <p className="text-sm text-slate-500">Supervisión de identidades y permisos de acceso global.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Total Usuarios</p>
                            <p className="text-xl font-bold">{totalCount.toLocaleString()}</p>
                        </div>
                    </div>

                    <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Rol (RBAC)</th>
                                        <th className="px-6 py-4">Estado de Cuenta</th>
                                        <th className="px-6 py-4">Última Actividad</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-900 dark:text-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                                Cargando usuarios...
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {u.avatar_url ? (
                                                            <div className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundImage: `url('${u.avatar_url}')` }}></div>
                                                        ) : (
                                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold border border-slate-300 dark:border-white/10 text-slate-500">
                                                                {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold">{u.full_name}</p>
                                                            <p className="text-xs text-slate-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${u.role === 'doctor' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                            u.role === 'paciente' ? 'bg-primary/10 text-primary border-primary/20' :
                                                                u.role === 'nutri' || u.role === 'nutritionist' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                                    'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                        }`}>
                                                        {getRoleLabel(u.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="size-1.5 rounded-full bg-primary"></span>
                                                        <span className="text-xs font-semibold">Activa</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{formatLastActive(u.created_at)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end">
                                                        <button className="px-3 py-1 text-[11px] font-bold rounded bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-slate-600 dark:text-slate-300">Editar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                                No se encontraron usuarios.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{users.length}</span> de <span className="font-bold text-slate-700 dark:text-slate-300">{totalCount.toLocaleString()}</span> usuarios</p>
                            <div className="flex gap-2">
                                <button className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <button className="p-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-bold px-2 text-primary">1</button>
                                <button className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold px-2 text-slate-500">2</button>
                                <button className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold px-2 text-slate-500">3</button>
                                <button className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminUserManagement;
