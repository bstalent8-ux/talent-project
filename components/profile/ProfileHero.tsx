"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import {
  Heart,
  Share2,
  MessageCircle,
  Star,
  ShieldCheck,
  Clock,
  BadgeCheck,
  Crown,
  Eye,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileHeroProps {
  name: string
  handle: string
  avatarUrl: string | null
  coverUrl?: string | null
  profession: string
  location: string
  memberSince: string
  rating: number
  reviewsCount: number
  viewsCount: number
  isVerified?: boolean
  isPremium?: boolean
  responseTime?: string
  className?: string
}

const images = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400&h=500&fit=crop",
]

export default function ProfileHero({
  name,
  handle,
  avatarUrl,
  profession,
  location,
  memberSince,
  rating,
  reviewsCount,
  viewsCount,
  isVerified = false,
  isPremium = false,
  responseTime,
  className,
}: ProfileHeroProps) {
  return (
    <section
      dir="rtl"
      className={cn(
        "relative w-full rounded-2xl border border-[rgba(0,255,163,.15)] bg-[#0D1623] p-6",
        className
      )}
    >
      <div className="grid grid-cols-[220px_1fr_360px] gap-6 h-260px">
        {/* ── Column 1: Profile Image ── */}
        <div className="relative h-260px w-220px rounded-[14px] overflow-hidden group">
          <Image
            src={avatarUrl || images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <span className="text-white text-xs font-medium">1/{images.length}</span>
          </div>
          <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/70 transition-colors">
              <ChevronRight size={16} />
            </button>
            <button className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/70 transition-colors">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* ── Column 2: Profile Info ── */}
        <div className="flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{name}</h1>
              {isPremium && (
                <span className="flex items-center gap-1 bg-[#F4B740]/15 text-[#F4B740] border border-[#F4B740]/30 rounded-lg px-2.5 py-0.5 text-xs font-bold">
                  <Crown size={14} />
                  Gold Model
                </span>
              )}
            </div>

            <p className="text-[#A8B3C2] text-sm mb-3">{profession}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#A8B3C2] mb-3">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                عضو منذ {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={13} />
                {viewsCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="fill-[#F4B740] text-[#F4B740]" />
                <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
                <span className="text-[#A8B3C2] text-xs">({reviewsCount} تقييم)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isVerified && (
                <span className="flex items-center gap-1 text-[#00D26A] text-xs font-medium bg-[#00D26A]/10 border border-[#00D26A]/20 rounded-lg px-2.5 py-1">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              )}
              {responseTime && (
                <span className="flex items-center gap-1 text-[#A8B3C2] text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                  <Clock size={14} />
                  الرد خلال {responseTime}
                </span>
              )}
              <span className="flex items-center gap-1 text-[#00D26A] text-xs font-medium bg-[#00D26A]/10 border border-[#00D26A]/20 rounded-lg px-2.5 py-1">
                <BadgeCheck size={14} />
                سريع الرد
              </span>
            </div>
          </div>
        </div>

        {/* ── Column 3: Actions + Escrow ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-[#00D26A] hover:bg-[#00E676] text-black font-bold text-sm rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Message
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              احجز الآن
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 text-[#A8B3C2] border border-white/10 rounded-xl p-2.5 transition-colors"
            >
              <Heart size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 text-[#A8B3C2] border border-white/10 rounded-xl p-2.5 transition-colors"
            >
              <Share2 size={18} />
            </motion.button>
          </div>

          {/* Escrow Card */}
          <div className="bg-[#0A121C] border border-[rgba(0,255,163,.12)] rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-[#00D26A]" />
              <span className="text-white text-xs font-bold">الدفع عبر الضمان</span>
            </div>
            <div className="flex items-center gap-1.5">
              {["الدفع محجوز", "تم التوصيل", "تم الموافقة", "صرف المبلغ"].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5 flex-1">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#00D26A]/15 border border-[#00D26A]/30">
                    <span className="text-[#00D26A] text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <span className="text-[#A8B3C2] text-[10px] leading-tight">{step}</span>
                  {i < 3 && <div className="flex-1 h-px bg-[rgba(0,255,163,.12)]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
