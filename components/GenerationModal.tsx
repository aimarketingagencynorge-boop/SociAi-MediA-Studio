import React, { useEffect, useState } from 'react';
import { translations, Language } from '../translations';
import { X, Sparkles, Download, CheckCircle, Terminal, AlertCircle, Key, Camera, Layout, RotateCw, Loader2, MessageSquare } from 'lucide-react';
import { generateAIImage, generateAIVideo } from '../services/geminiService';
import { BrandProfile, ImageGenMode } from '../types';

interface GenerationModalProps {
  type: 'image' | 'video';
  prompt: string;
  lang: Language;
  onClose: () => void;
  onSuccess: (url: string, brief?: any, aiPrompt?: string, mode?: ImageGenMode, aiDebug?: any) => void;
  brandContext?: BrandProfile;
  initialImageUrl?: string;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({ type, prompt, lang, onClose, onSuccess, brandContext, initialImageUrl }) => {
  const t = translations[lang];
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(!!initialImageUrl);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(initialImageUrl || null);
  const [needsKey, setNeedsKey] = useState(false);
  const [mode, setMode] = useState<ImageGenMode>('PHOTO');
  const [variantCount, setVariantCount] = useState(0);
  const [editInstruction, setEditInstruction] = useState('');

  const handleStartGeneration = async (skipKeyCheck = false, seed: number = 0) => {
    if (type === 'video' && !skipKeyCheck) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) { setNeedsKey(true); return; }
    }

    setIsGenerating(true);
    // Maintain old preview if regenerating
    if (seed === 0 && !initialImageUrl) setIsDone(false); 
    
    setNeedsKey(false);
    setError(null);
    setLogs(prev => [...prev, `[SYS] ${seed > 0 ? 'Recalibrating' : 'Initiating'} ${type} engine (Seed: ${seed})...`]);
    setProgress(10);

    try {
      if (type === 'image' && brandContext) {
        setLogs(prev => [...prev, "[AI] Loading Brand Context & Style References..."]);
        const result = await generateAIImage(prompt, brandContext, 'instagram', mode, seed, editInstruction);
        setLogs(prev => [...prev, "[AI] Brief synthesized.", "[AI] Rendering scene..."]);
        setResultUrl(result.url);
        setProgress(100);
        setIsDone(true);
        onSuccess(result.url, result.brief, result.prompt, mode, result.debug);
      } else if (type === 'video') {
        setLogs(prev => [...prev, "[AI] Initializing VEO Video Engine..."]);
        const url = await generateAIVideo(prompt, editInstruction);
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

  const handleRegenerate = () => {
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
              <p className="font-bold uppercase tracking-widest text-xs">{error}</p>
              <button 
                onClick={() => handleStartGeneration(false, variantCount)} 
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-black text-[10px] uppercase hover:bg-red-600 transition"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {!isGenerating && !isDone && !error && !needsKey ? (
            <div className="text-center space-y-8">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 italic text-sm">"{prompt}"</p>
              </div>
              
              {type === 'image' && (
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button 
                        onClick={() => setMode('PHOTO')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${mode === 'PHOTO' ? 'border-cyber-turquoise bg-cyber-turquoise/10 text-cyber-turquoise shadow-[0_0_15px_rgba(52,224,247,0.2)]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                    >
                        <Camera size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">PHOTO</span>
                    </button>
                    <button 
                        onClick={() => setMode('POSTER')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${mode === 'POSTER' ? 'border-cyber-magenta bg-cyber-magenta/10 text-cyber-magenta shadow-[0_0_15px_rgba(199,76,255,0.2)]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                    >
                        <Layout size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">POSTER</span>
                    </button>
                </div>
              )}

              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12} /> {t.editInstructionLabel} (Opcjonalnie)
                </label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-purple text-xs text-gray-300 h-20"
                  placeholder={t.editInstructionPlaceholder}
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                />
              </div>

              <button 
                onClick={() => handleStartGeneration()}
                className="w-full py-4 bg-cyber-purple text-white font-black rounded-xl hover:bg-cyber-magenta transition uppercase tracking-widest shadow-[0_0_20px_rgba(140,77,255,0.3)]"
              >
                Launch {type} Engine
              </button>
            </div>
          ) : isGenerating ? (
            <div className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 size={48} className="text-cyber-purple animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-cyber-purple/20 animate-pulse rounded-full"></div>
                  </div>
                  <h3 className="font-futuristic font-bold text-white uppercase tracking-widest">{t.genWorking}</h3>
                </div>
                
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-purple transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-[9px] text-green-400 h-32 overflow-y-auto text-left border border-white/5">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                    <div className="animate-pulse">_ Generating variant...</div>
                </div>
            </div>
          ) : isDone && (
            <div className="text-center space-y-6 animate-fadeIn">
               <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="text-xl font-futuristic font-bold text-white uppercase tracking-tighter">{t.genComplete}</h3>
               </div>

               <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group shadow-2xl">
                  {type === 'image' ? (
                    <img src={resultUrl!} className="w-full h-full object-cover" />
                  ) : (
                    <video src={resultUrl!} controls className="w-full h-full object-cover" />
                  )}
               </div>
               
               <div className="space-y-4">
                  <div className="text-left space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={12} /> {t.editInstructionLabel}
                    </label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-purple text-xs text-gray-300 h-20"
                      placeholder={t.editInstructionPlaceholder}
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="w-full py-4 bg-cyber-purple text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyber-magenta shadow-[0_0_20px_rgba(140,77,255,0.4)] transition-all disabled:opacity-50"
                    >
                      <RotateCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                      {t.addMorePower}
                    </button>
                    <button 
                      onClick={onClose} 
                      disabled={isGenerating}
                      className="w-full py-3 text-gray-400 hover:text-white rounded-xl font-bold uppercase transition bg-white/5 border border-white/10"
                    >
                      {t.close}
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};