import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';
import { calculateAdvancedMetrics, calculateAge } from '../utils/healthMetrics';
import AppDialog from './AppDialog';

type DialogType = 'success' | 'error' | 'confirm' | 'info';

export default function NutritionistEvaluation() {
  const { id, evaluationId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    weight: 0,
    height: 0,
    envergadura: 0,
    arm: 0,
    waist: 0,
    hip: 0,
    wrist: 0,
    body_fat: 0,
    neck: 0
  });

  const [habits, setHabits] = useState({
    alcohol: 'Nunca',
    alcohol_notes: '',
    smoking: 'Nunca ha fumado',
    smoking_qty: 0,
    caffeine_qty: 0,
    caffeine_type: 'Café',
    water_glasses: 0
  });

  const [sleepStress, setSleepStress] = useState({
    hours: 0,
    quality: 'Reparador',
    stress: 'Bajo',
    screens: false
  });

  const [dietHabits, setDietHabits] = useState({
    meals_per_day: 3,
    lunch_place: 'Comedor Empresa',
    ultraprocessed: 'Rara vez',
    allergies: ''
  });

  const [physicalActivity, setPhysicalActivity] = useState({
    hours_sitting: 0,
    exercise_hours: 0,
    frequency: 'Sedentario',
    type: 'Fuerza (Pesas/Calistenia)'
  });

  const [medicalHistory, setMedicalHistory] = useState({
    medications: '',
    supplements: '',
    previous_diagnoses: ''
  });

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('Nunca');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: DialogType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ type: 'info', title: '', message: '' });

  const handleMetricChange = (name: string, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleHabitsChange = (name: string, value: any) => {
    setHabits(prev => ({ ...prev, [name]: value }));
  };

  const handleSleepChange = (name: string, value: any) => {
    setSleepStress(prev => ({ ...prev, [name]: value }));
  };

  const handleDietChange = (name: string, value: any) => {
    setDietHabits(prev => ({ ...prev, [name]: value }));
  };

  const handleActivityChange = (name: string, value: any) => {
    setPhysicalActivity(prev => ({ ...prev, [name]: value }));
  };

  const handleHistoryChange = (name: string, value: any) => {
    setMedicalHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión de usuario');

      // 1. Calcular métricas avanzadas (usando util)
      const currentDateAge = calculateAge(patient?.birth_date || '');
      const advancedMetrics = calculateAdvancedMetrics({
        weight: Number(metrics.weight),
        height: Number(metrics.height),
        waist: Number(metrics.waist),
        hip: Number(metrics.hip),
        neck: Number(metrics.neck),
        age: currentDateAge,
        gender: patient?.gender === 'Femenino' || patient?.gender === 'Mujer' ? 'female' : 'male'
      });

      // 2. Preparar resumen descriptivo para el historial (matching user's expected format)
      const bmiRes = getBMIData();
      const bodyFatRes = getBodyFatData();
      const whrRes = getWHRData();

      const summaryText = `Paciente con IMC de ${advancedMetrics.bmi} (${bmiRes.status}), Grasa Corporal del ${advancedMetrics.bodyFat}% (${bodyFatRes.status}) y ICC de ${advancedMetrics.whr} (${whrRes.status}).`;

      const evaluationData = {
        patient_id: id,
        nutritionist_id: user.id,
        metrics: {
          ...metrics,
          body_fat: advancedMetrics.bodyFat
        },
        habits,
        sleep_stress: sleepStress,
        diet_habits: dietHabits,
        physical_activity: physicalActivity,
        medical_history: medicalHistory,
        ai_summary: summaryText
      };

      // 3. Guardar en historial
      console.log('Guardando en nutritional_evaluations...');
      let saveError;
      if (evaluationId) {
        const { error } = await supabase.from('nutritional_evaluations').update(evaluationData).eq('id', evaluationId);
        saveError = error;
      } else {
        const { error } = await supabase.from('nutritional_evaluations').insert([evaluationData]);
        saveError = error;
      }
      if (saveError) throw saveError;

      // 4. Upsert en perfil_actual_salud
      const profileHealthData = {
        patient_id: id,
        weight: Number(metrics.weight),
        height: Number(metrics.height),
        bmi: advancedMetrics.bmi,
        whr: advancedMetrics.whr,
        muscle_mass_kg: advancedMetrics.muscleMass,
        body_fat_pct: advancedMetrics.bodyFat,
        body_water_pct: advancedMetrics.waterPct,
        protein_pct: advancedMetrics.proteinPct,
        bmr_kcal: advancedMetrics.bmr,
        visceral_fat_level: advancedMetrics.visceralFatLevel,
        blood_type: patient?.blood_type,
        allergies: dietHabits.allergies,
        medical_history: medicalHistory.previous_diagnoses,
        medications: medicalHistory.medications,
        risk_status: whrRes.status.includes('Alto') ? 'Alto' : 'Bajo',
        updated_at: new Date().toISOString()
      };

      console.log('Intentando UPSERT en perfil_actual_salud...', profileHealthData);
      const { error: healthProfileError } = await supabase
        .from('perfil_actual_salud')
        .upsert(profileHealthData, { onConflict: 'patient_id' });

      if (healthProfileError) {
        console.error('DETALLE ERROR UPSERT:', healthProfileError);
        throw new Error(`Perfil Salud: ${healthProfileError.message}`);
      }
      console.log('UPSERT exitoso');

      // 5. Exito y Notificación
      setDialogConfig({
        type: 'success',
        title: evaluationId ? 'Evaluación Actualizada' : 'Evaluación Guardada',
        message: 'La evaluación nutricional y el perfil de salud han sido actualizados.',
        onConfirm: () => navigate(`/patient-details/${id}`)
      });
      setDialogOpen(true);
      setLastSaved(new Date());

      if (!evaluationId) {
        await supabase
          .from('notificaciones')
          .insert({
            user_id: id,
            titulo: 'Nueva Evaluación Nutricional',
            mensaje: 'Tu nutricionista ha registrado una nueva evaluación. ¡Revisa tu progreso!',
            tipo: 'evaluacion'
          });
      }
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
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

  const getBMIData = () => {
    if (metrics.weight <= 0 || metrics.height <= 0) return { value: '0.0', status: 'Esperando datos', color: 'gray', progress: 0 };
    const heightInMeters = metrics.height / 100;
    const bmi = metrics.weight / (heightInMeters * heightInMeters);
    let status = '';
    let color = '';
    let progress = 0;

    if (bmi < 18.5) {
      status = 'Bajo Peso';
      color = 'blue';
      progress = 25;
    } else if (bmi < 25) {
      status = 'Peso Normal';
      color = 'primary';
      progress = 50;
    } else if (bmi < 30) {
      status = 'Sobrepeso';
      color = 'yellow';
      progress = 75;
    } else {
      status = 'Obesidad';
      color = 'red';
      progress = 100;
    }

    return { value: bmi.toFixed(1), status, color, progress };
  };

  const getWHRData = () => {
    if (metrics.waist <= 0 || metrics.hip <= 0) return { value: '0.00', status: 'Esperando datos', color: 'gray', progress: 0 };
    const whr = metrics.waist / metrics.hip;
    const gender = patient?.gender?.toLowerCase() || 'no definido';
    let status = '';
    let color = '';
    let progress = 0;

    if (gender === 'femenino' || gender === 'mujer') {
      if (whr <= 0.80) { status = 'Riesgo Bajo'; color = 'primary'; progress = 33; }
      else if (whr <= 0.85) { status = 'Riesgo Moderado'; color = 'yellow'; progress = 66; }
      else { status = 'Riesgo Alto'; color = 'red'; progress = 100; }
    } else {
      // Masculino o por defecto
      if (whr <= 0.94) { status = 'Riesgo Bajo'; color = 'primary'; progress = 33; }
      else if (whr <= 1.00) { status = 'Riesgo Moderado'; color = 'yellow'; progress = 66; }
      else { status = 'Riesgo Alto'; color = 'red'; progress = 100; }
    }

    return { value: whr.toFixed(2), status, color, progress };
  };

  const getBoneFrameData = () => {
    if (metrics.height <= 0 || metrics.wrist <= 0) return { value: '0.0', status: 'Esperando datos', color: 'gray', progress: 0 };
    const r = metrics.height / metrics.wrist;
    const gender = patient?.gender?.toLowerCase() || 'no definido';
    let status = '';
    let color = 'primary';
    let progress = 50;

    if (gender === 'femenino' || gender === 'mujer') {
      if (r > 11.0) { status = 'Pequeña'; progress = 25; }
      else if (r >= 10.1) { status = 'Mediana'; progress = 50; }
      else { status = 'Grande'; progress = 75; }
    } else {
      // Masculino o por defecto
      if (r > 10.4) { status = 'Pequeña'; progress = 25; }
      else if (r >= 9.6) { status = 'Mediana'; progress = 50; }
      else { status = 'Grande'; progress = 75; }
    }

    return { value: r.toFixed(1), status, color, progress };
  };

  const getBodyFatData = () => {
    const { weight, height, waist, hip, neck } = metrics;
    if (height <= 0 || neck <= 0 || waist <= 0) return { value: '0.0', status: 'Esperando datos', color: 'gray', progress: 0 };

    const gender = patient?.gender?.toLowerCase() || 'no definido';
    let bodyFat = 0;

    try {
      if (gender === 'femenino' || gender === 'mujer') {
        if (hip <= 0) return { value: '0.0', status: 'Falta Cadera', color: 'gray', progress: 0 };
        // Formula Mujeres: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
      } else {
        // Formula Hombres: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      }
    } catch (e) {
      return { value: '0.0', status: 'Error cal.', color: 'red', progress: 0 };
    }

    if (isNaN(bodyFat) || !isFinite(bodyFat) || bodyFat < 0) bodyFat = 0;

    let status = '';
    let color = '';
    let progress = 0;

    if (gender === 'femenino' || gender === 'mujer') {
      if (bodyFat < 14) { status = 'Esencial'; color = 'blue'; progress = 20; }
      else if (bodyFat < 21) { status = 'Atleta'; color = 'primary'; progress = 40; }
      else if (bodyFat < 25) { status = 'Fitness'; color = 'primary'; progress = 60; }
      else if (bodyFat < 32) { status = 'Aceptable'; color = 'yellow'; progress = 80; }
      else { status = 'Obesidad'; color = 'red'; progress = 100; }
    } else {
      if (bodyFat < 6) { status = 'Esencial'; color = 'blue'; progress = 20; }
      else if (bodyFat < 14) { status = 'Atleta'; color = 'primary'; progress = 40; }
      else if (bodyFat < 18) { status = 'Fitness'; color = 'primary'; progress = 60; }
      else if (bodyFat < 25) { status = 'Aceptable'; color = 'yellow'; progress = 80; }
      else { status = 'Obesidad'; color = 'red'; progress = 100; }
    }

    return { value: bodyFat.toFixed(1), status, color, progress };
  };


  const bmiData = getBMIData();
  const whrData = getWHRData();
  const boneFrameData = getBoneFrameData();
  const bodyFatData = getBodyFatData();

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
    if (evaluationId) {
      fetchEvaluation();
    }
  }, [id, evaluationId]);

  async function fetchEvaluation() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutritional_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (error) throw error;
      if (data) {
        if (data.metrics) setMetrics(data.metrics);
        if (data.habits) setHabits(data.habits);
        if (data.sleep_stress) setSleepStress(data.sleep_stress);
        if (data.diet_habits) setDietHabits(data.diet_habits);
        if (data.physical_activity) setPhysicalActivity(data.physical_activity);
        if (data.medical_history) setMedicalHistory(data.medical_history);
        if (data.updated_at) setLastSaved(new Date(data.updated_at));
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const updateRelativeTime = () => {
      if (!lastSaved) {
        setTimeAgo('Nunca');
        return;
      }

      const diffInSeconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);

      if (diffInSeconds < 60) setTimeAgo('justo ahora');
      else if (diffInSeconds < 3600) setTimeAgo(`hace ${Math.floor(diffInSeconds / 60)} min`);
      else if (diffInSeconds < 86400) setTimeAgo(`hace ${Math.floor(diffInSeconds / 3600)} horas`);
      else setTimeAgo(lastSaved.toLocaleDateString());
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [lastSaved]);

  async function fetchPatient() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          perfil_actual_salud (
            blood_type,
            allergies,
            medical_history,
            family_history,
            medications
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const healthData = Array.isArray(data.perfil_actual_salud)
        ? data.perfil_actual_salud[0]
        : data.perfil_actual_salud || {};

      setPatient({
        ...data,
        blood_type: healthData.blood_type,
        allergies: healthData.allergies
      });

      if (healthData) {
        setDietHabits(prev => ({ ...prev, allergies: healthData.allergies || '' }));
        setMedicalHistory(prev => ({
          ...prev,
          medications: healthData.medications || '',
          previous_diagnoses: healthData.medical_history || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">Cargando perfil del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-lg font-bold text-red-500">No se encontró el paciente.</p>
      </div>
    );
  }
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
      <AppDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
      />
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Encabezado de Contexto del Paciente */}
        <div className="mb-8 bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-20 shadow-inner ring-4 ring-background-light dark:ring-background-dark" style={{ backgroundImage: `url('${patient.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}')` }}></div>
              <span className="absolute bottom-0 right-0 bg-primary size-5 rounded-full border-2 border-white dark:border-card-dark flex items-center justify-center"></span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{patient.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800 uppercase">
                  {patient.role === 'paciente' ? 'EMPLEADO' : patient.role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">badge</span> ID: {patient.cedula || 'N/A'}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span className="capitalize">{patient.gender || 'No definido'}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>{calculateAge(patient.birth_date) || 'N/A'} Años</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Regresar
            </button>
            <button
              onClick={() => navigate(`/patient-details/${id}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ficha Paciente
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Historial</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: Entradas Antropométricas e Historial */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Evaluación Nutricional</h2>
                <p className="text-text-sub text-sm">Protocolo ISAK y Anamnesis Integral de Estilo de Vida.</p>
              </div>
              <button className="flex items-center gap-1.5 text-primary text-sm font-bold hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined !text-lg">history</span>
                Cargar Previas
              </button>
            </div>

            {/* Mediciones Básicas e ISAK */}
            <div className="space-y-6">
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">straighten</span>
                  Perfil de Perímetros (Cinta Métrica)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <ISAKInput label="Masa Corporal (kg)" placeholder="0.0" value={metrics.weight || ''} onChange={(val) => handleMetricChange('weight', val)} />
                  <ISAKInput label="Estatura (cm)" placeholder="0.0" value={metrics.height || ''} onChange={(val) => handleMetricChange('height', val)} />
                  <ISAKInput label="Envergadura (cm)" placeholder="0.0" value={metrics.envergadura || ''} onChange={(val) => handleMetricChange('envergadura', val)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <ISAKInput label="Perímetro de Brazo (cm)" placeholder="0.0" value={metrics.arm || ''} onChange={(val) => handleMetricChange('arm', val)} />
                  <ISAKInput label="Perímetro de Cintura (cm)" placeholder="0.0" value={metrics.waist || ''} onChange={(val) => handleMetricChange('waist', val)} />
                  <ISAKInput label="Perímetro de Cadera (cm)" placeholder="0.0" value={metrics.hip || ''} onChange={(val) => handleMetricChange('hip', val)} />
                  <ISAKInput label="Perímetro de Muñeca (cm)" placeholder="0.0" value={metrics.wrist || ''} onChange={(val) => handleMetricChange('wrist', val)} />
                  <ISAKInput label="Perímetro de Cuello (cm)" placeholder="0.0" value={metrics.neck || ''} onChange={(val) => handleMetricChange('neck', val)} />
                </div>
              </section>

              {/* 1. Hábitos de Consumo */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-status-amber">wine_bar</span>
                  Hábitos de Consumo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Alcohol</p>
                    <select
                      value={habits.alcohol}
                      onChange={(e) => handleHabitsChange('alcohol', e.target.value)}
                      className="form-select w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm"
                    >
                      <option>Nunca</option>
                      <option>Ocasional (Eventos)</option>
                      <option>Semanal (Fines de semana)</option>
                      <option>Diario</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Bebida predominante..."
                      value={habits.alcohol_notes}
                      onChange={(e) => handleHabitsChange('alcohol_notes', e.target.value)}
                      className="form-input w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary text-xs h-10"
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Tabaquismo</p>
                    <select
                      value={habits.smoking}
                      onChange={(e) => handleHabitsChange('smoking', e.target.value)}
                      className="form-select w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm"
                    >
                      <option>Nunca ha fumado</option>
                      <option>Ex-fumador</option>
                      <option>Fumador activo</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Cigarrillos al día"
                      value={habits.smoking_qty || ''}
                      onChange={(e) => handleHabitsChange('smoking_qty', parseInt(e.target.value) || 0)}
                      className="form-input w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary text-xs h-10"
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Cafeína</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Tazas/día"
                        value={habits.caffeine_qty || ''}
                        onChange={(e) => handleHabitsChange('caffeine_qty', parseInt(e.target.value) || 0)}
                        className="form-input w-20 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-center font-mono"
                      />
                      <select
                        value={habits.caffeine_type}
                        onChange={(e) => handleHabitsChange('caffeine_type', e.target.value)}
                        className="form-select flex-1 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-primary h-12 text-sm"
                      >
                        <option>Café</option>
                        <option>Té</option>
                        <option>Energéticas</option>
                        <option>Refrescos</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Consumo de Agua</p>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={habits.water_glasses || ''}
                        onChange={(e) => handleHabitsChange('water_glasses', parseInt(e.target.value) || 0)}
                        className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4 font-mono text-center"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-sub uppercase">Vasos/Día</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Sueño y Estrés */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-blue-500">bedtime</span>
                  Higiene del Sueño y Estrés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Horas Sueño</p>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={sleepStress.hours || ''}
                      onChange={(e) => handleSleepChange('hours', parseFloat(e.target.value) || 0)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-center font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Calidad</p>
                    <select
                      value={sleepStress.quality}
                      onChange={(e) => handleSleepChange('quality', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Reparador</option>
                      <option>Interrumpido</option>
                      <option>Insomnio</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase">Estrés</p>
                    <select
                      value={sleepStress.stress}
                      onChange={(e) => handleSleepChange('stress', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Bajo</option>
                      <option>Medio</option>
                      <option>Alto</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sleepStress.screens}
                        onChange={(e) => handleSleepChange('screens', e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-bold text-text-sub uppercase">Pantallas antes de dormir</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. Hábitos Alimentarios Detallados */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">restaurant</span>
                  Hábitos Alimentarios Detallados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Comidas al día</p>
                    <select
                      value={dietHabits.meals_per_day}
                      onChange={(e) => handleDietChange('meals_per_day', parseInt(e.target.value))}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} comidas</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Lugar comida principal</p>
                    <select
                      value={dietHabits.lunch_place}
                      onChange={(e) => handleDietChange('lunch_place', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Comedor Empresa</option>
                      <option>Casa (Preparado)</option>
                      <option>Restaurante</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Consumo Ultraprocesados</p>
                    <select
                      value={dietHabits.ultraprocessed}
                      onChange={(e) => handleDietChange('ultraprocessed', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Rara vez</option>
                      <option>2-3 veces por semana</option>
                      <option>Diaria</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Alergias o Intolerancias</p>
                  <input
                    type="text"
                    placeholder="Ej: Lactosa, Gluten, Frutos Secos..."
                    value={dietHabits.allergies}
                    onChange={(e) => handleDietChange('allergies', e.target.value)}
                    className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4"
                  />
                </div>
              </section>

              {/* 4. Actividad Física y Sedentarismo */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">fitness_center</span>
                  Actividad Física y Sedentarismo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Horas sentado al día</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={physicalActivity.hours_sitting || ''}
                        onChange={(e) => handleActivityChange('hours_sitting', parseFloat(e.target.value) || 0)}
                        className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4 font-mono"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-sub">horas</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Horas de ejercicio al día</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={physicalActivity.exercise_hours || ''}
                        onChange={(e) => handleActivityChange('exercise_hours', parseFloat(e.target.value) || 0)}
                        className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 px-4 font-mono"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-sub">horas</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Frecuencia de ejercicio</p>
                    <select
                      value={physicalActivity.frequency}
                      onChange={(e) => handleActivityChange('frequency', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Sedentario</option>
                      <option>1-2 días/semana</option>
                      <option>3-5 días/semana</option>
                      <option>Atleta / Diario</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Tipo predominante</p>
                    <select
                      value={physicalActivity.type}
                      onChange={(e) => handleActivityChange('type', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-sm"
                    >
                      <option>Fuerza (Pesas/Calistenia)</option>
                      <option>Cardio (Running/Ciclismo)</option>
                      <option>Flexibilidad / Yoga</option>
                      <option>Deporte de Equipo</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 5. Antecedentes Médicos Relacionados */}
              <section className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-status-red">medical_information</span>
                  Antecedentes Médicos y Suplementación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Medicamentos actuales</p>
                    <textarea
                      placeholder="Cualquiera que afecte peso o apetito..."
                      value={medicalHistory.medications}
                      onChange={(e) => handleHistoryChange('medications', e.target.value)}
                      className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4 text-sm"
                      rows={2}
                    ></textarea>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Suplementación</p>
                    <textarea
                      placeholder="Proteína, Creatina, Multivitamínicos..."
                      value={medicalHistory.supplements}
                      onChange={(e) => handleHistoryChange('supplements', e.target.value)}
                      className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4 text-sm"
                      rows={2}
                    ></textarea>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Diagnósticos Previos</p>
                  <textarea
                    placeholder="Liste los diagnósticos médicos previos (ej: Diabetes, Hipertensión, etc.)"
                    value={medicalHistory.previous_diagnoses}
                    onChange={(e) => handleHistoryChange('previous_diagnoses', e.target.value)}
                    className="w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 p-4 text-sm"
                    rows={3}
                  ></textarea>
                </div>
              </section>
            </div>
          </div>

          {/* COLUMNA DERECHA: Análisis en Tiempo Real */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Análisis en Tiempo Real</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
              {whrData.color === 'red' && (
                <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">Alerta de Riesgo Metabólico</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">La relación cintura-cadera excede el umbral de salud para riesgo cardiovascular.</p>
                    </div>
                  </div>
                </div>
              )}
              <AnalysisCard label="IMC / BMI" value={bmiData.value} unit="kg/m²" status={bmiData.status} statusColor={bmiData.color} progress={bmiData.progress} target="18.5 - 24.9" icon="monitor_weight" />
              <AnalysisCard label="ICC (Cintura/Cadera)" value={whrData.value} unit="Ratio" status={whrData.status} statusColor={whrData.color} progress={whrData.progress} target={patient?.gender?.toLowerCase() === 'femenino' ? '< 0.81' : '< 0.95'} icon="accessibility" />
              <AnalysisCard label="Grasa Corporal (Navy)" value={bodyFatData.value} unit="%" status={bodyFatData.status} statusColor={bodyFatData.color} progress={bodyFatData.progress} icon="percent" />
              <AnalysisCard label="Complexión Ósea" value={boneFrameData.value} unit="Valor R" status={boneFrameData.status} statusColor={boneFrameData.color} progress={boneFrameData.progress} icon="skeleton" />

              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-xs font-bold text-primary-dark uppercase mb-2">Resumen de Riesgos AI</p>
                <p className="text-sm text-text-main dark:text-white leading-relaxed italic">"Paciente con sedentarismo laboral alto (8h sentado) y calidad de sueño baja. Riesgo metabólico aumentado por ICC &gt; 0.94."</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full bg-card-light/90 dark:bg-card-dark/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-4 px-8 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${lastSaved ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
            Último guardado: {timeAgo}
          </span>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 transition-colors">Guardar Borrador</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-black bg-primary hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {saving ? (
                <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              )}
              {saving ? 'Guardando...' : 'Generar Diagnóstico'}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}

function ISAKInput({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: any, onChange: (val: string) => void }) {
  return (
    <label className="group block text-left">
      <span className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-2 group-focus-within:text-primary transition-colors">
        {label}
      </span>
      <input
        type="number"
        step="0.1"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:border-primary focus:ring-primary focus:bg-white sm:text-lg h-14 font-mono transition-all text-center placeholder:text-gray-300"
      />
    </label>
  );
}

function AnalysisCard({ label, value, unit, status, statusColor, progress, target, icon }: any) {
  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-4xl font-bold font-mono tracking-tighter">{value}</span>
        <span className="text-sm font-medium text-gray-500 mb-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2 text-left">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-300`}>{status}</span>
        {target && <span className="text-xs text-gray-400">Objetivo: {target}</span>}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
        <div className={`bg-${statusColor === 'primary' ? 'primary' : statusColor + '-400'} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
