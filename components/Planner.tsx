import React, { useState, useMemo, useRef } from 'react';
import { NeonCard } from './NeonCard';
import { BrandProfile, SocialPost, ContentFormat, ImageGenMode } from '../types';
import { 
    Instagram, Facebook, Linkedin, Video, Edit2, Trash2, Image as ImageIcon, Sparkles, Plus, Zap, Clock, Shield, Film, RotateCw, Loader2, Info, ChevronLeft, ChevronRight, Settings as SettingsIcon
} from 'lucide-react';
import { generateWeeklyStrategy, generateAIImage } from '../services/geminiService';
import { translations, Language } from '../translations';
import { GenerationModal } from './GenerationModal';

interface PlannerProps {
  posts: SocialPost[];
  profile: BrandProfile;
  lang: Language;
  onUpdateCredits: (amount: number) => void;
  // Fixed type to support functional updates and avoid 'unknown' map error
  onUpdatePosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
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
  const [formats] = useState<ContentFormat[]>(DEFAULT_FORMATS);
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

  const handleAddManualPost = () => {
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      platform: 'instagram',
      date: new Date().toISOString().split('T')[0],
      content: 'Nowa transmisja...',
      hashtags: [],
      status: 'draft',
      mediaSource: 'ai_generated'
    };
    // Explicit type for prev to resolve unknown map error
    onUpdatePosts((prev: SocialPost[]) => [newPost, ...prev]);
  };

  const handleRegenerateImage = async (post: SocialPost) => {
    if (regeneratingPostIds.has(post.id)) return;
    setRegeneratingPostIds(prev => new Set(prev).add(post.id));
    onUpdateCredits(-5);
    try {
        const nextSeed = (post.variantCount || 0) + 1;
        const result = await generateAIImage(post.content, profile, post.platform, post.aiMode || 'PHOTO', nextSeed);
        // Explicit type for prev to resolve unknown map error
        onUpdatePosts((prev: SocialPost[]) => (prev as SocialPost[]).map(p => p.id === post.id ? {
            ...p,
            imageUrl: result.url,
            imageHistory: [...new Set([...(p.imageHistory || []), result.url])],
            variantCount: nextSeed,
            aiPrompt: result.prompt,
            aiDebug: result.debug
        } : p));
    } catch (e: any) { 
        alert(e.message || "Błąd regeneracji.");
    } finally {
        setRegeneratingPostIds(prev => { const next = new Set(prev); next.delete(post.id); return next; });
    }
  };

  const handleSwitchVariant = (postId: string, direction: 'prev' | 'next') => {
    // Explicit type for prev to resolve unknown map error
    onUpdatePosts((prev: SocialPost[]) => (prev as SocialPost[]).map(p => {
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
        // Explicit type for prev to resolve unknown map error
        onUpdatePosts((prev: SocialPost[]) => [...prev, ...newPosts]);
    } catch (e) { console.error(e); } finally { setIsWeeklyGenActive(false); }
  };

  const platformIcons = {
    instagram: <Instagram size={16} className="text-pink-500" />,
    facebook: <Facebook size={16} className="text-blue-500" />,
    linkedin: <Linkedin size={16} className="text-blue-700" />,
    tiktok: <Video size={16} className="text-cyber-turquoise" />
  };

  // Fixed type to support functional updates and avoid 'unknown' map error
  const handleSuccessUpdate = (url: string, brief?: any, aiPrompt?: string, mode?: ImageGenMode, aiDebug?: any) => {
    if (!genModal) return;
    // Fix: Explicitly typing 'prev' as SocialPost[] to resolve the "Property 'map' does not exist on type 'unknown'" error.
    onUpdatePosts((prev: SocialPost[]) => (prev as SocialPost[]).map(p => p.id === genModal.postId ? {
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
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 md:pb-20 px-2 md:px-0">
      {genModal && (
        <GenerationModal 
          type={genModal.type} 
          prompt={genModal.prompt} 
          lang={lang} 
          brandContext={profile}
          initialImageUrl={genModal.initialUrl}
          onClose={() => setGenModal(null)} 
          onSuccess={handleSuccessUpdate}
        />
      )}
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-futuristic font-bold neon-text-purple uppercase tracking-[0.15em]">{t.plannerTitle}</h1>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-2 italic"><Shield size={14} className="text-cyber-turquoise" /> {t.plannerSubtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button onClick={handleAddManualPost} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition">
             <Plus size={18} /> {t.addPost}
          </button>
          <button onClick={handleGenerateWeekly} disabled={isWeeklyGenActive} className="bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-purple hover:text-white transition">
             {isWeeklyGenActive ? <Clock className="animate-spin" /> : <Zap size={20} />} {isWeeklyGenActive ? t.genWorking : t.genWeekly}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <aside className="xl:col-span-1 space-y-6 order-2 xl:order-1">
           <NeonCard title={t.formatManager} icon={<SettingsIcon size={18}/>}>
              <div className="space-y-4">
                 {formats.map(format => (
                    <div key={format.id} className="p-4 bg-white/5 rounded-xl border-l-4 border-white/10 hover:border-cyber-purple transition-all" style={{ borderLeftColor: format.color }}>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm text-white">{format.name}</h4>
                            <span className="text-[10px] font-black text-gray-500">{format.postsPerWeek}x</span>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{format.keyword}</p>
                    </div>
                 ))}
              </div>
           </NeonCard>
        </aside>

        <div className="xl:col-span-3 space-y-12 order-1 xl:order-2">
           {/* Fix: Explicitly casting Object.entries result to resolve "Property 'map' does not exist on type 'unknown'" error */}
           {(Object.entries(groupedPosts) as [string, SocialPost[]][]).map(([date, dayPosts]) => (
             <div key={date} className="relative pl-6 md:pl-10 border-l border-white/5 space-y-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyber-dark border-2 border-cyber-purple shadow-[0_0_10px_#8C4DFF]" />
                <h3 className="text-xl md:text-3xl font-futuristic font-bold text-white uppercase tracking-tighter leading-none">{date}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {dayPosts.map(post => (
                        <NeonCard key={post.id}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">{platformIcons[post.platform as keyof typeof platformIcons]}</div>
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">{post.platform}</span>
                                </div>
                                {/* Fix: Added explicit casting to ensure p is recognized as SocialPost in complex JSX contexts */}
                                <button onClick={() => onUpdatePosts((prev: SocialPost[]) => (prev as SocialPost[]).map(p => p.id === post.id ? {...p, status: 'approved'} : p))} className="text-[10px] font-black text-cyber-turquoise uppercase bg-cyber-turquoise/5 px-3 py-1.5 rounded-lg border border-cyber-turquoise/30">
                                    <Sparkles size={14} /> {t.approve}
                                </button>
                            </div>

                            <p className="text-xs md:text-sm text-gray-200 italic mb-5 p-4 bg-black/40 rounded-xl">"{post.content}"</p>

                            {post.imageUrl || post.videoUrl ? (
                                <div className="space-y-4">
                                    <div className="relative group/img rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        {post.imageUrl ? (
                                          <img src={post.imageUrl} className={`w-full aspect-[4/3] object-cover ${regeneratingPostIds.has(post.id) ? 'blur-md' : ''}`} />
                                        ) : (
                                          <video src={post.videoUrl} className="w-full aspect-[4/3] object-cover" controls />
                                        )}
                                        {post.imageHistory && post.imageHistory.length > 1 && (
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-40">
                                                <button onClick={() => handleSwitchVariant(post.id, 'prev')} className="text-gray-400 hover:text-white"><ChevronLeft size={16}/></button>
                                                <span className="text-[10px] font-black text-white">{post.imageHistory.indexOf(post.imageUrl || '') + 1}/{post.imageHistory.length}</span>
                                                <button onClick={() => handleSwitchVariant(post.id, 'next')} className="text-gray-400 hover:text-white"><ChevronRight size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setGenModal({type: post.videoUrl ? 'video' : 'image', prompt: post.content, postId: post.id, initialUrl: post.imageUrl || post.videoUrl})} className="p-1 text-gray-500 hover:text-white"><Edit2 size={20} /></button>
                                            <button onClick={() => onUpdatePosts((prev: SocialPost[]) => (prev as SocialPost[]).filter(p => p.id !== post.id))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={20} /></button>
                                        </div>
                                        <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">Format: {post.format || 'STANDARD'}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setGenModal({type: 'image', prompt: post.content, postId: post.id})} className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-turquoise/5 border border-dashed border-cyber-turquoise/20 text-gray-500 hover:text-cyber-turquoise transition">
                                        <ImageIcon size={20} /> <span className="text-[10px] font-black uppercase">{t.genImage}</span>
                                    </button>
                                    <button onClick={() => setGenModal({type: 'video', prompt: post.content, postId: post.id})} className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-magenta/5 border border-dashed border-cyber-magenta/20 text-gray-400 hover:text-cyber-magenta transition">
                                        <Film size={20} /> <span className="text-[10px] font-black uppercase">{t.genVideo}</span>
                                    </button>
                                </div>
                            )}
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
