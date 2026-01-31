
import { supabase } from './supabase';

export const getHealthAdvice = async (prompt: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { prompt }
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw new Error(error.message || "Error al comunicarse con el asistente.");
    }

    return data.text || "Lo siento, no pude generar una respuesta.";
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return `Error: ${error.message || "Ocurrió un error inesperado."}`;
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string, prompt: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt: prompt || "Analiza esta imagen para obtener información relacionada con la salud.",
        base64Image,
        mimeType
      }
    });

    if (error) {
      console.error("Supabase Function Vision Error:", error);
      throw new Error(error.message || "Error al analizar la imagen.");
    }

    return data.text || "No pude analizar la imagen.";
  } catch (error: any) {
    console.error("Gemini Vision Service Error:", error);
    return `Error: ${error.message || "Ocurrió un error durante el análisis."}`;
  }
};
