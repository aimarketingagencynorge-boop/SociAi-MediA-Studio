
import React from 'react';
import { LayoutDashboard, Calendar, GraduationCap, CreditCard, Users, Share2, Settings } from 'lucide-react';
import { translations, Language } from './translations';
import { Notification } from './types';

export const COLORS = {
  PURPLE: '#8C4DFF',
  CYAN: '#34E0F7',
  MAGENTA: '#C74CFF',
  DARK: '#0A0A12'
};

export const getNavigation = (lang: Language) => [
  { id: 'DASHBOARD', label: translations[lang].navDashboard, icon: <LayoutDashboard size={20} /> },
  { id: 'PLANNER', label: translations[lang].navPlanner, icon: <Calendar size={20} /> },
  { id: 'DOCKING_BAY', label: translations[lang].navDockingBay, icon: <Share2 size={20} /> },
  { id: 'CRM', label: translations[lang].navCrm, icon: <Users size={20} /> },
  { id: 'ACADEMY', label: translations[lang].navAcademy, icon: <GraduationCap size={20} /> },
  { id: 'SUBSCRIPTIONS', label: translations[lang].navPricing, icon: <CreditCard size={20} /> },
  { id: 'SETTINGS', label: translations[lang].navSettings, icon: <Settings size={20} /> },
];

export const MOCK_ANALYTICS = [
  { name: 'Mon', followers: 400, engagement: 240 },
  { name: 'Tue', followers: 520, engagement: 310 },
  { name: 'Wed', followers: 610, engagement: 420 },
  { name: 'Thu', followers: 680, engagement: 450 },
  { name: 'Fri', followers: 850, engagement: 610 },
  { name: 'Sat', followers: 980, engagement: 740 },
  { name: 'Sun', followers: 1100, engagement: 820 },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'trend',
    title: 'New Trend Alert',
    message: 'Short-form video tutorials are trending in your niche. Try making a Reel!',
    timestamp: '2h ago',
    read: false
  },
  {
    id: '2',
    type: 'insight',
    title: 'AI Insight',
    message: 'Your engagement peaks at 8:00 PM. We suggest scheduling your next post then.',
    timestamp: '5h ago',
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    message: 'New LinkedIn carousel templates are now available in your studio.',
    timestamp: '1d ago',
    read: true
  }
];
