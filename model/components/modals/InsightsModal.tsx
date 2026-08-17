'use client';

import React from 'react';
import { X, Sparkles, TrendingUp, Compass, Award } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function InsightsModal({ isOpen, onClose, data }: InsightsModalProps) {
  if (!isOpen) return null;

  const detailedInsights = [
    {
      title: 'تصنيف الأداء والطلب',
      badge: 'TOP 7%',
      desc: 'مايا مصنفة ضمن أعلى 7% من العارضات الأكثر طلباً في مصر في قطاع Fashion & Commercial لعام 2026.',
    },
    {
      title: 'فرص الحملات الخارجية (Outdoor)',
      badge: '+35% Reach',
      desc: 'توصيات الذكاء الاصطناعي تشير إلى أن الحملات الخارجية في المواقع المفتوحة تحقق أعلى معدل تفاعل مع جمهور البراندات.',
    },
    {
      title: 'أوقات ذروة الحجوزات',
      badge: 'High Demand',
      desc: 'عطلات نهاية الأسبوع ومواعيد منتصف الأسبوع تشهد إقبالاً كثيفاً، ينصح بالحجز المسبق قبل 5 أيام على الأقل.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">توصيات وتحليلات الذكاء الاصطناعي</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          {detailedInsights.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-[#121826] border border-[#1e273a] rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
