'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://talents.app/maya-khaled';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">مشاركة الملف التعريفي لمايا خالد</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300">
            شارك هذا الملف مع فريق عملك أو مخرج الحملة للاطلاع على البورتفوليو والتقييمات:
          </p>

          <div className="flex items-center gap-2 bg-[#131b2c] border border-[#222f46] p-2 rounded-lg">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-slate-300 text-xs w-full focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="gold-gradient-btn px-3 py-1.5 rounded-md font-bold flex items-center gap-1 flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('الملف التعريفي للموديل مايا خالد على TALENTS: ' + shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-semibold"
            >
              <span>واتساب (WhatsApp)</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Maya Khaled - Professional Model on TALENTS')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/30 font-semibold"
            >
              <span>تويتر (X)</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
