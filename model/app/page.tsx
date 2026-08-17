'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import ActionBar from '@/components/ActionBar';
import HeroProfile from '@/components/HeroProfile';
import KeyStats from '@/components/KeyStats';
import PortfolioSection from '@/components/PortfolioSection';
import PreviousShoots from '@/components/PreviousShoots';
import PackagesSection from '@/components/PackagesSection';
import BottomStatsGrid from '@/components/BottomStatsGrid';
import RightSidebar from '@/components/RightSidebar';
import StickyBottomBar from '@/components/StickyBottomBar';

// Modals
import GalleryModal from '@/components/modals/GalleryModal';
import BookingBriefModal from '@/components/modals/BookingBriefModal';
import CalendarModal from '@/components/modals/CalendarModal';
import MeasurementsModal from '@/components/modals/MeasurementsModal';
import MatchExplanationModal from '@/components/modals/MatchExplanationModal';
import ShareModal from '@/components/modals/ShareModal';
import ContactModal from '@/components/modals/ContactModal';
import ReviewsModal from '@/components/modals/ReviewsModal';
import InsightsModal from '@/components/modals/InsightsModal';
import Toast from '@/components/Toast';

import { MAYA_DATA } from '@/lib/model-data';

export default function ModelProfilePage() {
  // Modal states
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMeasurementsOpen, setIsMeasurementsOpen] = useState(false);
  const [isMatchExplanationOpen, setIsMatchExplanationOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Selected package state
  const [selectedPackageId, setSelectedPackageId] = useState('growth');
  const [isSaved, setIsSaved] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'save'>('success');

  const showToast = (msg: string, type: 'success' | 'save' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const handleSaveToggle = (saved: boolean) => {
    setIsSaved(saved);
    showToast(
      saved ? 'تمت إضافة مايا خالد إلى قائمة المحفوظات' : 'تمت إزالة مايا خالد من المحفوظات',
      'save'
    );
  };

  const handleOpenGallery = (initialIndex: number = 0) => {
    setGalleryInitialIndex(initialIndex);
    setIsGalleryOpen(true);
  };

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = MAYA_DATA.packages.find((p) => p.id === pkgId);
    if (pkg) {
      showToast(`تم اختيار باقة ${pkg.name} (${pkg.price.toLocaleString()} EGP)`);
    }
  };

  const currentSelectedPrice =
    MAYA_DATA.packages.find((p) => p.id === selectedPackageId)?.price || 5200;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 pb-28">
      
      {/* 1. Top Navbar */}
      <Navbar
        onOpenNotifications={() => showToast('الإشعارات محدثة')}
        onOpenMessages={() => setIsContactOpen(true)}
      />

      {/* 2. Action Sub-header Bar */}
      <ActionBar
        onContactClick={() => setIsContactOpen(true)}
        onShareClick={() => setIsShareOpen(true)}
        onSaveToggle={handleSaveToggle}
        isSaved={isSaved}
      />

      {/* 3. Main Body Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Left/Center Column (8 cols in desktop) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Model Profile Hero Card */}
            <HeroProfile
              data={MAYA_DATA}
              onOpenGallery={() => handleOpenGallery(0)}
            />

            {/* 6 Key Stats Metrics Bar */}
            <KeyStats
              data={MAYA_DATA}
              onOpenReviews={() => setIsReviewsOpen(true)}
            />

            {/* Portfolio Bento Showcase */}
            <PortfolioSection
              data={MAYA_DATA}
              onOpenGallery={handleOpenGallery}
            />

            {/* Previous Shoots & Verified Clients */}
            <PreviousShoots data={MAYA_DATA} />

            {/* Pricing Packages */}
            <PackagesSection
              data={MAYA_DATA}
              onSelectPackage={handlePackageSelect}
              selectedPackageId={selectedPackageId}
            />

            {/* Bottom 3 Sections: Reviews, Timeline, Performance */}
            <BottomStatsGrid
              data={MAYA_DATA}
              onOpenReviews={() => setIsReviewsOpen(true)}
            />

          </div>

          {/* Right Sidebar Column (4 cols in desktop) */}
          <div className="lg:col-span-4">
            <RightSidebar
              data={MAYA_DATA}
              onOpenMatchModal={() => setIsMatchExplanationOpen(true)}
              onOpenCalendarModal={() => setIsCalendarOpen(true)}
              onOpenMeasurementsModal={() => setIsMeasurementsOpen(true)}
              onOpenInsightsModal={() => setIsInsightsOpen(true)}
              onOpenActivityModal={() => setIsGalleryOpen(true)}
            />
          </div>

        </div>
      </main>

      {/* 4. Sticky Floating Bottom Bar */}
      <StickyBottomBar
        data={MAYA_DATA}
        onContinueToBrief={() => setIsBookingOpen(true)}
        selectedPrice={currentSelectedPrice}
      />

      {/* 5. Modals & Drawers */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        data={MAYA_DATA}
        initialIndex={galleryInitialIndex}
      />

      <BookingBriefModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        data={MAYA_DATA}
        initialPackageId={selectedPackageId}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        data={MAYA_DATA}
        onSelectDate={(date) => {
          showToast(`تم اختيار الموعد: ${date}`);
          setIsBookingOpen(true);
        }}
      />

      <MeasurementsModal
        isOpen={isMeasurementsOpen}
        onClose={() => setIsMeasurementsOpen(false)}
        data={MAYA_DATA}
      />

      <MatchExplanationModal
        isOpen={isMatchExplanationOpen}
        onClose={() => setIsMatchExplanationOpen(false)}
        data={MAYA_DATA}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        data={MAYA_DATA}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        data={MAYA_DATA}
      />

      <ReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        data={MAYA_DATA}
      />

      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        data={MAYA_DATA}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        type={toastType}
      />

    </div>
  );
}
