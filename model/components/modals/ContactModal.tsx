'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2, ShieldCheck, Paperclip } from 'lucide-react';
import { ModelData } from '@/lib/model-data';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelData;
}

export default function ContactModal({ isOpen, onClose, data }: ContactModalProps) {
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState([
    {
      sender: 'maya',
      text: 'أهلاً بك! سعيدة بتواصلك معي. هل لديك مشروع أو جلسة تصوير تود مناقشتها؟',
      time: '11:30 ص',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = {
      sender: 'user',
      text: message,
      time: 'الآن',
    };

    setMessagesList((prev) => [...prev, userMsg]);
    setMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessagesList((prev) => [
        ...prev,
        {
          sender: 'maya',
          text: 'شكراً لرسالتك! اطلعت على التفاصيل وسأقوم بمراجعة التوفر في الجدول وإرسال العرض المناسب فوراً.',
          time: 'الآن',
        },
      ]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#232f48] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e273a] bg-[#121929]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.mainImage}
                alt={data.nameEn}
                className="w-9 h-9 rounded-full object-cover border border-amber-500/50"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">{data.nameEn}</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                  متصلة الآن
                </span>
              </div>
              <p className="text-[11px] text-slate-400">متوسط الرد: {data.responseTime}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a2337] hover:bg-[#25324d] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0e17]">
          {messagesList.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#d89b37] to-[#e8ab48] text-slate-950 font-medium rounded-br-none'
                    : 'bg-[#151d2d] text-slate-200 border border-[#222e44] rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 italic">
              <span>مايا تكتب الآن...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 bg-[#111726] border-t border-[#1e273a] flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك لمايا..."
            className="flex-1 bg-[#161f31] border border-[#243149] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="gold-gradient-btn p-2 rounded-lg text-slate-950 font-bold flex items-center justify-center shadow"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>

      </div>
    </div>
  );
}
