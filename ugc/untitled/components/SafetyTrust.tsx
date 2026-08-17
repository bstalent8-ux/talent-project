'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface SafetyTrustProps {
  lang: 'en' | 'ar';
  onHireNow: () => void;
  onOpenMessage: () => void;
}

export function SafetyTrust({ lang, onHireNow, onOpenMessage }: SafetyTrustProps) {
  const isAr = lang === 'ar';
  const [quickQuestion, setQuickQuestion] = useState('');
  const [sentQuestion, setSentQuestion] = useState(false);

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    setSentQuestion(true);
    setTimeout(() => {
      setQuickQuestion('');
      setSentQuestion(false);
      onOpenMessage();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. Safety & Trust Guarantee Box */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'الأمان وضمان الأموال' : 'Safety & Trust'}</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-slate-700">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <strong className="text-slate-900 block">{isAr ? 'دفع إلكتروني آمن ١٠٠٪' : '100% Secure Payments'}</strong>
              <span className="text-[11px] text-slate-500">{isAr ? 'حساب ضمان بنكي يحفظ المبلغ' : 'Encrypted bank-level escrow'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <strong className="text-slate-900 block">{isAr ? 'ضمان مالي قبل تحرير الدفعة' : 'Financial Guarantee (Escrow)'}</strong>
              <span className="text-[11px] text-slate-500">{isAr ? 'لا يستلم المنشئ المبلغ إلا بعد موافقتك' : 'Released only after your approval'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <strong className="text-slate-900 block">{isAr ? 'مراجعة يدوية لكل طلب' : 'Manual Review for Every Order'}</strong>
              <span className="text-[11px] text-slate-500">{isAr ? 'فريق الجودة يتحقق من المواصفات' : 'Quality checks on all deliverables'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <strong className="text-slate-900 block">{isAr ? 'حل سريع للنزاعات خلال ٢٤ ساعة' : 'Fast Dispute Resolution'}</strong>
              <span className="text-[11px] text-slate-500">{isAr ? 'دعم فني مخصص للعلامات التجارية' : 'Direct dedicated account manager'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Direct Talent Booking Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-3xl p-5 border border-emerald-200 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{isAr ? 'احجز المنشئة مباشرة' : 'Book Talent'}</h4>
            <p className="text-[11px] text-slate-600">{isAr ? 'أرسل تفاصيل حملتك واستلم الفيديوهات' : 'Share your campaign brief & get started'}</p>
          </div>
        </div>

        <button
          onClick={onHireNow}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'بدء الحجز بالضمان' : 'Book Talent (Escrow)'}</span>
        </button>
      </div>

      {/* 3. Ask the Talent direct question */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{isAr ? 'اسأل نور سؤالاً مباشراً' : 'Ask the Talent'}</h4>
            <p className="text-[11px] text-slate-500">{isAr ? 'استفسر عن جدول التصوير وتفاصيل المنتج' : 'Have a question? Get in touch directly'}</p>
          </div>
        </div>

        <form onSubmit={handleSendQuestion} className="space-y-2">
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder={isAr ? 'هل يمكنك تجربة منتج تجميلي الأسبوع القادم؟' : 'Can you shoot a skincare review next week?'}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button
            type="submit"
            disabled={sentQuestion}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {sentQuestion ? (
              <span className="text-emerald-400 font-bold">{isAr ? 'تم الإرسال...' : 'Opening Chat...'}</span>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>{isAr ? 'إرسال السؤال' : 'Send Question'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
