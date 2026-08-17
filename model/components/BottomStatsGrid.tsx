'use client';

import React from 'react';
import { Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface BottomStatsGridProps {
  data: ModelData;
  onOpenReviews: () => void;
}

export default function BottomStatsGrid({ data, onOpenReviews }: BottomStatsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. Reviews Section (Col Span 4) */}
      <div className="lg:col-span-4 bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Reviews ({data.reviewsCount})
            </h3>
            <button
              onClick={onOpenReviews}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              عرض الكل
            </button>
          </div>

          {/* Featured Review */}
          <div className="bg-[#121826] border border-[#1f283d] rounded-xl p-3.5 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-black text-[11px] flex items-center justify-center font-serif">
                  GLOW
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Glow Beauty</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] font-bold text-amber-400">5.0</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">15 مايو 2026</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed my-2.5">
              &quot;مايا رائعة جداً احترافية، ملتزمة بالمواعيد، والتعامل كان رائع&quot;
            </p>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1a2335]">
              <span className="bg-[#172033] text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded border border-[#232f48]">
                جودة العمل
              </span>
              <span className="bg-[#172033] text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded border border-[#232f48]">
                الالتزام بالمواعيد
              </span>
              <span className="bg-[#172033] text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded border border-[#232f48]">
                احترافية عالية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Career Timeline (Col Span 4) */}
      <div className="lg:col-span-4 bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-wide">Career Timeline</h3>
        </div>

        <div className="relative pr-4 space-y-4 before:absolute before:right-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#202a3f]">
          {data.timeline.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between text-xs">
              {/* Timeline Marker */}
              <div
                className={`absolute -right-[15px] w-3 h-3 rounded-full border-2 bg-[#0d121c] ${
                  item.highlight
                    ? 'border-amber-400 bg-amber-400 ring-4 ring-amber-500/20'
                    : 'border-slate-500 bg-[#121826]'
                }`}
              />

              <div className="pr-3">
                <p className="font-semibold text-slate-200">{item.title}</p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Performance (Col Span 4) */}
      <div className="lg:col-span-4 bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-wide">Performance</h3>
        </div>

        <div className="space-y-3 text-xs">
          {data.performance.map((metric, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                  {metric.label}
                </span>
                <span className="font-bold text-white">{metric.value}</span>
              </div>
              <div className="w-full h-1.5 bg-[#172033] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                  style={{
                    width: `${metric.pct}%`,
                    backgroundColor: metric.color || '#10b981',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
