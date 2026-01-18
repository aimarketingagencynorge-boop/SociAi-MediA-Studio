import React, { useEffect, useState } from 'react';
import { translations, Language } from '../translations';
import { X, Sparkles, Download, CheckCircle, Terminal, AlertCircle, Key, Camera, Layout, RotateCw } from 'lucide-react';
import { generateAIImage, generateAIVideo } from '../services/geminiService';
import { BrandProfile, ImageGenMode } from '../types';

interface GenerationModalProps {
  type: 'image' | 'video';
  prompt: string;
  lang: Language;
  onClose: () => void;
  onSuccess: (url: string, brief?: any, aiPrompt?: string, mode?: ImageGenMode, aiDebug?: any) => void;
  brandContext?: BrandProfile;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({ type, prompt, lang, onClose, onSuccess, brandContext }) => {
  const t = translations[lang];
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [mode, setMode] = useState<ImageGenMode>('PHOTO');
  const [variantCount, setVariantCount] = useState(0);

  const handleStartGeneration = async (skipKeyCheck = false, seed: number = 0) => {
    if (type === 'video' && !skipKeyCheck) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) { setNeedsKey(true); return; }
    }

    setIsGenerating(true);
    setIsDone(false);
    setNeedsKey(false);
    setError(null);
    setLogs(prev => [...prev, `[SYS] ${seed > 0 ? 'Recalibrating' : 'Initiating'} ${type} engine (Seed: ${seed})...`]);
    setProgress(10);

    try {
      if (type === 'image' && brandContext) {
        setLogs(prev => [...prev, "[AI] Loading Brand Context & Reference Assets..."]);
        const result = await generateAIImage(prompt, brandContext, 'instagram', mode, seed);
        setLogs(prev => [...prev, "[AI] Brief synthesized.", "[AI] Rendering scene..."]);
        setResultUrl(result.url);
        setProgress(100);
        setIsDone(true);
        onSuccess(result.url, result.brief, result.prompt, mode, result.debug);
      } else if (type === 'video') {
        const url = await generateAIVideo(prompt);
        setResultUrl(url);
        setProgress(100);
        setIsDone(true);
        onSuccess(url);
      }
    } catch (e: any) {
      setError(e.message || "Force connection failed.");
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecalibrate = () => {
    const nextSeed = variantCount + 1;
    setVariantCount(nextSeed);
    handleStartGeneration(true, nextSeed);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyber-dark/95 backdrop-blur-xl">
      <div className="w-full max-w-2xl glass-card border border-cyber-purple/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-purple/20 rounded-lg text-cyber-purple animate-pulse">
                <Sparkles size={20} />
             </div>
             <h2 className="text-lg font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.genTitle}</h2>
          </div>
          {!isGenerating && <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={24} /></button>}
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-center flex flex-col items-center gap-4">
              <AlertCircle size={32} />
              <p className="font-bold uppercase tracking-widest">{error}</p>
              <button onClick={() => handleStartGeneration(false, variantCount)} className="px-6 py-2 bg-red-500 text-white rounded-lg font-black text-[10px] uppercase">TRY AGAIN</button>
            </div>
          )}

          {!isGenerating && !isDone && !error && !needsKey ? (
            <div className="text-center space-y-8">
              <p className="text-gray-400 italic text-sm">"{prompt}"</p>
              
              {type === 'image' && (
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button 
                        onClick={() => setMode('PHOTO')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${mode === 'PHOTO' ? 'border-cyber-turquoise bg-cyber-turquoise/10 text-cyber-turquoise' : 'border-white/10 text-gray-500'}`}
                    >
                        <Camera size={24} />
                        <span className="text-[10px] font-black uppercase">PHOTO</span>
                    </button>
                    <button 
                        onClick={() => setMode('POSTER')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${mode === 'POSTER' ? 'border-cyber-magenta bg-cyber-magenta/10 text-cyber-magenta' : 'border-white/10 text-gray-500'}`}
                    >
                        <Layout size={24} />
                        <span className="text-[10px] font-black uppercase">POSTER</span>
                    </button>
                </div>
              )}

              <button 
                onClick={() => handleStartGeneration()}
                className="w-full py-4 bg-cyber-purple text-white font-black rounded-xl hover:bg-cyber-magenta transition uppercase tracking-widest"
              >
                Launch {type} Engine
              </button>
            </div>
          ) : isGenerating && !isDone ? (
            <div className="space-y-6">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-purple transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-[9px] text-green-400 h-40 overflow-y-auto">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                    <div className="animate-pulse">_ Generating variant...</div>
                </div>
            </div>
          ) : isDone && (
            <div className="text-center space-y-6 animate-fadeIn">
               <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
                  {type === 'image' ? <img src={resultUrl!} className="w-full h-full object-cover" /> : <video src={resultUrl!} controls className="w-full h-full object-cover" />}
               </div>
               
               <div className="flex gap-4">
                  <button 
                    onClick={onClose} 
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl font-bold uppercase transition"
                  >
                    {t.close}
                  </button>
                  <button 
                    onClick={handleRecalibrate}
                    className="flex-1 py-4 bg-cyber-purple text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyber-magenta shadow-[0_0_20px_rgba(140,77,255,0.3)] transition-all"
                  >
                    <RotateCw size={18} />
                    {t.recalibrateHolocron}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};