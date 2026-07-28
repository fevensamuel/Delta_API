import { Building, Hotel, Luggage, Plane, Star, UtensilsCrossed } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language } from '../types.js';

interface Partner {
  id: string;
  name: string;
  type: 'airline' | 'hotel';
}

interface AirlinePartner extends Partner {
  code: string;
  hub: string;
  is_featured?: boolean;
  baggage_allowance: string;
  catering_info: string;
  aircraft: string[];
}

interface HotelPartner extends Partner {
  city: string;
  stars: number;
  distance_to_haram: string;
  amenities: string[];
}

interface PartnersSectionProps {
  partners: Partner[];
  currentLang: Language;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({ partners, currentLang }) => {
  const [activeTab, setActiveTab] = useState<'airline' | 'hotel'>('airline');
  const t = translations[currentLang];

  const airlines = partners.filter(p => p.type === 'airline') as AirlinePartner[];
  const hotels = partners.filter(p => p.type === 'hotel') as HotelPartner[];

  return (
    <section id="partners" className="py-16 bg-slate-900 text-slate-100 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
            World-Class Hospitality & Transport
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            {t.partners_heading}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.partners_subheading}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 inline-flex space-x-2">
            <button
              onClick={() => setActiveTab('airline')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'airline'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>{t.tab_airlines} ({airlines.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hotel')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'hotel'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>{t.tab_hotels} ({hotels.length})</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {activeTab === 'airline' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {airlines.map((airline) => (
              <div key={airline.id} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-emerald-950 rounded-xl border border-emerald-800">
                        <Plane className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white font-serif">{airline.name}</h3>
                        <span className="text-xs text-slate-400 font-mono">IATA: {airline.code} | Hub: {airline.hub}</span>
                      </div>
                    </div>
                    {airline.is_featured && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-start space-x-2">
                      <Luggage className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-200">{t.baggage}:</span> {airline.baggage_allowance}
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-200">{t.catering}:</span> {airline.catering_info}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {airline.aircraft.map((ac, i) => (
                      <span key={i} className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px]">
                        {ac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-teal-950 rounded-xl border border-teal-800">
                        <Building className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white font-serif">{hotel.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(hotel.stars)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">({hotel.city})</span>
                        </div>
                      </div>
                    </div>
                    <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                      {hotel.distance_to_haram}
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hotel Amenities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.map((am, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px]">
                          ✓ {am}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
