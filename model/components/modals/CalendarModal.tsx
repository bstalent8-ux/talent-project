'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check, Clock } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
  onSelectDate?: (dateStr: string) => void;
}

export default function CalendarModal({ isOpen, onClose, data, onSelectDate }: CalendarModalProps) {
  const [selectedDay, setSelectedDay] = useState<number>(14);

  if (!isOpen) return null;

  // August 2026 Calendar Days
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const busyDays = [4, 5, 12, 16, 20, 26, 27];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">التقويم الكامل لتوفر مايا خالد</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1c263c]">
            <span className="text-sm font-extrabold text-white">أغسطس 2026</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                متاح للحجز
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                جلسة تصوير محجوزة
              </span>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
            <span>أحد</span>
            <span>إثنين</span>
            <span>ثلاثاء</span>
            <span>أربعاء</span>
            <span>خميس</span>
            <span>جمعة</span>
            <span>سبت</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {/* Offset for August 2026 start */}
            <div className="p-2 text-slate-700">-</div>
            <div className="p-2 text-slate-700">-</div>
            <div className="p-2 text-slate-700">-</div>

            {daysInMonth.map((day) => {
              const isBusy = busyDays.includes(day);
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => !isBusy && setSelectedDay(day)}
                  disabled={isBusy}
                  className={`p-2 rounded-lg font-bold transition-all relative ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                      : isBusy
                      ? 'bg-rose-950/20 text-rose-400/50 border border-rose-900/30 cursor-not-allowed line-through'
                      : 'bg-[#141b2a] text-slate-200 hover:bg-[#1b253b] border border-[#222e44]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selected Date Info */}
          <div className="mt-5 p-3 rounded-xl bg-[#131b2c] border border-[#222f46] flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">التاريخ المحدد:</span>
              <span className="font-bold text-white text-sm">{selectedDay} أغسطس 2026</span>
            </div>
            <button
              onClick={() => {
                onSelectDate?.(`2026-08-${selectedDay}`);
                onClose();
              }}
              className="gold-gradient-btn px-4 py-1.5 rounded-lg font-bold text-xs"
            >
              اختيار هذا الموعد
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
