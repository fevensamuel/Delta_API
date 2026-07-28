import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language } from '../types.js';

interface InquirySectionProps {
  currentLang: Language;
}

export const InquirySection: React.FC<InquirySectionProps> = ({ currentLang }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !message) {
      setError('Please fill in your name, phone number, and message.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          subject: subject.trim() || 'General Umrah Inquiry',
          message: message.trim(),
          source: 'Website Public Contact Form'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFullName('');
        setPhone('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setError(data.error || 'Failed to submit inquiry.');
      }
    } catch (err) {
      setError('Network error submitting inquiry message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 bg-slate-900 text-slate-100 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Side */}
          <div className="space-y-6">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                Direct Contact & Support
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif mt-1">
                {t.contact_heading}
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                {t.contact_subheading}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Headquarters & Saudi Offices</h4>
                  <p className="text-slate-400 mt-0.5">{t.footer_address}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Hotlines & WhatsApp</h4>
                  <p className="text-slate-400 mt-0.5">{t.footer_phone}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <Mail className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Email Inquiries</h4>
                  <p className="text-slate-400 mt-0.5">info@deltatravel.com / admin@deltatravel.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            
            <h3 className="text-lg font-bold text-white font-serif border-b border-slate-800 pb-3">
              Send Us a Message
            </h3>

            {success && (
              <div className="bg-emerald-950 border border-emerald-600 text-emerald-200 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t.contact_success}</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-950 border border-rose-800 text-rose-200 p-3 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.contact_name} *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mohammed Ahmed"
                  className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.contact_phone} *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 22 33 44"
                    className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.contact_email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.contact_subject}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Ramadan Umrah Family Package Inquiry"
                  className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.contact_message} *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your preferred travel dates, group size, and visa requirements..."
                  className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : t.contact_send_btn}</span>
              </button>
            </form>

          </div>

        </div>

      </div>
    </section>
  );
};
