'use client';

import React from 'react';
import { X, Star, CheckCircle2, ShieldCheck, ThumbsUp } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function ReviewsModal({ isOpen, onClose, data }: ReviewsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-bold text-white">
              تقييمات وآراء العملاء ({data.reviewsCount} تقييم)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Score Box */}
        <div className="p-4 bg-[#121826] border-b border-[#1d2639] flex items-center justify-around text-center">
          <div>
            <span className="text-3xl font-extrabold text-white">{data.rating}</span>
            <div className="flex items-center justify-center text-amber-400 my-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">تقييم عام موثوق</span>
          </div>

          <div className="h-10 w-[1px] bg-[#1e273a]" />

          <div>
            <span className="text-2xl font-extrabold text-emerald-400">100%</span>
            <span className="block text-[10px] text-slate-400 mt-1">الالتزام بالمواعيد</span>
          </div>

          <div className="h-10 w-[1px] bg-[#1e273a]" />

          <div>
            <span className="text-2xl font-extrabold text-white">82%</span>
            <span className="block text-[10px] text-slate-400 mt-1">تكرار طلب العمل</span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {data.reviews.map((rev, idx) => (
            <div key={idx} className="bg-[#121826] border border-[#1f283d] rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{rev.brand}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({rev.author})</span>
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                    <span className="text-[11px] font-bold">{rev.rating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">{rev.date}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed my-2">
                &quot;{rev.comment}&quot;
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1b2438]">
                {rev.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-[#172033] text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded border border-[#232f48]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
