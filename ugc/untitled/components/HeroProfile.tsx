'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  CheckCircle, 
  MapPin, 
  Globe, 
  Award, 
  Star, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  FolderPlus, 
  Zap, 
  Sparkles, 
  Play, 
  ExternalLink,
  ChevronDown,
  Instagram,
  Check,
  Heart,
  Share2
} from 'lucide-react';
import { CREATOR_PROFILE, VideoItem } from '../data/creatorData';

interface HeroProfileProps {
  lang: 'en' | 'ar';
  onHireNow: () => void;
  onAddToCampaign: () => void;
  onOpenMessage: () => void;
  onSelectVideo: (videoId: string) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function HeroProfile({
  lang,
  onHireNow,
  onAddToCampaign,
  onOpenMessage,
  onSelectVideo,
  isSaved,
  onToggleSave
}: HeroProfileProps) {
  const isAr = lang === 'ar';
  const [showWebsiteMenu, setShowWebsiteMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#0B0F19] text-white pt-8 pb-10 border-b border-slate-800 relative overflow-hidden">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Creator Main Details (Cols 1 to 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {/* Top row: Avatar + Name + Badges */}
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Creator Avatar with Online indicator */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-violet-500 via-indigo-500 to-emerald-400 shadow-xl shadow-violet-950/50">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-800">
                    <Image
                      src={CREATOR_PROFILE.avatar}
                      alt={CREATOR_PROFILE.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      priority
                    />
                  </div>
                </div>
                {/* Online Pill Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-emerald-500/60 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-300 tracking-wide">
                    {isAr ? 'متصلة' : 'Online'}
                  </span>
                </div>
              </div>

              {/* Name & Headline info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isAr ? CREATOR_PROFILE.nameAr : CREATOR_PROFILE.name}
                  </h1>
                  {/* Verified Badge */}
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm" title="Verified Talent">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </div>

                <p className="text-slate-300 text-sm font-medium mt-1">
                  {isAr ? CREATOR_PROFILE.headline.ar : CREATOR_PROFILE.headline.en}
                </p>

                {/* Location & Languages */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAr ? CREATOR_PROFILE.location.ar : CREATOR_PROFILE.location.en}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAr ? CREATOR_PROFILE.languages.ar : CREATOR_PROFILE.languages.en}</span>
                  </div>
                </div>

                {/* Creator Badges */}
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  {/* Gold Creator Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? CREATOR_PROFILE.tierAr : CREATOR_PROFILE.tier}</span>
                  </div>

                  {/* Rating Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{CREATOR_PROFILE.rating}</span>
                    <span className="text-slate-400 text-[11px]">({CREATOR_PROFILE.reviewsCount} {isAr ? 'تقييم' : 'reviews'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">2-3 Days</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{isAr ? 'وقت الرد' : 'Avg. Response Time'}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">98%</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{isAr ? 'نسبة الإنجاز' : 'Completion Rate'}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">100%</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{isAr ? 'في الموعد' : 'On-Time Delivery'}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400">{isAr ? 'متاحة' : 'Available'}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{isAr ? 'استقبال طلبات' : 'Accepting Projects'}</div>
                </div>
              </div>
            </div>

            {/* Social Profiles Row */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">
                {isAr ? 'الحسابات الاجتماعية:' : 'Social Profiles'}
              </span>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-pink-500/60 hover:bg-pink-950/20 text-xs text-slate-200 transition-all group"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                  ig
                </div>
                <span className="font-bold text-white">24.8K</span>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">Instagram</span>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 hover:bg-cyan-950/20 text-xs text-slate-200 transition-all group"
              >
                <div className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold border border-slate-600">
                  tt
                </div>
                <span className="font-bold text-white">8.2K</span>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">TikTok</span>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 hover:bg-blue-950/20 text-xs text-slate-200 transition-all group"
              >
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                  f
                </div>
                <span className="font-bold text-white">12K</span>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">Facebook</span>
              </a>

              {/* Portfolio Website Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowWebsiteMenu(!showWebsiteMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-violet-500/60 text-xs text-slate-200 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-medium">{isAr ? 'موقع البورتفوليو' : 'Portfolio Website'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showWebsiteMenu && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 text-xs">
                    <a
                      href="https://nour-ugc.studio"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <span>nour-ugc.studio</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: Video Reels Collage Preview (Cols 6 to 9) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
                  {isAr ? 'معاينة أعمال الفيديو السريعة' : 'Featured Video Snippets'}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">9:16 UGC Format</span>
              </div>

              {/* 5-item collage grid */}
              <div className="grid grid-cols-5 gap-2 h-32 sm:h-36">
                {CREATOR_PROFILE.reelThumbnails.map((thumb, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectVideo(`v${(idx % 5) + 1}`)}
                    className="relative h-full rounded-xl overflow-hidden border border-slate-800 hover:border-violet-500/80 cursor-pointer group transition-all transform hover:-translate-y-1 shadow-md bg-slate-900"
                  >
                    <Image
                      src={thumb}
                      alt={`Reel snippet ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-violet-600 transition-all shadow-lg">
                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Match Score Widget Card */}
            <div className="bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-800/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg shadow-violet-950/30">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-violet-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isAr ? 'نسبة التطابق الذكي' : 'AI Match Score'}</span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>{isAr ? 'تطابق ممتاز لمشاريع الـ UGC' : 'Excellent Match for UGC & Ads'}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-sans">
                  96%
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CTAs & Actions (Cols 10 to 12) */}
          <div className="lg:col-span-3 flex flex-col space-y-3 justify-center">
            {/* Primary CTA: Hire Now with Escrow */}
            <button
              onClick={onHireNow}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 group transition-all transform active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isAr ? 'وظف الآن (حماية الضمان)' : 'Hire Now'}</span>
            </button>
            <div className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'محمي بواسطة حساب الضمان البنكي Escrow' : 'Protected by Escrow Guarantee'}</span>
            </div>

            {/* Secondary CTA: Add to Campaign */}
            <button
              onClick={onAddToCampaign}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-violet-400" />
              <span>{isAr ? 'إضافة إلى حملة إعلانية' : 'Add to Campaign'}</span>
            </button>

            {/* Tertiary CTA: Message Creator */}
            <button
              onClick={onOpenMessage}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'إرسال رسالة مباشرة' : 'Message'}</span>
            </button>

            {/* Quick Share & Bookmark Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={onToggleSave}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isSaved
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{isSaved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة' : 'Share')}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
