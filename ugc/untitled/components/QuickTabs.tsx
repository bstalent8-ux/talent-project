'use client';

import React from 'react';

interface QuickTabsProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
  lang: 'en' | 'ar';
}

export function QuickTabs({ activeTab, setActiveTab, lang }: QuickTabsProps) {
  const isAr = lang === 'ar';

  const tabs = [
    { id: 'overview', label: { en: 'Overview', ar: 'نظرة عامة' } },
    { id: 'portfolio', label: { en: 'Video Portfolio', ar: 'معرض الفيديوهات' } },
    { id: 'performance', label: { en: 'Performance Metrics', ar: 'مؤشرات الأداء' } },
    { id: 'shoots', label: { en: 'Previous Shoots', ar: 'الأعمال السابقة' } },
    { id: 'packages', label: { en: 'Packages & Prices', ar: 'الباقات والأسعار' } },
    { id: 'reviews', label: { en: 'Reviews & Insights', ar: 'التقييمات والإحصائيات' } }
  ];

  return (
    <div className="sticky top-16 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  const el = document.getElementById(tab.id);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 120;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isAr ? tab.label.ar : tab.label.en}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
