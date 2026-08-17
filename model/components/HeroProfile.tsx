'use client';

import React from 'react';
import { CheckCircle2, Award, MapPin, ExternalLink, Maximize2, Instagram, Globe, Sparkles } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface HeroProfileProps {
  data: ModelData;
  onOpenGallery: () => void;
  onOpenSocial?: (platform: string) => void;
}

export default function HeroProfile({ data, onOpenGallery, onOpenSocial }: HeroProfileProps) {
  return (
    <div className="w-full bg-[#0e131e] border border-[#1d273a] rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Main Model Photo Card */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
          <div className="relative group rounded-xl overflow-hidden border border-[#25324c] bg-[#141a27] aspect-[4/5] shadow-2xl">
            {/* Top Badge */}
            <div className="absolute top-3 left-3 z-20">
              <span className="inline-flex items-center gap-1 bg-[#d89b37] text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-md tracking-wider uppercase shadow-lg">
                TOP RATED
              </span>
            </div>

            {/* Model Main Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.mainImage}
              alt={data.nameEn}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            {/* View All Photos Button */}
            <button
              onClick={onOpenGallery}
              className="absolute bottom-3 right-3 left-3 z-20 flex items-center justify-center gap-2 bg-[#0c1018]/85 hover:bg-[#151c2a] text-slate-200 hover:text-white border border-[#29354d] hover:border-amber-500/50 py-2 px-3 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-lg active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>عرض جميع الصور</span>
            </button>
          </div>
        </div>

        {/* Model Information Area */}
        <div className="flex-1 flex flex-col justify-between">
          
          <div>
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                VERIFIED
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-md">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                GOLD MODEL
              </span>
            </div>

            {/* Name */}
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans">
                {data.nameEn}
              </h1>
            </div>

            {/* Subtitle: Role & Location */}
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-4 font-medium">
              <span className="text-slate-200">{data.titleEn}</span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-1 text-amber-400/90">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {data.locationEn}
              </span>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#151c2b] text-slate-300 hover:text-white border border-[#232f46] hover:border-slate-500 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Arabic Bio */}
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mb-6 font-normal">
              {data.bio}
            </p>
          </div>

          {/* Social Profiles Container */}
          <div className="bg-[#121826] border border-[#1e283d] rounded-xl p-3 md:p-4">
            <span className="block text-[11px] font-bold text-slate-400 mb-2.5 tracking-wider uppercase">
              Social Profiles
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#172032] hover:bg-[#1e2a42] border border-[#23304a] hover:border-pink-500/40 p-2 rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {data.social.instagram}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Instagram</div>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#172032] hover:bg-[#1e2a42] border border-[#23304a] hover:border-cyan-500/40 p-2 rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded-md bg-black border border-slate-700 flex items-center justify-center text-cyan-400 font-black text-xs flex-shrink-0">
                  ♪
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {data.social.tiktok}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">TikTok</div>
                </div>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#172032] hover:bg-[#1e2a42] border border-[#23304a] hover:border-blue-500/40 p-2 rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  f
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {data.social.facebook}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Facebook</div>
                </div>
              </a>

              {/* Website / Portfolio Link */}
              <button
                onClick={onOpenGallery}
                className="flex items-center gap-2 bg-[#172032] hover:bg-[#1e2a42] border border-[#23304a] hover:border-amber-500/40 p-2 rounded-lg transition-all group text-right"
              >
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    Portfolio /
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Website</div>
                </div>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
