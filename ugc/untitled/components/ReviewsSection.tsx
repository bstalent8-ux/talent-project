'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, ShieldCheck, CheckCircle2, MessageSquarePlus, Filter } from 'lucide-react';
import { REVIEWS, ReviewItem } from '../data/creatorData';

interface ReviewsSectionProps {
  lang: 'en' | 'ar';
}

export function ReviewsSection({ lang }: ReviewsSectionProps) {
  const isAr = lang === 'ar';
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | '5star'>('all');
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(REVIEWS);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newRev: ReviewItem = {
      id: `r-${Date.now()}`,
      author: isAr ? 'علامة تجارية موثقة' : 'Verified Brand Client',
      company: 'Direct Client',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rating: newReviewRating,
      packageUsed: { en: 'Growth Package', ar: 'باقة النمو' },
      price: '5,500 EGP',
      comment: { en: newReviewText, ar: newReviewText },
      date: { en: 'Just now', ar: 'الآن' },
      recommended: true
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewReviewText('');
    setShowAddReview(false);
  };

  return (
    <section id="reviews" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isAr ? 'تقييمات وتجارب العملاء' : 'Client Reviews'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              128 {isAr ? 'تقييم موثق' : 'Verified Reviews'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'تقييمات حقيقية من مديري التسويق وشركات التجارة الإلكترونية'
              : 'Real feedback from brand marketing managers and e-commerce directors'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddReview(!showAddReview)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة تقييم' : 'Write a Review'}</span>
          </button>
        </div>
      </div>

      {/* Add Review Inline Form */}
      {showAddReview && (
        <form onSubmit={handleAddReview} className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{isAr ? 'شارك تجربتك مع نور:' : 'Share your experience with Nour:'}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
            placeholder={isAr ? 'اكتب تقييمك حول جودة المحتوى والالتزام بالمواعيد...' : 'Write about the content quality, speed, and communication...'}
            className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddReview(false)}
              className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
            >
              {isAr ? 'نشر التقييم' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Ratings Breakdown Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 items-center">
        {/* Big Overall Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r md:border-slate-200 pr-0 md:pr-4">
          <div className="text-4xl font-black text-slate-900 font-sans tracking-tight">4.9</div>
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {isAr ? 'بناءً على ١٢٨ مشروعاً مكتملاً' : 'Based on 128 completed projects'}
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 space-y-1.5">
          {[
            { stars: '5 Stars', pct: 95 },
            { stars: '4 Stars', pct: 4 },
            { stars: '3 Stars', pct: 1 },
            { stars: '2 Stars', pct: 0 },
            { stars: '1 Star', pct: 0 }
          ].map((bar, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600 font-medium shrink-0">{bar.stars}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-semibold text-slate-700">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsList.map((review) => (
          <div
            key={review.id}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {review.company.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {review.company}
                    </h4>
                    {review.recommended && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span>{isAr ? 'يوصي بالتعامل' : 'Recommended'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{review.author}</span>
                    <span>•</span>
                    <span className="text-violet-600 font-semibold">
                      {isAr ? review.packageUsed.ar : review.packageUsed.en}
                    </span>
                  </div>
                </div>
              </div>

              {/* Star Rating & Date */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">
                  {isAr ? review.date.ar : review.date.en}
                </div>
              </div>
            </div>

            {/* Comment Text */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              &ldquo;{isAr ? review.comment.ar : review.comment.en}&rdquo;
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isAr ? 'مشروع موثق ومدفوع بالضمان' : 'Verified Escrow Booking'}
              </span>
              <span>{review.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
