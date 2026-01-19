import React, { useState, useEffect } from 'react';
import { View, BrandProfile, SocialPost, Notification } from './types';
import { getNavigation, MOCK_NOTIFICATIONS } from './constants';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { Academy } from './components/Academy';
import { DockingBay } from './components/DockingBay';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
import { PaymentModal } from './components/PaymentModal';
import { Auth } from './components/Auth';
import { generateInitialStrategy } from './services/geminiService';
import { dbService } from './services/db';
import { translations, Language } from './translations';
import { 
  Zap, 
  Menu, 
  X, 
  Bell, 
  LogOut, 
  BatteryCharging,
  LogIn,
  AlertCircle,
  Home
} from 'lucide-react';

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
  
  const [activePaymentPlan, setActivePaymentPlan] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScanningTrends, setIsScanningTrends] = useState(false);

  const t = translations[lang];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Persistence Engine: Session Recovery
  useEffect(() => {
    const sessionEmail = localStorage.getItem('sociai_session_email');
    if (sessionEmail) {
      const userProfile = dbService.getUser(sessionEmail);
      if (userProfile) {
        setProfile(userProfile);
        setIsLoggedIn(true);
        setCurrentView(View.DASHBOARD);
        
        // Load user-specific data
        setPosts(dbService.getTransmissions(sessionEmail));
        setNotifications(dbService.getNotifications(sessionEmail));
        const savedCredits = localStorage.getItem(`credits_${sessionEmail}`);
        if (savedCredits) setCredits(parseInt(savedCredits));
      }
    }
    
    const savedLang = localStorage.getItem('sociai_lang');
    if (savedLang) setLang(savedLang as Language);
  }, []);

  // Persistence Engine: Auto-sync to DB
  useEffect(() => {
    if (!isLoggedIn || !profile?.email) return;
    
    setIsSyncing(true);
    const syncTimeout = setTimeout(() => {
      try {
        dbService.saveUser(profile.email!, profile);
        dbService.saveTransmissions(profile.email!, posts);
        dbService.saveNotifications(profile.email!, notifications);
        localStorage.setItem(`credits_${profile.email}`, credits.toString());
        setIsSyncing(false);
      } catch (e) {
        console.error("Critical Sync Error:", e);
        setGlobalError(lang === 'pl' ? "Przerwano połączenie z Holonetem. Synchronizacja nieudana." : "Holonet connection disrupted. Sync failed.");
        setIsSyncing(false);
      }
    }, 1000);

    return () => clearTimeout(syncTimeout);
  }, [profile, posts, credits, notifications, isLoggedIn]);

  const handleOnboardingComplete = async (brandProfile: BrandProfile) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      // Save primary user record
      dbService.saveUser(brandProfile.email!, brandProfile);
      setProfile(brandProfile);
      setIsLoggedIn(true);
      localStorage.setItem('sociai_session_email', brandProfile.email!);

      // Generate initial strategy
      const initialPosts = await generateInitialStrategy(brandProfile, lang);
      setPosts(initialPosts);
      dbService.saveTransmissions(brandProfile.email!, initialPosts);

      const welcomeNote: Notification = {
        id: 'welcome_' + Date.now(),
        type: 'insight',
        title: t.welcomeGiftTitle,
        message: t.welcomeGiftDesc,
        timestamp: 'Just now',
        read: false
      };
      setNotifications([welcomeNote]);
      setCurrentView(View.DASHBOARD);
    } catch (e) {
      console.error("Launch sequence failed", e);
      setGlobalError(lang === 'pl' ? "Procedura startowa przerwana. Spróbuj ponownie." : "Launch sequence interrupted. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (authenticatedProfile: BrandProfile) => {
    setProfile(authenticatedProfile);
    setIsLoggedIn(true);
    localStorage.setItem('sociai_session_email', authenticatedProfile.email!);
    
    // Refresh data for this specific user
    setPosts(dbService.getTransmissions(authenticatedProfile.email!));
    setNotifications(dbService.getNotifications(authenticatedProfile.email!));
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfile(null);
    setPosts([]);
    localStorage.removeItem('sociai_session_email');
    setCurrentView(View.LANDING);
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      setCurrentView(View.DASHBOARD);
    } else {
      setCurrentView(View.LANDING);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-16 h-16 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-futuristic font-bold neon-text-purple uppercase tracking-widest">{t.engineering}</h2>
          <p className="text-gray-400 mt-2">{t.connecting}</p>
        </div>
      );
    }

    // Route Guard
    if (isLoggedIn && (currentView === View.LANDING || currentView === View.AUTH)) {
        setCurrentView(View.DASHBOARD);
    }

    switch (currentView) {
      case View.LANDING:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20 px-4 min-h-[85vh] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-cyber-purple/20 blur-[110px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-7xl md:text-8xl font-sans font-black tracking-tighter leading-[1.0] text-white">SociAI MediA</h1>
                <h1 className="text-8xl md:text-9xl font-sans font-black tracking-tighter leading-[0.8] bg-gradient-to-r from-cyber-turquoise to-cyber-purple bg-clip-text text-transparent uppercase mt-1">STUDIO</h1>
            </div>
            <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed relative z-10 font-medium tracking-tight">{t.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto px-6 pt-6 relative z-10">
              <button onClick={() => setCurrentView(View.ONBOARDING)} className="w-full sm:w-auto px-14 py-5 bg-cyber-purple text-white font-black text-xl rounded-full hover:scale-105 transition shadow-2xl shadow-cyber-purple/50 uppercase tracking-widest">{t.getStarted}</button>
              <button onClick={() => setCurrentView(View.AUTH)} className="w-full sm:w-auto px-14 py-5 border-2 border-cyber-turquoise/40 hover:border-cyber-turquoise text-cyber-turquoise font-black text-xl rounded-full transition uppercase tracking-widest flex items-center justify-center gap-3 bg-cyber-dark/40 backdrop-blur-md"><LogIn size={20} /> {t.login}</button>
            </div>
          </div>
        );
      case View.AUTH:
        return <Auth lang={lang} onLogin={handleLogin} onSignup={() => setCurrentView(View.ONBOARDING)} />;
      case View.ONBOARDING:
        return <Onboarding onComplete={handleOnboardingComplete} lang={lang} />;
      case View.DASHBOARD:
        return <Dashboard lang={lang} />;
      case View.PLANNER:
        return profile ? <Planner posts={posts} profile={profile} lang={lang} onUpdateCredits={(amt) => setCredits(c => Math.max(0, c + amt))} onUpdatePosts={setPosts} /> : null;
      case View.ACADEMY:
        return <Academy lang={lang} />;
      case View.DOCKING_BAY:
        return <DockingBay lang={lang} />;
      case View.SETTINGS:
        return profile ? <Settings profile={profile} lang={lang} onUpdateProfile={setProfile} /> : null;
      case View.SUBSCRIPTIONS:
        return (
          <div className="py-12 animate-fadeIn max-w-6xl mx-auto space-y-20 px-4">
             <h1 className="text-4xl md:text-5xl font-futuristic font-black text-center uppercase tracking-tighter">{t.pricingTitle}</h1>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['starter', 'pro', 'agency'].map(plan => (
                   <div key={plan} className="glass-card p-10 rounded-3xl border border-white/5 text-center space-y-6">
                      <h3 className="text-3xl font-black uppercase tracking-widest">{(t as any)[plan]}</h3>
                      <button onClick={() => setActivePaymentPlan({key: plan, label: (t as any)[plan], price: '99', credits: 1000})} className="w-full py-4 bg-cyber-purple rounded-xl font-bold uppercase">{t.selectPlan}</button>
                   </div>
                ))}
             </div>
          </div>
        );
      default:
        return <Dashboard lang={lang} />;
    }
  };

  const showSidebar = isLoggedIn && [View.DASHBOARD, View.PLANNER, View.ACADEMY, View.SUBSCRIPTIONS, View.DOCKING_BAY, View.SETTINGS].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-cyber-dark text-white">
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-bounce">
          <AlertCircle size={20} /> <span className="text-sm font-bold uppercase tracking-widest">{globalError}</span>
          <button onClick={() => setGlobalError(null)}><X size={18}/></button>
        </div>
      )}

      {activePaymentPlan && <PaymentModal plan={activePaymentPlan} lang={lang} onClose={() => setActivePaymentPlan(null)} onSuccess={(amt) => { setCredits(c => c + amt); setActivePaymentPlan(null); }} />}

      {showSidebar && (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5 bg-cyber-dark transition-all duration-300 hidden md:flex flex-col fixed h-full z-50`}>
          <button 
            onClick={handleLogoClick}
            className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity text-left w-full group"
            title={t.backToHome}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-purple to-cyber-magenta rounded-xl flex items-center justify-center shadow-[0_0_20px_#8C4DFF] group-hover:scale-110 transition-transform"><Zap size={20} /></div>
            {isSidebarOpen && <span className="font-futuristic font-black text-xl tracking-tighter text-white">SociAI</span>}
          </button>
          
          <nav className="flex-1 px-4 py-8 space-y-2">
            {getNavigation(lang).map(item => (
              <button key={item.id} onClick={() => { setCurrentView(item.id as View); setIsNotificationsOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition ${currentView === item.id ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/20' : 'text-gray-400 hover:bg-white/5'}`}>
                {item.icon} {isSidebarOpen && <span className="font-bold">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-auto">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition">
                <LogOut size={20} /> {isSidebarOpen && <span className="font-bold">{t.logout}</span>}
            </button>
          </div>
        </aside>
      )}

      <main className={`flex-1 transition-all duration-300 relative ${showSidebar ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : ''} mb-20 md:mb-0 flex flex-col`}>
        <header className="sticky top-0 z-40 bg-cyber-dark/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-8">
           <div className="flex items-center gap-6">
             {showSidebar ? (
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">{isSidebarOpen ? <X size={22} /> : <Menu size={22} />}</button>
             ) : (
               <button 
                 onClick={handleLogoClick}
                 className="flex items-center gap-3 hover:opacity-80 transition text-white"
               >
                 <Zap size={22} className="text-cyber-purple" />
                 <span className="font-futuristic font-black tracking-tighter uppercase hidden sm:inline">SociAI Studio</span>
               </button>
             )}
             {isLoggedIn && profile && (
               <div className="flex items-center gap-3 bg-cyber-purple/10 border border-cyber-purple/20 px-4 py-1 rounded-full">
                 <BatteryCharging size={16} className="text-cyber-purple" />
                 <span className="text-cyber-purple font-black text-sm uppercase">{credits}</span>
                 {isSyncing && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" title={lang === 'pl' ? "Synchronizacja z Holonetem" : "Syncing to Holonet"} />}
               </div>
             )}
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center bg-white/5 rounded-full px-2 py-1 border border-white/10">
                {(['pl', 'en'] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-[10px] font-black rounded-full transition ${lang === l ? 'bg-cyber-purple text-white' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                ))}
              </div>
              {isLoggedIn && (
                <div className="relative">
                  <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-gray-400 hover:text-white transition">
                    <Bell size={22} />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-cyber-magenta rounded-full text-[9px] font-black flex items-center justify-center">{unreadCount}</span>}
                  </button>
                  {isNotificationsOpen && (
                    <NotificationCenter 
                      notifications={notifications} 
                      lang={lang} 
                      isScanning={isScanningTrends}
                      onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                      onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      onScanTrends={() => setIsScanningTrends(true)}
                      onClose={() => setIsNotificationsOpen(false)}
                    />
                  )}
                </div>
              )}
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto flex-1 w-full">
          {renderContent()}
        </div>

        <footer className="py-12 border-t border-white/5 text-center space-y-4 bg-black/20">
            <div className="flex items-center justify-center gap-4 mb-2">
               <Zap size={20} className="text-cyber-purple animate-pulse" />
               <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/60">
                  Powered by <span className="text-cyber-turquoise">Gemini 2.5 Flash</span> & <span className="text-cyber-purple">Use the Force AI</span>
               </p>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
               May the AI be with you.
            </p>
            {!isLoggedIn && (
               <button 
                 onClick={() => setCurrentView(View.LANDING)}
                 className="text-[10px] text-cyber-turquoise hover:text-white transition font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto mt-4 group"
               >
                 <Home size={12} className="group-hover:-translate-y-0.5 transition-transform" /> {t.backToHome}
               </button>
            )}
        </footer>
      </main>
    </div>
  );
};

export default App;