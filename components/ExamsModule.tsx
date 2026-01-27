import React, { useState, useEffect } from 'react';

export interface ExamRequest {
    name: string;
    note: string;
}

export interface ExamResultValue {
    key: string;
    value: string | number;
    unit?: string;
    isAbnormal?: boolean;
}

export interface ExamResult {
    examType: string;
    values: Record<string, string | number>;
    date: string;
    files?: string[];
}

interface ExamsModuleProps {
    examsRequested: ExamRequest[];
    setExamsRequested: (exams: ExamRequest[]) => void;
    examResults: ExamResult[];
    setExamResults: (results: ExamResult[]) => void;
    requestVisible: boolean;
    setRequestVisible: (v: boolean) => void;
    resultsVisible: boolean;
    setResultsVisible: (v: boolean) => void;
    isReadOnly?: boolean;
}

// Configuration for Exam Types
const EXAM_TYPES = [
    { id: 'perfil20', name: 'Perfil 20 (Bioquímica)', type: 'numeric_panel' },
    { id: 'hematologia', name: 'Hematología Completa', type: 'numeric_panel' },
    { id: 'orina', name: 'Examen de Orina', type: 'mixed_panel' },
    { id: 'heces', name: 'Examen de Heces', type: 'mixed_panel' },
    { id: 'rx_torax', name: 'Rayos X de Tórax', type: 'text' },
    { id: 'eco_abdominal', name: 'Ecosonograma Abdominal', type: 'text' },
];

const EXAM_DEFINITIONS: Record<string, any> = {
    'perfil20': {
        fields: [
            { key: 'glucose', label: 'Glucosa', unit: 'mg/dL', min: 70, max: 100, type: 'number' },
            { key: 'urea', label: 'Urea', unit: 'mg/dL', min: 10, max: 50, type: 'number' },
            { key: 'creatinine', label: 'Creatinina', unit: 'mg/dL', min: 0.6, max: 1.2, type: 'number' },
            { key: 'uric_acid', label: 'Ácido Úrico', unit: 'mg/dL', min: 2.5, max: 7.0, type: 'number' },
            { key: 'cholesterol', label: 'Colesterol Total', unit: 'mg/dL', min: 0, max: 200, type: 'number' },
            { key: 'hdl', label: 'HDL (Bueno)', unit: 'mg/dL', min: 40, max: 100, type: 'number' },
            { key: 'ldl', label: 'LDL (Malo)', unit: 'mg/dL', min: 0, max: 100, type: 'number' },
            { key: 'triglycerides', label: 'Triglicéridos', unit: 'mg/dL', min: 0, max: 150, type: 'number' },
        ]
    },
    'orina': {
        fields: [
            { key: 'color', label: 'Color', type: 'select', options: ['Amarillo', 'Ámbar', 'Rojo', 'Incoloro'] },
            { key: 'aspect', label: 'Aspecto', type: 'select', options: ['Límipido', 'Ligeramente Turbio', 'Turbio'] },
            { key: 'density', label: 'Densidad', unit: '', min: 1.005, max: 1.030, type: 'number', step: 0.005 },
            { key: 'ph', label: 'pH', unit: '', min: 4.6, max: 8.0, type: 'number', step: 0.5 },
            { key: 'protein', label: 'Proteínas', type: 'select', options: ['Negativo', 'Trazas', 'Positivo (+)', 'Positivo (++)'] },
            { key: 'glucose', label: 'Glucosa', type: 'select', options: ['Negativo', 'Normal', 'Positivo'] },
            { key: 'sediment', label: 'Sedimento', type: 'text' },
        ]
    }
};

export default function ExamsModule({
    examsRequested,
    setExamsRequested,
    examResults,
    setExamResults,
    requestVisible,
    setRequestVisible,
    resultsVisible,
    setResultsVisible,
    isReadOnly = false
}: ExamsModuleProps) {

    // --- Request Logic ---
    const [selectedExamToAdd, setSelectedExamToAdd] = useState('');
    const [examNote, setExamNote] = useState('');

    const handleAddRequest = () => {
        if (!selectedExamToAdd) return;
        const examName = EXAM_TYPES.find(e => e.id === selectedExamToAdd)?.name || selectedExamToAdd;
        setExamsRequested([...examsRequested, { name: examName, note: examNote }]);
        setSelectedExamToAdd('');
        setExamNote('');
    };

    const handleRemoveRequest = (index: number) => {
        const newList = [...examsRequested];
        newList.splice(index, 1);
        setExamsRequested(newList);
    };

    // --- Results Logic ---
    const [transcribingExamId, setTranscribingExamId] = useState(''); // 'perfil20' etc
    const [currentResultValues, setCurrentResultValues] = useState<Record<string, string | number>>({});

    const startTranscription = (examId: string) => {
        setTranscribingExamId(examId);
        // Load existing values if editing? For now simplified to new entry
        setCurrentResultValues({});
    };

    const handleResultChange = (key: string, value: string | number) => {
        setCurrentResultValues({ ...currentResultValues, [key]: value });
    };

    const saveResult = () => {
        if (!transcribingExamId) return;

        // Basic validation/mark abnormal is done on render or pre-save
        // We save the raw values alongside the exam type
        const newResult: ExamResult = {
            examType: transcribingExamId,
            values: currentResultValues,
            date: new Date().toISOString().split('T')[0]
        };

        // If exists, replace? Or add new? Let's add new for history, but for this specific consultation context maybe replace?
        // Let's filter out previous result for SAME exam type in THIS consultation to avoid duplicates
        const filteredResults = examResults.filter(r => r.examType !== transcribingExamId);
        setExamResults([...filteredResults, newResult]);

        setTranscribingExamId('');
        setCurrentResultValues({});
    };

    const isAbnormal = (examId: string, key: string, value: any): boolean => {
        if (!value) return false;
        const field = EXAM_DEFINITIONS[examId]?.fields.find((f: any) => f.key === key);
        if (!field || field.type !== 'number') return false;

        const num = parseFloat(value);
        if (isNaN(num)) return false;

        return num < field.min || num > field.max;
    };

    const getExamName = (id: string) => EXAM_TYPES.find(e => e.id === id)?.name || id;

    return (
        <div className="flex flex-col gap-6">

            {/* --- MOMENTUM A: SOLICITUD --- */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">assignment_add</span>
                        </span>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Orden de Exámenes</h3>
                            <p className="text-xs text-slate-500">Solicitud de nuevos estudios</p>
                        </div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                            checked={requestVisible}
                            disabled={isReadOnly}
                            onChange={(e) => setRequestVisible(e.target.checked)}
                            className="peer absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all duration-300 checked:right-0 checked:border-blue-500 disabled:cursor-not-allowed"
                            id="toggle-req-exams"
                            type="checkbox"
                        />
                        <label className="block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300 peer-checked:bg-blue-500" htmlFor="toggle-req-exams"></label>
                    </div>
                </div>

                <div className={`p-6 transition-all duration-300 ${!requestVisible ? 'opacity-50 pointer-events-none grayscale hidden' : 'block'}`}>
                    {!isReadOnly && (
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <select
                                    value={selectedExamToAdd}
                                    onChange={(e) => setSelectedExamToAdd(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                                >
                                    <option value="">Seleccione un examen...</option>
                                    {EXAM_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-[2]">
                                <input
                                    value={examNote}
                                    onChange={(e) => setExamNote(e.target.value)}
                                    placeholder="Nota / Indicación (ej. Ayuno 12h)"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                                    type="text"
                                />
                            </div>
                            <button
                                onClick={handleAddRequest}
                                disabled={!selectedExamToAdd}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Agregar
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        {examsRequested.map((req, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{req.name}</span>
                                    {req.note && <span className="text-xs text-slate-400 italic">({req.note})</span>}
                                </div>
                                <button onClick={() => handleRemoveRequest(idx)} className="text-slate-400 hover:text-red-500">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ))}
                        {examsRequested.length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No hay exámenes solicitados.</p>}
                    </div>
                </div>
            </div>

            {/* --- MOMENTUM B: CARGA DE RESULTADOS --- */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">labs</span>
                        </span>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Resultados de Exámenes</h3>
                            <p className="text-xs text-slate-500">Transcripción y registro de valores</p>
                        </div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                            checked={resultsVisible}
                            disabled={isReadOnly}
                            onChange={(e) => setResultsVisible(e.target.checked)}
                            className="peer absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all duration-300 checked:right-0 checked:border-purple-500 disabled:cursor-not-allowed"
                            id="toggle-res-exams"
                            type="checkbox"
                        />
                        <label className="block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300 peer-checked:bg-purple-500" htmlFor="toggle-res-exams"></label>
                    </div>
                </div>

                <div className={`p-6 transition-all duration-300 ${!resultsVisible ? 'opacity-50 pointer-events-none grayscale hidden' : 'block'}`}>

                    {!transcribingExamId ? (
                        <div className="space-y-4">
                            {!isReadOnly && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {EXAM_TYPES.filter(t => EXAM_DEFINITIONS[t.id]).map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => startTranscription(type.id)}
                                            className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 transition-colors">{type.name}</span>
                                                <span className="material-symbols-outlined text-purple-300 group-hover:text-purple-500">edit_note</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Click para transcribir</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Existing Results Summary Table */}
                            {examResults.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Valores Cargados</h4>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-2">Examen</th>
                                                    <th className="px-4 py-2">Parámetro</th>
                                                    <th className="px-4 py-2">Valor</th>
                                                    <th className="px-4 py-2">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {examResults.map((res, i) => (
                                                    Object.entries(res.values).map(([key, val], j) => {
                                                        const def = EXAM_DEFINITIONS[res.examType]?.fields.find((f: any) => f.key === key);
                                                        const abnormal = isAbnormal(res.examType, key, val);
                                                        return (
                                                            <tr key={`${i}-${j}`} className="bg-white dark:bg-card-dark">
                                                                {j === 0 && (
                                                                    <td rowSpan={Object.keys(res.values).length} className="px-4 py-2 font-medium border-r border-slate-100 dark:border-slate-700 align-top pt-3">
                                                                        {getExamName(res.examType)}
                                                                        {!isReadOnly && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const n = [...examResults];
                                                                                    n.splice(i, 1);
                                                                                    setExamResults(n);
                                                                                }}
                                                                                className="block mt-1 text-xs text-red-400 hover:text-red-500"
                                                                            >Eliminar</button>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{def?.label || key}</td>
                                                                <td className={`px-4 py-2 font-bold ${abnormal ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                                                    {val} <span className="text-xs font-normal text-slate-400">{def?.unit}</span>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    {abnormal ? (
                                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                                                            <span className="material-symbols-outlined text-[10px]">warning</span> Fuera de rango
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-[10px]">check</span> Normal
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-200">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                    <button onClick={() => setTranscribingExamId('')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    {getExamName(transcribingExamId)}
                                </h4>
                                <button
                                    onClick={saveResult}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">save</span> Guardar Valores
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {EXAM_DEFINITIONS[transcribingExamId].fields.map((field: any) => {
                                    const value = currentResultValues[field.key] || '';
                                    const abnormal = isAbnormal(transcribingExamId, field.key, value);

                                    return (
                                        <div key={field.key} className={`p-3 rounded-lg border ${abnormal ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'} transition-all`}>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{field.label}</label>
                                                {field.type === 'number' && (
                                                    <span className="text-[10px] text-slate-400">Ref: {field.min} - {field.max} {field.unit}</span>
                                                )}
                                            </div>

                                            {field.type === 'select' ? (
                                                <select
                                                    value={value}
                                                    onChange={(e) => handleResultChange(field.key, e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-800 border-b border-slate-300 focus:border-purple-500 outline-none text-sm py-1 dark:text-white"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {field.options.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        value={value}
                                                        onChange={(e) => handleResultChange(field.key, e.target.value)}
                                                        className={`w-full bg-transparent border-b ${abnormal ? 'border-red-400 text-red-600 font-bold' : 'border-slate-300 dark:border-slate-600 focus:border-purple-500'} outline-none text-sm py-1 dark:text-white`}
                                                        type={field.type}
                                                        placeholder="---"
                                                    />
                                                    {field.unit && <span className="absolute right-0 top-1 text-xs text-slate-400">{field.unit}</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
