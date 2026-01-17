import React, { useState } from 'react';
import { NeonCard } from './NeonCard';
import { translations, Language } from '../translations';
import { Integration, SocialAsset } from '../types';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Video, 
  Unlink, 
  Link as LinkIcon, 
  RefreshCw, 
  ShieldCheck,
  ChevronRight,
  Globe,
  UserCheck,
  X
} from 'lucide-react';

interface DockingBayProps {
  lang: Language;
}

const MOCK_ASSETS: Record<string, SocialAsset[]> = {
    fb: [
        { id: '1', externalId: 'p1', name: 'Official Brand Page', type: 'page', thumbnail: 'https://picsum.photos/40/40?random=1' },
        { id: '2', externalId: 'p2', name: 'Product Ventures', type: 'page', thumbnail: 'https://picsum.photos/40/40?random=2' }
    ],
    ig: [
        { id: '3', externalId: 'i1', name: 'brand_official_ig', type: 'business_account', thumbnail: 'https://picsum.photos/40/40?random=3' }
    ],
    li: [
        { id: '4', externalId: 'l1', name: 'Global Corp Inc.', type: 'company', thumbnail: 'https://picsum.photos/40/40?random=4' },
        { id: '5', externalId: 'l2', name: 'CEO Personal Profile', type: 'profile', thumbnail: 'https://picsum.photos/40/40?random=5' }
    ],
    tk: [
        { id: '6', externalId: 't1', name: '@brand_trends', type: 'creator_account', thumbnail: 'https://picsum.photos/40/40?random=6' }
    ]
};

export const DockingBay: React.FC<DockingBayProps> = ({ lang }) => {
  const t = translations[lang];
  const [dockingPlatform, setDockingPlatform] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectingAssetFor, setSelectingAssetFor] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<Integration[]>([
    { id: 'fb', provider: 'facebook', connected: false, status: 'none', assets: [] },
    { id: 'ig', provider: 'instagram', connected: true, status: 'active', assets: MOCK_ASSETS['ig'], selectedAssetId: '3' },
    { id: 'li', provider: 'linkedin', connected: false, status: 'none', assets: [] },
    { id: 'tk', provider: 'tiktok', connected: false, status: 'none', assets: [] },
  ]);

  const handleDock = (id: string) => {
    setDockingPlatform(id);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setDockingPlatform(null);
          setSelectingAssetFor(id);
          return 100;
        }
        return p + 10;
      });
    }, 80);
  };

  const handleSelectAsset = (platformId: string, assetId: string) => {
      setPlatforms(prev => prev.map(plat => 
        plat.id === platformId ? { 
            ...plat, 
            connected: true, 
            status: 'active' as const, 
            assets: MOCK_ASSETS[platformId],
            selectedAssetId: assetId 
        } : plat
      ));
      setSelectingAssetFor(null);
  };

  const handleDisconnect = (id: string) => {
    if (confirm("Odłączyć to połączenie?")) {
      setPlatforms(prev => prev.map(plat => 
        plat.id === id ? { ...plat, connected: false, status: 'none' as const, selectedAssetId: undefined, assets: [] } : plat
      ));
    }
  };

  const platformMeta = {
    facebook: { icon: <Facebook />, color: '#1877F2', label: 'Facebook' },
    instagram: { icon: <Instagram />, color: '#E4405F', label: 'Instagram' },
    linkedin: { icon: <Linkedin />, color: '#0A66C2', label: 'LinkedIn' },
    tiktok: { icon: <Video />, color: '#000000', label: 'TikTok' },
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.dockTitle}</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-cyber-turquoise" /> Zarządzaj bezpiecznymi kanałami komunikacji.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platforms.map(plat => {
          const meta = platformMeta[plat.provider];
          const selectedAsset = plat.assets.find(a => a.id === plat.selectedAssetId);

          return (
            <NeonCard key={plat.id} className={`transition-all duration-500 ${plat.connected ? 'border-cyber-turquoise/30' : 'opacity-80 hover:opacity-100'}`}>
              <div className="flex flex-col items-center text-center space-y-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl relative group overflow-hidden"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.icon}
                </div>

                <div className="w-full">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">{meta.label}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${plat.connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {plat.connected ? t.docked : t.notDocked}
                    </span>
                  </div>
                </div>

                {selectedAsset && plat.connected && (
                    <div className="w-full p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                        <img src={selectedAsset.thumbnail} className="w-8 h-8 rounded-lg" alt="" />
                        <div className="text-left overflow-hidden">
                            <p className="text-[10px] text-cyber-turquoise font-black uppercase leading-none mb-1">Aktywny Kanał</p>
                            <p className="text-[11px] text-white font-bold truncate">{selectedAsset.name}</p>
                        </div>
                    </div>
                )}

                {dockingPlatform === plat.id ? (
                  <div className="w-full space-y-3">
                     <p className="text-[9px] font-bold text-cyber-turquoise uppercase animate-pulse">{t.dockingProcess}</p>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyber-turquoise transition-all duration-300" style={{ width: `${progress}%` }} />
                     </div>
                  </div>
                ) : plat.connected ? (
                  <div className="w-full space-y-2">
                    <button 
                        onClick={() => setSelectingAssetFor(plat.id)}
                        className="w-full py-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition"
                    >
                        Zmień Kanał
                    </button>
                    <button 
                        onClick={() => handleDisconnect(plat.id)}
                        className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <Unlink size={14} /> Rozłącz
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleDock(plat.id)}
                    className="w-full py-3 bg-cyber-purple/20 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <LinkIcon size={14} /> Połącz
                  </button>
                )}
              </div>
            </NeonCard>
          );
        })}
      </div>

      {selectingAssetFor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cyber-dark/80 backdrop-blur-md animate-fadeIn">
              <div className="w-full max-w-lg glass-card border border-cyber-purple/30 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <h2 className="text-xl font-futuristic font-bold text-white uppercase tracking-widest">Wybierz Kanał</h2>
                      <button onClick={() => setSelectingAssetFor(null)} className="text-gray-500 hover:text-white"><X size={24}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      {MOCK_ASSETS[selectingAssetFor]?.map(asset => (
                          <button 
                            key={asset.id} 
                            onClick={() => handleSelectAsset(selectingAssetFor, asset.id)}
                            className="w-full group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyber-turquoise/50 hover:bg-cyber-turquoise/5 transition-all"
                          >
                              <div className="flex items-center gap-4">
                                  <img src={asset.thumbnail} className="w-12 h-12 rounded-xl" alt="" />
                                  <div className="text-left">
                                      <p className="text-white font-bold text-sm">{asset.name}</p>
                                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{asset.type}</p>
                                  </div>
                              </div>
                              <ChevronRight className="text-gray-600 group-hover:text-cyber-turquoise transition" size={20} />
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <NeonCard title="Bezpieczeństwo Połączenia" icon={<ShieldCheck size={18} />}>
           <div className="space-y-4">
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                 <Globe className="text-cyber-turquoise mt-1 shrink-0" size={16} />
                 <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Szyfrowanie 256-bit</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Wszystkie dane wysyłane do platform są szyfrowane end-to-end.</p>
                 </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                 <UserCheck className="text-green-400 mt-1 shrink-0" size={16} />
                 <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Autoryzacja OAuth 2.0</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">System nie przechowuje Twoich haseł, korzystamy z oficjalnych protokołów dostępu.</p>
                 </div>
              </div>
           </div>
        </NeonCard>
        
        <NeonCard title="Monitor Przesyłu" icon={<RefreshCw size={18} />}>
           <div className="space-y-4 font-mono text-[10px] text-gray-500">
              <div className="flex gap-4 items-center">
                 <span className="text-cyber-turquoise">2025-05-12 11:30:10</span>
                 <span className="text-white">API_SYNC: Channels ready.</span>
              </div>
              <div className="flex gap-4 items-center">
                 <span className="text-cyber-turquoise">2025-05-12 09:15:22</span>
                 <span className="text-white">ENCRYPTION: Secure Tunnel Active.</span>
              </div>
           </div>
        </NeonCard>
      </div>
    </div>
  );
};