import { CheckCircle2, Clock, DollarSign, FileCheck, Globe2, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language } from '../types.js';

interface VisaInfo {
  id: string;
  nationality: string;
  visa_type: string;
  price_usd: number;
  processing_time_days: number;
  required_documents: string[];
}

interface VisaSectionProps {
  visas: VisaInfo[];
  currentLang: Language;
}

export const VisaSection: React.FC<VisaSectionProps> = ({ visas, currentLang }) => {
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const t = translations[currentLang];

  const filteredVisas = selectedNationality
    ? visas.filter(v => v.nationality.toLowerCase().includes(selectedNationality.toLowerCase()))
    : visas;

  return (
    <section id="visa" className="py-16 bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Kingdom of Saudi Arabia E-Visa Verification
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            {t.visa_heading}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.visa_subheading}
          </p>
        </div>

        {/* Nationality Selector Filter */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-xl">
            <Globe2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.visa_select_nationality}
              </label>
              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">All Nationalities ({visas.length} Available)</option>
                {visas.map(v => (
                  <option key={v.id} value={v.nationality}>
                    {v.nationality} - {v.visa_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visa Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVisas.map((v) => (
            <div key={v.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-emerald-700/60 transition-all shadow-xl space-y-4">
              
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {v.nationality} Passport
                  </span>
                  <h3 className="text-lg font-bold text-white font-serif mt-2">
                    {v.visa_type}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Fee</span>
                  <span className="text-2xl font-black text-amber-400 font-serif">${v.price_usd}</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <div>
                    <span className="text-slate-400 block">{t.visa_proc_time}</span>
                    <span className="font-bold text-slate-200">{v.processing_time_days} Working Days</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-slate-400 block">Required Docs</span>
                    <span className="font-bold text-slate-200">{v.required_documents.length} Items</span>
                  </div>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t.visa_req_docs}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {v.required_documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/251911223344?text=Hello%20Delta%20Travel!%20I%20want%20to%20apply%20for%20a%20${encodeURIComponent(v.visa_type)}%20for%20a%20${encodeURIComponent(v.nationality)}%20passport.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
                >
                  Apply & Submit Passport Documents
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
