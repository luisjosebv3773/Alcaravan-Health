
export interface HealthMetrics {
    bmi: number;
    whr: number;
    bodyFat: number;
    muscleMass: number; // kg
    waterMass: number; // kg, estimated
    waterPct: number; // %
    proteinPct: number; // % estimated
    bmr: number; // kcal
    visceralFatLevel: number; // estimated 1-59 scale
}

interface MetricInputs {
    weight: number; // kg
    height: number; // cm
    waist: number; // cm
    hip: number; // cm
    neck: number; // cm
    age: number;
    gender: 'male' | 'female';
}

/**
 * Calculates BMI (Body Mass Index)
 */
export const calculateBMI = (weight: number, heightCm: number): number => {
    if (!weight || !heightCm) return 0;
    const heightM = heightCm / 100;
    return Number((weight / (heightM * heightM)).toFixed(1));
};

/**
 * Calculates WHR (Waist-to-Hip Ratio)
 */
export const calculateWHR = (waist: number, hip: number): number => {
    if (!waist || !hip) return 0;
    return Number((waist / hip).toFixed(2));
};

/**
 * Calculates Body Fat Percentage using US Navy Method
 */
export const calculateBodyFatNavy = (
    waist: number,
    neck: number,
    height: number,
    hip: number,
    gender: 'male' | 'female'
): number => {
    if (!waist || !neck || !height) return 0;
    // Prevent log of negative/zero
    if (waist - neck <= 0) return 0;

    // Formulas
    // Men: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    // Women: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450

    let bodyFat = 0;

    try {
        if (gender === 'male') {
            bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
        } else {
            if (!hip) return 0;
            bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
        }
    } catch (e) {
        console.error("Error calculating body fat", e);
        return 0;
    }

    // Clamp and round
    return Number(Math.max(0, bodyFat).toFixed(1));
};

/**
 * Calculates BMR using Mifflin-St Jeor Equation
 */
export const calculateBMRMifflin = (
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female'
): number => {
    if (!weight || !height || !age) return 0;

    // Base: 10W + 6.25H - 5A
    const base = (10 * weight) + (6.25 * height) - (5 * age);

    // Men: +5, Women: -161
    const bmr = gender === 'male' ? base + 5 : base - 161;

    return Math.round(bmr);
};

/**
 * Main function to get all derived health metrics
 */
export const calculateAdvancedMetrics = (inputs: MetricInputs): HealthMetrics => {
    const { weight, height, waist, hip, neck, age, gender } = inputs;

    const bmi = calculateBMI(weight, height);
    const whr = calculateWHR(waist, hip);
    const bodyFat = calculateBodyFatNavy(waist, neck, height, hip, gender);
    const bmr = calculateBMRMifflin(weight, height, age, gender);

    // Muscle Mass Estimation (Simplified: Weight * (1 - BodyFat%))
    const leanBodyMass = weight * (1 - bodyFat / 100);
    const muscleMass = Number(leanBodyMass.toFixed(1));

    // Water Mass Estimation (Approx 73% of Lean Body Mass)
    const waterMass = Number((leanBodyMass * 0.73).toFixed(1));
    const waterPct = weight > 0 ? Number(((waterMass / weight) * 100).toFixed(1)) : 0;

    // Protein Percentage Estimation (LBM * 0.20)
    const proteinMass = leanBodyMass * 0.20;
    const proteinPct = weight > 0 ? Number(((proteinMass / weight) * 100).toFixed(1)) : 0;

    // Visceral Fat Level Estimation (Simplified/Heuristic)
    let visceralFatLevel = 1;
    const whrBaseline = gender === 'male' ? 0.9 : 0.85;
    if (whr > whrBaseline) {
        const excess = whr - whrBaseline;
        visceralFatLevel = 1 + Math.round(excess * 100);
    }
    visceralFatLevel = Math.max(1, Math.min(59, visceralFatLevel));

    return {
        bmi,
        whr,
        bodyFat,
        muscleMass,
        waterMass,
        waterPct,
        proteinPct,
        bmr,
        visceralFatLevel
    };
};

/**
 * Calculates age from birthdate string (YYYY-MM-DD)
 */
export const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
