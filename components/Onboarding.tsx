import React, { useState } from 'react';
import { NeonCard } from './NeonCard';
import { BrandProfile } from '../types';
import { ArrowRight, Sparkles, Zap, Search, Globe, Loader2, CheckCircle2, Palette, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { translations, Language } from '../translations';
import { analyzeBrandIdentity } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: BrandProfile) => void;
  lang: Language;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, lang }) => {
  const t = translations[lang];
  const [step, setStep] = useState(0); 
  const [isScanning, setIsScanning] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState<BrandProfile>({
    name: '',
    industry: '',
    website: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    targetAudience: '',
    tone: 'professional',
    primaryColor: '#8C4DFF',
    logoUrl: '',
    autoAppendSignature: true,
    styleReferenceUrls: []
  });

  const handleStartScan = async () => {
    if (!profile.name) return;
    setIsScanning(true);
    console.info("[SociAI Diagnostic] Initiating Holonet Scan via Gemini Search...");
    
    try {
        const detectedIdentity = await analyzeBrandIdentity(profile.name, profile.website);
        console.info("[SociAI Diagnostic] Data Received. Success.");
        setProfile(prev => ({
            ...prev,
            ...detectedIdentity,
            tone: (detectedIdentity.tone as any) || prev.tone,
            primaryColor: detectedIdentity.primaryColor || prev.primaryColor,
            targetAudience: detectedIdentity.targetAudience || prev.targetAudience,
            autoAppendSignature: detectedIdentity.autoAppendSignature ?? prev.autoAppendSignature,
        }));
        setStep(3); // Go to identity verification screen
    } catch (e) {
        console.error("[SociAI Diagnostic] Scan error:", e);
        setStep(2); // Fallback to manual details
    } finally {
        setIsScanning(false);
    }
  };

  const handleAccountCreation = () => {
    setError('');
    if (!profile.email || !profile.password) {
      setError('Please fill all fields');
      return;
    }
    if (profile.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setStep(1);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="flex justify-center mb-8 gap-4">
        {[0, 1, 3, 2, 4].map(i => (
          <div key={i} className={`w-10 h-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-cyber-purple' : 'bg-white/10'}`}></div>
        ))}
      </div>

      <NeonCard className="p-8">
        {step === 0 && (
          <div className="space-y-6 animate-slideRight">
            <div>
              <h2 className="text-2xl font-futuristic font-bold mb-2 uppercase tracking-tighter">{t.onboardingTitle0}</h2>
              <p className="text-gray-400 text-sm">{t.onboardingSub0}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.email}</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="email" 
                      placeholder="office@yourbrand.com"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.email}
                      onChange={e => setProfile({...profile, email: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.password}</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.password}
                      onChange={e => setProfile({...profile, password: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.confirmPassword}</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs font-bold text-center uppercase tracking-widest">{error}</p>}

            <button 
              onClick={handleAccountCreation}
              className="w-full bg-cyber-purple py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition shadow-lg shadow-cyber-purple/20 uppercase tracking-widest"
            >
              {t.nextStep} <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-slideRight">
            <div>
              <h2 className="text-2xl font-futuristic font-bold mb-2 uppercase tracking-tighter">{t.onboardingTitle1}</h2>
              <p className="text-gray-400 text-sm">{t.onboardingSub1}</p>
            </div>
            
            {isScanning ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                    <Loader2 size={48} className="text-cyber-turquoise animate-spin" />
                    <div className="absolute inset-0 bg-cyber-turquoise/20 blur-xl animate-pulse rounded-full"></div>
                </div>
                <div>
                    <h3 className="text-xl font-futuristic font-bold text-white uppercase tracking-widest mb-2">{t.scanningWebsite}</h3>
                    <p className="text-gray-500 text-xs italic">{t.scanningDesc}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.brandName}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Studio"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.industry}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Creative Agency"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.industry}
                      onChange={e => setProfile({...profile, industry: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.websiteUrl}</label>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                          type="url" 
                          placeholder="https://yourbrand.com"
                          className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                          value={profile.website}
                          onChange={e => setProfile({...profile, website: e.target.value})}
                        />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleStartScan} 
                  disabled={!profile.name}
                  className="w-full bg-cyber-purple py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition disabled:opacity-50 shadow-lg shadow-cyber-purple/20 uppercase tracking-widest"
                >
                  {t.nextStep} <Search size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slideRight">
            <div className="flex items-center gap-4 p-4 bg-cyber-turquoise/5 border border-cyber-turquoise/20 rounded-2xl">
               <div className="w-12 h-12 bg-cyber-turquoise/10 rounded-full flex items-center justify-center text-cyber-turquoise">
                  <CheckCircle2 size={24} />
               </div>
               <div>
                  <h3 className="text-sm font-black text-cyber-turquoise uppercase tracking-widest">{t.identityDetected}</h3>
                  <p className="text-[10px] text-gray-400">{t.identityDesc}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Brand Visuals</label>
                    <div className="flex gap-4 items-center">
                        {profile.logoUrl ? (
                            <img src={profile.logoUrl} className="w-20 h-20 rounded-2xl border border-white/10 shadow-xl object-contain bg-black/20" alt="Logo" />
                        ) : (
                            <div className="w-20 h-20 bg-white/5 rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-gray-600">Logo</div>
                        )}
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: profile.primaryColor }} />
                                <span className="text-xs font-mono text-gray-400 uppercase">{profile.primaryColor}</span>
                             </div>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Tone Selection</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['professional', 'funny', 'inspirational', 'edgy'] as const).map(tone => (
                            <button 
                                key={tone}
                                onClick={() => setProfile({...profile, tone})}
                                className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${profile.tone === tone ? 'border-cyber-turquoise bg-cyber-turquoise/10 text-cyber-turquoise shadow-[0_0_10px_rgba(52,224,247,0.2)]' : 'border-white/5 bg-white/5 text-gray-500'}`}
                            >
                                {tone}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.targetAudience}</label>
              <textarea 
                className="w-full bg-cyber-dark/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyber-turquoise h-24 text-sm text-gray-300"
                value={profile.targetAudience}
                onChange={e => setProfile({...profile, targetAudience: e.target.value})}
              />
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-cyber-purple py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition-all uppercase tracking-widest">
              {t.nextStep} <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slideRight">
            <div>
              <h2 className="text-2xl font-futuristic font-bold mb-2 uppercase tracking-tighter">{t.onboardingTitle2}</h2>
              <p className="text-gray-400 text-sm">{t.onboardingSub2}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.phone}</label>
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="tel" 
                      placeholder="+48 123 456 789"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.phone}
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.address}</label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Main St 1, Warsaw"
                      className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                      value={profile.address}
                      onChange={e => setProfile({...profile, address: e.target.value})}
                    />
                </div>
              </div>
            </div>

            <button onClick={() => setStep(4)} className="w-full bg-cyber-purple py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition-all uppercase tracking-widest">
              {t.nextStep} <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 text-center animate-slideRight py-4 flex flex-col items-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <Sparkles size={56} className="text-cyber-purple animate-pulse mb-4" />
              </div>
              <h2 className="text-3xl md:text-4xl font-futuristic font-bold uppercase tracking-tighter leading-tight">{t.calibrating}</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">{t.calibrationSub}</p>
            </div>
            
            <div className="w-full bg-cyber-turquoise/10 border border-cyber-turquoise/30 rounded-3xl p-8 animate-glow relative overflow-hidden flex flex-col items-center justify-center min-h-[180px] my-6">
                <Palette size={100} className="absolute -bottom-4 -right-4 text-cyber-turquoise opacity-5 pointer-events-none" />
                
                <div className="flex items-center justify-center gap-3 text-cyber-turquoise font-black text-3xl md:text-4xl mb-3 relative z-10">
                    <Zap size={32} className="fill-cyber-turquoise" /> 
                    <span>+500 {t.credits}</span>
                </div>
                <p className="text-xs md:text-sm text-white uppercase font-black tracking-[0.2em] relative z-10">{t.welcomeGiftTitle}</p>
                <p className="text-[10px] md:text-xs text-gray-400 mt-2 relative z-10 max-w-[240px] leading-relaxed uppercase">{t.welcomeGiftDesc}</p>
            </div>

            <button 
              onClick={() => onComplete(profile)} 
              className="w-full bg-gradient-to-r from-cyber-purple to-cyber-magenta py-5 rounded-2xl font-black text-lg transition shadow-[0_0_30px_rgba(140,77,255,0.4)] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.launchStudio}
            </button>
          </div>
        )}
      </NeonCard>
    </div>
  );
};