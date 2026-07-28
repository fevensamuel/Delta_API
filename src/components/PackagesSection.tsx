import { Building2, Calendar, Check, Clock, Eye, Hotel, MapPin, MessageSquare, X } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language, TravelPackage } from '../types.js';

interface PackagesSectionProps {
  packages: TravelPackage[];
  currentLang: Language;
  onPackageClick: (pkgId: number) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  currentLang,
  onPackageClick
}) => {
  const [selectedItineraryPackage, setSelectedItineraryPackage] = useState<TravelPackage | null>(null);
  const t = translations[currentLang];

  const getTitle = (pkg: TravelPackage) => {
    const p = pkg as any;
    if (currentLang === 'ar') return pkg.titleAr || p.title_ar || pkg.titleEn || p.title_en || '';
    if (currentLang === 'am') return pkg.titleAm || p.title_am || pkg.titleEn || p.title_en || '';
    return pkg.titleEn || p.title_en || '';
  };

  const getPriceUsd = (pkg: any) => pkg.priceUsd ?? pkg.price_usd ?? pkg.price ?? 0;
  const getDurationDays = (pkg: any) => pkg.durationDays ?? pkg.duration_days ?? 0;
  const getImageUrl = (pkg: any) => pkg.imageUrl || pkg.image_url || '';

  const generateWhatsAppUrl = (pkg: TravelPackage) => {
    const packageName = getTitle(pkg);
    const priceUsd = getPriceUsd(pkg);
    const duration = getDurationDays(pkg);
    const message = `Hello Delta Travel! I'm interested in the ${packageName} ($${priceUsd} USD, ${duration} days). Please share available dates and registration requirements.`;
    return `https://wa.me/251911223344?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="packages" className="py-16 bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-slate-800 pb-4">
          <div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Sacred Pilgrimage Offerings
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif mt-1">
              {t.nav_packages}
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md mt-2 md:mt-0">
            Handcrafted package itineraries with 5-star hotel options, flight tickets, and VIP transport.
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center">
            <p className="text-slate-400 text-lg">No active packages match your current search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => {
              const categoryColor =
                pkg.category === 'VIP' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold uppercase' :
                pkg.category === 'Hajj' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase' :
                pkg.category === 'Premium' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase' :
                pkg.category === 'Economy' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold uppercase' :
                'bg-slate-800 text-slate-300 border border-slate-700 font-bold uppercase';

              return (
                <div
                  key={pkg.id}
                  className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 hover:border-amber-500/50 transition-all flex flex-col shadow-xl group"
                >
                  {/* Image & Badge */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={getImageUrl(pkg)}
                      alt={getTitle(pkg)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    
                    <span className={`absolute top-4 left-4 px-2.5 py-1 rounded-md text-[10px] tracking-wider shadow-md ${categoryColor}`}>
                      {pkg.category}
                    </span>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold border border-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{getDurationDays(pkg)} {t.pkg_duration}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-300 block font-medium">Starting from</span>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-amber-400 font-serif">${getPriceUsd(pkg)} USD</span>
                          {pkg.priceEtb ? (
                            <span className="text-[11px] text-emerald-400 font-mono font-bold">≈ ETB {pkg.priceEtb.toLocaleString()}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white font-serif line-clamp-2 leading-snug">
                        {getTitle(pkg)}
                      </h3>

                      {/* Hotels */}
                      <div className="mt-4 space-y-2 text-xs text-slate-300">
                        <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <Hotel className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200">{t.pkg_makkah_hotel}:</span> {pkg.hotel_name_makkah}
                            <span className="text-amber-400 font-semibold block">{pkg.distance_haram_makkah}</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <Building2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200">{t.pkg_madinah_hotel}:</span> {pkg.hotel_name_madinah}
                            <span className="text-amber-400 font-semibold block">{pkg.distance_haram_madinah}</span>
                          </div>
                        </div>
                      </div>

                      {/* Inclusions checklist */}
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Key Package Highlights
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {pkg.inclusions.slice(0, 4).map((inc, i) => (
                            <li key={i} className="flex items-center space-x-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 space-y-2">
                      <button
                        onClick={() => {
                          onPackageClick(pkg.id);
                          setSelectedItineraryPackage(pkg);
                        }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>{t.pkg_view_details}</span>
                      </button>

                      <a
                        href={generateWhatsAppUrl(pkg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onPackageClick(pkg.id)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950/50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t.pkg_whatsapp_btn}</span>
                      </a>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Itinerary Modal Drawer */}
      {selectedItineraryPackage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setSelectedItineraryPackage(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                {selectedItineraryPackage.category} Umrah Package
              </span>
              <h3 className="text-2xl font-bold text-white font-serif mt-1">
                {getTitle(selectedItineraryPackage)}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Duration: {getDurationDays(selectedItineraryPackage)} Days | Price: ${getPriceUsd(selectedItineraryPackage)} USD
                {selectedItineraryPackage.priceEtb ? ` (≈ ETB ${selectedItineraryPackage.priceEtb.toLocaleString()})` : ''}
              </p>
            </div>

            {/* Inclusions */}
            <div>
              <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-3">
                Included Features & Services
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {(selectedItineraryPackage.inclusions || []).map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day by Day Itinerary */}
            <div>
              <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-3">
                {t.pkg_itinerary_title}
              </h4>
              <div className="space-y-3">
                {(selectedItineraryPackage.itinerary || []).map((day: any) => {
                  const dayTitle = currentLang === 'ar' ? (day.titleAr || day.title_ar || day.titleEn || day.title_en) : currentLang === 'am' ? (day.titleAm || day.title_am || day.titleEn || day.title_en) : (day.titleEn || day.title_en);
                  const dayDesc = currentLang === 'ar' ? (day.descriptionAr || day.description_ar || day.descriptionEn || day.description_en) : currentLang === 'am' ? (day.descriptionAm || day.description_am || day.descriptionEn || day.description_en) : (day.descriptionEn || day.description_en);

                  return (
                    <div key={day.day} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded">
                          Day {day.day}
                        </span>
                        <h5 className="text-sm font-bold text-slate-100">{dayTitle}</h5>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-1 pt-1">{dayDesc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedItineraryPackage(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Close
              </button>
              <a
                href={generateWhatsAppUrl(selectedItineraryPackage)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center space-x-2 hover:bg-emerald-500"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Confirm Interest on WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
