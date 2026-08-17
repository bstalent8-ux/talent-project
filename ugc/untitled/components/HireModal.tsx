'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Lock, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft,
  Package,
  FileText,
  Truck
} from 'lucide-react';
import { PACKAGES, PackageItem } from '../data/creatorData';

interface HireModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
  currency: 'EGP' | 'USD' | 'SAR' | 'AED';
  initialPackage?: PackageItem | null;
}

export function HireModal({ isOpen, onClose, lang, currency, initialPackage }: HireModalProps) {
  const isAr = lang === 'ar';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPkg, setSelectedPkg] = useState<PackageItem>(initialPackage || PACKAGES[1]);
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('TikTok Ads');
  const [briefNotes, setBriefNotes] = useState('');
  const [shippingRequired, setShippingRequired] = useState(true);
  const [extraHookAddon, setExtraHookAddon] = useState(false);
  const [expressDeliveryAddon, setExpressDeliveryAddon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [contractRef, setContractRef] = useState('TAL-UGC-842915');

  if (!isOpen) return null;

  const getBasePrice = () => {
    if (currency === 'USD') return selectedPkg.priceUSD;
    if (currency === 'SAR') return Math.round(selectedPkg.priceUSD * 3.75);
    if (currency === 'AED') return Math.round(selectedPkg.priceUSD * 3.67);
    return selectedPkg.priceEGP;
  };

  const getAddonPrice = (addon: 'hook' | 'express') => {
    let base = addon === 'hook' ? 500 : 1000;
    if (currency === 'USD') return addon === 'hook' ? 10 : 20;
    if (currency === 'SAR') return addon === 'hook' ? 40 : 80;
    if (currency === 'AED') return addon === 'hook' ? 38 : 75;
    return base;
  };

  const calculateTotal = () => {
    let total = getBasePrice();
    if (extraHookAddon) total += getAddonPrice('hook');
    if (expressDeliveryAddon) total += getAddonPrice('express');
    return total;
  };

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setContractRef(`TAL-UGC-${Math.floor(100000 + Math.random() * 900000)}`);
      setOrderConfirmed(true);
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        {!orderConfirmed ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'حساب الضمان البنكي Escrow' : '100% Escrow Protection'}
              </span>
              <span className="text-xs text-slate-400">
                {isAr ? `خطوة ${step} من ٣` : `Step ${step} of 3`}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isAr ? 'حجز مشروع مع نور محمد' : 'Book Nour Mohamed for UGC Campaign'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'أموالك محفوظة في حساب الضمان ولن يتم تحريرها للمنشئة إلا بعد تسليم الفيديوهات واعتمادك النهائي.'
                : 'Funds remain held securely in escrow until deliverables are submitted and approved.'}
            </p>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2 my-5">
              {[
                { s: 1, label: { en: '1. Package', ar: '١. الباقة' } },
                { s: 2, label: { en: '2. Brief Details', ar: '٢. السيناريو والمنتج' } },
                { s: 3, label: { en: '3. Escrow Deposit', ar: '٣. الدفع بالضمان' } }
              ].map((st) => (
                <div
                  key={st.s}
                  className={`h-1.5 rounded-full transition-all ${
                    step >= st.s ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* STEP 1: Choose Package & Add-ons */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">
                          {isAr ? pkg.name.ar : pkg.name.en}
                        </div>
                        <div className="text-base font-black text-violet-700 mt-1">
                          {pkg.priceEGP.toLocaleString()} {currency}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{pkg.deliveryDays} {isAr ? 'أيام' : 'days'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Add-ons */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {isAr ? 'إضافات مقترحة (اختياري):' : 'Optional Add-ons:'}
                  </h4>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer text-xs transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={extraHookAddon}
                        onChange={(e) => setExtraHookAddon(e.target.checked)}
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-800">
                          {isAr ? 'خطافين إعلانيين إضافيين لاختبار A/B' : '2 Additional Viral Hooks for A/B Testing'}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {isAr ? 'اختبر زوايا مختلفة لزيادة التحويل' : 'Test different intro hooks on TikTok'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">+{getAddonPrice('hook')} {currency}</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 cursor-pointer text-xs transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={expressDeliveryAddon}
                        onChange={(e) => setExpressDeliveryAddon(e.target.checked)}
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-800">
                          {isAr ? 'تسليم فائق السرعة خلال ٢٤ ساعة' : '24-Hour Rush Turnaround'}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {isAr ? 'أولوية قصوى للتصوير والمونتاج' : 'Top priority filming queue'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">+{getAddonPrice('express')} {currency}</span>
                  </label>
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500">{isAr ? 'الإجمالي المؤقت:' : 'Estimated Subtotal:'} </span>
                    <strong className="text-base text-slate-900">{calculateTotal().toLocaleString()} {currency}</strong>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>{isAr ? 'متابعة تفاصيل الحملة' : 'Continue to Brief'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Campaign Brief Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isAr ? 'اسم العلامة التجارية / المتجر *' : 'Brand or Store Name *'}
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Velvet Skin Studio"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isAr ? 'اسم المنتج أو الخدمة *' : 'Product / Service Name *'}
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Vitamin C Radiance Serum"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isAr ? 'منصة الحملة الأساسية' : 'Target Ad Platform'}
                    </label>
                    <select
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
                    >
                      <option value="TikTok Ads">TikTok Spark Ads (9:16)</option>
                      <option value="Instagram Reels">Instagram Reels & Stories</option>
                      <option value="Snapchat Ads">Snapchat Commercials</option>
                      <option value="Meta Ads">Meta Feed & Story Ads</option>
                      <option value="Organic UGC">Organic Creator Posting</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shippingRequired}
                        onChange={(e) => setShippingRequired(e.target.checked)}
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      <Truck className="w-4 h-4 text-slate-500" />
                      <span>{isAr ? 'يتطلب شحن منتج فيزيائي لنور في القاهرة' : 'Physical product will be shipped to Cairo'}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {isAr ? 'النقاط التسويقية والخطاف المطلوب (Brief & Hook Notes)' : 'Creative Brief & Key Angles (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={briefNotes}
                    onChange={(e) => setBriefNotes(e.target.value)}
                    placeholder={isAr ? 'اذكر المزايا التنافسية أو كود الخصم المراد التركيز عليه...' : 'Mention key selling points, problem-solving angle, or call to action...'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رجوع' : 'Back'}</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>{isAr ? 'متابعة لضمان الدفع' : 'Review & Secure Deposit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Escrow Review & Deposit */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'ملخص اتفاقية الضمان المالي' : 'Escrow Deposit Agreement'}</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    {isAr
                      ? `سيتم حجز مبلغ ${calculateTotal().toLocaleString()} ${currency} في حساب الضمان. يبدأ احتساب فترة التسليم (${selectedPkg.deliveryDays} أيام) فور استلام نور للمنتج وتأكيد السيناريو.`
                      : `A secure deposit of ${calculateTotal().toLocaleString()} ${currency} will be held. Delivery countdown (${selectedPkg.deliveryDays} days) activates once product receipt and brief are confirmed.`}
                  </p>
                </div>

                {/* Summary Table */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? selectedPkg.name.ar : selectedPkg.name.en} ({selectedPkg.deliveryDays} {isAr ? 'أيام' : 'days'})</span>
                    <span className="font-semibold text-slate-900">{getBasePrice().toLocaleString()} {currency}</span>
                  </div>
                  {extraHookAddon && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isAr ? 'خطافين إعلانيين إضافيين' : '2 Additional Viral Hooks'}</span>
                      <span className="font-semibold text-slate-900">+{getAddonPrice('hook')} {currency}</span>
                    </div>
                  )}
                  {expressDeliveryAddon && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isAr ? 'تسليم سريع ٢٤ ساعة' : '24h Express Delivery'}</span>
                      <span className="font-semibold text-slate-900">+{getAddonPrice('express')} {currency}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>{isAr ? 'المجموع المحتجز في الضمان:' : 'Total Held in Escrow:'}</span>
                    <span className="text-violet-700">{calculateTotal().toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* Final Action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رجوع' : 'Back'}</span>
                  </button>

                  <button
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>{isAr ? 'جاري تفعيل الضمان...' : 'Securing Escrow...'}</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{isAr ? 'تأكيد الحجز والإيداع بالضمان' : 'Deposit & Initiate Project'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              {isAr ? 'تم تأكيد حجز المشروع بنجاح!' : 'Escrow Deposit Confirmed!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {isAr
                ? `تم إشعار نور محمد بتفاصيل حملتك (${selectedPkg.name.ar}). تم فتح غرفة دردشة مخصصة لتبادل تفاصيل الشحن والسيناريو.`
                : `Nour Mohamed has been notified of your project (${selectedPkg.name.en}). A dedicated workspace & chat room has been opened for production tracking.`}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-xs text-slate-700">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">{isAr ? 'رقم العقد:' : 'Contract Ref:'}</span>
                <span className="font-mono font-bold">#{contractRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'حالة الضمان:' : 'Escrow Status:'}</span>
                <span className="font-bold text-emerald-600">{isAr ? 'مؤمن وجاري العمل' : 'Funded & Active'}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'تم، العودة للملف الشخصي' : 'Back to Profile'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
