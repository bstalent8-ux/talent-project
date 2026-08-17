'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Briefcase, ShieldCheck, CheckCircle2, ExternalLink, Sparkles, Check } from 'lucide-react';
import { PREVIOUS_SHOOTS, VERIFIED_TALENTS_CONTRACTS, ShootItem } from '../data/creatorData';

interface PreviousShootsProps {
  lang: 'en' | 'ar';
}

export function PreviousShoots({ lang }: PreviousShootsProps) {
  const isAr = lang === 'ar';
  const [selectedShoot, setSelectedShoot] = useState<ShootItem | null>(null);

  return (
    <section id="shoots" className="space-y-6">
      {/* 1. Previous Shoots (Uploaded by Creator) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{isAr ? 'أعمال وحملات سابقة' : 'Previous Shoots'}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({isAr ? 'تم الرفع بواسطة المنشئة' : 'Uploaded by Creator'})
                </span>
              </h2>
            </div>
          </div>

          <button className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline">
            {isAr ? 'عرض الكل (١٢)' : 'View All'}
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {PREVIOUS_SHOOTS.map((shoot) => (
            <div
              key={shoot.id}
              onClick={() => setSelectedShoot(shoot)}
              className="group bg-slate-50 hover:bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Brand Logo / Header Box */}
              <div className="h-16 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center p-2 mb-3 relative overflow-hidden shadow-xs">
                <span className="text-base sm:text-lg font-black tracking-tighter text-slate-900 group-hover:scale-105 transition-transform font-sans uppercase">
                  {shoot.brand}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                  {shoot.brand}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {isAr ? shoot.campaign.ar : shoot.campaign.en}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  {isAr ? shoot.date.ar : shoot.date.en}
                </div>
              </div>

              {shoot.results && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] font-semibold text-emerald-600 truncate">
                  ✨ {shoot.results}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Verified Through Talents (Escrow completed contracts) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{isAr ? 'عقود موثقة عبر منصة Talents' : 'Verified Through Talents'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'مشاريع مكتملة وتم تسليمها ودفع مستحقاتها بنجاح عبر حساب الضمان البنكي'
                  : 'Completed projects delivered & paid out securely via platform escrow'}
              </p>
            </div>
          </div>

          <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            {isAr ? 'عرض سجل العقود' : 'View All'}
          </button>
        </div>

        {/* 3 Verified Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
          {VERIFIED_TALENTS_CONTRACTS.map((contract) => (
            <div
              key={contract.id}
              onClick={() => setSelectedShoot(contract)}
              className="bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              {/* Verified Ribbon Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>VERIFIED</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {isAr ? contract.date.ar : contract.date.en}
                </span>
              </div>

              {/* Brand Name Title */}
              <div className="my-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {contract.brand}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {contract.category}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold">
                  {contract.results}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shoot Deliverables Modal preview */}
      {selectedShoot && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                  {selectedShoot.brand[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedShoot.brand}</h3>
                  <p className="text-[11px] text-slate-500">{isAr ? selectedShoot.campaign.ar : selectedShoot.campaign.en}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShoot(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-1">
                  {isAr ? 'تفاصيل المشروع والنتائج:' : 'Campaign Scope & Impact:'}
                </span>
                <p className="text-slate-600">
                  {selectedShoot.results || (isAr ? 'تم تسليم ٣ فيديوهات تيك توك وسيناريوهات مخصصة.' : '3 TikTok UGC ads delivered with full editing & voiceovers.')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                  ✓ {isAr ? 'حقوق الاستخدام التجاري' : 'Full Commercial Usage'}
                </div>
                <div className="p-2.5 rounded-lg bg-violet-50 text-violet-800 font-medium">
                  ✓ {isAr ? 'تم الدفع بالضمان (Escrow)' : 'Escrow Secured'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedShoot(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
