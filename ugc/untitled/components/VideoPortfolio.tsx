'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Eye, MoreVertical, Sparkles, Filter, Check } from 'lucide-react';
import { VIDEO_PORTFOLIO, VideoItem } from '../data/creatorData';

interface VideoPortfolioProps {
  lang: 'en' | 'ar';
  onSelectVideo: (videoId: string) => void;
}

export function VideoPortfolio({ lang, onSelectVideo }: VideoPortfolioProps) {
  const isAr = lang === 'ar';
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: { en: 'All Videos (5)', ar: 'الكل (٥)' } },
    { id: 'skincare', label: { en: 'Skincare & Beauty', ar: 'العناية والتجميل' } },
    { id: 'unboxing', label: { en: 'Unboxing', ar: 'فتح الصندوق' } },
    { id: 'tech', label: { en: 'Tech', ar: 'التقنية' } },
    { id: 'food', label: { en: 'Food', ar: 'الأطعمة' } }
  ];

  const filteredVideos = VIDEO_PORTFOLIO.filter((vid) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'skincare') return vid.id === 'v1' || vid.id === 'v3';
    if (selectedFilter === 'unboxing') return vid.id === 'v2';
    if (selectedFilter === 'tech') return vid.id === 'v4';
    if (selectedFilter === 'food') return vid.id === 'v5';
    return true;
  });

  return (
    <section id="portfolio" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Play className="w-4 h-4 fill-violet-700 ml-0.5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isAr ? 'معرض نماذج الفيديوهات' : 'Video Portfolio'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                9:16 Vertical UGC
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'فيديوهات إعلانية حقيقية ومصورة بجودة 4K مع خطافات جذابة'
                : 'High-converting UGC videos filmed in 4K with proven hooks & angles'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            {isAr ? 'عرض الكل' : 'View All (5)'}
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === f.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? f.label.ar : f.label.en}
          </button>
        ))}
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="group relative flex flex-col bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-violet-300 transition-all cursor-pointer"
            onClick={() => onSelectVideo(video.id)}
          >
            {/* 9:16 Video Thumbnail Container */}
            <div className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden">
              <Image
                src={video.thumbnail}
                alt={isAr ? video.title.ar : video.title.en}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40 group-hover:via-slate-950/10 transition-colors" />

              {/* Duration Badge (Top Right or Bottom Right) */}
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold font-mono tracking-wider">
                {video.duration}
              </div>

              {/* Hook Rate Tag (Top Left) */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-violet-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>{video.hookRate} Hook</span>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-violet-600 group-hover:scale-110 transition-all shadow-lg">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Info Footer */}
            <div className="p-3 bg-white flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1">
                  {isAr ? video.title.ar : video.title.en}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {isAr ? video.category.ar : video.category.en}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-700">{video.views}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === video.id ? null : video.id);
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
