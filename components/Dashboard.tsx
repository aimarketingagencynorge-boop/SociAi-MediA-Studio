
import React from 'react';
import { NeonCard } from './NeonCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MOCK_ANALYTICS, COLORS } from '../constants';
import { TrendingUp, Users, Eye, Zap, Bot } from 'lucide-react';
import { translations, Language } from '../translations';

interface DashboardProps {
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-futuristic font-bold neon-text-cyan">{t.commandCenter}</h1>
          <p className="text-gray-400">{t.aiInsights}</p>
        </div>
        <button className="bg-gradient-to-r from-cyber-purple to-cyber-magenta px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-cyber-purple/20">
          <Zap size={18} />
          {t.genReport}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeonCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyber-purple/20 rounded-lg text-cyber-purple"><Users /></div>
            <div>
              <p className="text-sm text-gray-400">{t.totalReach}</p>
              <h4 className="text-2xl font-bold">124.5K</h4>
              <span className="text-xs text-green-400 font-bold">+12%</span>
            </div>
          </div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyber-turquoise/20 rounded-lg text-cyber-turquoise"><TrendingUp /></div>
            <div>
              <p className="text-sm text-gray-400">{t.engagementRate}</p>
              <h4 className="text-2xl font-bold">4.8%</h4>
              <span className="text-xs text-green-400 font-bold">+0.5%</span>
            </div>
          </div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyber-magenta/20 rounded-lg text-cyber-magenta"><Eye /></div>
            <div>
              <p className="text-sm text-gray-400">{t.profileVisits}</p>
              <h4 className="text-2xl font-bold">8,291</h4>
              <span className="text-xs text-red-400 font-bold">-2%</span>
            </div>
          </div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg text-white"><Zap /></div>
            <div>
              <p className="text-sm text-gray-400">{t.aiSuggestions}</p>
              <h4 className="text-2xl font-bold">12</h4>
              <span className="text-xs text-cyber-turquoise font-bold">LIVE</span>
            </div>
          </div>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeonCard title={t.growthTitle}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ANALYTICS}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.PURPLE} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#151525', borderColor: '#8C4DFF', color: '#fff' }} />
                <Area type="monotone" dataKey="followers" stroke={COLORS.PURPLE} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>

        <NeonCard title={t.engagementTitle}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ANALYTICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#151525', borderColor: '#34E0F7', color: '#fff' }} />
                <Bar dataKey="engagement" fill={COLORS.CYAN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      <NeonCard title={t.aiRecs} icon={<Bot />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-cyber-purple/20 bg-cyber-purple/5">
            <p className="text-cyber-purple font-bold mb-1">🔥 Reel Trend Alert</p>
            <p className="text-sm text-gray-300">Your "Educational Hook" Reels are performing 34% better.</p>
          </div>
          <div className="p-4 rounded-xl border border-cyber-turquoise/20 bg-cyber-turquoise/5">
            <p className="text-cyber-turquoise font-bold mb-1">⏰ Peak Time</p>
            <p className="text-sm text-gray-300">Your audience is most active on LinkedIn at 9:15 AM EST.</p>
          </div>
        </div>
      </NeonCard>
    </div>
  );
};
