
import React from 'react';

interface NeonCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const NeonCard: React.FC<NeonCardProps> = ({ children, title, className = "", icon }) => {
  return (
    <div className={`glass-card rounded-2xl p-6 relative overflow-hidden group ${className}`}>
      {/* Animated Gradient Background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyber-purple/20 via-cyber-magenta/20 to-cyber-turquoise/20 opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
      
      <div className="relative z-10">
        {(title || icon) && (
          <div className="flex items-center gap-3 mb-6">
            {icon && <div className="text-cyber-turquoise">{icon}</div>}
            {title && <h3 className="text-xl font-futuristic font-bold tracking-tight neon-text-purple uppercase">{title}</h3>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
