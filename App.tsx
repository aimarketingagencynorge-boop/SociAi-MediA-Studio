import React, { useState, useEffect, useCallback } from 'react';
import { View, BrandProfile, SocialPost, Notification } from './types';
import { getNavigation } from './constants';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
import { Auth } from './components/Auth';
import { generateInitialStrategy } from './services/geminiService';
import { dbService } from './services/db';
import { translations, Language } from './translations';
// Added missing Loader2 import
import { Zap, Menu, X, Bell, LogOut, BatteryCharging, LogIn, AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pl');
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [credits, setCredits] = useState(500); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const t = translations[lang];

  // Natychmiastowa synchronizacja (Bug #1 fix)
  const flushSync = useCallback(() => {
    if (isLoggedIn && profile?.email) {
      console.debug("[JedAi Sync] High-priority flush initiated.");
      dbService.saveUser(profile.email, profile);
      dbService.saveTransmissions(profile.email, posts);
      dbService.saveNotifications(profile.email, notifications);
    }
  }, [isLoggedIn, profile, posts, notifications]);

  useEffect(() => {
    const sessionEmail = localStorage.getItem('sociai_session_email');
    if (sessionEmail) {
      const userProfile = dbService.getUser(sessionEmail);
      if (userProfile) {
        setProfile(userProfile);
        setIsLoggedIn(true);
        setCurrentView(View.DASHBOARD);
        setPosts(dbService.getTransmissions(sessionEmail));
        setNotifications(dbService.getNotifications(sessionEmail));
      }
    }
    const savedLang = localStorage.getItem('sociai_lang');
    if (savedLang) setLang(savedLang as Language);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !profile?.email) return;
    
    setIsSyncing(true);
    const syncTimeout = setTimeout(() => {
        flushSync();
        setIsSyncing(false);
    }, 1500);

    const handleUnload = () => flushSync();
    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushSync());

    return () => {
        clearTimeout(syncTimeout);
        window.removeEventListener('beforeunload', handleUnload);
    };
  }, [profile, posts, notifications, isLoggedIn, flushSync]);

  const handleOnboardingComplete = async (brandProfile: BrandProfile) => {
    setIsLoading(true);
    try {
      dbService.saveUser(brandProfile.email!, brandProfile);
      setProfile(brandProfile);
      setIsLoggedIn(true);
      localStorage.setItem('sociai_session_email', brandProfile.email!);
      const initialPosts = await generateInitialStrategy(brandProfile, lang);
      setPosts(initialPosts);
      setCurrentView(View.DASHBOARD);
    } catch (e) {
      setGlobalError("Procedura startowa nieudana.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse"><Loader2 size={48} className="animate-spin text-cyber-purple mb-4" /><h2 className="uppercase font-futuristic font-bold">Inicjacja systemów...</h2></div>;
    
    switch (currentView) {
      case View.LANDING: return <div className="text-center py-40 space-y-10"><h1 className="text-8xl font-black uppercase tracking-tighter neon-text-purple">SociAI MediA</h1><p className="text-2xl text-gray-400 uppercase tracking-widest">{t.heroSubtitle}</p><div className="flex justify-center gap-6"><button onClick={() => setCurrentView(View.ONBOARDING)} className="px-10 py-5 bg-cyber-purple rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 transition shadow-2xl">{t.getStarted}</button></div></div>;
      case View.AUTH: return <Auth lang={lang} onLogin={(p) => { setProfile(p); setIsLoggedIn(true); localStorage.setItem('sociai_session_email', p.email!); setPosts(dbService.getTransmissions(p.email!)); setCurrentView(View.DASHBOARD); }} onSignup={() => setCurrentView(View.ONBOARDING)} />;
      case View.ONBOARDING: return <Onboarding onComplete={handleOnboardingComplete} lang={lang} />;
      case View.DASHBOARD: return <Dashboard lang={lang} />;
      case View.PLANNER: return profile ? <Planner posts={posts} profile={profile} lang={lang} onUpdateCredits={(amt) => setCredits(c => c + amt)} onUpdatePosts={setPosts} /> : null;
      case View.SETTINGS: return profile ? <Settings profile={profile} lang={lang} onUpdateProfile={setProfile} /> : null;
      default: return <Dashboard lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-white font-sans flex flex-col md:flex-row">
      {globalError && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-red-500 px-6 py-3 rounded-full flex items-center gap-3 animate-bounce shadow-2xl"><AlertCircle size={20}/> <span className="text-xs font-black uppercase tracking-widest">{globalError}</span><button onClick={() => setGlobalError(null)}><X size={16}/></button></div>}
      
      {isLoggedIn && (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5 bg-black/40 hidden md:flex flex-col fixed h-full z-50 transition-all duration-300`}>
          <div className="p-6 flex items-center gap-4"><Zap size={24} className="text-cyber-purple" /> {isSidebarOpen && <span className="font-futuristic font-bold text-xl">SociAI</span>}</div>
          <nav className="flex-1 px-4 py-10 space-y-2">
            {getNavigation(lang).map(item => <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition ${currentView === item.id ? 'bg-cyber-purple/20 text-cyber-purple' : 'text-gray-400 hover:bg-white/5'}`}>{item.icon} {isSidebarOpen && <span className="font-bold">{item.label}</span>}</button>)}
          </nav>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('sociai_session_email'); setCurrentView(View.LANDING); }} className="p-8 text-red-500 flex items-center gap-4"><LogOut size={20}/> {isSidebarOpen && <span>Logout</span>}</button>
        </aside>
      )}

      <main className={`flex-1 transition-all ${isLoggedIn ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : ''}`}>
        <header className="h-16 border-b border-white/5 px-8 flex justify-between items-center sticky top-0 bg-cyber-dark/80 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
             {isLoggedIn && <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><Menu size={20}/></button>}
             {isLoggedIn && <div className="flex items-center gap-2 bg-cyber-purple/10 px-4 py-1.5 rounded-full border border-cyber-purple/20"><BatteryCharging size={14} className="text-cyber-purple"/><span className="text-xs font-black text-cyber-purple">{credits}</span>{isSyncing && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-2" />}</div>}
           </div>
           <div className="flex gap-4">
             <button onClick={() => setLang(lang === 'pl' ? 'en' : 'pl')} className="text-[10px] font-black uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/10">{lang.toUpperCase()}</button>
             {isLoggedIn && <button className="relative p-2 text-gray-400"><Bell size={20}/></button>}
           </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;