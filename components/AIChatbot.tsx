
import React, { useState, useRef, useEffect } from 'react';
import { getHealthAdvice, analyzeHealthImage } from '../services/geminiService';
import { ChatMessage } from '../types';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "¡Hola! Soy tu asistente de IA de Alcaraván Health. ¿Cómo puedo ayudarte hoy? Puedes hacerme preguntas sobre salud o subir una foto de tu comida o una postura de ejercicio para analizarla." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await getHealthAdvice(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `[Imagen Analizada: ${file.name}]` }]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (base64) {
        const aiResponse = await analyzeHealthImage(base64, file.type, "Analiza esta imagen para obtener consejos de salud.");
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col mb-4 overflow-hidden animate-fade-in origin-bottom-right">
          <div className="p-4 bg-primary text-black flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined">smart_toy</span>
              Asistente de Salud IA
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 rounded p-1 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-black rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-card-dark/50">
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-sub hover:text-primary transition-colors" title="Subir imagen">
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pregunta algo sobre tu salud..."
                className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-primary focus:border-primary"
              />
              <button onClick={handleSend} disabled={isLoading} className="bg-primary text-black p-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <span className="material-symbols-outlined !text-[32px] group-hover:rotate-12 transition-transform">
          {isOpen ? 'chat_bubble' : 'support_agent'}
        </span>
      </button>
    </div>
  );
}
