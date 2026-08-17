'use client';

import React, { useState } from 'react';
import { PieChart } from 'lucide-react';
import { TOP_CONTENT_TYPES } from '../data/creatorData';

interface TopContentTypesChartProps {
  lang: 'en' | 'ar';
}

export function TopContentTypesChart({ lang }: TopContentTypesChartProps) {
  const isAr = lang === 'ar';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Donut Chart calculation
  const size = 160;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute strokeDasharray and strokeDashoffset for each slice
  let currentOffset = 0;
  const slices = TOP_CONTENT_TYPES.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((currentOffset / 100) * circumference);
    currentOffset += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'أنواع المحتوى الأكثر إنتاجاً' : 'Top Content Types'}</span>
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {slices.map((item, index) => {
              const isHovered = hoveredIdx === index;

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={item.strokeDasharray}
                  strokeDashoffset={item.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {hoveredIdx !== null ? (isAr ? TOP_CONTENT_TYPES[hoveredIdx].name.ar : TOP_CONTENT_TYPES[hoveredIdx].name.en) : (isAr ? 'الإجمالي' : 'Total')}
            </span>
            <span className="text-xl font-black text-slate-900 font-sans">
              {hoveredIdx !== null ? `${TOP_CONTENT_TYPES[hoveredIdx].percentage}%` : '100%'}
            </span>
          </div>
        </div>

        {/* Legend & Breakdown List */}
        <div className="flex-1 w-full space-y-2">
          {TOP_CONTENT_TYPES.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-50 font-bold' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{isAr ? item.name.ar : item.name.en}</span>
                </div>
                <span className="font-bold text-slate-900 font-sans">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
