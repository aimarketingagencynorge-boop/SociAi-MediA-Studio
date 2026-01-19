import React, { useState, useRef } from 'react';
import { NeonCard } from './NeonCard';
import { BrandProfile } from '../types';
import { translations, Language } from '../translations';
import { 
  Save, 
  Upload, 
  Info, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  Layout, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Plus, 
  Lock, 
  ShieldCheck, 
  Zap,
  Terminal,
  Cpu,
  MessageSquare,
  Compass,
  Briefcase
} from 'lucide-react';

interface SettingsProps {
  profile: BrandProfile;
  lang: Language;
  onUpdateProfile: (profile: BrandProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, lang, onUpdateProfile }) => {
  const t = translations[lang];
  const [formData, setFormData] = useState<BrandProfile>({
    ...profile,
    styleReferenceUrls: profile.styleReferenceUrls || []
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');
  
  // Developer Mode States
  const [logoClicks, setLogoClicks] = useState(0);
  const [showDevField, setShowDevField] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [devModeActive, setDevModeActive] = useState(profile.isAdmin || false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setPwdError('');
    let finalProfile = { ...formData };
    
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setPwdError('Passwords do not match');
        return;
      }
      finalProfile.password = newPassword;
    }

    // Include Admin state
    finalProfile.isAdmin = devModeActive;

    onUpdateProfile(finalProfile);
    setShowSaved(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleLogoClick = () => {
    if (devModeActive) return;
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 5) {
        setShowDevField(true);
        setLogoClicks(0);
    }
  };

  const verifyDevToken = () => {
    // Secret token for unlimited power
    if (devToken.trim().toUpperCase() === 'USE_THE_FORCE_2025') {
        setDevModeActive(true);
        setShowDevField(false);
        setDevToken('');
        // Immediately persist this change
        onUpdateProfile({ ...formData, isAdmin: true });
    } else {
        alert("ACCESS DENIED: Neural link invalid.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert(lang === 'pl' ? "Plik logo jest zbyt duży. Maksymalny rozmiar to 1.5MB." : "Logo file too large. Max size 1.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'pl' ? "Zdjęcie referencyjne jest zbyt duże. Maksymalny rozmiar to 2MB." : "Reference photo too large. Max size 2MB.");
        return;
      }
      if ((formData.styleReferenceUrls?.length || 0) < 3) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const currentRefs = formData.styleReferenceUrls || [];
          setFormData({ ...formData, styleReferenceUrls: [...currentRefs, reader.result as string] });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeStyleRef = (index: number) => {
    const currentRefs = [...(formData.styleReferenceUrls || [])];
    currentRefs.splice(index, 1);
    setFormData({ ...formData, styleReferenceUrls: currentRefs });
  };

  const SignaturePreview = () => {
    const parts = [];
    if (formData.website) parts.push(`🌐 Website: ${formData.website}`);
    if (formData.email) parts.push(`📧 Email: ${formData.email}`);
    if (formData.phone) parts.push(`📞 Contact: ${formData.phone}`);
    if (formData.address) parts.push(`📍 Address: ${formData.address}`);

    if (parts.length === 0) return <p className="text-[10px] italic text-gray-600">{lang === 'pl' ? "Wprowadź dane kontaktowe powyżej..." : "Enter contact details above..."}</p>;

    return (
      <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-gray-400 space-y-1 overflow-hidden">
        <p className="border-t border-white/10 pt-2 opacity-50">---</p>
        {parts.map((p, i) => <p key={i} className="truncate">{p}</p>)}
        <p className="opacity-50">---</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.settingsTitle}</h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-1">Configure your system neural link</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            {devModeActive && (
                <div className="flex items-center gap-2 bg-cyber-turquoise/10 border border-cyber-turquoise/30 px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(52,224,247,0.2)] animate-pulse">
                    <Zap size={18} className="text-cyber-turquoise" />
                    <span className="text-[10px] font-black text-cyber-turquoise uppercase tracking-widest">Unlimited Power Active</span>
                </div>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 md:flex-none bg-cyber-purple px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition shadow-lg shadow-cyber-purple/20"
            >
              <Save size={18} /> {t.saveSettings}
            </button>
        </div>
      </div>

      {showSaved && (
        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3 animate-slideDown">
           <CheckCircle2 className="text-green-500" size={20} />
           <p className="text-sm font-bold text-green-500 uppercase tracking-widest">System parameters updated successfully.</p>
        </div>
      )}

      {showDevField && (
        <div className="animate-slideDown bg-cyber-dark border-2 border-cyber-purple rounded-2xl p-6 shadow-[0_0_30px_rgba(140,77,255,0.3)]">
           <div className="flex items-center gap-3 mb-4">
              <Terminal size={20} className="text-cyber-purple" />
              <h3 className="font-futuristic font-bold text-white uppercase tracking-widest">Developer Authentication</h3>
           </div>
           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Input master neural token to unlock developer override.</p>
           <div className="flex gap-3">
              <input 
                type="password" 
                placeholder="NEURAL_TOKEN_HERE"
                className="flex-1 bg-white/5 border border-cyber-purple/30 rounded-xl px-4 py-3 text-xs md:text-sm text-cyber-purple font-mono focus:outline-none focus:border-cyber-magenta transition-all"
                value={devToken}
                onChange={e => setDevToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyDevToken()}
              />
              <button 
                onClick={verifyDevToken}
                className="bg-cyber-purple px-6 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs hover:bg-cyber-magenta transition"
              >
                VERIFY
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <NeonCard title={t.advancedBrandInfo} icon={<Cpu size={18} className="text-cyber-magenta" />}>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={12} className="text-cyber-purple" /> {t.brandVoiceLabel}
                        </label>
                        <span className={`text-[8px] font-mono ${(formData.brandVoice?.length || 0) > 280 ? 'text-cyber-magenta' : 'text-gray-600'}`}>
                            {formData.brandVoice?.length || 0}/300
                        </span>
                    </div>
                    <textarea 
                        maxLength={300}
                        placeholder={t.brandVoiceDesc}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-xs h-24 text-gray-300"
                        value={formData.brandVoice || ''}
                        onChange={e => setFormData({ ...formData, brandVoice: e.target.value })}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase size={12} className="text-cyber-turquoise" /> {t.businessDescriptionLabel}
                        </label>
                        <span className={`text-[8px] font-mono ${(formData.businessDescription?.length || 0) > 280 ? 'text-cyber-magenta' : 'text-gray-600'}`}>
                            {formData.businessDescription?.length || 0}/300
                        </span>
                    </div>
                    <textarea 
                        maxLength={300}
                        placeholder={t.businessDescriptionDesc}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-xs h-24 text-gray-300"
                        value={formData.businessDescription || ''}
                        onChange={e => setFormData({ ...formData, businessDescription: e.target.value })}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Compass size={12} className="text-cyber-magenta" /> {t.valuePropositionLabel}
                        </label>
                        <span className={`text-[8px] font-mono ${(formData.valueProposition?.length || 0) > 280 ? 'text-cyber-magenta' : 'text-gray-600'}`}>
                            {formData.valueProposition?.length || 0}/300
                        </span>
                    </div>
                    <textarea 
                        maxLength={300}
                        placeholder={t.valuePropositionDesc}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-magenta transition-all text-xs h-24 text-gray-300"
                        value={formData.valueProposition || ''}
                        onChange={e => setFormData({ ...formData, valueProposition: e.target.value })}
                    />
                </div>
            </div>
          </NeonCard>

          <NeonCard title={t.accountSecurity} icon={<ShieldCheck size={18} className="text-cyber-turquoise" />}>
            <div className="space-y-4">
               <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input 
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.newPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              {newPassword && (
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.confirmPassword}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {pwdError && <p className="text-red-400 text-[10px] font-bold mt-2 uppercase">{pwdError}</p>}
                </div>
              )}
            </div>
          </NeonCard>
        </div>

        <div className="space-y-8">
          <NeonCard title={t.brandIdentity} icon={<Layout size={18}/>}>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.brandName}</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.websiteUrl}</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input 
                    type="url" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                    value={formData.website || ''}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Color</label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="color" 
                         className="w-10 h-10 bg-transparent border-none cursor-pointer"
                         value={formData.primaryColor}
                         onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                       />
                       <span className="text-xs font-mono text-gray-400 uppercase">{formData.primaryColor}</span>
                    </div>
                 </div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title={t.styleReferencesTitle} icon={<Sparkles size={18} className="text-cyber-turquoise" />}>
              <div className="space-y-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">{t.styleReferencesDesc}</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                      {formData.styleReferenceUrls?.map((url, idx) => (
                          <div key={idx} className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden relative group shadow-lg">
                              <img src={url} className="w-full h-full object-cover" alt="style ref" />
                              <button 
                                  onClick={() => removeStyleRef(idx)}
                                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                                  title="Remove"
                              >
                                  <X size={12} />
                              </button>
                          </div>
                      ))}
                      
                      {(formData.styleReferenceUrls?.length || 0) < 3 && (
                          <button 
                            onClick={() => styleInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-cyber-turquoise hover:border-cyber-turquoise/50 transition bg-white/5"
                          >
                            <Plus size={20} />
                            <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{t.uploadReference}</span>
                          </button>
                      )}
                  </div>

                  <input 
                    type="file" 
                    ref={styleInputRef} 
                    onChange={handleStyleUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
              </div>
          </NeonCard>

          <NeonCard title={t.signatureSettings} icon={<Mail size={18}/>}>
             <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl">
                   <div className="flex items-center gap-3">
                      <Info className="text-cyber-purple" size={16} />
                      <span className="text-xs font-bold text-white uppercase">{t.autoSignature}</span>
                   </div>
                   <button 
                     onClick={() => setFormData({ ...formData, autoAppendSignature: !formData.autoAppendSignature })}
                     className={`w-10 h-5 rounded-full relative transition-colors ${formData.autoAppendSignature ? 'bg-cyber-purple' : 'bg-white/10'}`}
                   >
                     <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.autoAppendSignature ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>

                <div className="space-y-4">
                   <div>
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.phone}</label>
                     <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                       <input 
                         type="tel" 
                         className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                         value={formData.phone || ''}
                         onChange={e => setFormData({ ...formData, phone: e.target.value })}
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.address}</label>
                     <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                       <input 
                         type="text" 
                         className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-purple transition-all text-sm"
                         value={formData.address || ''}
                         onChange={e => setFormData({ ...formData, address: e.target.value })}
                       />
                     </div>
                   </div>
                </div>

                {formData.autoAppendSignature && (
                  <div className="pt-4 border-t border-white/5">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.signaturePreview}</label>
                    <SignaturePreview />
                  </div>
                )}
             </div>
          </NeonCard>

          <NeonCard title={t.logoSettings} icon={<ImageIcon size={18}/>}>
             <div className="flex items-center gap-6">
                <div 
                    className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner cursor-pointer select-none active:scale-95 transition-transform"
                    onClick={handleLogoClick}
                >
                   {formData.logoUrl ? (
                     <img src={formData.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                   ) : (
                     <ImageIcon className="text-gray-700" size={32} />
                   )}
                </div>
                <div className="flex-1 space-y-3">
                   <p className="text-[10px] text-gray-500 uppercase font-black leading-tight">This logo will be used by AI for brand consistency.</p>
                   <button 
                     onClick={() => logoInputRef.current?.click()}
                     className="w-full py-2 bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyber-purple hover:text-white transition"
                   >
                     {t.uploadNewLogo}
                   </button>
                   <input 
                     type="file" 
                     ref={logoInputRef} 
                     onChange={handleLogoUpload} 
                     className="hidden" 
                     accept="image/*"
                   />
                </div>
             </div>
          </NeonCard>
        </div>
      </div>
      
      <p className="text-[8px] text-gray-600 font-black uppercase text-center tracking-[0.4em]">Engineered for Control by usetheforce.ai</p>
    </div>
  );
};