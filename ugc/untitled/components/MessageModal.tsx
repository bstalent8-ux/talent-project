'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Send, Sparkles, Check, Clock, Bot, User } from 'lucide-react';
import { CREATOR_PROFILE } from '../data/creatorData';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'creator';
  text: string;
  time: string;
}

function getNewMessageId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageModal({ isOpen, onClose, lang }: MessageModalProps) {
  const isAr = lang === 'ar';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'creator',
      text: isAr
        ? 'أهلاً بك! أنا نور. سعيدة بتواصلك، كيف يمكنني المساعدة في حملتك الإعلانية القادمة؟'
        : "Hi there! I'm Nour. Excited to connect—how can I help with your upcoming UGC campaign?",
      time: '10:02 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      en: 'What is your current filming availability this month?',
      ar: 'ما هو جدول تصويرك المتاح هذا الشهر؟'
    },
    {
      en: 'Can we ship a product to your address in Cairo?',
      ar: 'هل يمكننا شحن منتج لعنوانك في القاهرة؟'
    },
    {
      en: 'Do you deliver raw B-roll footage with the final cut?',
      ar: 'هل تشمل الباقة اللقطات الخام B-roll مع الفيديو النهائي؟'
    }
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: getNewMessageId('user'),
      sender: 'user',
      text: text,
      time: getFormattedTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulated creator response
    setTimeout(() => {
      const reply = isAr
        ? 'أكيد! أنا جاهزة لاستلام المنتج وتصوير ٣ زوايا مختلفة فور اعتماد السيناريو. هل تفضل باقة الـ Growth أم Campaign Bundle؟'
        : 'Absolutely! I am ready to test your product and shoot 3 viral hooks once the brief is confirmed. Are you looking for the Growth or Campaign package?';

      const creatorMsg: ChatMessage = {
        id: getNewMessageId('creator'),
        sender: 'creator',
        text: reply,
        time: getFormattedTime()
      };
      setMessages((prev) => [...prev, creatorMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[580px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-[#0B0F19] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src={CREATOR_PROFILE.avatar}
                  alt={CREATOR_PROFILE.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{isAr ? CREATOR_PROFILE.nameAr : CREATOR_PROFILE.name}</h3>
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isAr ? 'متصلة الآن • الرد المعتاد خلال دقائق' : 'Online now • Fast response'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200 w-fit text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(isAr ? qp.ar : qp.en)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-200/60 shrink-0"
            >
              {isAr ? qp.ar : qp.en}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isAr ? 'اكتب رسالتك لنور...' : 'Type your message to Nour...'}
            className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
