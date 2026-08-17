'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, ZoomIn, ZoomOut, Star } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
  initialIndex?: number;
}

export default function GalleryModal({
  isOpen,
  onClose,
  data,
  initialIndex = 0,
}: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen) return null;

  // Extended photo collection
  const allPhotos = [
    {
      id: '1',
      title: 'Editorial Vogue Cover Shoot',
      category: 'Editorial',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=90',
      client: 'Vogue Arabia',
      date: '2026',
    },
    {
      id: '2',
      title: 'Glow Beauty Glamour',
      category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=90',
      client: 'Glow Cosmetics',
      date: '2026',
    },
    {
      id: '3',
      title: 'Commercial Portrait Studio',
      category: 'Commercial',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=90',
      client: 'TechStore Egypt',
      date: '2026',
    },
    {
      id: '4',
      title: 'Haute Couture Runway Walk',
      category: 'Runway',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=90',
      client: 'Cairo Fashion Week',
      date: '2026',
    },
    {
      id: '5',
      title: 'ZARA Summer Campaign',
      category: 'Campaign',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=90',
      client: 'ZARA',
      date: '2026',
    },
    {
      id: '6',
      title: 'L’AZUR Beachwear Lifestyle',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1400&q=90',
      client: "L'AZUR",
      date: '2026',
    },
    {
      id: '7',
      title: 'Urban Chic Street Style',
      category: 'Street Style',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=90',
      client: 'StreetWear Egypt',
      date: '2026',
    },
    {
      id: '8',
      title: 'L’Oréal Hair & Face Beauty',
      category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=90',
      client: "L'Oréal Paris",
      date: '2026',
    },
  ];

  const categories = ['All', 'Editorial', 'Beauty', 'Commercial', 'Runway', 'Campaign', 'Lifestyle', 'Street Style'];

  const filteredPhotos = activeCategory === 'All'
    ? allPhotos
    : allPhotos.filter((p) => p.category === activeCategory);

  const currentPhoto = filteredPhotos[currentIndex] || filteredPhotos[0] || allPhotos[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
    setZoomLevel(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
    setZoomLevel(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#20293d] bg-[#0c1018]/90">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-amber-400 text-lg tracking-wider">
            Maya Khaled
          </span>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} من {filteredPhotos.length}
          </span>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#141c2c] p-1 rounded-lg border border-[#232f48]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentIndex(0);
                setZoomLevel(1);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-[#1e2a42]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => (z > 1 ? z - 0.25 : 1))}
            className="p-2 rounded-lg bg-[#141c2c] hover:bg-[#1e2a42] text-slate-300 hover:text-white border border-[#232f48]"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => (z < 2 ? z + 0.25 : 2))}
            className="p-2 rounded-lg bg-[#141c2c] hover:bg-[#1e2a42] text-slate-300 hover:text-white border border-[#232f48]"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-600/40 transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 transition-all backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Photo Container */}
        <div className="max-w-4xl max-h-[75vh] relative flex items-center justify-center transition-transform duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.image}
            alt={currentPhoto.title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl border border-[#26334a] transition-all"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 transition-all backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Photo Details & Thumbnails */}
      <div className="px-6 py-4 bg-[#0a0d14] border-t border-[#1e273a] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{currentPhoto.title}</span>
            <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
              {currentPhoto.category}
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            العميل: {currentPhoto.client} • تم التصوير في {currentPhoto.date}
          </p>
        </div>

        {/* Thumbnails Row */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1">
          {filteredPhotos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
              }}
              className={`relative rounded-lg overflow-hidden flex-shrink-0 w-12 h-12 border-2 transition-all ${
                currentIndex === idx
                  ? 'border-amber-400 scale-105 shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.image} alt={photo.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
