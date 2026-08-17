'use client';

import React from 'react';
import { CheckCircle2, Heart } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  type?: 'success' | 'save';
}

export default function Toast({ message, isVisible, type = 'success' }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#121826]/95 border border-amber-500/40 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
      {type === 'save' ? (
        <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      )}
      <span>{message}</span>
    </div>
  );
}
