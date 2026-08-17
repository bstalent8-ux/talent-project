'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Info, Zap } from 'lucide-react';
import { PERFORMANCE_METRICS, MetricItem } from '../data/creatorData';

interface PerformanceMetricsProps {
  lang: 'en' | 'ar';
}

export function PerformanceMetrics({ lang }: PerformanceMetricsProps) {
  const isAr = lang === 'ar';
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // SVG Sparkline generator
  const renderSparkline = (points: number[], color: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const padding = 4;

    const coords = points.map((p, index) => {
      const x = (index / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((p - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const pathData = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div className="w-full h-9 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Subtle gradient fill area */}
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`}
            fill={`url(#grad-${color.replace('#', '')})`}
          />
          {/* Main stroke line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End point highlight dot */}
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="3.5"
            fill={color}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  };

  return (
    <section id="performance" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isAr ? 'مؤشرات الأداء الفعلية' : 'Performance Metrics'}</span>
              <span className="text-xs font-normal text-slate-400">
                ({isAr ? 'آخر ٩٠ يوماً' : 'Last 90 Days'})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'بيانات تتبع دقيقة مأخوذة من إعلانات TikTok وMeta وعقود المنصة'
                : 'Real tracked campaign metrics across TikTok Ads, Meta campaigns, and verified platform contracts'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5" />
          <span>{isAr ? 'أعلى ٥٪ من صناع الـ UGC' : 'Top 5% Creator Cohort'}</span>
        </div>
      </div>

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {PERFORMANCE_METRICS.map((metric) => (
          <div
            key={metric.id}
            onMouseEnter={() => setActiveTooltip(metric.id)}
            onMouseLeave={() => setActiveTooltip(null)}
            className="relative bg-slate-50/80 hover:bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Metric Label */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">
                  {isAr ? metric.label.ar : metric.label.en}
                </span>
                <Info className="w-3 h-3 text-slate-400 shrink-0 cursor-help" />
              </div>

              {/* Large Metric Number */}
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
                {metric.value}
              </div>

              {/* Status Badge */}
              <div className="mt-1 flex items-center gap-1">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: metric.color }}
                >
                  {isAr ? metric.status.ar : metric.status.en}
                </span>
              </div>
            </div>

            {/* Sparkline Graphic */}
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              {renderSparkline(metric.sparkline, metric.color)}
              <div className="text-[10px] text-slate-400 text-center font-medium mt-1">
                {metric.change}
              </div>
            </div>

            {/* Hover Tooltip Description */}
            {activeTooltip === metric.id && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95 leading-tight">
                {isAr ? metric.description.ar : metric.description.en}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
