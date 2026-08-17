'use client';

import React from 'react';
import { X, Ruler, User, Sparkles, CheckCircle2, Globe, Heart, Shield } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function MeasurementsModal({ isOpen, onClose, data }: MeasurementsModalProps) {
  if (!isOpen) return null;

  const fullSpecs = [
    { label: 'الاسم الكامل', value: 'مايا خالد (Maya Khaled)' },
    { label: 'المهنة', value: 'عارضة أزياء احترافية (Fashion & Commercial Model)' },
    { label: 'المدينة / الدولة', value: 'القاهرة، جمهورية مصر العربية' },
    { label: 'الجنسية', value: 'مصرية' },
    { label: 'اللغة الأم', value: 'العربية (Native)' },
    { label: 'اللغات الأخرى', value: 'الإنجليزية (طلاقة كاملة - Fluent)' },
    { label: 'الطول', value: '174 cm (5 ft 8.5 in)' },
    { label: 'الوزن', value: '54 kg' },
    { label: 'الصدر / الخصر / الأرداف', value: '90 - 60 - 90 cm' },
    { label: 'مقاس الحذاء', value: '38.5 EU / 6 UK' },
    { label: 'مقاس الفستان', value: '36 EU / Small' },
    { label: 'لون العين', value: 'بني دافئ' },
    { label: 'لون الشعر', value: 'بني غامق طبيعي' },
    { label: 'نوع البشرة', value: 'حنطي صافي (Olive / Mediterranean)' },
    { label: 'جاهزية السفر والتنقل', value: 'متاحة للسفر داخل وخارج مصر بجواز سفر ساري' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">بطاقة القياسات الرسمية (Comp Card)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#131b2c] border border-[#222e44] rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.mainImage}
              alt={data.nameEn}
              className="w-14 h-14 rounded-lg object-cover border border-amber-500/40"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white">{data.nameEn}</h4>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400">{data.titleEn} • {data.locationEn}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fullSpecs.map((spec, idx) => (
              <div
                key={idx}
                className="bg-[#121826] border border-[#1e273a] p-2.5 rounded-lg flex flex-col justify-between text-xs"
              >
                <span className="text-slate-400 font-medium text-[11px] mb-1">{spec.label}</span>
                <span className="font-bold text-slate-200">{spec.value}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>تم التحقق من هذه القياسات رسميًا بواسطة فريق عمل TALENTS Agency.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
