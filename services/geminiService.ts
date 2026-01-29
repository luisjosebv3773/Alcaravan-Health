
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const getHealthAdvice = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Eres un asistente médico profesional para Alcaraván Health. Proporciona consejos de salud útiles, precisos y de apoyo en español. Siempre sugiere consultar a un profesional humano para asuntos graves."
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al conectar con el asistente de salud. Verifica la configuración de la API Key.";
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string, prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      },
      { text: prompt || "Analiza esta imagen para obtener información relacionada con la salud, como contenido nutricional de una comida, afecciones cutáneas o forma física. Proporciona una evaluación profesional en español." }
    ]);

    const response = await result.response;
    return response.text() || "No pude analizar la imagen.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "Ocurrió un error durante el análisis de la imagen.";
  }
};
