'use client';

import React from 'react';
import { Building2, Sparkles } from 'lucide-react';
import { BRANDS_WORKED_WITH } from '../data/creatorData';

interface BrandsWorkedWithProps {
  lang: 'en' | 'ar';
}

export function BrandsWorkedWith({ lang }: BrandsWorkedWithProps) {
  const isAr = lang === 'ar';

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-600" />
          <span>{isAr ? 'علامات تجارية تعاونت معها' : "Brands I've Worked With"}</span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          +16 {isAr ? 'علامة إقليمية وعالمية' : 'Global & Regional Brands'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BRANDS_WORKED_WITH.map((brand, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs font-bold text-slate-800 tracking-tight transition-colors text-center font-sans shadow-2xs hover:border-slate-300"
          >
            {brand}
          </div>
        ))}
      </div>
    </div>
  );
}
