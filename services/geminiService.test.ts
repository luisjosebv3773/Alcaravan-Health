
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHealthAdvice } from './geminiService';

// Mock simple de la función fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('geminiService', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    it('should return health advice when API call is successful', async () => {
        // Mock de una respuesta exitosa de Gemini
        const mockResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            { text: "Recuerda beber mucha agua y dormir 8 horas." }
                        ]
                    }
                }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await getHealthAdvice("tengo dolor de cabeza");

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result).toBe("Recuerda beber mucha agua y dormir 8 horas.");

        // Verificar que se llame a la URL correcta (simulada)
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[0]).toContain('generativelanguage.googleapis.com');
        expect(callArgs[1].method).toBe('POST');
    });

    it('should handle API errors gracefully', async () => {
        // Mock de un error de la API (ej: 500)
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: { message: "Internal Server Error" } })
        });

        const result = await getHealthAdvice("error test");

        // El servicio captura el error y devuelve un string con el prefijo Error
        expect(result).toContain('Error:');
    });

    it('should handle network exceptions', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        const result = await getHealthAdvice("network test");

        expect(result).toContain('Error: Network failure');
    });
});
