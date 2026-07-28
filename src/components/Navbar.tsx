import { FileCode, Globe, LogIn, Menu, MessageSquare, PhoneCall, ShieldCheck, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { Language } from '../types.js';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeSection: string;
  onSectionSelect: (section: string) => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  activeSection,
  onSectionSelect,
  isAdminLoggedIn
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[currentLang];

  const navItems = [
    { id: 'packages', label: t.nav_packages },
    { id: 'visa', label: t.nav_visa },
    { id: 'partners', label: t.nav_partners },
    { id: 'gallery', label: t.nav_gallery },
    { id: 'sms', label: t.nav_sms },
    { id: 'contact', label: t.nav_contact },
    { id: 'swagger', label: t.nav_swagger, icon: FileCode }
  ];

  const handleNavClick = (id: string) => {
    onSectionSelect(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('packages')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-lg shadow-md group-hover:scale-105 transition-transform">
              Δ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white uppercase">DELTA TRAVEL & TOUR</span>
              </div>
              <p className="text-[10px] text-amber-400 tracking-wider font-semibold uppercase hidden sm:block">
                Umrah & Hajj Specialists
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border-l-2 sm:border-l-0 sm:border-b-2 border-amber-500 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Language Switcher */}
            <div className="relative flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <Globe className="w-4 h-4 text-emerald-400 mx-1.5 hidden sm:inline" />
              {(['en', 'ar', 'am'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-1 text-xs font-semibold rounded uppercase transition-colors ${
                    currentLang === lang
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Direct WhatsApp Lead Button */}
            <a
              href="https://wa.me/251911223344?text=Hello%20Delta%20Travel!%20I'm%20interested%20in%20Umrah%20and%20Visa%20services.%20Please%20assist%20me."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-emerald-900/40"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>

            {/* Admin Portal Button */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-lg border transition-all text-xs font-semibold flex items-center space-x-1.5 ${
                activeSection === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : isAdminLoggedIn
                  ? 'bg-amber-900/40 text-amber-300 border-amber-700'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <LogIn className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAdminLoggedIn ? 'Admin Active' : t.nav_admin}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-emerald-900/60 px-4 pt-3 pb-6 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-emerald-700 text-amber-300 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 flex flex-col space-y-2">
            <a
              href="https://wa.me/251911223344?text=Hello%20Delta%20Travel!%20I'm%20interested%20in%20Umrah%20packages."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold"
            >
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Direct Chat</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
