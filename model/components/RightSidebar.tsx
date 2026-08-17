'use client';

import React from 'react';
import {
  Check,
  X,
  Sparkles,
  Info,
  Calendar,
  User,
  Clock,
  ChevronLeft,
  Star,
  Activity,
  Globe2,
  Ruler,
  Eye,
  Scissors
} from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface RightSidebarProps {
  data: ModelData;
  onOpenMatchModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenMeasurementsModal: () => void;
  onOpenInsightsModal: () => void;
  onOpenActivityModal: () => void;
}

export default function RightSidebar({
  data,
  onOpenMatchModal,
  onOpenCalendarModal,
  onOpenMeasurementsModal,
  onOpenInsightsModal,
  onOpenActivityModal,
}: RightSidebarProps) {
  return (
    <div className="w-full space-y-4">
      
      {/* 1. Match Score Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <h3 className="text-sm font-bold text-center text-white mb-4">
          مدى المطابقة مع طلبك
        </h3>

        {/* Circular Progress Gauge */}
        <div className="flex flex-col items-center justify-center my-3 relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circular Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#172236"
                strokeWidth="7"
                fill="none"
              />
              {/* Foreground Match Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#10b981"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * data.matchScore.score) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {data.matchScore.score}%
              </span>
              <span className="text-xs font-semibold text-slate-300">Match</span>
            </div>
          </div>
        </div>

        {/* Match Factors Checklist */}
        <div className="space-y-2 my-4 text-xs">
          {data.matchScore.factors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-slate-300 font-medium">{factor.name}</span>
              </div>
              <span className="font-bold text-emerald-400 font-mono">{factor.pct}</span>
            </div>
          ))}
        </div>

        {/* Explanation Link */}
        <button
          onClick={onOpenMatchModal}
          className="w-full text-center text-xs text-amber-400/90 hover:text-amber-300 font-medium flex items-center justify-center gap-1 mt-3 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>لماذا هذه النسبة؟</span>
        </button>
      </div>

      {/* 2. AI Insights Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-black flex items-center justify-center">
              AI
            </span>
            <h3 className="text-sm font-bold text-white">AI Insights من Talents</h3>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {data.aiInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-[#121826] border border-[#1e273a] p-2.5 rounded-lg">
              <span className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                AI
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {insight}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onOpenInsightsModal}
          className="w-full py-2 bg-[#141b29] hover:bg-[#192338] text-amber-400 hover:text-amber-300 border border-[#232f46] rounded-lg text-xs font-semibold transition-all"
        >
          عرض كل التوصيات
        </button>
      </div>

      {/* 3. Weekly Availability Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3">
          التوفر هذا الأسبوع
        </h3>

        {/* 7 Days Schedule Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {data.weeklyAvailability.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium mb-0.5">{item.day}</span>
              <span className="text-xs font-bold text-white mb-1.5">{item.date}</span>

              {/* Status Pill */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  item.available
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
                    : 'bg-rose-950/80 border border-rose-500/50 text-rose-400'
                }`}
              >
                {item.available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <span
                className={`text-[9px] font-semibold mt-1 ${
                  item.available ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {item.available ? 'متاحة' : 'مشغولة'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onOpenCalendarModal}
          className="w-full py-2 bg-[#141b29] hover:bg-[#192338] text-amber-400 hover:text-amber-300 border border-[#232f46] rounded-lg text-xs font-semibold transition-all"
        >
          عرض التقويم الكامل
        </button>
      </div>

      {/* 4. Quick Bio Card */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3.5">
          نبذة سريعة
        </h3>

        <div className="space-y-2.5 text-xs mb-4">
          {data.quickBio.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between pb-2 border-b border-[#182030] last:border-b-0">
              <span className="text-slate-400 font-medium">{item.label}</span>
              <span className="font-bold text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onOpenMeasurementsModal}
          className="w-full py-2 bg-[#141b29] hover:bg-[#192338] text-amber-400 hover:text-amber-300 border border-[#232f46] rounded-lg text-xs font-semibold transition-all"
        >
          عرض كل التفاصيل
        </button>
      </div>

      {/* 5. Maya's Recent Activity */}
      <div className="bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3.5">
          نشاط مايا مؤخراً
        </h3>

        <div className="space-y-3 mb-4">
          {/* Activity 1 */}
          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-[#121826] border border-[#1e273a]">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">تم إضافة 5 صور جديدة</p>
                <span className="text-[10px] text-slate-500">منذ ساعتين</span>
              </div>
            </div>
            
            {/* 2 Photo Previews */}
            <div className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="thumb"
                className="w-7 h-7 rounded object-cover border border-[#2d3a54]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80"
                alt="thumb"
                className="w-7 h-7 rounded object-cover border border-[#2d3a54]"
              />
            </div>
          </div>

          {/* Activity 2 */}
          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-[#121826] border border-[#1e273a]">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">تم تحديث التوفر</p>
                <span className="text-[10px] text-slate-500">منذ 5 ساعات</span>
              </div>
            </div>
          </div>

          {/* Activity 3 */}
          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-[#121826] border border-[#1e273a]">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">تم تقييم مشروع L&apos;Oréal Paris</p>
                <span className="text-[10px] text-slate-500">منذ يومين</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenActivityModal}
          className="w-full py-2 bg-[#141b29] hover:bg-[#192338] text-amber-400 hover:text-amber-300 border border-[#232f46] rounded-lg text-xs font-semibold transition-all"
        >
          عرض كل النشاط
        </button>
      </div>

    </div>
  );
}
