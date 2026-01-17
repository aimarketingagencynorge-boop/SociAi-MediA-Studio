
import React, { useState, useEffect } from 'react';
import { View, BrandProfile, SocialPost, Notification } from './types';
import { getNavigation, MOCK_NOTIFICATIONS } from './constants';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { Academy } from './components/Academy';
import { DockingBay } from './components/DockingBay';
import { Settings } from './components/Settings';
import { NeonCard } from './components/NeonCard';
import { NotificationCenter } from './components/NotificationCenter';
import { PaymentModal } from './components/PaymentModal';
import { Auth } from './components/Auth';
import { generateInitialStrategy, fetchLatestTrends } from './services/geminiService';
import { translations, Language } from './translations';
import { 
  Zap, 
  Menu, 
  X, 
  Bell, 
  LogOut, 
  Globe,
  BatteryCharging,
  Cpu,
  Crown,
  Activity,
  RefreshCcw,
  AlertTriangle,
  Plus,
  Flame,
  Rocket,
  LogIn,
  Infinity,
  CloudCheck,
  CloudUpload
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
  
  const [activePaymentPlan, setActivePaymentPlan] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScanningTrends, setIsScanningTrends] = useState(false);

  const t = translations[lang];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Persistence & Sync Logic
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('sociai_profile');
      const savedPosts = localStorage.getItem('sociai_posts');
      const savedCredits = localStorage.getItem('sociai_credits');
      const savedLang = localStorage.getItem('sociai_lang');
      const savedNotifications = localStorage.getItem('sociai_notifications');
      const sessionActive = localStorage.getItem('sociai_session');

      if (savedLang) setLang(savedLang as Language);
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        setProfile(p);
        if (sessionActive === 'true') {
          setIsLoggedIn(true);
          setCurrentView(View.DASHBOARD);
        }
        if (p.isAdmin) setCredits(999999);
      }
      if (savedPosts) setPosts(JSON.parse(savedPosts));
      if (savedCredits && !profile?.isAdmin) setCredits(parseInt(savedCredits));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  // Simulate Cloud Sync whenever critical data changes
  useEffect(() => {
    if (!isLoggedIn) return;
    
    setIsSyncing(true);
    const syncTimeout = setTimeout(() => {
        try {
            if (profile) localStorage.setItem('sociai_profile', JSON.stringify(profile));
            if (posts.length > 0) localStorage.setItem('sociai_posts', JSON.stringify(posts));
            localStorage.setItem('sociai_credits', credits.toString());
            localStorage.setItem('sociai_lang', lang);
            localStorage.setItem('sociai_notifications', JSON.stringify(notifications));
            localStorage.setItem('sociai_session', isLoggedIn.toString());
            setIsSyncing(false);
        } catch (e) {
            console.warn("Storage quota limit. Cloud Sync would handle this on a real server.", e);
            setIsSyncing(false);
        }
    }, 1500);

    return () => clearTimeout(syncTimeout);
  }, [profile, posts, credits, lang, notifications, isLoggedIn]);

  const handleOnboardingComplete = async (brandProfile: BrandProfile) => {
    setIsLoading(true);
    setProfile(brandProfile);
    setIsLoggedIn(true);
    try {
      const initialPosts = await generateInitialStrategy(brandProfile, lang);
      setPosts(initialPosts);
      
      const welcomeNote: Notification = {
        id: 'welcome_gift',
        type: 'insight',
        title: t.welcomeGiftTitle,
        message: t.welcomeGiftDesc,
        timestamp: 'Just now',
        read: false
      };
      setNotifications([welcomeNote, ...notifications]);
      
      setCurrentView(View.DASHBOARD);
    } catch (e) {
      console.error(e);
      setPosts([]);
      setCurrentView(View.DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (authenticatedProfile: BrandProfile) => {
    setProfile(authenticatedProfile);
    setIsLoggedIn(true);
    if (authenticatedProfile.isAdmin) setCredits(999999);
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView(View.LANDING);
    localStorage.setItem('sociai_session', 'false');
  };

  const handleFetchTrends = async () => {
    const industry = profile?.industry || "Social Media Trends";
    setIsScanningTrends(true);
    try {
      const newTrends = await fetchLatestTrends(industry, lang);
      setNotifications(prev => [...newTrends, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningTrends(false);
    }
  };

  const handleReset = () => {
    if (confirm("Czy na pewno chcesz zresetować studio? Wszystkie dane zostaną usunięte.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateCredits = (amount: number) => {
    if (profile?.isAdmin) return; 
    setCredits(prev => Math.max(0, prev + amount));
  };

  const handlePaymentSuccess = (addedCredits: number) => {
    updateCredits(addedCredits);
    setActivePaymentPlan(null);
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: t.paymentSuccess,
      message: `${t.creditsAdded} (+${addedCredits} ${t.credits})`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  const CheckIcon = () => (
    <div className="w-4 h-4 bg-cyber-turquoise/20 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-cyber-turquoise rounded-full"></div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-16 h-16 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-futuristic font-bold neon-text-purple uppercase">{t.engineering}</h2>
          <p className="text-gray-400 mt-2">{t.connecting}</p>
        </div>
      );
    }

    switch (currentView) {
      case View.LANDING:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-20 px-4 min-h-[90vh]">
            <div className="relative inline-block">
                <div className="absolute -inset-4 bg-cyber-purple/20 blur-2xl rounded-full"></div>
                <h1 className="text-4xl md:text-8xl font-futuristic font-black tracking-tighter leading-none relative">
                    SociAI MediA<br/> 
                    <span className="bg-gradient-to-r from-cyber-turquoise via-cyber-magenta to-cyber-purple bg-clip-text text-transparent">STUDIO</span>
                </h1>
            </div>
            <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto">{t.heroSubtitle}</p>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto px-6">
              <button onClick={() => setCurrentView(View.ONBOARDING)} className="w-full md:w-auto px-10 py-5 bg-cyber-purple text-white font-black text-xl rounded-full hover:scale-105 transition shadow-2xl shadow-cyber-purple/40 uppercase tracking-widest">
                {t.getStarted}
              </button>
              <button 
                onClick={() => setCurrentView(View.AUTH)} 
                className="w-full md:w-auto px-10 py-5 border-2 border-cyber-turquoise/40 hover:border-cyber-turquoise text-cyber-turquoise font-black text-xl rounded-full transition uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <LogIn size={20} /> {t.login}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-[0.3em] mt-12">Powered by usetheforce.ai & Gemini</p>
          </div>
        );
      case View.AUTH:
        return <Auth lang={lang} onLogin={handleLogin} onSignup={() => setCurrentView(View.ONBOARDING)} />;
      case View.ONBOARDING:
        return <Onboarding onComplete={handleOnboardingComplete} lang={lang} />;
      case View.DASHBOARD:
        return <Dashboard lang={lang} />;
      case View.PLANNER:
        return profile ? (
            <Planner 
                posts={posts} 
                profile={profile} 
                lang={lang} 
                onUpdateCredits={updateCredits} 
                onUpdatePosts={setPosts}
            />
        ) : <div>Please complete onboarding.</div>;
      case View.ACADEMY:
        return <Academy lang={lang} />;
      case View.DOCKING_BAY:
        return <DockingBay lang={lang} />;
      case View.SETTINGS:
        return profile ? (
          <Settings 
            profile={profile} 
            lang={lang} 
            onUpdateProfile={(updated) => {
              setProfile(updated);
              if (updated.isAdmin) setCredits(999999);
            }} 
          />
        ) : <div>Please complete onboarding.</div>;
      case View.SUBSCRIPTIONS:
        const plans = [
          { key: 'starter', label: t.starter, price: '29', credits: 100, features: t.features.starter, icon: <Activity size={24} className="text-gray-400" /> },
          { key: 'pro', label: t.pro, price: '89', credits: 1000, features: t.features.pro, icon: <Cpu size={24} className="text-cyber-purple" />, highlight: true },
          { key: 'agency', label: t.agency, price: '299', credits: 5000, features: t.features.agency, icon: <Crown size={24} className="text-cyber-turquoise" /> },
        ];
        const boostPacks = [
          { key: 'mini', label: t.packSmall, price: '9', credits: 150, icon: <Flame size={20} className="text-orange-400" /> },
          { key: 'power', label: t.packMedium, price: '19', credits: 400, icon: <Rocket size={20} className="text-cyber-turquoise" /> },
          { key: 'supernova', label: t.packLarge, price: '39', credits: 1000, icon: <Zap size={20} className="text-yellow-400" /> },
        ];
        return (
          <div className="py-12 animate-fadeIn max-w-6xl mx-auto space-y-20 px-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-futuristic font-bold text-center mb-4 uppercase tracking-tighter">{t.pricingTitle}</h1>
              <p className="text-center text-gray-500 mb-16 uppercase text-[10px] tracking-[0.3em]">Scalable power for every creator</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                {plans.map(plan => (
                  <NeonCard 
                    key={plan.key} 
                    className={`relative transition-all duration-500 ${plan.highlight ? 'scale-105 border-cyber-purple/50 bg-cyber-purple/5 z-10' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {plan.highlight && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_#8C4DFF]">
                          Most Popular
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="mb-6 flex justify-center">{plan.icon}</div>
                      <h3 className="text-2xl font-bold mb-4 uppercase tracking-wider">{plan.label}</h3>
                      <div className="flex items-baseline justify-center gap-1 mb-8">
                        <span className="text-4xl font-black">${plan.price}</span>
                        <span className="text-sm text-gray-500 uppercase font-bold tracking-widest">{t.perMonth}</span>
                      </div>
                      
                      <div className="space-y-4 mb-10 text-left border-t border-white/5 pt-8">
                        {plan.features.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                            <CheckIcon /> 
                            <span className={idx === 0 ? "font-bold text-white" : ""}>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => setActivePaymentPlan(plan)}
                        className={`w-full py-4 rounded-xl font-bold transition-all duration-300 uppercase tracking-widest text-xs ${
                        plan.highlight 
                          ? 'bg-gradient-to-r from-cyber-purple to-cyber-magenta text-white hover:shadow-[0_0_20px_rgba(140,77,255,0.4)]' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white'
                      }`}>
                        {t.selectPlan}
                      </button>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </div>

            <div id="boost-packs">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-futuristic font-bold neon-text-cyan uppercase tracking-widest inline-flex items-center gap-3">
                  <Zap size={32} /> {t.boostPacksTitle}
                </h2>
                <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.2em]">{t.boostPacksSub}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {boostPacks.map(pack => (
                  <div 
                    key={pack.key} 
                    className="p-1 rounded-2xl bg-gradient-to-br from-white/10 to-transparent hover:from-cyber-turquoise/30 hover:to-cyber-purple/30 transition-all duration-500"
                  >
                    <div className="bg-cyber-dark/80 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between border border-white/5 h-full">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white">
                             {pack.icon}
                          </div>
                          <div>
                             <h4 className="font-bold text-white uppercase tracking-wider">{pack.label}</h4>
                             <p className="text-cyber-turquoise font-black text-sm">+{pack.credits} <span className="text-[10px] text-gray-500 uppercase">{t.credits}</span></p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-white">${pack.price}</p>
                          <button 
                            onClick={() => setActivePaymentPlan({...pack, label: `${pack.label} (${t.oneTime})`})}
                            className="mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition"
                          >
                            {t.buyCredits}
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard lang={lang} />;
    }
  };

  const showSidebar = isLoggedIn && [View.DASHBOARD, View.PLANNER, View.ACADEMY, View.CRM, View.SUBSCRIPTIONS, View.DOCKING_BAY, View.SETTINGS].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-cyber-dark">
      {activePaymentPlan && (
        <PaymentModal 
          plan={activePaymentPlan} 
          lang={lang} 
          onClose={() => setActivePaymentPlan(null)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}

      {/* DESKTOP SIDEBAR */}
      {showSidebar && (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5 bg-cyber-dark transition-all duration-300 hidden md:flex flex-col fixed h-full z-50`}>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyber-purple to-cyber-magenta rounded-lg flex items-center justify-center shadow-[0_0_15px_#8C4DFF]"><Zap size={18} /></div>
            {isSidebarOpen && <span className="font-futuristic font-bold text-lg tracking-widest text-white">SociAI</span>}
          </div>
          <nav className="flex-1 px-4 py-8 space-y-2">
            {getNavigation(lang).map(item => (
              <button key={item.id} onClick={() => { setCurrentView(item.id as View); setIsNotificationsOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition ${currentView === item.id ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/20 shadow-[0_0_15px_rgba(140,77,255,0.1)]' : 'text-gray-400 hover:bg-white/5'}`}>
                {item.icon} {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-auto">
             {isSidebarOpen && (
               <div className="mb-4 px-4">
                  <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">Partner Engine</p>
                  <p className="text-[10px] text-cyber-turquoise font-bold">usetheforce.ai</p>
               </div>
             )}
            <button 
              onClick={handleReset}
              className="w-full flex items-center gap-4 px-4 py-3 text-cyber-magenta hover:bg-cyber-magenta/10 rounded-xl transition border border-transparent hover:border-cyber-magenta/20 mb-2"
            >
                <RefreshCcw size={20} /> {isSidebarOpen && <span className="font-medium">{t.resetStudio}</span>}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition"
            >
                <LogOut size={20} /> {isSidebarOpen && <span className="font-medium">{t.logout}</span>}
            </button>
          </div>
        </aside>
      )}

      <main className={`flex-1 transition-all duration-300 relative ${showSidebar ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : ''} mb-20 md:mb-0`}>
        <header className="sticky top-0 z-40 bg-cyber-dark/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 md:gap-4">
             {showSidebar && (
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition hidden md:block">
                 {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
               </button>
             )}
             <div className="flex items-center gap-2 bg-yellow-500/10 px-2 md:px-3 py-1 rounded-full border border-yellow-500/20">
                <AlertTriangle size={12} className="text-yellow-500" />
                <span className="text-[9px] md:text-[10px] font-black text-yellow-500 uppercase tracking-widest">BETA</span>
             </div>
             
             {/* Cloud Sync Indicator */}
             {isLoggedIn && (
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 group cursor-help" title={t.syncCloud}>
                    {isSyncing ? (
                        <CloudUpload size={14} className="text-cyber-turquoise animate-bounce" />
                    ) : (
                        <CloudCheck size={14} className="text-green-400" />
                    )}
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest hidden md:inline">Cloud</span>
                 </div>
             )}

             {profile && isLoggedIn && (
              <div className="flex items-center gap-2 md:gap-4 text-sm">
                 <div className="flex items-center gap-2 bg-cyber-purple/10 px-2 md:px-3 py-1 rounded-full border border-cyber-purple/20">
                    <BatteryCharging size={14} className="text-cyber-purple" />
                    {profile.isAdmin ? (
                        <div className="flex items-center gap-1">
                            <Infinity size={14} className="text-cyber-turquoise" />
                            <span className="text-cyber-turquoise font-black text-[10px] uppercase tracking-tighter">UNLIMITED</span>
                        </div>
                    ) : (
                        <span className="text-cyber-purple font-bold text-xs md:text-sm">{credits}</span>
                    )}
                    <button 
                      onClick={() => setCurrentView(View.SUBSCRIPTIONS)}
                      className="ml-1 md:ml-2 w-5 h-5 bg-cyber-purple rounded-full flex items-center justify-center text-white hover:scale-110 transition"
                      title={t.buyCredits}
                    >
                      <Plus size={10} />
                    </button>
                 </div>
              </div>
             )}
          </div>
          <div className="flex items-center gap-2 md:gap-4 relative">
              <div className="flex items-center bg-white/5 rounded-full px-1.5 md:px-2 py-1 border border-white/10">
                <Globe size={14} className="text-cyber-turquoise mr-1.5 md:mr-2 ml-1" />
                {(['pl', 'en'] as const).map((l) => (
                  <button 
                    key={l} 
                    onClick={() => setLang(l)}
                    className={`px-2 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full transition ${lang === l ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/40' : 'text-gray-500 hover:text-white'}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              
              {isLoggedIn && (
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-2 rounded-lg transition ${isNotificationsOpen ? 'bg-cyber-purple/20 text-cyber-purple' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-cyber-magenta rounded-full text-[9px] font-black text-white flex items-center justify-center border border-cyber-dark shadow-[0_0_8px_rgba(199,76,255,0.6)]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {isNotificationsOpen && (
                    <NotificationCenter 
                      notifications={notifications}
                      lang={lang}
                      isScanning={isScanningTrends}
                      onMarkRead={markNotificationRead}
                      onMarkAllRead={markAllNotificationsRead}
                      onScanTrends={handleFetchTrends}
                      onClose={() => setIsNotificationsOpen(false)}
                    />
                  )}
                </div>
              )}

              {profile && isLoggedIn && (
                <div 
                  className="w-8 h-8 rounded-full bg-cyber-dark border border-white/20 overflow-hidden ring-2 ring-cyber-purple/20 group cursor-pointer"
                  onClick={() => setCurrentView(View.SETTINGS)}
                >
                  {profile?.logoUrl ? (
                     <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition" />
                  ) : (
                     <img src="https://picsum.photos/32/32" alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition" />
                  )}
                </div>
              )}
          </div>
        </header>

        <div className={`p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto min-h-screen`}>
          {renderContent()}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {showSidebar && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-cyber-dark/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
           {getNavigation(lang).slice(0, 5).map(item => (
              <button 
                key={item.id} 
                onClick={() => { setCurrentView(item.id as View); setIsNotificationsOpen(false); }}
                className={`flex flex-col items-center justify-center transition-all ${currentView === item.id ? 'text-cyber-purple scale-110' : 'text-gray-500'}`}
              >
                 {item.icon}
                 <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{item.label.split(' ')[0]}</span>
                 {currentView === item.id && <div className="w-1 h-1 bg-cyber-purple rounded-full mt-1 shadow-[0_0_8px_#8C4DFF]" />}
              </button>
           ))}
        </nav>
      )}
    </div>
  );
};

export default App;
