'use client';

import React, { useState } from 'react';
import { Heart, Bell, MessageSquare, ChevronDown, Search, Sparkles, Check, Globe } from 'lucide-react';

interface NavbarProps {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  currency: 'EGP' | 'USD' | 'SAR' | 'AED';
  setCurrency: (c: 'EGP' | 'USD' | 'SAR' | 'AED') => void;
  savedCount: number;
  onOpenMessage: () => void;
}

export function Navbar({ lang, setLang, currency, setCurrency, savedCount, onOpenMessage }: NavbarProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              talents<span className="text-emerald-500 font-extrabold">.</span>
            </span>
          </a>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#discover" className="hover:text-slate-900 transition-colors">
              {isAr ? 'اكتشف المواهب' : 'Discover Talents'}
            </a>
            <a href="#categories" className="hover:text-slate-900 transition-colors">
              {isAr ? 'الأقسام والتصنيفات' : 'Categories'}
            </a>
            <a href="#for-brands" className="hover:text-slate-900 transition-colors">
              {isAr ? 'للشركات والعلامات' : 'For Brands'}
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              {isAr ? 'كيف يعمل النظام' : 'How It Works'}
            </a>
            <a href="#packages" className="hover:text-slate-900 transition-colors">
              {isAr ? 'الأسعار والباقات' : 'Pricing'}
            </a>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            >
              <span>{currency}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                {(['EGP', 'USD', 'SAR', 'AED'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setCurrency(curr);
                      setShowCurrencyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currency === curr ? 'font-bold text-violet-600 bg-violet-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{curr}</span>
                    {currency === curr && <Check className="w-3.5 h-3.5 text-violet-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'العربية' : 'EN'}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setLang('en');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    lang === 'en' ? 'font-bold text-violet-600 bg-violet-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-violet-600" />}
                </button>
                <button
                  onClick={() => {
                    setLang('ar');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    lang === 'ar' ? 'font-bold text-violet-600 bg-violet-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>🇪🇬 العربية</span>
                  {lang === 'ar' && <Check className="w-3.5 h-3.5 text-violet-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Saved items */}
          <button
            title="Saved Talents"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <Heart className={`w-4 h-4 ${savedCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isAr ? 'المحفوظات' : 'Saved'}</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            title="Notifications"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {/* Direct Message trigger */}
          <button
            onClick={onOpenMessage}
            title="Messages"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                R
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Rawan Studio</p>
                  <p className="text-[11px] text-slate-500 truncate">brand@rawanstudio.com</p>
                </div>
                <div className="py-1">
                  <a href="#campaigns" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    {isAr ? 'حملاتي الإعلانية' : 'My Brand Campaigns'}
                  </a>
                  <a href="#contracts" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    {isAr ? 'عقود الضمان المالي (Escrow)' : 'Escrow Contracts'}
                  </a>
                  <a href="#settings" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    {isAr ? 'إعدادات الحساب' : 'Account Settings'}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
