'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface PreviousShootsProps {
  data: ModelData;
}

export default function PreviousShoots({ data }: PreviousShootsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* Previous Shoots Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-white tracking-wide">Previous Shoots</h3>
          <button className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            عرض الكل
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {data.shoots.map((shoot, idx) => (
            <div
              key={idx}
              className="bg-[#121826] hover:bg-[#182133] border border-[#1e273a] hover:border-amber-500/40 rounded-lg p-2.5 flex flex-col items-center justify-between text-center transition-all group min-h-[90px]"
            >
              <div className="font-serif font-black tracking-widest text-xs text-slate-200 group-hover:text-amber-300 transition-colors">
                {shoot.brand}
              </div>
              
              <div className="my-1">
                <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[90px]">
                  {shoot.type}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">{shoot.date}</p>
              </div>

              <div className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Through Talents Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-white tracking-wide">Verified Through Talents</h3>
          </div>
          <button className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            عرض الكل
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {data.verifiedWork.map((work, idx) => (
            <div
              key={idx}
              className="bg-[#121826] hover:bg-[#182133] border border-[#1e273a] hover:border-emerald-500/40 rounded-lg p-2.5 flex flex-col items-center justify-between text-center transition-all group min-h-[90px]"
            >
              <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                {work.brand}
              </div>

              <div className="my-1">
                <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[90px]">
                  {work.type}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">{work.date}</p>
              </div>

              <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                VERIFIED
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
