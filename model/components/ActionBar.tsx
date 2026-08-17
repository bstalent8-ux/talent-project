'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Heart, Share2, MessageCircle } from 'lucide-react';

interface ActionBarProps {
  onContactClick: () => void;
  onShareClick: () => void;
  onSaveToggle: (saved: boolean) => void;
  isSaved?: boolean;
}

export default function ActionBar({
  onContactClick,
  onShareClick,
  onSaveToggle,
  isSaved = false,
}: ActionBarProps) {
  const [saved, setSaved] = useState(isSaved);

  const handleToggleSave = () => {
    const next = !saved;
    setSaved(next);
    onSaveToggle(next);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-3 px-4 lg:px-8 flex items-center justify-between gap-3 border-b border-[#182030]/80">
      {/* Right side in RTL: Back to results */}
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : null}
        className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-300 hover:text-white bg-[#121826] hover:bg-[#182133] border border-[#202a3d] px-3.5 py-2 rounded-lg transition-all"
      >
        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180 md:rotate-0" />
        <span>رجوع إلي النتائج</span>
      </button>

      {/* Left side in RTL: Save, Share, Contact buttons */}
      <div className="flex items-center gap-2.5">
        {/* Save Button */}
        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 text-xs md:text-sm font-medium px-3.5 py-2 rounded-lg border transition-all ${
            saved
              ? 'bg-rose-950/40 text-rose-300 border-rose-600/50'
              : 'bg-[#121826] text-slate-300 hover:text-white border-[#202a3d] hover:bg-[#182133]'
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          <span>{saved ? 'تم الحفظ' : 'حفظ'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShareClick}
          className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-300 hover:text-white bg-[#121826] hover:bg-[#182133] border border-[#202a3d] px-3.5 py-2 rounded-lg transition-all"
        >
          <Share2 className="w-4 h-4 text-slate-400" />
          <span>مشاركة</span>
        </button>

        {/* Contact Maya Gold Button */}
        <button
          onClick={onContactClick}
          className="gold-gradient-btn flex items-center gap-2 text-xs md:text-sm font-bold px-5 py-2 rounded-lg shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all"
        >
          <span>تواصل مع مايا</span>
        </button>
      </div>
    </div>
  );
}
