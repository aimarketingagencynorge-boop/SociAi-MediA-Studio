
import React, { useEffect, useState } from 'react';
import { translations, Language } from '../translations';
import { X, Sparkles, CheckCircle, AlertCircle, Camera, Layout, RotateCw, Loader2, MessageSquare, Info } from 'lucide-react';
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

const VIDEO_STATUS_MESSAGES = [
    "Inicjacja rdzenia VEO...",
    "Skanowanie Holokronu marki...",
    "Synteza briefu kreatywnego...",
    "Renderowanie klatek kinowych...",
    "Balansowanie palety kolorów...",
    "Finalizacja transmisji..."
];

export const GenerationModal: React.FC<GenerationModalProps> = ({ type, prompt, lang, onClose, onSuccess, brandContext, initialImageUrl }) => {
  const t = translations[lang];
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(!!initialImageUrl);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(initialImageUrl || null);
  const [mode, setMode] = useState<ImageGenMode>('PHOTO');
  const [editInstruction, setEditInstruction] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Mandatory API Key selection for Veo models as per guidelines
  const checkApiKeyAndStart = async () => {
    if (type === 'video' && typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // GUIDELINE: Assume the key selection was successful after triggering openSelectKey() and proceed.
      }
    }
    handleStartGeneration();
  };

  const handleStartGeneration = async (seed: number = 0) => {
    setIsGenerating(true);
    setError(null);
    setLogs(prev => [...prev, `[JedAi Debug] Uruchamianie silnika ${type}...`]);
    setProgress(10);

    const statusInterval = setInterval(() => {
        setLogs(prev => {
            const nextMsg = VIDEO_STATUS_MESSAGES[Math.floor(Math.random() * VIDEO_STATUS_MESSAGES.length)];
            return [...prev.slice(-10), `[AI] ${nextMsg}`];
        });
        setProgress(p => Math.min(p + 5, 95));
    }, 4000);

    try {
      if (type === 'image' && brandContext) {
        const result = await generateAIImage(prompt, brandContext, 'instagram', mode, seed, editInstruction);
        setResultUrl(result.url);
        setDebugData(result.debug);
        setIsDone(true);
        onSuccess(result.url, result.brief, result.prompt, mode, result.debug);
      } else if (type === 'video' && brandContext) {
        try {
          const result = await generateAIVideo(prompt, brandContext, editInstruction);
          setResultUrl(result.url);
          setDebugData(result.debug);
          setIsDone(true);
          onSuccess(result.url, null, null, undefined, result.debug);
        } catch (videoError: any) {
          // GUIDELINE: If request fails with "Requested entity was not found.", reset key selection and prompt again.
          if (videoError.message?.includes("Requested entity was not found")) {
             if (typeof (window as any).aistudio !== 'undefined') {
                await (window as any).aistudio.openSelectKey();
             }
             throw new Error("Wymagana re-autoryzacja klucza API. Wybierz projekt z aktywnym bilingiem.");
          }
          throw videoError;
        }
      }
    } catch (e: any) {
      setError(e.message || "Błąd połączenia z siecią neuronową.");
    } finally {
      clearInterval(statusInterval);
      setIsGenerating(false);
      setProgress(100);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyber-dark/95 backdrop-blur-xl">
      <div className="w-full max-w-2xl glass-card border border-cyber-purple/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-purple/20 rounded-lg text-cyber-purple animate-pulse"><Sparkles size={20} /></div>
             <h2 className="text-lg font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.genTitle}</h2>
          </div>
          {!isGenerating && <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>}
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-center flex flex-col items-center gap-4">
              <AlertCircle size={32} />
              <p className="font-bold uppercase tracking-widest text-xs">{error}</p>
              <button onClick={() => checkApiKeyAndStart()} className="px-6 py-2 bg-red-500 text-white rounded-lg font-black text-[10px] uppercase">PONÓW PRÓBĘ</button>
            </div>
          )}

          {!isGenerating && !isDone && !error ? (
            <div className="text-center space-y-8">
              <p className="text-gray-400 italic text-sm p-4 bg-black/30 rounded-xl">"{prompt}"</p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <button onClick={() => setMode('PHOTO')} className={`p-4 rounded-2xl border ${mode === 'PHOTO' ? 'border-cyber-turquoise bg-cyber-turquoise/10 text-cyber-turquoise' : 'border-white/10 text-gray-500'}`}>
                    <Camera size={24} className="mx-auto mb-2" /> <span className="text-[10px] font-black uppercase">PHOTO</span>
                </button>
                <button onClick={() => setMode('POSTER')} className={`p-4 rounded-2xl border ${mode === 'POSTER' ? 'border-cyber-magenta bg-cyber-magenta/10 text-cyber-magenta' : 'border-white/10 text-gray-500'}`}>
                    <Layout size={24} className="mx-auto mb-2" /> <span className="text-[10px] font-black uppercase">POSTER</span>
                </button>
              </div>
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12} /> Instrukcje edycji</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 h-20" placeholder="Np. cieplejsze barwy..." value={editInstruction} onChange={e => setEditInstruction(e.target.value)} />
              </div>
              <button onClick={() => checkApiKeyAndStart()} className="w-full py-4 bg-cyber-purple text-white font-black rounded-xl uppercase tracking-widest shadow-lg">START SILNIKA {type.toUpperCase()}</button>
            </div>
          ) : isGenerating ? (
            <div className="space-y-6 text-center py-10">
                <Loader2 size={48} className="text-cyber-purple animate-spin mx-auto mb-4" />
                <h3 className="font-futuristic font-bold text-white uppercase tracking-widest">TRWA GENEROWANIE...</h3>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-cyber-purple transition-all" style={{ width: `${progress}%` }} /></div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-[9px] text-green-400 h-24 overflow-y-auto text-left border border-white/5">{logs.map((log, i) => <div key={i}>{log}</div>)}</div>
            </div>
          ) : isDone && (
            <div className="text-center space-y-6">
               <div className="flex flex-col items-center gap-2">
                  <CheckCircle size={32} className="text-green-400" />
                  <h3 className="text-xl font-futuristic font-bold text-white uppercase tracking-tighter">{t.genComplete}</h3>
               </div>
               <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
                  {type === 'image' ? <img src={resultUrl!} className="w-full h-full object-cover" /> : <video src={resultUrl!} controls className="w-full h-full object-cover" />}
                  {debugData && <button onClick={() => setShowDebug(!showDebug)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-cyber-turquoise"><Info size={16} /></button>}
               </div>
               {showDebug && debugData && (
                   <div className="bg-black/80 rounded-xl p-4 text-left font-mono text-[8px] text-gray-400 border border-white/10 animate-slideDown">
                       <p className="text-cyber-turquoise font-bold mb-1">[JedAi Debug Snapshot]</p>
                       <p>Palette: {debugData.palette?.join(', ')}</p>
                       <p>Missing: {debugData.missingFields?.join(', ') || 'NONE'}</p>
                   </div>
               )}
               <button onClick={onClose} className="w-full py-3 text-gray-400 hover:text-white rounded-xl font-bold uppercase transition bg-white/5 border border-white/10">{t.close}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
