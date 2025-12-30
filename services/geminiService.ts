
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getHealthAdvice = async (prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional medical assistant for Alcaraván Health. Provide helpful, accurate, and supportive health advice. Always suggest consulting a human professional for serious matters."
      }
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while connecting to the health assistant.";
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
          { text: prompt || "Analyze this image for any health-related insights, such as nutritional content in a meal, skin conditions, or fitness form. Provide a professional assessment." }
        ]
      }
    });
    return response.text || "I couldn't analyze the image.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "An error occurred during image analysis.";
  }
};
