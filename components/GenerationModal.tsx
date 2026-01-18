
import React, { useEffect, useState } from 'react';
import { translations, Language } from '../translations';
import { X, Sparkles, Download, CheckCircle, Terminal, AlertCircle, Key } from 'lucide-react';
import { generateAIImage, generateAIVideo } from '../services/geminiService';
import { BrandProfile } from '../types';

interface GenerationModalProps {
  type: 'image' | 'video';
  prompt: string;
  lang: Language;
  onClose: () => void;
  onSuccess: (url: string, brief?: any, aiPrompt?: string) => void;
  brandContext?: BrandProfile;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({ type, prompt, lang, onClose, onSuccess, brandContext }) => {
  const t = translations[lang];
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const statuses = [
    t.genStatusInit,
    t.genStatusNeural,
    t.genStatusSynthesis,
    t.genStatusFinal
  ];

  const handleStartGeneration = async (skipKeyCheck = false) => {
    if (type === 'video' && !skipKeyCheck) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsKey(true);
        return;
      }
    }

    setIsGenerating(true);
    setNeedsKey(false);
    setError(null);
    setLogs([`[SYS] Initiating usetheforce.ai ${type} engine...`]);
    setProgress(5);

    try {
      if (type === 'image' && brandContext) {
        const result = await generateAIImage(prompt, brandContext, 'instagram');
        setResultUrl(result.url);
        setProgress(100);
        setIsDone(true);
        onSuccess(result.url, result.brief, result.prompt);
      } else if (type === 'video') {
        const url = await generateAIVideo(prompt);
        setResultUrl(url);
        setProgress(100);
        setIsDone(true);
        onSuccess(url);
      } else {
        throw new Error("Missing context for image generation.");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        setNeedsKey(true);
      }
      setError(e.message || "Force connection failed.");
      setIsGenerating(false);
    }
  };

  const handleOpenKey = async () => {
    await (window as any).aistudio.openSelectKey();
    handleStartGeneration(true);
  };

  useEffect(() => {
    if (!isGenerating || isDone) return;

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return 95;
        return p + (type === 'image' ? 2 : 0.2);
      });
    }, 200);

    const statusTimer = setInterval(() => {
      setStatusIdx(s => (s < statuses.length - 1 ? s + 1 : s));
    }, type === 'image' ? 2000 : 8000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [isGenerating, isDone, type]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyber-dark/95 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-2xl glass-card border border-cyber-purple/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(140,77,255,0.2)]">
        
        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-purple/20 rounded-lg text-cyber-purple animate-pulse">
                <Sparkles size={20} />
             </div>
             <h2 className="text-lg md:text-xl font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.genTitle}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
              <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
          {needsKey ? (
            <div className="text-center py-6 md:py-10 space-y-6">
              <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto ring-1 ring-yellow-500/30">
                <Key size={40} />
              </div>
              <h3 className="text-xl md:text-2xl font-futuristic font-bold text-white">{t.needApiKey}</h3>
              <p className="text-gray-400 text-xs md:text-sm max-w-sm mx-auto">
                To generate high-quality AI Video via Veo, you must select a paid API key from your project.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block mt-2 text-cyber-turquoise hover:underline">Read Billing Docs</a>
              </p>
              <button 
                onClick={handleOpenKey}
                className="px-8 py-4 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 transition flex items-center gap-2 mx-auto"
              >
                <Key size={20} /> {t.openKeySelector}
              </button>
            </div>
          ) : !isGenerating && !isDone && !error ? (
            <div className="text-center py-10 space-y-6">
              <p className="text-gray-300 italic text-sm">"{prompt}"</p>
              <button 
                onClick={() => handleStartGeneration()}
                className="w-full py-4 bg-cyber-purple text-white font-black rounded-xl hover:bg-cyber-magenta transition uppercase tracking-widest text-sm"
              >
                Initiate {type} generation
              </button>
            </div>
          ) : error ? (
            <div className="text-center py-10 space-y-6">
               <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={40} />
               </div>
               <h3 className="text-xl font-bold text-white">Generation Failed</h3>
               <p className="text-red-400 text-xs">{error}</p>
               <button onClick={() => handleStartGeneration()} className="text-cyber-turquoise font-bold hover:underline">Try Again</button>
            </div>
          ) : !isDone ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-cyber-turquoise">{statuses[statusIdx]}</span>
                  <span className="text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyber-purple via-cyber-magenta to-cyber-turquoise transition-all duration-300 shadow-[0_0_10px_#8C4DFF]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/50 rounded-xl p-4 font-mono text-[9px] text-green-400 border border-green-500/20 h-40 overflow-y-auto space-y-1">
                <div className="flex items-center gap-2 mb-2 text-white/50 border-b border-white/10 pb-1">
                    <Terminal size={12} />
                    <span>ENGINE_LOGS_STREAM</span>
                </div>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
                <div>[SYS] Synchronizing with Gemini AI Engine...</div>
                <div className="animate-pulse">_</div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 md:py-6 space-y-4 md:space-y-6 animate-fadeIn">
               <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
               </div>
               <h3 className="text-xl md:text-2xl font-futuristic font-black neon-text-cyan">{t.genComplete}</h3>
               
               <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
                  {type === 'image' ? (
                    <img src={resultUrl!} alt="AI result" className="w-full h-full object-cover" />
                  ) : (
                    <video src={resultUrl!} controls className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                     <a href={resultUrl!} download className="bg-cyber-purple p-4 rounded-full text-white hover:scale-110 transition">
                        <Download size={24} />
                     </a>
                  </div>
               </div>

               <button 
                 onClick={onClose}
                 className="w-full py-4 bg-gradient-to-r from-cyber-purple to-cyber-magenta rounded-xl font-bold uppercase tracking-widest hover:shadow-[0_0_20px_#8C4DFF] transition text-sm"
               >
                 OK / CLOSE
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
