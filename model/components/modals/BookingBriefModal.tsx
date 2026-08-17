'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  Camera,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModelData } from '@/lib/model-data';

interface BookingBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
  initialPackageId?: string;
}

export default function BookingBriefModal({
  isOpen,
  onClose,
  data,
  initialPackageId = 'growth',
}: BookingBriefModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [projectTitle, setProjectTitle] = useState('حملة تصوير أزياء صيفية');
  const [brandName, setBrandName] = useState('Best Production');
  const [selectedType, setSelectedType] = useState('Fashion Campaign');
  const [selectedPackage, setSelectedPackage] = useState(initialPackageId);
  const [locationType, setLocationType] = useState('استوديو داخلي - المعادي');
  const [shootDate, setShootDate] = useState('2026-08-22');
  const [hours, setHours] = useState(6);
  const [notes, setNotes] = useState('جلسة تصوير كولكشن الصيف الجديد، يتطلب 3 لوكات مختلفة مع ميكب أرتيست متواجد.');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const getPackagePrice = () => {
    const pkg = data.packages.find((p) => p.id === selectedPackage);
    return pkg ? pkg.price : 5500;
  };

  const handleFinishBooking = () => {
    setIsSubmitted(true);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if unavailable
    }
  };

  const resetAndClose = () => {
    setIsSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">حجز جلسة عمل وتفاصيل المشروع</h3>
              <p className="text-xs text-slate-400">مع الموديل {data.nameEn}</p>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isSubmitted ? (
          <div className="p-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1b2538] text-xs">
              <div className={`flex items-center gap-2 font-bold ${step >= 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                <span>تفاصيل المشروع</span>
              </div>
              <div className="h-[1px] flex-1 bg-[#222d42] mx-3" />
              <div className={`flex items-center gap-2 font-bold ${step >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                <span>الباقة والموعد</span>
              </div>
              <div className="h-[1px] flex-1 bg-[#222d42] mx-3" />
              <div className={`flex items-center gap-2 font-bold ${step >= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                <span>الضمان والدفع</span>
              </div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    عنوان المشروع / الحملة
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      اسم الشركة أو البراند
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      نوع التصوير
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option>Fashion Campaign</option>
                      <option>TVC & Commercial</option>
                      <option>Beauty & Cosmetics</option>
                      <option>UGC & Social Content</option>
                      <option>Runway & Event</option>
                      <option>Editorial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ملاحظات الـ Moodboard والمتطلبات
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    اختر الباقة المطلوبة
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {data.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          selectedPackage === pkg.id
                            ? 'bg-[#182338] border-amber-400 shadow-md'
                            : 'bg-[#111724] border-[#222e44] hover:border-slate-500'
                        }`}
                      >
                        <span className="block text-xs font-bold text-white mb-1">{pkg.name}</span>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-base font-extrabold text-amber-400">
                            {pkg.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">EGP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      تاريخ التصوير المقترح
                    </label>
                    <input
                      type="date"
                      value={shootDate}
                      onChange={(e) => setShootDate(e.target.value)}
                      className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      موقع التصوير
                    </label>
                    <input
                      type="text"
                      value={locationType}
                      onChange={(e) => setLocationType(e.target.value)}
                      className="w-full bg-[#131b2c] border border-[#24324c] rounded-lg px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-[#131b2c] border border-[#222e44] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f2a3f]">
                    <span className="text-xs text-slate-300">الموديل المختارة:</span>
                    <span className="text-xs font-bold text-white">Maya Khaled (Gold Model)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f2a3f]">
                    <span className="text-xs text-slate-300">نوع المشروع:</span>
                    <span className="text-xs font-bold text-white">{projectTitle}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f2a3f]">
                    <span className="text-xs text-slate-300">التاريخ والموقع:</span>
                    <span className="text-xs font-bold text-white">{shootDate} • {locationType}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-200">إجمالي المبلغ المحمي (Escrow):</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-amber-400">
                        {getPackagePrice().toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-amber-400">EGP</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    لن يتم تحويل أي مبالغ للموديل إلا بعد انتهاء جلسة التصوير وتسليم جميع الصور وموافقتك التامة على المخرجات.
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e273a]">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-[#141c2c] border border-[#232f48]"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="gold-gradient-btn flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinishBooking}
                  className="gold-gradient-btn flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-lg shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الحجز وإرسال الـ Brief</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">تم إرسال طلب الحجز بنجاح!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              تم إرسال تفاصيل مشروع &quot;{projectTitle}&quot; إلى مايا خالد وفريق إدارة أعمالها. سيتم إشعارك خلال 1.8 ساعة فور تأكيد التوفر.
            </p>

            <div className="pt-4">
              <button
                onClick={resetAndClose}
                className="gold-gradient-btn px-6 py-2 rounded-lg text-xs font-bold"
              >
                العودة للملف التعريفي
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
