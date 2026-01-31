import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Manejo de CORS (Preflight)
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { prompt, base64Image, mimeType } = await req.json();
        const apiKey = Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY no configurada en el servidor.");
        }

        const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        // Si hay imagen, usamos el modelo vision
        const model = base64Image ? "gemini-pro-vision" : "gemini-pro";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const body: any = {
            contents: [
                {
                    parts: [],
                },
            ],
        };

        if (base64Image && mimeType) {
            body.contents[0].parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                },
            });
        }

        body.contents[0].parts.push({
            text: prompt,
        });

        // Instrucción de sistema si no hay imagen (Gemini Pro no soporta systemInstruction nativo igual que Flash en todas las versiones, lo añadimos al prompt)
        if (!base64Image) {
            body.contents[0].parts[0].text = `Instrucción de Sistema: Eres un asistente médico profesional para Alcaraván Health. Proporciona consejos de salud útiles, precisos y de apoyo en español. Siempre sugiere consultar a un profesional humano para asuntos graves.\n\nUsuario: ${prompt}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

        return new Response(JSON.stringify({ text: resultText }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
