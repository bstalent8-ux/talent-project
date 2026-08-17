'use client';

import React, { useState } from 'react';
import { Search, Bell, MessageSquare, ChevronDown, Check, Sparkles, ExternalLink, X } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications?: () => void;
  onOpenMessages?: () => void;
}

export default function Navbar({ onOpenNotifications, onOpenMessages }: NavbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'talents' | 'messages' | 'explore'>('talents');

  const notifications = [
    {
      id: 1,
      title: 'تم قبول طلب الحجز الخاص بك',
      desc: 'وافقت مايا خالد على جلسة تصوير ZARA الصيفية.',
      time: 'منذ 15 دقيقة',
      unread: true,
    },
    {
      id: 2,
      title: 'رسالة جديدة من GLOW Beauty',
      desc: 'تم إرسال العقد النهائي عبر Escrow.',
      time: 'منذ ساعتين',
      unread: false,
    },
  ];

  const messages = [
    {
      id: 1,
      name: 'Maya Khaled',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      message: 'أهلاً بك! جاهزة لمناقشة تفاصيل الـ Moodboard لجلسة التصوير.',
      time: '11:42 ص',
      unread: 2,
    },
    {
      id: 2,
      name: 'L’Oréal Agency Egypt',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
      message: 'تم تأكيد الموقع في المعادي، نلقاكم غداً الساعة 9 صباحاً.',
      time: 'أمس',
      unread: 2,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d111a]/95 backdrop-blur-md border-b border-[#1c2436] px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left Side: Brand Logo + Search Input (In RTL: Start is Right, but following layout) */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-xl lg:text-2xl font-serif font-extrabold tracking-wider bg-gradient-to-r from-[#f5c768] via-[#e5a93c] to-[#c58a28] bg-clip-text text-transparent uppercase">
              TALENTS
            </span>
          </div>

          {/* Search Bar with Icon */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="إبحث عن مواهب، وظائف، أو شركات"
              className="w-full bg-[#131926] text-slate-200 placeholder-slate-400 text-xs md:text-sm rounded-lg pl-9 pr-9 py-2 border border-[#232c3f] focus:outline-none focus:border-[#d89b37] focus:ring-1 focus:ring-[#d89b37] transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('explore')}
            className={`transition-colors hover:text-white ${
              activeTab === 'explore' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            اكتشف
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`transition-colors hover:text-white ${
              activeTab === 'messages' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            رسائلي
          </button>
          <button
            onClick={() => setActiveTab('talents')}
            className="relative text-[#f0b74e] font-bold pb-1 after:absolute after:bottom-0 after:right-0 after:w-full after:h-[2px] after:bg-[#e5a93c] after:rounded-full"
          >
            مواهب
          </button>
        </nav>

        {/* Right Side Icons & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMessages(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#182030] border border-[#20293d] transition-all"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                1
              </span>
            </button>

            {showNotifications && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 bg-[#121826] border border-[#26324a] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#202b40] mb-2">
                  <span className="text-sm font-bold text-white">الإشعارات</span>
                  <span className="text-xs text-amber-400 cursor-pointer hover:underline">تعيين الكل كمقروء</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        n.unread
                          ? 'bg-[#182236] border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-[#101522] border-[#1c2436] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages Chat Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMessages(!showMessages);
                setShowNotifications(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#182030] border border-[#20293d] transition-all"
              title="المحادثات"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                4
              </span>
            </button>

            {showMessages && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 bg-[#121826] border border-[#26324a] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#202b40] mb-2">
                  <span className="text-sm font-bold text-white">الرسائل المباشرة</span>
                  <span className="text-xs text-amber-400 cursor-pointer hover:underline">فتح المحادثات</span>
                </div>
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[#141b2b] hover:bg-[#192338] border border-[#1f2a3f] transition-all cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-amber-500/40" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400">{m.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">{m.message}</p>
                      </div>
                      {m.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                          {m.unread}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setShowMessages(false);
              }}
              className="flex items-center gap-2 bg-[#141b29] hover:bg-[#192338] border border-[#243048] rounded-lg px-2.5 py-1.5 transition-all text-xs font-medium text-slate-200"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                B
              </div>
              <span className="hidden sm:inline-block font-semibold">Best Production</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-[#121826] border border-[#26324a] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="px-3 py-2 border-b border-[#202b40] mb-1">
                  <p className="text-xs font-bold text-white">Best Production</p>
                  <p className="text-[10px] text-slate-400">agency@bestproduction.eg</p>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <button className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-[#1c263c] hover:text-white">
                    لوحة تحكم الشركة
                  </button>
                  <button className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-[#1c263c] hover:text-white">
                    العقود والمشاريع
                  </button>
                  <button className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-[#1c263c] hover:text-white">
                    حساب الـ Escrow
                  </button>
                  <div className="border-t border-[#202b40] my-1"></div>
                  <button className="w-full text-right px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
