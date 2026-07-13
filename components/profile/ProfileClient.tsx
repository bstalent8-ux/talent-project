"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Edit3, X, Save, User, MapPin, Globe, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import ProfileHero from "./ProfileHero"

interface ProfileData {
  id: string
  full_name: string
  handle: string
  city: string
  avatar_url: string | null
  bio: string | null
  category?: string
  avg_rating: number
  total_reviews: number
  profile_views: number
  is_featured: boolean
  specialties?: string[]
  availability?: string
  social_links?: Record<string, string>
}

interface ProfileClientProps {
  profile: ProfileData
  isOwner?: boolean
}

export default function ProfileClient({ profile, isOwner = false }: ProfileClientProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    city: profile.city,
    bio: profile.bio || "",
    avatar_url: profile.avatar_url || "",
  })

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profile.id,
        profileData: {
          full_name: form.full_name,
          city: form.city,
          bio: form.bio,
          avatar_url: form.avatar_url || null,
        },
      }),
    })
    if (res.ok) setEditing(false)
  }

  return (
    <div className="relative">
      {/* Edit Button for Owner */}
      {isOwner && !editing && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setEditing(true)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#00D26A] hover:bg-[#00E676] text-black font-bold text-sm rounded-xl px-4 py-2 transition-colors"
        >
          <Edit3 size={16} />
          تعديل البروفايل
        </motion.button>
      )}

      <ProfileHero
        name={profile.full_name}
        handle={profile.handle}
        avatarUrl={form.avatar_url}
        profession={profile.category ? `Model | ${profile.category}` : "Model"}
        location={profile.city}
        memberSince="يناير 2024"
        rating={profile.avg_rating}
        reviewsCount={profile.total_reviews}
        viewsCount={profile.profile_views}
        isVerified
        isPremium={profile.is_featured}
        responseTime="خلال ساعة"
      />

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0D1623] border border-[rgba(0,255,163,.15)] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-bold">تعديل البروفايل</h2>
                <button onClick={() => setEditing(false)} className="text-[#A8B3C2] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#0A121C] border-2 border-[rgba(0,255,163,.15)]">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A8B3C2]">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <button className="flex items-center gap-2 text-sm text-[#00D26A] hover:text-[#00E676] transition-colors">
                    <Camera size={16} />
                    تغيير الصورة
                  </button>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[#A8B3C2] text-xs mb-1.5">الاسم الكامل</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-[#0A121C] border border-[rgba(0,255,163,.12)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00D26A]/50 transition-colors"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[#A8B3C2] text-xs mb-1.5">المدينة</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B3C2]" />
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full bg-[#0A121C] border border-[rgba(0,255,163,.12)] rounded-xl pr-10 pl-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00D26A]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[#A8B3C2] text-xs mb-1.5">النبذة</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#0A121C] border border-[rgba(0,255,163,.12)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00D26A]/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-[#A8B3C2] border border-white/10 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="flex-2 bg-[#00D26A] hover:bg-[#00E676] text-black font-bold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  حفظ التغييرات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
