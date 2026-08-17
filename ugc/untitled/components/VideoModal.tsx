'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  TrendingUp, 
  Eye, 
  Share2, 
  CheckCircle2, 
  Maximize2,
  FileText,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { VIDEO_PORTFOLIO, VideoItem } from '../data/creatorData';

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
  lang: 'en' | 'ar';
  onOrderThisStyle: () => void;
}

export function VideoModal({ videoId, onClose, lang, onOrderThisStyle }: VideoModalProps) {
  const isAr = lang === 'ar';
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(25);
  const [copied, setCopied] = useState(false);

  const video = VIDEO_PORTFOLIO.find((v) => v.id === videoId) || VIDEO_PORTFOLIO[0];

  useEffect(() => {
    if (!videoId || !isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 150);
    return () => clearInterval(interval);
  }, [videoId, isPlaying]);

  if (!videoId) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-800/20 relative my-auto animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: 9:16 Video Player Simulation (Cols 1 to 6) */}
          <div className="md:col-span-6 flex justify-center">
            <div className="relative aspect-[9/16] w-full max-w-[290px] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-900">
              <Image
                src={video.thumbnail}
                alt={isAr ? video.title.ar : video.title.en}
                fill
                className={`object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                referrerPolicy="no-referrer"
              />

              {/* Gradient lighting */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40" />

              {/* Top Creator Watermark */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">@nour.ugc</span>
                </div>

                <div className="px-2 py-0.5 rounded-md bg-violet-600/90 text-[10px] font-bold">
                  {video.brand}
                </div>
              </div>

              {/* Center Play/Pause Trigger */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center group"
              >
                {!isPlaying && (
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-violet-600 transition-all shadow-xl">
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </div>
                )}
              </button>

              {/* Bottom Video Controls & Scrubber */}
              <div className="absolute bottom-3 left-3 right-3 space-y-2 z-10">
                {/* On-screen Hook Headline */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold leading-snug">
                  &ldquo;{video.hook}&rdquo;
                </div>

                {/* Progress bar scrubber */}
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Control Actions Row */}
                <div className="flex items-center justify-between text-white text-xs pt-1">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-violet-300">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-violet-300">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-[10px] text-slate-300 font-mono">{video.duration}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setProgress(0)} className="text-[10px] hover:text-white text-slate-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleShare} className="text-[10px] hover:text-white text-slate-400">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Video Details, Hook Analysis & Order CTA (Cols 7 to 12) */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-violet-600 font-bold mb-1">
                <span>{isAr ? video.category.ar : video.category.en}</span>
                <span>•</span>
                <span>{video.brand}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? video.title.ar : video.title.en}
              </h3>
            </div>

            {/* Performance Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                <span className="text-[10px] text-violet-700 font-bold block">{isAr ? 'قوة الخطاف' : 'Hook Rate'}</span>
                <span className="text-lg font-black text-violet-950 font-sans">{video.hookRate}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block">{isAr ? 'المشاهدات' : 'Views'}</span>
                <span className="text-lg font-black text-emerald-950 font-sans">{video.views}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-600 font-bold block">{isAr ? 'المدة' : 'Duration'}</span>
                <span className="text-lg font-black text-slate-900 font-mono">{video.duration}</span>
              </div>
            </div>

            {/* Script Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <FileText className="w-4 h-4 text-violet-600" />
                <span>{isAr ? 'هيكل السيناريو وزاوية البيع (Script Anatomy):' : 'Script Angle & Formula:'}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {video.scriptSnippet}
              </p>
            </div>

            {/* Guarantee Tag */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'تسليم بصيغة 4K 9:16 جاهزة لحملات TikTok و Meta' : 'Delivered in 4K 9:16 format with full commercial rights'}</span>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onOrderThisStyle();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isAr ? 'طلب فيديو بنفس الستايل والخطاف' : 'Order This Video Style'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
