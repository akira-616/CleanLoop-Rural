import React from 'react';
import { useApp } from '../store/appStore';
import { ShieldAlert, Info } from 'lucide-react';

export const DisclaimerFooter: React.FC = () => {
  const { dict, language } = useApp();

  return (
    <footer className="mt-10 mb-20 md:mb-8 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/80 text-center space-y-1.5 shadow-2xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>{dict.disclaimer}</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed max-w-lg mx-auto">
          {dict.tagline}
        </p>
        <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <Info className="w-3 h-3" />
          <span>{language === 'hi' ? 'सिंथेटिक डेमो डेटा • मानव सत्यापन आवश्यक' : 'Synthetic demo data • Doctor confirmation required'}</span>
        </div>
      </div>
    </footer>
  );
};
