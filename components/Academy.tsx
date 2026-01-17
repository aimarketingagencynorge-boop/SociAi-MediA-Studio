
import React from 'react';
import { NeonCard } from './NeonCard';
import { PlayCircle, FileText, Award, BookOpen } from 'lucide-react';
import { translations, Language } from '../translations';

interface AcademyProps {
  lang: Language;
}

export const Academy: React.FC<AcademyProps> = ({ lang }) => {
  const t = translations[lang];
  const courses = [
    // Fixed: Removed comparison with 'ru' as it is not part of the Language type ('pl' | 'en')
    { title: lang === 'pl' ? "Mistrzostwo Promptów AI" : "Mastering AI Prompts", level: "Beginner", time: "45 min", type: "Video", color: "cyber-purple" },
    { title: lang === 'pl' ? "Strategia Viral Reels 2025" : "Viral Reels Strategy 2025", level: "Intermediate", time: "1.5 hrs", type: "Workshop", color: "cyber-turquoise" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-futuristic font-bold neon-text-magenta uppercase">{t.academyTitle}</h1>
        <p className="text-gray-400">{t.academySubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course, i) => (
          <NeonCard key={i} className="cursor-pointer hover:-translate-y-2 transition-transform">
            <div className="aspect-video bg-cyber-dark/80 rounded-xl mb-4 flex items-center justify-center relative group">
                <PlayCircle size={48} className="text-white opacity-50 group-hover:opacity-100 transition" />
            </div>
            <h4 className="text-lg font-bold mb-2">{course.title}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><BookOpen size={12}/> {course.level}</span>
                <span className="flex items-center gap-1"><PlayCircle size={12}/> {course.time}</span>
            </div>
          </NeonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeonCard title={t.knowledgeBase} icon={<FileText />}>
            <div className="space-y-4">
                {['The Ethics of AI', 'Platform Algorithms'].map(doc => (
                    <div key={doc} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition cursor-pointer">
                        <span className="text-gray-300">{doc}</span>
                        <button className="text-cyber-turquoise text-xs font-bold">READ PDF</button>
                    </div>
                ))}
            </div>
        </NeonCard>
        <NeonCard title={t.achievements} icon={<Award />}>
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full border-4 border-cyber-purple/40 flex items-center justify-center font-bold">12 UNITS</div>
            </div>
        </NeonCard>
      </div>
    </div>
  );
};
