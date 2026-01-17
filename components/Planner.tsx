
import React, { useState, useMemo, useRef } from 'react';
import { NeonCard } from './NeonCard';
import { BrandProfile, SocialPost, PostStatus, MediaSource, ContentFormat } from '../types';
import { 
    Instagram, 
    Facebook, 
    Linkedin, 
    Video, 
    Edit2, 
    Trash2, 
    Image as ImageIcon, 
    Sparkles, 
    CheckCircle2, 
    Upload, 
    Zap,
    Clock,
    Plus,
    X,
    Dna,
    Shield,
    Film,
    RotateCw,
    Save,
    Wand2
} from 'lucide-react';
import { generateWeeklyStrategy, getFormattedSignature } from '../services/geminiService';
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
  const [genModal, setGenModal] = useState<{type: 'image' | 'video', prompt: string} | null>(null);
  
  const [formats, setFormats] = useState<ContentFormat[]>(DEFAULT_FORMATS);
  const [showFormatForm, setShowFormatForm] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [newFormat, setNewFormat] = useState({ name: '', keyword: '', quota: 1 });
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePostForUpload, setActivePostForUpload] = useState<{id: string, type: 'image' | 'video'} | null>(null);

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

  const handleGenerateWeekly = async () => {
    setIsWeeklyGenActive(true);
    onUpdateCredits(-50); 
    try {
        const newPosts = await generateWeeklyStrategy(profile, lang, formats);
        onUpdatePosts([...posts, ...newPosts]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsWeeklyGenActive(false);
    }
  };

  const handleAddFormat = () => {
    if (!newFormat.name || !newFormat.keyword) return;
    const format: ContentFormat = {
        id: Date.now().toString(),
        name: newFormat.name.toUpperCase(),
        keyword: newFormat.keyword.toUpperCase(),
        postsPerWeek: newFormat.quota,
        color: editingFormatId ? formats.find(f => f.id === editingFormatId)?.color || '#FFFFFF' : '#FFFFFF'
    };

    if (editingFormatId) {
        setFormats(formats.map(f => f.id === editingFormatId ? { ...format, id: editingFormatId } : f));
        setEditingFormatId(null);
    } else {
        setFormats([...formats, format]);
    }
    
    setNewFormat({ name: '', keyword: '', quota: 1 });
    setShowFormatForm(false);
  };

  const startEditFormat = (fmt: ContentFormat) => {
    setEditingFormatId(fmt.id);
    setNewFormat({ name: fmt.name, keyword: fmt.keyword, quota: fmt.postsPerWeek });
    setShowFormatForm(true);
  };

  const removeFormat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormats(formats.filter(f => f.id !== id));
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten post?")) {
        onUpdatePosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEditPost = () => {
    onUpdatePosts(posts.map(p => p.id === editingPostId ? { ...p, content: editContent } : p));
    setEditingPostId(null);
  };

  const handleAddPostAtDate = (date: string) => {
    const newPost: SocialPost = {
        id: Date.now().toString(),
        platform: 'instagram',
        date,
        content: 'Wprowadź treść nowego posta...',
        hashtags: ['nowypost', profile.name.toLowerCase().replace(/\s/g, '')],
        status: 'draft',
        mediaSource: 'client_upload'
    };
    onUpdatePosts([...posts, newPost]);
    handleEditPost(newPost);
  };

  const handleApprove = (postId: string) => {
    onUpdatePosts(posts.map(p => p.id === postId ? { ...p, status: 'approved' as PostStatus } : p));
  };

  const handleAiRegeneratePost = async (post: SocialPost) => {
    onUpdateCredits(-15);
    
    // Pobieramy sformatowaną sygnaturę
    const signature = getFormattedSignature(profile);
    
    // Definiujemy dłuższe, bardziej profesjonalne warianty tekstów
    const variations = [
      `Zmień sposób, w jaki świat postrzega Twoją markę dzięki SociAI MediA Studio. Nasze zaawansowane algorytmy AI analizują trendy w czasie rzeczywistym, tworząc treści, które nie tylko przyciągają wzrok, ale budują autentyczne zaangażowanie i lojalność klientów. Wznieś swój marketing na wyższy poziom innowacji już dziś.`,
      `Czy Twoja komunikacja w mediach społecznościowych potrzebuje nowego impulsu? W SociAI MediA Studio projektujemy przyszłość Twojej obecności online. Wykorzystujemy najnowszą technologię Gemini AI, aby każda publikacja była precyzyjnie dopasowana do Twojej grupy docelowej, zachowując unikalny ton i wartości Twojej marki.`,
      `Odkryj potęgę inteligentnego marketingu opartego na danych. Tworzymy kampanie, które realnie konwertują, optymalizując każdy hashtag i grafikę pod kątem zasięgów. Razem z SociAI MediA Studio stajesz się liderem w cyfrowym świecie, wyprzedzając konkurencję dzięki strategicznemu wykorzystaniu sztucznej inteligencji.`
    ];
    
    let newText = variations[Math.floor(Math.random() * variations.length)];
    
    // Doklejamy sygnaturę, jeśli jest włączona w profilu
    if (profile.autoAppendSignature && signature) {
        newText += "\n" + signature;
    }

    const newHashtags = ["Innowacja", "SociAI", "Przyszłość", "MarketingAI", "Success", "DigitalGrowth"];
    
    onUpdatePosts(posts.map(p => p.id === post.id ? { 
        ...p, 
        content: newText, 
        hashtags: newHashtags,
        status: 'needs_review' 
    } : p));
  };

  const toggleMediaSource = (postId: string) => {
    onUpdatePosts(posts.map(p => {
        if (p.id === postId) {
            return { ...p, mediaSource: p.mediaSource === 'ai_generated' ? 'client_upload' : 'ai_generated' as MediaSource };
        }
        return p;
    }));
  };

  const handleOpenGenModal = (type: 'image' | 'video', postContent: string) => {
    setGenModal({ type, prompt: postContent });
  };

  const handleFileUploadTrigger = (postId: string, type: 'image' | 'video') => {
    setActivePostForUpload({ id: postId, type });
    if (fileInputRef.current) {
        fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePostForUpload) {
        const url = URL.createObjectURL(file);
        onUpdatePosts(posts.map(p => {
            if (p.id === activePostForUpload.id) {
                return activePostForUpload.type === 'image' 
                    ? { ...p, imageUrl: url, videoUrl: undefined } 
                    : { ...p, videoUrl: url, imageUrl: undefined };
            }
            return p;
        }));
    }
    setActivePostForUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const platformIcons = {
    instagram: <Instagram size={16} className="text-pink-500" />,
    facebook: <Facebook size={16} className="text-blue-500" />,
    linkedin: <Linkedin size={16} className="text-blue-700" />,
    tiktok: <Video size={16} className="text-cyber-turquoise" />
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 md:pb-20 px-2 md:px-0">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {genModal && (
        <GenerationModal 
          type={genModal.type} 
          prompt={genModal.prompt} 
          lang={lang} 
          brandContext={profile}
          onClose={() => setGenModal(null)} 
          onSuccess={(url) => {
              const updated = posts.map(p => p.content === genModal.prompt ? (
                  genModal.type === 'image' ? { ...p, imageUrl: url, videoUrl: undefined } : { ...p, videoUrl: url, imageUrl: undefined }
              ) : p);
              onUpdatePosts(updated);
              onUpdateCredits(genModal.type === 'image' ? -5 : -25);
          }}
        />
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-futuristic font-bold neon-text-purple uppercase tracking-[0.15em]">{t.plannerTitle}</h1>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-2 italic">
             <Shield size={14} className="text-cyber-turquoise" /> {t.plannerSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
           <button 
             onClick={handleGenerateWeekly}
             disabled={isWeeklyGenActive}
             className="w-full md:w-auto bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-purple hover:text-white transition disabled:opacity-50 group"
           >
             {isWeeklyGenActive ? <Clock className="animate-spin" /> : <Zap size={20} className="group-hover:rotate-12 transition" />}
             {isWeeklyGenActive ? t.genWorking : t.genWeekly}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
           <NeonCard title={t.formatManager} icon={<Dna size={18} />}>
             <div className="space-y-4">
                {formats.map(fmt => (
                    <div 
                        key={fmt.id} 
                        onClick={() => startEditFormat(fmt)}
                        className="p-3 bg-white/5 rounded-xl border border-white/10 group relative transition-all hover:bg-white/10 cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase text-white tracking-wider">{fmt.name}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={(e) => removeFormat(fmt.id, e)} className="p-1 text-red-400 hover:bg-red-500/10 rounded transition">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-500 uppercase font-black">
                            <span>{fmt.keyword}</span>
                            <span className="text-cyber-turquoise">{fmt.postsPerWeek}X</span>
                        </div>
                        <div className="absolute left-0 top-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: fmt.color }} />
                    </div>
                ))}
                
                {showFormatForm ? (
                    <div className="space-y-3 p-4 bg-cyber-purple/5 border border-cyber-purple/30 rounded-xl animate-fadeIn">
                        <input 
                            placeholder={t.formatName} 
                            className="w-full bg-cyber-dark/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white uppercase"
                            value={newFormat.name}
                            onChange={e => setNewFormat({...newFormat, name: e.target.value})}
                        />
                        <input 
                            placeholder={t.formatKeyword} 
                            className="w-full bg-cyber-dark/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white uppercase"
                            value={newFormat.keyword}
                            onChange={e => setNewFormat({...newFormat, keyword: e.target.value})}
                        />
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] uppercase font-bold text-gray-500">{t.formatQuota}</span>
                            <input 
                                type="number" 
                                className="w-16 bg-cyber-dark/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                value={newFormat.quota}
                                onChange={e => setNewFormat({...newFormat, quota: parseInt(e.target.value) || 1})}
                            />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={handleAddFormat} className="flex-1 py-2 bg-cyber-purple text-white rounded-lg text-xs font-bold uppercase">{editingFormatId ? t.saveSettings : t.addFormat}</button>
                             <button onClick={() => { setShowFormatForm(false); setEditingFormatId(null); }} className="p-2 border border-white/10 rounded-lg text-gray-500 hover:text-white"><X size={14}/></button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => { setShowFormatForm(true); setEditingFormatId(null); setNewFormat({name:'', keyword:'', quota:1}); }}
                        className="w-full py-3 border border-dashed border-white/10 text-gray-500 hover:text-white rounded-xl transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                    >
                        <Plus size={14} /> {t.addFormat}
                    </button>
                )}
             </div>
           </NeonCard>
        </div>

        <div className="xl:col-span-3 space-y-12">
           {(Object.entries(groupedPosts) as [string, SocialPost[]][]).map(([date, dayPosts]) => (
             <div key={date} className="relative pl-6 md:pl-10 border-l border-white/5 space-y-6">
                {/* Timeline Circle */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyber-dark border-2 border-cyber-purple shadow-[0_0_10px_#8C4DFF]" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl md:text-3xl font-futuristic font-bold text-white uppercase tracking-tighter leading-none">{date}</h3>
                        {dayPosts.length > 1 && (
                            <span className="bg-cyber-purple/20 text-cyber-purple px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-cyber-purple/30">
                                {t.multiPostDay}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => handleAddPostAtDate(date)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyber-turquoise hover:text-white transition group"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition" /> {t.addPost}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {dayPosts.map(post => (
                        <NeonCard 
                            key={post.id} 
                            className={`transition-all duration-300 ${post.status === 'approved' ? 'border-green-500/40' : 'border-cyber-purple/20'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">{platformIcons[post.platform]}</div>
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">{post.platform}</span>
                                </div>
                                <div className="flex gap-3 items-center">
                                    {post.status === 'approved' ? (
                                        <div className="flex items-center gap-2 text-[10px] font-black text-cyber-turquoise uppercase tracking-widest bg-cyber-turquoise/10 px-3 py-1.5 rounded-lg border border-cyber-turquoise/20">
                                            <Zap size={14} className="fill-cyber-turquoise" /> {t.statusApproved}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleAiRegeneratePost(post)}
                                                className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition flex items-center gap-1.5"
                                            >
                                                <Wand2 size={12} /> {t.fixAi}
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(post.id)}
                                                className="text-[10px] font-black text-cyber-turquoise uppercase tracking-widest flex items-center gap-1.5 bg-cyber-turquoise/5 px-3 py-1.5 rounded-lg border border-cyber-turquoise/30 hover:bg-cyber-turquoise/20 transition shadow-[0_0_10px_rgba(52,224,247,0.1)]"
                                            >
                                                <Sparkles size={14} /> {t.approve}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-5 group relative min-h-[120px] overflow-hidden">
                                {editingPostId === post.id ? (
                                    <div className="space-y-3">
                                        <textarea 
                                            className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl p-3 text-xs md:text-sm text-gray-200 focus:outline-none min-h-[100px]"
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={saveEditPost}
                                                className="flex items-center gap-2 bg-cyber-purple px-4 py-2 rounded-lg text-[10px] font-black uppercase text-white hover:bg-cyber-magenta transition"
                                            >
                                                <Save size={14} /> ZAPISZ
                                            </button>
                                            <button 
                                                onClick={() => setEditingPostId(null)}
                                                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase text-gray-500 border border-white/10 hover:text-white transition"
                                            >
                                                ANULUJ
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-medium italic whitespace-pre-wrap tracking-wide">
                                            "{post.content}"
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                                            {post.hashtags.map(h => <span key={h} className="text-[10px] font-bold text-cyber-purple">#{h}</span>)}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">{t.aiMedia}</span>
                                    <button 
                                        onClick={() => toggleMediaSource(post.id)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${post.mediaSource === 'ai_generated' ? 'bg-cyber-purple' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${post.mediaSource === 'ai_generated' ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                {post.mediaSource === 'ai_generated' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleOpenGenModal('image', post.content)}
                                            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-turquoise/5 border border-dashed border-cyber-turquoise/20 text-gray-500 hover:text-cyber-turquoise hover:bg-cyber-turquoise/10 transition group shadow-sm"
                                        >
                                            <ImageIcon size={20} className="group-hover:scale-110 transition" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.genImage}</span>
                                        </button>
                                        <button 
                                            onClick={() => handleOpenGenModal('video', post.content)}
                                            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-cyber-magenta/5 border border-dashed border-cyber-magenta/20 text-gray-400 hover:text-cyber-magenta hover:bg-cyber-magenta/10 transition group shadow-sm"
                                        >
                                            <Film size={20} className="group-hover:scale-110 transition" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.genVideo}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleFileUploadTrigger(post.id, 'image')}
                                            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-white/5 border border-dashed border-white/20 text-gray-500 hover:text-white transition group"
                                        >
                                            <Upload size={20} className="group-hover:-translate-y-1 transition" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.uploadGraphic}</span>
                                        </button>
                                        <button 
                                            onClick={() => handleFileUploadTrigger(post.id, 'video')}
                                            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-white/5 border border-dashed border-white/20 text-gray-500 hover:text-white transition group"
                                        >
                                            <Film size={20} className="group-hover:-translate-y-1 transition" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.uploadVideo}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {post.imageUrl && (
                              <div className="mt-5 aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 relative group/img shadow-2xl">
                                <img src={post.imageUrl} alt="Media" className="w-full h-full object-cover group-hover/img:scale-105 transition duration-700" />
                                {profile.logoUrl && (
                                  <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 p-1.5 shadow-xl">
                                    <img src={profile.logoUrl} className="w-full h-full object-contain" alt="watermark" />
                                  </div>
                                )}
                              </div>
                            )}

                            {post.videoUrl && (
                              <div className="mt-5 aspect-video rounded-2xl overflow-hidden border border-cyber-turquoise/30 shadow-[0_0_20px_rgba(52,224,247,0.1)]">
                                <video src={post.videoUrl} controls className="w-full h-full object-cover" />
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/5">
                                <div className="flex gap-4 text-gray-500">
                                    <button 
                                        onClick={() => handleEditPost(post)}
                                        className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePost(post.id)}
                                        className="p-2 hover:bg-white/5 rounded-xl hover:text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    FORMAT: {post.format || 'HOLOCRON'}
                                </div>
                            </div>
                        </NeonCard>
                    ))}
                </div>
             </div>
           ))}
        </div>
      </div>
      
      {/* Footer Simulation */}
      <p className="text-center text-[10px] text-gray-600 uppercase font-black tracking-[0.5em] pt-12">
          May the AI be with you. usetheforce.ai
      </p>
    </div>
  );
};
