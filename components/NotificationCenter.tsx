
import React from 'react';
import { Notification } from '../types';
import { translations, Language } from '../translations';
import { Zap, TrendingUp, Bell, RefreshCw, X, CheckCheck } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  lang: Language;
  isScanning?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onScanTrends: () => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  lang,
  isScanning = false,
  onMarkRead,
  onMarkAllRead,
  onScanTrends,
  onClose
}) => {
  const t = translations[lang];

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'insight': return <Zap size={16} className="text-cyber-purple" />;
      case 'trend': return <TrendingUp size={16} className="text-cyber-turquoise" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  const handleMarkAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkAllRead();
  };

  const handleScan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onScanTrends();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleNotificationClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkRead(id);
  };

  return (
    <div 
      className="absolute right-0 top-14 w-80 max-h-[520px] overflow-hidden glass-card rounded-2xl border border-white/10 shadow-2xl z-50 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-cyber-dark/40">
        <h3 className="font-futuristic font-bold text-sm tracking-widest uppercase text-white">
          {t.notifications}
        </h3>
        <div className="flex gap-4">
          <button 
            onClick={handleMarkAll}
            className="text-[10px] text-cyber-turquoise font-black hover:text-white transition-all uppercase tracking-widest flex items-center gap-1.5"
          >
            <CheckCheck size={12} /> {t.markAllRead}
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-white/5">
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-3 bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyber-purple hover:text-white transition disabled:opacity-50 shadow-[0_0_15px_rgba(140,77,255,0.1)] active:scale-95 transition-transform"
        >
          {isScanning ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Zap size={14} className="fill-current" />
          )}
          {isScanning ? t.scanningTrends : t.scanTrends}
        </button>
      </div>

      <div className="overflow-y-auto max-h-[340px] py-2 scroll-smooth">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs italic space-y-2">
            <Bell size={32} className="mx-auto opacity-20" />
            <p>{t.noNotifications}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={(e) => handleNotificationClick(n.id, e)}
              className={`p-4 hover:bg-white/5 cursor-pointer transition-all relative group border-l-2 ${!n.read ? 'bg-cyber-purple/5 border-cyber-purple' : 'border-transparent opacity-60'}`}
            >
              <div className="flex gap-3">
                <div className="mt-1 flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[11px] font-bold truncate ${!n.read ? 'text-white' : 'text-gray-400'} group-hover:text-cyber-turquoise transition`}>
                      {n.title}
                    </span>
                    <span className="text-[9px] text-gray-500 whitespace-nowrap ml-2 font-mono uppercase">{n.timestamp}</span>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${!n.read ? 'text-gray-300' : 'text-gray-500'}`}>
                    {n.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-cyber-dark/40 border-t border-white/5 flex gap-2">
        <button 
          onClick={handleCloseClick}
          className="flex-1 py-3 text-[10px] font-black bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2"
        >
          <X size={14} /> {t.close}
        </button>
      </div>
    </div>
  );
};
