
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("CRITICAL: VITE_GEMINI_API_KEY is not defined in the environment variables.");
}
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

export const getHealthAdvice = async (prompt: string) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: "Eres un asistente médico profesional para Alcaraván Health. Proporciona consejos de salud útiles, precisos y de apoyo en español. Siempre sugiere consultar a un profesional humano para asuntos graves."
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Error: ${error.message || "Ocurrió un error al conectar con el asistente."}`;
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string, prompt: string) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              },
              {
                text: prompt || "Analiza esta imagen para obtener información relacionada con la salud."
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude analizar la imagen.";
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    return `Error: ${error.message || "Ocurrió un error durante el análisis."}`;
  }
};
