
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getHealthAdvice = async (prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asistente médico profesional para Alcaraván Health. Proporciona consejos de salud útiles, precisos y de apoyo en español. Siempre sugiere consultar a un profesional humano para asuntos graves."
      }
    });
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al conectar con el asistente de salud.";
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt || "Analiza esta imagen para obtener información relacionada con la salud, como contenido nutricional de una comida, afecciones cutáneas o forma física. Proporciona una evaluación profesional en español." }
        ]
      }
    });
    return response.text || "No pude analizar la imagen.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "Ocurrió un error durante el análisis de la imagen.";
  }
};
