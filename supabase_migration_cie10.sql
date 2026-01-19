-- Create table for CIE-10 dictionaries in Spanish if it doesn't exist
-- Note: 'codigo' is used as the unique identifier for upserts
CREATE TABLE IF NOT EXISTS diagnosticos_cie10 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text NOT NULL UNIQUE,
    descripcion text NOT NULL,
    categoria text,
    active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE diagnosticos_cie10 ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'diagnosticos_cie10' AND policyname = 'Allow read access to all users'
    ) THEN
        CREATE POLICY "Allow read access to all users" ON diagnosticos_cie10 FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Insert Seed Data (Categorized)
INSERT INTO diagnosticos_cie10 (codigo, descripcion, categoria) VALUES
-- 1. Enfermedades Respiratorias
('J00', 'Rinofaringitis aguda (Resfriado común)', 'Enfermedades Respiratorias'),
('J01.9', 'Sinusitis aguda, no especificada', 'Enfermedades Respiratorias'),
('J02.9', 'Faringitis aguda, no especificada', 'Enfermedades Respiratorias'),
('J03.9', 'Amigdalitis aguda, no especificada', 'Enfermedades Respiratorias'),
('J04.0', 'Laringitis aguda', 'Enfermedades Respiratorias'),
('J06.9', 'Infección aguda de las vías respiratorias superiores', 'Enfermedades Respiratorias'),
('J11.1', 'Gripe con otras manifestaciones respiratorias', 'Enfermedades Respiratorias'),
('J20.9', 'Bronquitis aguda, no especificada', 'Enfermedades Respiratorias'),
('J30.4', 'Rinitis alérgica, no especificada', 'Enfermedades Respiratorias'),
('J45.9', 'Asma, no especificada', 'Enfermedades Respiratorias'),
('R05', 'Tos', 'Enfermedades Respiratorias'),
('R06.0', 'Disnea (Dificultad respiratoria)', 'Enfermedades Respiratorias'),
('J31.0', 'Rinitis crónica', 'Enfermedades Respiratorias'),

-- 2. Trastornos Osteomusculares
('M54.5', 'Lumbago no especificado', 'Trastornos Osteomusculares'),
('M54.2', 'Cervicalgia (Dolor de cuello)', 'Trastornos Osteomusculares'),
('M54.9', 'Dorsalgia, no especificada', 'Trastornos Osteomusculares'),
('M51.2', 'Otros desplazamientos especificados de disco intervertebral', 'Trastornos Osteomusculares'),
('G56.0', 'Síndrome del túnel carpiano', 'Trastornos Osteomusculares'),
('M77.1', 'Epicondilitis lateral (Codo de tenista)', 'Trastornos Osteomusculares'),
('M75.1', 'Síndrome del manguito rotador', 'Trastornos Osteomusculares'),
('M79.1', 'Mialgia (Dolor muscular)', 'Trastornos Osteomusculares'),
('M25.5', 'Dolor en articulación', 'Trastornos Osteomusculares'),
('M62.4', 'Contractura muscular', 'Trastornos Osteomusculares'),
('M79.7', 'Fibromialgia', 'Trastornos Osteomusculares'),
('M54.4', 'Lumbago con ciática', 'Trastornos Osteomusculares'),
('M70.2', 'Bursitis del olécranon', 'Trastornos Osteomusculares'),
('M70.3', 'Otras bursitis del codo', 'Trastornos Osteomusculares'),
('M72.2', 'Fibromatosis de la fascia plantar', 'Trastornos Osteomusculares'),
('M17.9', 'Gonartrosis (Artrosis de rodilla)', 'Trastornos Osteomusculares'),
('M16.9', 'Coxartrosis (Artrosis de cadera)', 'Trastornos Osteomusculares'),
('M19.9', 'Artrosis, no especificada', 'Trastornos Osteomusculares'),
('M54.1', 'Radiculopatía', 'Trastornos Osteomusculares'),
('M76.8', 'Otras entesopatías del miembro inferior', 'Trastornos Osteomusculares'),
('M21.4', 'Pie plano', 'Trastornos Osteomusculares'),

-- 3. Salud Mental y Estrés Laboral
('Z73.0', 'Agotamiento (Síndrome de Burnout)', 'Salud Mental'),
('F41.9', 'Trastorno de ansiedad, no especificado', 'Salud Mental'),
('F43.0', 'Reacción al estrés agudo', 'Salud Mental'),
('F43.2', 'Trastornos de adaptación', 'Salud Mental'),
('F32.9', 'Episodio depresivo, no especificado', 'Salud Mental'),
('F51.0', 'Insomnio no orgánico', 'Salud Mental'),
('G47.0', 'Trastornos del inicio y del mantenimiento del sueño', 'Salud Mental'),
('F41.1', 'Trastorno de ansiedad generalizada', 'Salud Mental'),
('F41.0', 'Trastorno de pánico', 'Salud Mental'),
('F48.0', 'Neurastenia (Fatiga crónica)', 'Salud Mental'),

-- 4. Enfermedades Digestivas
('K29.7', 'Gastritis, no especificada', 'Enfermedades Digestivas'),
('K21.9', 'Enfermedad por reflujo gastroesofágico', 'Enfermedades Digestivas'),
('K58.9', 'Síndrome del colon irritable', 'Enfermedades Digestivas'),
('K59.0', 'Constipación (Estreñimiento)', 'Enfermedades Digestivas'),
('R10.4', 'Otros dolores abdominales', 'Enfermedades Digestivas'),
('K29.1', 'Gastritis aguda', 'Enfermedades Digestivas'),
('K30', 'Dispepsia', 'Enfermedades Digestivas'),
('A09.9', 'Gastroenteritis y colitis de origen infeccioso', 'Enfermedades Digestivas'),
('K64.9', 'Hemorroides no especificadas', 'Enfermedades Digestivas'),
('K02.9', 'Caries dental, no especificada', 'Enfermedades Digestivas'),
('K05.3', 'Periodontitis crónica', 'Enfermedades Digestivas'),

-- 5. Metabolismo y Nutrición
('E66.9', 'Obesidad, no especificada', 'Metabolismo y Nutrición'),
('E66.0', 'Obesidad debida a exceso de calorías', 'Metabolismo y Nutrición'),
('E11.9', 'Diabetes mellitus tipo 2 sin complicaciones', 'Metabolismo y Nutrición'),
('E78.5', 'Hiperlipidemia (Colesterol/Triglicéridos altos)', 'Metabolismo y Nutrición'),
('E78.0', 'Hipercolesterolemia pura', 'Metabolismo y Nutrición'),
('E78.1', 'Hipertrigliceridemia pura', 'Metabolismo y Nutrición'),
('E10.9', 'Diabetes mellitus tipo 1 sin complicaciones', 'Metabolismo y Nutrición'),
('E03.9', 'Hipotiroidismo, no especificado', 'Metabolismo y Nutrición'),
('E79.0', 'Hiperuricemia (Ácido úrico alto)', 'Metabolismo y Nutrición'),
('D64.9', 'Anemia, no especificada', 'Metabolismo y Nutrición'),
('E55.9', 'Deficiencia de vitamina D', 'Metabolismo y Nutrición'),
('E56.9', 'Deficiencia de vitamina, no especificada', 'Metabolismo y Nutrición'),
('E88.8', 'Otros trastornos metabólicos (Síndrome Metabólico)', 'Metabolismo y Nutrición'),

-- 6. Sistema Cardiovascular
('I10', 'Hipertensión esencial (primaria)', 'Sistema Cardiovascular'),
('I11.9', 'Enfermedad cardíaca hipertensiva', 'Sistema Cardiovascular'),
('I95.9', 'Hipotensión, no especificada', 'Sistema Cardiovascular'),
('I83.9', 'Venas varicosas de los miembros inferiores', 'Sistema Cardiovascular'),
('R00.0', 'Taquicardia, no especificada', 'Sistema Cardiovascular'),
('R00.1', 'Bradicardia, no especificada', 'Sistema Cardiovascular'),
('R07.4', 'Dolor en el pecho, no especificado', 'Sistema Cardiovascular'),

-- 7. Neurología y Salud Visual
('R51', 'Cefalea (Dolor de cabeza)', 'Neurología y Salud Visual'),
('G43.9', 'Migraña, no especificada', 'Neurología y Salud Visual'),
('G44.2', 'Cefalea tensional', 'Neurología y Salud Visual'),
('H53.1', 'Astenopia (Fatiga visual)', 'Neurología y Salud Visual'),
('H52.1', 'Miopía', 'Neurología y Salud Visual'),
('H52.2', 'Astigmatismo', 'Neurología y Salud Visual'),
('H52.4', 'Presbicia', 'Neurología y Salud Visual'),
('H10.9', 'Conjuntivitis, no especificada', 'Neurología y Salud Visual'),
('H01.0', 'Blefaritis', 'Neurología y Salud Visual'),
('H00.0', 'Orzuelo', 'Neurología y Salud Visual'),
('H11.0', 'Pterigión', 'Neurología y Salud Visual'),
('G47.3', 'Apnea del sueño', 'Neurología y Salud Visual'),
('R42', 'Mareo y desvanecimiento', 'Neurología y Salud Visual'),

-- 8. Piel y Tejido Subcutáneo
('L20.9', 'Dermatitis atópica, no especificada', 'Piel y Tejido Subcutáneo'),
('L23.9', 'Dermatitis alérgica de contacto', 'Piel y Tejido Subcutáneo'),
('L70.9', 'Acné, no especificado', 'Piel y Tejido Subcutáneo'),
('L30.9', 'Dermatitis, no especificada', 'Piel y Tejido Subcutáneo'),
('B35.3', 'Tiña del pie (Pie de atleta)', 'Piel y Tejido Subcutáneo'),
('L60.0', 'Uña encarnada', 'Piel y Tejido Subcutáneo'),
('L03.9', 'Celulitis, no especificada', 'Piel y Tejido Subcutáneo'),
('L50.9', 'Urticaria, no especificada', 'Piel y Tejido Subcutáneo'),
('B35.1', 'Tiña de las uñas (Onicomicosis)', 'Piel y Tejido Subcutáneo'),
('L21.9', 'Dermatitis seborreica', 'Piel y Tejido Subcutáneo'),

-- 9. Genitourinario
('N39.0', 'Infección de vías urinarias', 'Genitourinario'),
('N20.9', 'Cálculo urinario, no especificado', 'Genitourinario'),
('N94.6', 'Dismenorrea (Dolor menstrual)', 'Genitourinario'),
('N18.9', 'Enfermedad renal crónica', 'Genitourinario'),
('N40', 'Hiperplasia de la próstata', 'Genitourinario'),
('N64.4', 'Mastodinia (Dolor en mamas)', 'Genitourinario'),

-- 10. Traumatismos
('S93.4', 'Esguince de tobillo', 'Traumatismos'),
('S63.5', 'Esguince de muñeca', 'Traumatismos'),
('S83.6', 'Esguince de rodilla', 'Traumatismos'),
('S61.9', 'Herida de dedo de la mano', 'Traumatismos'),
('T14.0', 'Traumatismo superficial', 'Traumatismos'),
('L55.9', 'Quemadura solar', 'Traumatismos'),
('T30.0', 'Quemadura de primer grado', 'Traumatismos'),
('S06.0', 'Conmoción cerebral (Golpe en cabeza)', 'Traumatismos'),
('S43.4', 'Esguince de la articulación del hombro', 'Traumatismos'),
('S53.4', 'Esguince del codo', 'Traumatismos'),
('S33.5', 'Esguince de la columna lumbar', 'Traumatismos'),
('S13.4', 'Esguince de la columna cervical (Latigazo)', 'Traumatismos'),

-- 11. Síntomas
('R50.9', 'Fiebre, no especificada', 'Síntomas y Hallazgos'),
('R53', 'Malestar y fatiga', 'Síntomas y Hallazgos'),
('R60.0', 'Edema localizado (Hinchazón)', 'Síntomas y Hallazgos'),
('R11', 'Náuseas y vómitos', 'Síntomas y Hallazgos'),
('R21', 'Erupción y otras erupciones cutáneas', 'Síntomas y Hallazgos'),
('R55', 'Síncope y colapso (Desmayo)', 'Síntomas y Hallazgos'),
('R04.0', 'Epistaxis (Sangrado nasal)', 'Síntomas y Hallazgos'),
('R52.9', 'Dolor, no especificado', 'Síntomas y Hallazgos'),

-- 12. Factores que influyen
('Z00.0', 'Examen médico general (Chequeo)', 'Factores Preventivos'),
('Z01.0', 'Examen de ojos y de la visión', 'Factores Preventivos'),
('Z01.1', 'Examen de oídos y de la audición', 'Factores Preventivos'),
('Z10.0', 'Examen médico ocupacional', 'Factores Preventivos'),
('Z71.3', 'Asesoría y vigilancia nutricional', 'Factores Preventivos'),
('Z29.9', 'Medidas profilácticas (Vacunación)', 'Factores Preventivos'),
('Z02.1', 'Examen para ingreso al trabajo', 'Factores Preventivos'),
('Z02.7', 'Expedición de certificado médico', 'Factores Preventivos'),
('Z56.3', 'Ritmo de trabajo apresurado (Estrés laboral)', 'Factores Preventivos'),
('Z56.6', 'Otras tensiones físicas y mentales relacionadas con el trabajo', 'Factores Preventivos'),
('Z57.1', 'Exposición ocupacional a radiación (Pantallas)', 'Factores Preventivos'),

-- 13. Oído y Nariz
('H61.2', 'Cerumen impactado (Tapón de oído)', 'Oído y Nariz'),
('H66.9', 'Otitis media, no especificada', 'Oído y Nariz'),
('H60.9', 'Otitis externa, no especificada', 'Oído y Nariz'),
('H90.3', 'Sordera neurosensorial (Por ruido)', 'Oído y Nariz'),
('H93.1', 'Tinnitus (Zumbido)', 'Oído y Nariz'),
('J34.2', 'Desviación del tabique nasal', 'Oído y Nariz'),

-- 14. Otras Infecciones
('B37.9', 'Candidiasis, no especificada', 'Otras Infecciones'),
('B00.9', 'Infección por virus del herpes simple', 'Otras Infecciones'),
('A64', 'Enfermedad de transmisión sexual no especificada', 'Otras Infecciones'),
('B19.9', 'Hepatitis viral, no especificada', 'Otras Infecciones'),
('A08.4', 'Infección intestinal viral', 'Otras Infecciones'),
('B02.9', 'Herpes zóster sin complicaciones', 'Otras Infecciones'),
('B01.9', 'Varicela sin complicaciones', 'Otras Infecciones'),

-- 15. Ginecología
('N76.0', 'Vaginitis aguda', 'Ginecología'),
('N91.2', 'Amenorrea, no especificada', 'Ginecología'),
('N92.6', 'Menstruación irregular', 'Ginecología'),
('N95.1', 'Estados menopáusicos y climatéricos', 'Ginecología'),
('O21.9', 'Vómitos del embarazo', 'Ginecología'),

-- 16. Hematología
('D12.6', 'Pólipo del colon', 'Hematología'),
('D22.9', 'Nevo melanocítico (Lunar sospechoso)', 'Hematología'),
('D23.9', 'Tumor benigno de la piel', 'Hematología'),
('D50.9', 'Anemia por deficiencia de hierro', 'Hematología'),

-- 17. Adicciones
('F17.2', 'Síndrome de dependencia del tabaco', 'Adicciones'),
('F10.2', 'Síndrome de dependencia del alcohol', 'Adicciones'),
('F10.0', 'Intoxicación aguda por alcohol', 'Adicciones'),
('Z72.0', 'Uso de tabaco', 'Adicciones'),
('Z72.1', 'Uso de alcohol', 'Adicciones'),
('Z72.3', 'Falta de ejercicio físico (Sedentarismo)', 'Adicciones'),
('Z72.4', 'Dieta y hábitos alimentarios inapropiados', 'Adicciones'),

-- 18. Específicas
('B97.7', 'Papilomavirus (VPH) como causa de enfermedades', 'Específicas'),
('U07.1', 'COVID-19, virus identificado', 'Específicas'),
('A01.0', 'Fiebre tifoidea', 'Específicas'),
('B24', 'Enfermedad por VIH, no especificada', 'Específicas'),
('A37.9', 'Tos ferina, no especificada', 'Específicas'),
('A38', 'Escarlatina', 'Específicas'),

-- 19. Crónicas
('G40.9', 'Epilepsia, no especificada', 'Crónicas'),
('M10.9', 'Gota, no especificada', 'Crónicas'),
('G20', 'Enfermedad de Parkinson', 'Crónicas'),
('G35', 'Esclerosis múltiple', 'Crónicas'),
('G80.9', 'Parálisis cerebral', 'Crónicas'),
('M06.9', 'Artritis reumatoide', 'Crónicas'),

-- 20. Varias
('H04.1', 'Ojo seco', 'Varias'),
('K08.8', 'Dolor de muela (Odontalgia)', 'Varias'),
('L02.9', 'Absceso cutáneo', 'Varias'),
('M79.6', 'Dolor en miembro (Brazo/Pierna)', 'Varias'),
('N60.9', 'Displasia mamaria benigna', 'Varias'),
('R07.0', 'Dolor de garganta', 'Varias'),
('R11.1', 'Vómito solo', 'Varias'),
('R19.7', 'Diarrea, no especificada', 'Varias'),
('R30.0', 'Disuria (Dolor al orinar)', 'Varias'),
('R31', 'Hematuria (Sangre en orina)', 'Varias'),
('R61', 'Hiperhidrosis (Sudoración excesiva)', 'Varias'),
('S00.9', 'Traumatismo superficial de la cabeza', 'Varias'),
('S40.0', 'Contusión del hombro', 'Varias'),
('S50.0', 'Contusión del codo', 'Varias'),
('S60.0', 'Contusión de dedo(s) de la mano', 'Varias'),
('S80.0', 'Contusión de la rodilla', 'Varias'),
('T14.3', 'Esguince de región no especificada', 'Varias'),
('Z01.2', 'Examen odontológico', 'Varias'),
('Z01.4', 'Examen ginecológico', 'Varias'),
('Z56.0', 'Problemas relacionados con el desempleo (Estrés por despido)', 'Varias'),
('Z56.4', 'Desacuerdo con el consejero y otras dificultades en el trabajo', 'Varias'),
('Z73.2', 'Falta de relajación y tiempo libre', 'Varias'),
('Z76.0', 'Expedición de receta de repetición', 'Varias'),
('Z86.4', 'Historia personal de abuso de sustancias', 'Varias')

ON CONFLICT (codigo) DO UPDATE SET 
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria;
