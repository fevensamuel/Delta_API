import { Bell, CheckCircle, MessageSquare, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language } from '../types.js';

interface SmsSubscribeSectionProps {
  currentLang: Language;
}

export const SmsSubscribeSection: React.FC<SmsSubscribeSectionProps> = ({ currentLang }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const t = translations[currentLang];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setErrorMsg('Please enter a valid mobile phone number with country code (e.g. +251911223344).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim() || undefined,
          channel: 'Website Public Newsletter Section'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || t.sms_success_toast);
        setPhone('');
        setEmail('');
      } else {
        setErrorMsg(data.error || 'Failed to subscribe phone number.');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to Delta Travel subscription API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="sms" className="py-16 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-slate-100 border-t border-emerald-900/60 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-slate-900/90 border border-emerald-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>

          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              Twilio SMS Integration
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif mt-1">
              {t.sms_heading}
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mt-2">
              {t.sms_subheading}
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-950 border border-emerald-600 text-emerald-200 p-4 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950 border border-rose-800 text-rose-200 p-3.5 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubscribe} className="space-y-4 max-w-lg mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-left block text-xs font-bold text-slate-300 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.sms_phone_placeholder}
                  className="w-full bg-slate-950 text-white font-medium px-4 py-3 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="text-left block text-xs font-bold text-slate-300 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. pilgrim@example.com"
                  className="w-full bg-slate-950 text-white font-medium px-4 py-3 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-colors flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Bell className="w-4 h-4" />
              <span>{loading ? 'Subscribing...' : t.sms_subscribe_btn}</span>
            </button>
          </form>

        </div>
      </div>
    </section>
  );
};
