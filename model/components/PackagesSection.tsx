'use client';

import React, { useState } from 'react';
import { Check, ShieldCheck, Sun, Gem, Sparkles } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface PackagesSectionProps {
  data: ModelData;
  onSelectPackage: (pkgId: string) => void;
  selectedPackageId?: string;
}

export default function PackagesSection({
  data,
  onSelectPackage,
  selectedPackageId = 'growth',
}: PackagesSectionProps) {
  const [selected, setSelected] = useState(selectedPackageId);

  const handleSelect = (pkgId: string) => {
    setSelected(pkgId);
    onSelectPackage(pkgId);
  };

  return (
    <div className="w-full bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white font-sans">Packages</h2>
          <span className="text-xs text-slate-400 font-medium">اختر الباقة المناسبة لمشروعك</span>
        </div>
      </div>

      {/* 3 Packages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Starter Package */}
        <div
          onClick={() => handleSelect('starter')}
          className={`relative rounded-xl p-4 md:p-5 flex flex-col justify-between transition-all cursor-pointer ${
            selected === 'starter'
              ? 'bg-[#141b2b] border-2 border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-[#111724] border border-[#1e273a] hover:border-slate-600'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-amber-400/80" />
              <h3 className="text-sm font-bold text-white">Starter</h3>
            </div>

            <div className="flex items-baseline gap-1 mb-4 pb-3 border-b border-[#1c2538]">
              <span className="text-2xl font-extrabold text-white">2,500</span>
              <span className="text-xs text-amber-400 font-bold">EGP</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>3 ساعات تصوير</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Look واحد</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>10 صور معدلة</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>استخدام تجاري أساسي</span>
              </li>
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('starter');
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selected === 'starter'
                ? 'gold-gradient-btn'
                : 'bg-[#172032] hover:bg-[#1f2c44] text-slate-200 border border-[#263550]'
            }`}
          >
            اختر الباقة
          </button>
        </div>

        {/* Growth Package (Highlighted & Most Popular) */}
        <div
          onClick={() => handleSelect('growth')}
          className={`relative rounded-xl p-4 md:p-5 flex flex-col justify-between transition-all cursor-pointer ${
            selected === 'growth'
              ? 'bg-[#141b2b] border-2 border-amber-400 shadow-xl shadow-amber-500/20'
              : 'bg-[#121827] border border-amber-500/60'
          }`}
        >
          {/* Top Pill Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider">
              الأكثر طلباً
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 mt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">Growth</h3>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-4 pb-3 border-b border-[#243048]">
              <span className="text-2xl font-extrabold text-white">5,500</span>
              <span className="text-xs text-amber-400 font-bold">EGP</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-200 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>6 ساعات تصوير</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>3 Looks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>20 صورة معدلة</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>فيديو قصير (15 ثانية)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>استخدام تجاري كامل</span>
              </li>
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('growth');
            }}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold gold-gradient-btn shadow-md"
          >
            اختر الباقة
          </button>
        </div>

        {/* Premium Package */}
        <div
          onClick={() => handleSelect('premium')}
          className={`relative rounded-xl p-4 md:p-5 flex flex-col justify-between transition-all cursor-pointer ${
            selected === 'premium'
              ? 'bg-[#141b2b] border-2 border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-[#111724] border border-[#1e273a] hover:border-slate-600'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gem className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Premium</h3>
            </div>

            <div className="flex items-baseline gap-1 mb-4 pb-3 border-b border-[#1c2538]">
              <span className="text-2xl font-extrabold text-white">9,000</span>
              <span className="text-xs text-amber-400 font-bold">EGP</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>يوم كامل تصوير</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>5 Looks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>40 صورة معدلة</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>فيديو قصير + BTS</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>استخدام تجاري كامل</span>
              </li>
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('premium');
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selected === 'premium'
                ? 'gold-gradient-btn'
                : 'bg-[#172032] hover:bg-[#1f2c44] text-slate-200 border border-[#263550]'
            }`}
          >
            اختر الباقة
          </button>
        </div>

      </div>

      {/* Escrow Guarantee Note */}
      <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-300 bg-[#121826] border border-[#1e273a] py-2.5 px-4 rounded-lg">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>جميع الباقات تشمل حماية الدفع عبر Escrow وضمان استرداد الأموال بنسبة 100%</span>
      </div>
    </div>
  );
}
