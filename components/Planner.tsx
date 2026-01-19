import React, { useState, useMemo, useRef } from 'react';
import { NeonCard } from './NeonCard';
import { BrandProfile, SocialPost, PostStatus, MediaSource, ContentFormat, ImageGenMode } from '../types';
import { 
    Instagram, Facebook, Linkedin, Video, Edit2, Trash2, Image as ImageIcon, Sparkles, CheckCircle2, Upload, Zap, Clock, Plus, X, Dna, Shield, Film, RotateCw, Save, Wand2, Loader2, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { generateWeeklyStrategy, getFormattedSignature, generateAIImage } from '../services/geminiService';
import { translations, Language } from '../translations';
import { GenerationModal } from './GenerationModal';

interface PlannerProps {
  posts: SocialPost[];
  profile: BrandProfile;
  lang: Language;
  onUpdateCredits: (amount: number) => void;
  onUpdatePosts: (posts: SocialPost[]) => void;
}

const DEFAULT_FORMATS: ContentFormat[] = [
    { id: '1', name: 'HOLOCRON', keyword: 'EDUCATIONAL & STRATEGY', postsPerWeek: 3, color: '#34E0F7' },
    { id: '2', name: 'HYPERDRIVE', keyword: 'FAST NEWS & PROMO', postsPerWeek: 2, color: '#C74CFF' },
    { id: '3', name: 'CANTINA', keyword: 'COMMUNITY & VIBES', postsPerWeek: 2, color: '#8C4DFF' },
    { id: '4', name: 'NEXUS PULSE', keyword: 'VIRAL TRENDS', postsPerWeek: 1, color: '#FFFFFF' }
];

export const Planner: React.FC<PlannerProps> = ({ posts, profile, lang, onUpdateCredits, onUpdatePosts }) => {
  const [isWeeklyGenActive, setIsWeeklyGenActive] = useState(false);
  const [genModal, setGenModal] = useState<{type: 'image' | 'video', prompt: string, postId: string, initialUrl?: string} | null>(null);
  const [regeneratingPostIds, setRegeneratingPostIds] = useState<Set<string>>(new Set());
  
  const [formats, setFormats] = useState<ContentFormat[]>(DEFAULT_FORMATS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  const groupedPosts = useMemo(() => {
    const groups: Record<string, SocialPost[]> = {};
    posts.forEach(post => {
      if (!groups[post.date]) groups[post.date] = [];
      groups[post.date].push(post);
    });
    return Object.keys(groups).sort().reduce((acc, date) => {
        acc[date] = groups[date];
        return acc;
    }, {} as Record<string, SocialPost[]>);
  }, [posts]);

  const handleRegenerateImage = async (post: SocialPost) => {
    if (regeneratingPostIds.has(post.id)) return;
    setRegeneratingPostIds(prev => new Set(prev).add(post.id));
    onUpdateCredits(-5);
    try {
        const nextSeed = (post.variantCount || 0) + 1;
        const result = await generateAIImage(post.content, profile, post.platform, post.aiMode || 'PHOTO', nextSeed);
        onUpdatePosts(posts.map(p => p.id === post.id ? {
            ...p,
            imageUrl: result.url,
            imageHistory: [...new Set([...(p.imageHistory || []), result.url])],
            variantCount: nextSeed,
            creativeBrief: result.brief,
            aiPrompt: result.prompt,
            aiDebug: result.debug
        } : p));
    } catch (e: any) { 
      console.error("Regeneration failed", e); 
      alert(e.message || "Failed to regenerate image.");
    } finally {
        setRegeneratingPostIds(prev => { const next = new Set(prev); next.delete(post.id); return next; });
    }
  };

  const handleSwitchVariant = (postId: string, direction: 'prev' | 'next') => {
    onUpdatePosts(posts.map(p => {
        if (p.id === postId && p.imageHistory && p.imageHistory.length > 1) {
            const currentIndex = p.imageHistory.indexOf(p.imageUrl || '');
            let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex >= p.imageHistory.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = p.imageHistory.length - 1;
            return { ...p, imageUrl: p.imageHistory[nextIndex] };
        }
        return p;
    }));
  };

  const handleGenerateWeekly = async () => {
    setIsWeeklyGenActive(true);
    onUpdateCredits(-50); 
    try {
        const newPosts = await generateWeeklyStrategy(profile, lang, formats);
        onUpdatePosts([...posts, ...newPosts]);
    } catch (e) { console.error(e); } finally { setIsWeeklyGenActive(false); }
  };

  const platformIcons = {
    instagram: <Instagram size={16} className="text-pink-500" />,
    facebook: <Facebook size={16} className="text-blue-500" />,
    linkedin: <Linkedin size={16} className="text-blue-700" />,
    tiktok: <Video size={16} className="text-cyber-turquoise" />
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 md:pb-20 px-2 md:px-0">
      <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" />

      {genModal && (
        <GenerationModal 
          type={genModal.type} 
          prompt={genModal.prompt} 
          lang={lang} 
          brandContext={profile}
          initialImageUrl={genModal.initialUrl}
          onClose={() => setGenModal(null)} 
          onSuccess={(url, brief, aiPrompt, mode, aiDebug) => {
              onUpdatePosts(posts.map(p => p.id === genModal.postId ? {
                ...p,
                imageUrl: genModal.type === 'image' ? url : p.imageUrl,
                videoUrl: genModal.type === 'video' ? url : p.videoUrl,
                creativeBrief: brief || p.creativeBrief,
                aiPrompt: aiPrompt || p.aiPrompt,
                aiMode: mode || p.aiMode,
                imageHistory: genModal.type === 'image' ? [...new Set([...(p.imageHistory || []), url])] : p.imageHistory,
                variantCount: (p.variantCount || 0) + 1,
                aiDebug: aiDebug || p.aiDebug
              } : p));
          }}
        />
      )}
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-futuristic font-bold neon-text-purple uppercase tracking-[0.15em]">{t.plannerTitle}</h1>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-2 italic"><Shield size={14} className="text-cyber-turquoise" /> {t.plannerSubtitle}</p>
        </div>
        <button onClick={handleGenerateWeekly} disabled={isWeeklyGenActive} className="w-full md:w-auto bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-purple hover:text-white transition">
           {isWeeklyGenActive ? <Clock className="animate-spin" /> : <Zap size={20} />} {isWeeklyGenActive ? t.genWorking : t.genWeekly}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-4 space-y-12">
           {(Object.entries(groupedPosts) as [string, SocialPost[]][]).map(([date, dayPosts]) => (
             <div key={date} className="relative pl-6 md:pl-10 border-l border-white/5 space-y-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyber-dark border-2 border-cyber-purple shadow-[0_0_10px_#8C4DFF]" />
                <h3 className="text-xl md:text-3xl font-futuristic font-bold text-white uppercase tracking-tighter leading-none">{date}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {dayPosts.map(post => (
                        <NeonCard key={post.id} className={`${post.status === 'approved' ? 'border-green-500/40' : 'border-cyber-purple/20'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">{platformIcons[post.platform]}</div>
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">{post.platform}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => onUpdatePosts(posts.map(p => p.id === post.id ? {...p, status: 'approved'} : p))} className="text-[10px] font-black text-cyber-turquoise uppercase bg-cyber-turquoise/5 px-3 py-1.5 rounded-lg border border-cyber-turquoise/30 hover:bg-cyber-turquoise/20 transition">
                                        <Sparkles size={14} /> {t.approve}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-5 group min-h-[100px] relative">
                                <p className="text-xs md:text-sm text-gray-200 italic whitespace-pre-wrap">"{post.content}"</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">{t.aiMedia}</span>
                                    <div className="flex items-center gap-2">
                                        {post.aiMode && <span className="text-[8px] font-black bg-white/10 px-2 py-0.5 rounded text-gray-400">{post.aiMode}</span>}
                                    </div>
                                </div>

                                {post.imageUrl || post.videoUrl ? (
                                    <div className="relative group/img rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        {post.imageUrl ? (
                                          <img src={post.imageUrl} className={`w-full aspect-[4/3] object-cover transition-all duration-700 ${regeneratingPostIds.has(post.id) ? 'blur-md brightness-50' : 'group-hover/img:scale-105'}`} />
                                        ) : (
                                          <video src={post.videoUrl} className="w-full aspect-[4/3] object-cover" controls />
                                        )}
                                        
                                        {regeneratingPostIds.has(post.id) && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-cyber-turquoise gap-2 z-30 bg-black/40">
                                                <Loader2 size={32} className="animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Regenerating...</span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-20">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setGenModal({type: post.videoUrl ? 'video' : 'image', prompt: post.content, postId: post.id, initialUrl: post.imageUrl || post.videoUrl})}
                                                    className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-cyber-purple transition flex flex-col items-center gap-1 border border-white/10"
                                                >
                                                    <Edit2 size={18} />
                                                    <span className="text-[8px] font-black uppercase">{t.edit}</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleRegenerateImage(post)}
                                                    disabled={regeneratingPostIds.has(post.id)}
                                                    className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-cyber-magenta transition flex flex-col items-center gap-1 border border-white/10"
                                                >
                                                    <RotateCw size={18} className={regeneratingPostIds.has(post.id) ? 'animate-spin' : ''} />
                                                    <span className="text-[8px] font-black uppercase">{t.addMorePower}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {post.imageHistory && post.imageHistory.length > 1 && (
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-40">
                                                <button onClick={() => handleSwitchVariant(post.id, 'prev')} className="text-gray-400 hover:text-white transition"><ChevronLeft size={16}/></button>
                                                <span className="text-[10px] font-black text-white whitespace-nowrap">
                                                    {(post.imageHistory.indexOf(post.imageUrl || '') + 1)} / {post.imageHistory.length}
                                                </span>
                                                <button onClick={() => handleSwitchVariant(post.id, 'next')} className="text-gray-400 hover:text-white transition"><ChevronRight size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                ) : post.mediaSource === 'ai_generated' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setGenModal({type: 'image', prompt: post.content, postId: post.id})} className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-turquoise/5 border border-dashed border-cyber-turquoise/20 text-gray-500 hover:text-cyber-turquoise transition">
                                            <ImageIcon size={20} /> <span className="text-[10px] font-black uppercase">{t.genImage}</span>
                                        </button>
                                        <button onClick={() => setGenModal({type: 'video', prompt: post.content, postId: post.id})} className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-magenta/5 border border-dashed border-cyber-magenta/20 text-gray-400 hover:text-cyber-magenta transition">
                                            <Film size={20} /> <span className="text-[10px] font-black uppercase">{t.genVideo}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-gray-600">
                                        <Upload size={24} />
                                    </div>
                                )}

                                {(post.imageUrl || post.videoUrl) && (
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setGenModal({type: post.videoUrl ? 'video' : 'image', prompt: post.content, postId: post.id, initialUrl: post.imageUrl || post.videoUrl})}
                                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                                title={t.edit}
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button 
                                                onClick={() => onUpdatePosts(posts.filter(p => p.id !== post.id))}
                                                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                                title="Usuń"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                        {post.format && (
                                            <div className="px-5 py-2.5 bg-cyber-card border border-white/10 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] shadow-lg">
                                                Format: {post.format}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </NeonCard>
                    ))}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};