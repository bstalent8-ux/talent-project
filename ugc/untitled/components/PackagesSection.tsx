'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Shield, Clock, RotateCcw, ArrowRight } from 'lucide-react';
import { PACKAGES, PackageItem } from '../data/creatorData';

interface PackagesSectionProps {
  lang: 'en' | 'ar';
  currency: 'EGP' | 'USD' | 'SAR' | 'AED';
  onSelectPackage: (pkg: PackageItem) => void;
}

export function PackagesSection({ lang, currency, onSelectPackage }: PackagesSectionProps) {
  const isAr = lang === 'ar';
  const [billingCycle, setBillingCycle] = useState<'single' | 'monthly'>('single');

  // Convert prices based on currency selection
  const formatPrice = (pkg: PackageItem) => {
    let multiplier = 1;
    let symbol = currency;
    let amount = pkg.priceEGP;

    if (currency === 'USD') {
      amount = pkg.priceUSD;
    } else if (currency === 'SAR') {
      amount = Math.round(pkg.priceUSD * 3.75);
    } else if (currency === 'AED') {
      amount = Math.round(pkg.priceUSD * 3.67);
    }

    if (billingCycle === 'monthly') {
      // 15% discount on monthly retainer
      amount = Math.round(amount * 0.85);
    }

    return {
      formatted: amount.toLocaleString(),
      symbol: currency
    };
  };

  return (
    <section id="packages" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
      {/* Header with Title & Billing Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isAr ? 'باقات الإنتاج والأسعار' : 'Packages & Pricing'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAr
              ? 'اختر الباقة المناسبة لحملتك. جميع المبالغ مؤمنة عبر حساب الضمان البنكي ولا تُدفع إلا بعد استلامك للعمل واعتماده.'
              : 'Choose the perfect package for your project. All funds are secured via escrow and only released upon your final approval.'}
          </p>
        </div>

        {/* Billing cycle toggle (Single Project vs Monthly Retainer) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'single'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isAr ? 'حملة واحدة' : 'One-Time Shoot'}
          </button>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              billingCycle === 'monthly'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{isAr ? 'اشتراك شهري' : 'Monthly Retainer'}</span>
            <span className="text-[10px] px-1 py-0.2 bg-emerald-400 text-slate-950 rounded font-black">-15%</span>
          </button>
        </div>
      </div>

      {/* 3 Packages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {PACKAGES.map((pkg) => {
          const priceObj = formatPrice(pkg);
          const isPopular = pkg.popular;

          return (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-[#1C1438] via-[#2A174E] to-[#160E2E] text-white shadow-2xl shadow-violet-900/30 border-2 border-violet-500 transform md:-translate-y-2'
                  : 'bg-slate-50/70 hover:bg-white text-slate-900 border border-slate-200/90 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              {/* Most Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-400 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{isAr ? pkg.tag?.ar : pkg.tag?.en}</span>
                </div>
              )}

              <div>
                {/* Package Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className={`text-lg font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {isAr ? pkg.name.ar : pkg.name.en}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-semibold opacity-80">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pkg.deliveryDays} {isAr ? 'أيام تسليم' : 'Days Delivery'}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="my-4 pb-4 border-b border-dashed border-slate-200/20">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
                      {priceObj.formatted}
                    </span>
                    <span className={`text-xs font-bold uppercase ${isPopular ? 'text-violet-300' : 'text-slate-500'}`}>
                      {priceObj.symbol}
                    </span>
                    {billingCycle === 'monthly' && (
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        /{isAr ? 'شهر' : 'mo'}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 ${isPopular ? 'text-violet-200/70' : 'text-slate-500'}`}>
                    {isAr ? 'شامل جولات التعديل وحقوق الإعلانات' : 'Includes revisions & usage rights'}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 mb-6 text-xs">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isPopular
                            ? 'bg-emerald-400 text-slate-950 font-bold'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={isPopular ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium'}>
                        {isAr ? feat.ar : feat.en}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-extrabold hover:opacity-95 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-[0.98]'
                  }`}
                >
                  <span>{isAr ? 'اختيار هذه الباقة' : 'Select Package'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className={`mt-2 text-[10px] text-center flex items-center justify-center gap-1 ${
                  isPopular ? 'text-violet-300/70' : 'text-slate-400'
                }`}>
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'أموالك مؤمنة بالكامل في حساب الضمان' : '100% Escrow Protection'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
