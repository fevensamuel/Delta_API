import { CheckCircle, Search, ShieldCheck, Sparkles, Users, Utensils } from 'lucide-react';
import React from 'react';
import { translations } from '../translations.js';
import type { Language, PackageCategory } from '../types.js';

interface HeroSectionProps {
  currentLang: Language;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentLang,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange
}) => {
  const t = translations[currentLang];

  const categories: (PackageCategory | 'ALL')[] = ['ALL', 'VIP', 'Premium', 'Standard', 'Economy'];

  return (
    <div className="relative bg-slate-950 text-white overflow-hidden pt-12 pb-20 border-b border-slate-800">
      {/* Background Graphic Accent */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-700/60 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t.slogan}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif leading-tight">
            {t.hero_title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {t.hero_subtitle}
          </p>

          {/* Quick Features Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-left sm:text-center">
            <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Licensed Hajj & Umrah Agency</span>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5 shadow-sm">
              <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Instant WhatsApp Pre-Filled Link</span>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5 shadow-sm">
              <Users className="w-5 h-5 text-teal-400 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Multilingual Scholars & Guides</span>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-xl flex items-center space-x-2.5 shadow-sm">
              <Utensils className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Full Halal Catering & Transport</span>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="pt-6">
            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
              
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t.search_placeholder}
                  className="w-full bg-slate-950 text-white font-medium pl-12 pr-4 py-3 rounded-xl text-xs sm:text-sm border border-slate-800 focus:outline-none focus:border-amber-500 placeholder-slate-500 font-sans"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => onCategorySelect(cat)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-900 shadow-md scale-105'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat === 'ALL' ? t.filter_all : `${cat} Packages`}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
