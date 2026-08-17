'use client';

import React from 'react';
import { Star, Maximize2 } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface PortfolioSectionProps {
  data: ModelData;
  onOpenGallery: (initialIndex?: number) => void;
}

export default function PortfolioSection({ data, onOpenGallery }: PortfolioSectionProps) {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b2436] rounded-xl p-4 md:p-5 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-white font-sans tracking-wide">Portfolio</h2>
          <span className="bg-[#1e283c] text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded-md">
            {data.portfolio.length * 6}
          </span>
        </div>

        <button
          onClick={() => onOpenGallery(0)}
          className="text-xs md:text-sm font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors"
        >
          عرض الكل
        </button>
      </div>

      {/* Custom Bento Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Main Tall Card: Editorial + */}
        <div
          onClick={() => onOpenGallery(0)}
          className="md:col-span-4 relative group rounded-xl overflow-hidden bg-[#141b29] border border-[#222d42] hover:border-amber-500/60 aspect-[3/4] md:aspect-auto cursor-pointer transition-all duration-300"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.portfolio[0].image}
            alt={data.portfolio[0].title}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          
          {/* Label Badge */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-[#0a0e17]/85 border border-[#2a374e] text-white text-xs font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
            <span>{data.portfolio[0].title}</span>
          </div>

          {/* Star Bookmark Icon */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="w-6 h-6 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <span className="p-2.5 rounded-full bg-amber-500 text-slate-950 font-bold shadow-lg">
              <Maximize2 className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Right Section: 2 Medium + 4 Small items */}
        <div className="md:col-span-8 flex flex-col gap-3">
          
          {/* Row of 2 Medium Cards */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Card 2: Beauty */}
            <div
              onClick={() => onOpenGallery(1)}
              className="relative group rounded-xl overflow-hidden bg-[#141b29] border border-[#222d42] hover:border-amber-500/60 aspect-[4/3] cursor-pointer transition-all duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.portfolio[1].image}
                alt={data.portfolio[1].title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-2.5 right-2.5 z-10 bg-[#0a0e17]/85 border border-[#2a374e] text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                <span>{data.portfolio[1].title}</span>
              </div>

              <div className="absolute bottom-2.5 left-2.5 z-10">
                <span className="w-5 h-5 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                </span>
              </div>
            </div>

            {/* Card 3: Commercial */}
            <div
              onClick={() => onOpenGallery(2)}
              className="relative group rounded-xl overflow-hidden bg-[#141b29] border border-[#222d42] hover:border-amber-500/60 aspect-[4/3] cursor-pointer transition-all duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.portfolio[2].image}
                alt={data.portfolio[2].title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-2.5 right-2.5 z-10 bg-[#0a0e17]/85 border border-[#2a374e] text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                <span>{data.portfolio[2].title}</span>
              </div>

              <div className="absolute bottom-2.5 left-2.5 z-10">
                <span className="w-5 h-5 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                </span>
              </div>
            </div>
          </div>

          {/* Row of 4 Small Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.portfolio.slice(3, 7).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onOpenGallery(idx + 3)}
                className="relative group rounded-xl overflow-hidden bg-[#141b29] border border-[#222d42] hover:border-amber-500/60 aspect-square cursor-pointer transition-all duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-2 right-2 z-10 bg-[#0a0e17]/85 border border-[#2a374e] text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md truncate max-w-[80%]">
                  <span>{item.title}</span>
                </div>

                <div className="absolute bottom-2 left-2 z-10">
                  <span className="w-4 h-4 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
