'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface KeyStatsProps {
  data: ModelData;
  onOpenReviews?: () => void;
}

export default function KeyStats({ data, onOpenReviews }: KeyStatsProps) {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b2436] rounded-xl p-3 md:p-4 shadow-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 divide-[#1a2334] text-center">
        
        {/* Rating */}
        <div
          onClick={onOpenReviews}
          className="pt-2 sm:pt-0 flex flex-col items-center justify-center cursor-pointer group p-2 rounded-lg hover:bg-[#131a29] transition-all"
        >
          <span className="text-[11px] text-slate-400 font-medium mb-1">تقييم عام</span>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
              {data.rating}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">({data.reviewsCount} تقييم)</span>
        </div>

        {/* Cancellation Rate */}
        <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center p-2 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium mb-1">معدل الإلغاء</span>
          <span className="text-xl font-extrabold text-white tracking-tight">
            {data.cancellationRate}
          </span>
        </div>

        {/* Response Time */}
        <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center p-2 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium mb-1">معدل الوصول</span>
          <span className="text-xl font-extrabold text-white tracking-tight">
            {data.responseTime}
          </span>
        </div>

        {/* Response Rate */}
        <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center p-2 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium mb-1">معدل الاستجابة</span>
          <span className="text-xl font-extrabold text-emerald-400 tracking-tight">
            {data.responseRate}
          </span>
        </div>

        {/* Projects Count */}
        <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center p-2 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium mb-1">عدد المشاريع</span>
          <span className="text-xl font-extrabold text-white tracking-tight">
            {data.projectsCount}
          </span>
        </div>

        {/* Average Project Price */}
        <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center p-2 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium mb-1">متوسط قيمة المشروع</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {data.avgProjectPrice.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-bold">EGP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
