import React, { useState } from 'react';
import { NeonCard } from './NeonCard';
import { translations, Language } from '../translations';
import { BrandProfile } from '../types';
import { dbService } from '../services/db';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

interface AuthProps {
  lang: Language;
  onLogin: (profile: BrandProfile) => void;
  onSignup: () => void;
}

export const Auth: React.FC<AuthProps> = ({ lang, onLogin, onSignup }) => {
  const t = translations[lang];
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = () => {
    setError('');
    
    if (!email || !password) {
        setError('Wszystkie pola są wymagane.');
        return;
    }

    if (isLogin) {
      const savedProfile = dbService.getUser(email);
      if (savedProfile) {
        if (savedProfile.password === password) {
          onLogin(savedProfile);
          return;
        } else {
          setError('Nieprawidłowe hasło.');
          return;
        }
      }
      setError(t.invalidAuth);
    } else {
      // Signup triggers onboarding flow
      onSignup();
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 animate-fadeIn">
      <NeonCard title={isLogin ? t.loginTitle : t.onboardingTitle0}>
        <div className="space-y-6">
          <p className="text-gray-400 text-sm -mt-4">{isLogin ? t.loginSub : t.onboardingSub0}</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="email" 
                  className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="password" 
                  className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-cyber-turquoise transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={handleAuth}
            className="w-full bg-cyber-purple py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyber-magenta transition shadow-lg shadow-cyber-purple/20 uppercase tracking-widest"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? t.login : t.signup}
          </button>

          <div className="text-center pt-4 border-t border-white/5">
             <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-cyber-turquoise font-bold hover:underline uppercase tracking-widest"
             >
               {isLogin ? t.noAccount : t.haveAccount}
             </button>
          </div>
        </div>
      </NeonCard>
    </div>
  );
};