'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroProfile } from '../components/HeroProfile';
import { QuickTabs } from '../components/QuickTabs';
import { VideoPortfolio } from '../components/VideoPortfolio';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { ContentSpecialties } from '../components/ContentSpecialties';
import { TopContentTypesChart } from '../components/TopContentTypesChart';
import { PreviousShoots } from '../components/PreviousShoots';
import { PackagesSection } from '../components/PackagesSection';
import { BrandsWorkedWith } from '../components/BrandsWorkedWith';
import { ReviewsSection } from '../components/ReviewsSection';
import { InsightsAndActivity } from '../components/InsightsAndActivity';
import { SafetyTrust } from '../components/SafetyTrust';
import { HireModal } from '../components/HireModal';
import { VideoModal } from '../components/VideoModal';
import { MessageModal } from '../components/MessageModal';
import { AddToCampaignModal } from '../components/AddToCampaignModal';
import { PackageItem, PACKAGES } from '../data/creatorData';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [currency, setCurrency] = useState<'EGP' | 'USD' | 'SAR' | 'AED'>('EGP');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [savedCount, setSavedCount] = useState<number>(1);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Modals state
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [selectedPackageForHire, setSelectedPackageForHire] = useState<PackageItem | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);

  // Sync HTML dir attribute for Arabic RTL
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    setSavedCount((prev) => (isSaved ? Math.max(0, prev - 1) : prev + 1));
  };

  const handleSelectPackage = (pkg: PackageItem) => {
    setSelectedPackageForHire(pkg);
    setIsHireOpen(true);
  };

  return (
    <div className={`min-h-screen bg-slate-100/60 font-sans text-slate-900 ${lang === 'ar' ? 'font-[sans-serif]' : ''}`}>
      {/* 1. Global Navigation Bar */}
      <Navbar
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        savedCount={savedCount}
        onOpenMessage={() => setIsMessageOpen(true)}
      />

      {/* 2. Hero Dark Creator Card */}
      <HeroProfile
        lang={lang}
        onHireNow={() => {
          setSelectedPackageForHire(PACKAGES[1]);
          setIsHireOpen(true);
        }}
        onAddToCampaign={() => setIsCampaignOpen(true)}
        onOpenMessage={() => setIsMessageOpen(true)}
        onSelectVideo={(vId) => setActiveVideoId(vId)}
        isSaved={isSaved}
        onToggleSave={handleToggleSave}
      />

      {/* 3. Sub-Navigation Tabs */}
      <QuickTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
      />

      {/* 4. Main Two-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / MAIN COLUMN (Cols 1 to 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Video Portfolio Grid */}
            <VideoPortfolio
              lang={lang}
              onSelectVideo={(vId) => setActiveVideoId(vId)}
            />

            {/* Performance Metrics with Sparklines */}
            <PerformanceMetrics
              lang={lang}
            />

            {/* Previous Shoots & Verified Contracts */}
            <PreviousShoots
              lang={lang}
            />

            {/* Packages & Pricing Table */}
            <PackagesSection
              lang={lang}
              currency={currency}
              onSelectPackage={handleSelectPackage}
            />

            {/* Client Reviews Section */}
            <ReviewsSection
              lang={lang}
            />
          </div>

          {/* RIGHT / SIDEBAR COLUMN (Cols 9 to 12) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Content Specialties Badges */}
            <ContentSpecialties
              lang={lang}
              selectedSpecialty={selectedSpecialty}
              onSelectSpecialty={setSelectedSpecialty}
            />

            {/* Top Content Types Donut Chart */}
            <TopContentTypesChart
              lang={lang}
            />

            {/* Brands I've Worked With */}
            <BrandsWorkedWith
              lang={lang}
            />

            {/* Insights & Recent Activity */}
            <InsightsAndActivity
              lang={lang}
            />

            {/* Safety & Escrow Trust Details + Direct Booking */}
            <SafetyTrust
              lang={lang}
              onHireNow={() => {
                setSelectedPackageForHire(PACKAGES[1]);
                setIsHireOpen(true);
              }}
              onOpenMessage={() => setIsMessageOpen(true)}
            />

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-16 py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">talents<span className="text-emerald-500">.</span></span>
            <span>•</span>
            <span>{lang === 'ar' ? 'منصة توظيف صناع محتوى الـ UGC الموثوقين' : 'The premier verified UGC talent marketplace'}</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#terms" className="hover:text-slate-900 transition-colors">{lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</a>
            <a href="#privacy" className="hover:text-slate-900 transition-colors">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
            <a href="#escrow" className="hover:text-slate-900 transition-colors">{lang === 'ar' ? 'حماية الضمان المالي' : 'Escrow Protection'}</a>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Escrow Booking Modal */}
      <HireModal
        isOpen={isHireOpen}
        onClose={() => setIsHireOpen(false)}
        lang={lang}
        currency={currency}
        initialPackage={selectedPackageForHire}
      />

      {/* 2. Video Player Modal */}
      <VideoModal
        videoId={activeVideoId}
        onClose={() => setActiveVideoId(null)}
        lang={lang}
        onOrderThisStyle={() => {
          setActiveVideoId(null);
          setSelectedPackageForHire(PACKAGES[1]);
          setIsHireOpen(true);
        }}
      />

      {/* 3. Live Message Simulator Modal */}
      <MessageModal
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        lang={lang}
      />

      {/* 4. Add to Campaign Modal */}
      <AddToCampaignModal
        isOpen={isCampaignOpen}
        onClose={() => setIsCampaignOpen(false)}
        lang={lang}
      />

    </div>
  );
}
