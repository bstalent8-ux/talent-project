'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Check, Plus, Sparkles, Building2 } from 'lucide-react';
import { CREATOR_PROFILE } from '../data/creatorData';

interface AddToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export function AddToCampaignModal({ isOpen, onClose, lang }: AddToCampaignModalProps) {
  const isAr = lang === 'ar';
  const [selectedCampaign, setSelectedCampaign] = useState<string>('c1');
  const [campaigns, setCampaigns] = useState([
    { id: 'c1', name: isAr ? 'حملة الصيف لمستحضرات التجميل 2024' : 'Summer Skincare Launch 2024', creators: 3, budget: '35,000 EGP' },
    { id: 'c2', name: isAr ? 'إعلانات تيك توك سبارك - الربع الثالث' : 'Q3 TikTok Spark Blitz', creators: 5, budget: '60,000 EGP' },
    { id: 'c3', name: isAr ? 'حملة العودة للمدارس / الأجهزة' : 'Back to Campus Tech Series', creators: 2, budget: '20,000 EGP' }
  ]);
  const [newCampName, setNewCampName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen) return null;

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    const newC = {
      id: `c-${Date.now()}`,
      name: newCampName,
      creators: 1,
      budget: '25,000 EGP'
    };
    setCampaigns([newC, ...campaigns]);
    setSelectedCampaign(newC.id);
    setNewCampName('');
    setShowCreate(false);
  };

  const handleAddCreator = () => {
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isAr ? 'إضافة إلى حملة إعلانية' : 'Add to Brand Campaign'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'اختر الحملة لضم نور محمد إلى قائمة الصناع' : 'Assign Nour Mohamed to your roster'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Existing Campaigns */}
        <div className="py-4 space-y-2">
          {campaigns.map((camp) => {
            const isSelected = selectedCampaign === camp.id;
            return (
              <div
                key={camp.id}
                onClick={() => setSelectedCampaign(camp.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-violet-600 bg-violet-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{camp.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>{camp.creators} {isAr ? 'صناع محتوى' : 'creators'}</span>
                    <span>•</span>
                    <span>{camp.budget}</span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-violet-600 text-white' : 'border border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Campaign Button/Form */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء حملة جديدة' : 'Create New Campaign'}</span>
          </button>
        ) : (
          <form onSubmit={handleCreateCampaign} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <input
              type="text"
              value={newCampName}
              onChange={(e) => setNewCampName(e.target.value)}
              placeholder={isAr ? 'اسم الحملة (مثال: حملة الخريف للجمال)' : 'Campaign Name...'}
              className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-2.5 py-1 text-xs text-slate-500"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleAddCreator}
            disabled={isAdded}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            {isAdded ? (
              <span className="text-emerald-400 font-bold">{isAr ? 'تمت الإضافة بنجاح!' : 'Added Successfully!'}</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد الإضافة' : 'Confirm Assignment'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
