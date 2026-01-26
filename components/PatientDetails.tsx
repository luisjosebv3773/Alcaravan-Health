import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import DoctorPatientDetails from './DoctorPatientDetails';
import NutritionPatientDetails from './NutritionPatientDetails';

export default function PatientDetails() {
    const { id } = useParams();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setRole(data?.role || 'paciente');
            }
            setLoading(false);
        };
        fetchRole();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (role === 'doctor') {
        return <DoctorPatientDetails />;
    }

    return <NutritionPatientDetails />;
}
