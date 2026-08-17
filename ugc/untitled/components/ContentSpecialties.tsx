'use client';

import React, { useState } from 'react';
import { 
  Package, 
  Sparkles, 
  Lightbulb, 
  Scale, 
  Camera, 
  Heart, 
  Utensils, 
  Laptop, 
  Film, 
  Video, 
  ShoppingBag, 
  TrendingUp,
  Tag
} from 'lucide-react';
import { CONTENT_SPECIALTIES } from '../data/creatorData';

interface ContentSpecialtiesProps {
  lang: 'en' | 'ar';
  selectedSpecialty: string | null;
  onSelectSpecialty: (id: string | null) => void;
}

export function ContentSpecialties({ lang, selectedSpecialty, onSelectSpecialty }: ContentSpecialtiesProps) {
  const isAr = lang === 'ar';
  const [showAll, setShowAll] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-3.5 h-3.5" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Lightbulb': return <Lightbulb className="w-3.5 h-3.5" />;
      case 'Scale': return <Scale className="w-3.5 h-3.5" />;
      case 'Camera': return <Camera className="w-3.5 h-3.5" />;
      case 'Heart': return <Heart className="w-3.5 h-3.5" />;
      case 'Utensils': return <Utensils className="w-3.5 h-3.5" />;
      case 'Laptop': return <Laptop className="w-3.5 h-3.5" />;
      case 'Film': return <Film className="w-3.5 h-3.5" />;
      case 'Video': return <Video className="w-3.5 h-3.5" />;
      case 'ShoppingBag': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'TrendingUp': return <TrendingUp className="w-3.5 h-3.5" />;
      default: return <Tag className="w-3.5 h-3.5" />;
    }
  };

  const visibleItems = showAll ? CONTENT_SPECIALTIES : CONTENT_SPECIALTIES.slice(0, 12);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-violet-600" />
          <span>{isAr ? 'مجالات وتخصصات المحتوى' : 'Content Specialties'}</span>
        </h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
        >
          {showAll ? (isAr ? 'إخفاء' : 'Show Less') : (isAr ? 'عرض الكل' : 'View All')}
        </button>
      </div>

      {/* Grid of Specialty Badges */}
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((spec) => {
          const isSelected = selectedSpecialty === spec.id;
          return (
            <button
              key={spec.id}
              onClick={() => onSelectSpecialty(isSelected ? null : spec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                  : `${spec.color} hover:shadow-sm hover:scale-[1.02]`
              }`}
            >
              {getIcon(spec.icon)}
              <span>{isAr ? spec.label.ar : spec.label.en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
