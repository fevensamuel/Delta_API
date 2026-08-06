import { FileCode, Server, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { ApiDeveloperPortal } from './components/ApiDeveloperPortal.js';
import type { Language } from './types.js';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('en');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 text-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-lg shadow-sm group-hover:scale-105 transition-transform">
                Δ
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base tracking-tight text-slate-900 uppercase">DELTA TRAVEL API</span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    REST Service
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 font-black shadow-sm flex items-center space-x-1.5">
                <Server className="w-4 h-4" />
                <span>API Sandbox & Docs</span>
              </div>

              <a
                href="/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center space-x-1.5"
              >
                <FileCode className="w-4 h-4 text-amber-600" />
                <span>Swagger UI</span>
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main>
        <ApiDeveloperPortal />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-800">Delta Travel REST API Engine</span>
          </div>
          <p>© 2026 Delta Travel & Tour. Standalone Backend Service for External Frontend Applications.</p>
        </div>
      </footer>

    </div>
  );
}

