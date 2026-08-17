'use client';

import React from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  Calendar, 
  Eye, 
  Video,
  Flame
} from 'lucide-react';
import { RECENT_ACTIVITY } from '../data/creatorData';

interface InsightsAndActivityProps {
  lang: 'en' | 'ar';
}

export function InsightsAndActivity({ lang }: InsightsAndActivityProps) {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-6">
      {/* 1. Creator Insights Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'رؤى وإحصائيات الذكاء الاصطناعي' : 'Talents Insights'}</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-200">
            AI Powered
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Best performing content type */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {isAr ? 'النوع الأكثر أداءً' : 'Best performing content type'}
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {isAr
                  ? 'مراجعات المنتجات (تفاعل أعلى بنسبة ٧٢٪)'
                  : 'Product Reviews (72% higher engagement rate)'}
              </div>
            </div>
          </div>

          {/* Top performing industry */}
          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {isAr ? 'أعلى قطاع مبيعات' : 'Top performing industry'}
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {isAr
                  ? 'العناية بالبشرة والتجميل (نسبة نجاح ٨٥٪)'
                  : 'Beauty & Skincare (85% campaign success rate)'}
              </div>
            </div>
          </div>

          {/* Estimated monthly bookings */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">
                  {isAr ? 'الحجوزات الشهرية المقدرة' : 'Estimated monthly bookings'}
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  {isAr ? '٣ - ٥ مشاريع شهرياً' : '3-5 projects / month'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
              {isAr ? 'طلب عالي' : 'High Demand'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Recent Activity Timeline */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'النشاط الأخير للمنشئة' : 'Recent Activity'}</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {isAr ? 'مباشر' : 'Live'}
          </span>
        </div>

        <div className="space-y-3.5">
          {RECENT_ACTIVITY.map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                {act.icon === 'Video' && <Video className="w-3.5 h-3.5" />}
                {act.icon === 'Star' && <Star className="w-3.5 h-3.5" />}
                {act.icon === 'Calendar' && <Calendar className="w-3.5 h-3.5" />}
                {act.icon === 'Eye' && <Eye className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 leading-snug">
                  {isAr ? act.action.ar : act.action.en}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAr ? act.time.ar : act.time.en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
