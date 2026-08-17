'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, UserCheck, Clock, ArrowLeft } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface StickyBottomBarProps {
  data: ModelData;
  onContinueToBrief: () => void;
  selectedPrice?: number;
}

export default function StickyBottomBar({
  data,
  onContinueToBrief,
  selectedPrice = 5200,
}: StickyBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#090d15]/95 backdrop-blur-lg border-t border-[#1e273a] py-3 px-4 lg:px-8 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Right Info: Price Estimate & Trust Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-6 text-xs text-slate-300">
          
          {/* Approximate Price */}
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-lg font-extrabold text-white font-mono">
                  {selectedPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-400">EGP</span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                السعر التقريبي لمشروع مشابه
              </span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-[#1e273a] hidden sm:block" />

          {/* Trust Badges */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>محمي Escrow</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>مؤكدة الهوية</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 hidden md:flex">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>دعم على مدار الساعة</span>
            </div>
          </div>

        </div>

        {/* Action Button: Continue to Brief */}
        <button
          onClick={onContinueToBrief}
          className="gold-gradient-btn flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all text-sm font-bold text-slate-950"
        >
          <div className="text-right">
            <div className="flex items-center gap-2 font-sans font-extrabold text-sm">
              <span>Continue to Brief</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-900 block font-semibold -mt-0.5">
              الخطوة التالية: وصف المشروع
            </span>
          </div>
        </button>

      </div>
    </div>
  );
}
