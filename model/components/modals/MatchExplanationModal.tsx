'use client';

import React from 'react';
import { X, Sparkles, Check, Info, ArrowUpRight } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface MatchExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function MatchExplanationModal({
  isOpen,
  onClose,
  data,
}: MatchExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">كيف تم حساب نسبة المطابقة ({data.matchScore.score}%)؟</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            يستخدم محرك الذكاء الاصطناعي في منصة <strong className="text-amber-400">TALENTS</strong> خوارزمية ذكية لمطابقة متطلبات حملتك الإعلانية مع خبرات ومواصفات وتوفر الموديل:
          </p>

          <div className="space-y-2.5">
            {data.matchScore.factors.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#131b2c] border border-[#202c42]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-white font-medium">{f.name}</span>
                </div>
                <span className="font-bold text-emerald-400 font-mono">{f.pct}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-blue-300">
            <p className="leading-relaxed">
              💡 <strong>نصيحة:</strong> الموديل مايا خالد تحقق أعلى نسبة توافق مع مشاريع الـ Fashion والـ Commercial لهذا الشهر.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
