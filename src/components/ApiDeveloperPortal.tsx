import {
  CheckCircle,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Globe,
  Key,
  Layers,
  Lock,
  Play,
  Server,
  ShieldCheck,
  Terminal,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const ApiDeveloperPortal: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/packages');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [requestBody, setRequestBody] = useState<string>('{\n  "full_name": "Test Pilgrim",\n  "phone": "+251911223344",\n  "message": "Inquiry from external frontend"\n}');

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ status: 'error', error: 'Service unreachable' });
    }
  };

  const handleRunApiTest = async () => {
    setTestLoading(true);
    setTestResponse(null);

    const [method, path] = selectedEndpoint.split(' ');
    const url = path;

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if ((method === 'POST' || method === 'PUT') && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const json = await res.json();
      setTestResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: 'Request Failed', message: err.message }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://api.deltatravel.com';

  const getCodeSnippet = () => {
    const [method, path] = selectedEndpoint.split(' ');
    if (method === 'GET') {
      return `// JavaScript / TypeScript Frontend Example
fetch('${currentHost}${path}')
  .then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('API Error:', err));`;
    } else {
      return `// JavaScript / TypeScript Frontend Example
fetch('${currentHost}${path}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${requestBody})
})
  .then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('API Error:', err));`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>REST API Backend Active</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200">
                CORS Enabled (*)
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif tracking-tight">
              Delta Travel REST API Service
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Standalone backend engine serving Umrah & Hajj packages, visa rules, partner airlines, photo gallery, SMS subscriber broadcasts, and customer inquiries. Ready for connection with your custom external frontend.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <FileCode className="w-4 h-4" />
              <span>Interactive Swagger UI</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </a>
          </div>
        </div>

        {/* Health Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Server Status</span>
            <span className="text-sm font-bold text-emerald-700 mt-0.5 block flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{healthStatus?.status === 'ok' ? 'Online & Healthy' : 'Initializing...'}</span>
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">OpenAPI Spec</span>
            <a
              href="/api-docs/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-amber-700 hover:underline mt-0.5 block truncate font-bold"
            >
              /api-docs/openapi.json
            </a>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Allowed Headers</span>
            <span className="text-xs font-mono text-slate-700 mt-0.5 block truncate">
              Content-Type, Authorization
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Auth Scheme</span>
            <span className="text-xs font-mono text-slate-700 mt-0.5 block">
              Bearer JWT Tokens
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Endpoint Tester & Code Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: API Endpoints Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center space-x-2">
              <Server className="w-4 h-4 text-amber-600" />
              <span>Available Backend REST Routes</span>
            </h3>
            <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              v1.0 API
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono max-h-[500px] overflow-y-auto pr-1">
            {[
              { ep: 'GET /api/packages', desc: 'Fetch list of active travel packages with search/filter params' },
              { ep: 'GET /api/packages/1', desc: 'Fetch package details & track WhatsApp click analytics' },
              { ep: 'GET /api/gallery', desc: 'Fetch photo and video gallery items (?type=photo|video)' },
              { ep: 'GET /api/gallery/g1', desc: 'Fetch single gallery photo/video detail' },
              { ep: 'POST /api/subscribers', desc: 'Public opt-in for Twilio SMS broadcasts' },
              { ep: 'POST /api/inquiries', desc: 'Submit customer Umrah inquiry' },
              { ep: 'POST /api/auth/login', desc: 'Authenticate admin/editor and get Bearer JWT token' },
              { ep: 'GET /api/admin/packages/stats', desc: 'Get package WhatsApp click stats (JWT required)' },
              { ep: 'POST /api/admin/gallery', desc: 'Admin create photo/video gallery item (JWT required)' },
              { ep: 'POST /api/admin/sms/campaign', desc: 'Broadcast Twilio SMS to opted-in phones (JWT required)' },
            ].map((item) => {
              const isSelected = selectedEndpoint === item.ep;
              const method = item.ep.split(' ')[0];
              const path = item.ep.split(' ')[1];

              return (
                <button
                  key={item.ep}
                  onClick={() => setSelectedEndpoint(item.ep)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      method === 'GET' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {method}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{path}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1 leading-snug">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Tester & Frontend Code Generator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Endpoint Runner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center space-x-2">
                <Play className="w-4 h-4 text-emerald-600" />
                <span>Live Endpoint Sandbox Tester</span>
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-bold">{selectedEndpoint}</span>
            </div>

            {selectedEndpoint.startsWith('POST') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">JSON Request Body Payload:</label>
                <textarea
                  rows={4}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <button
              onClick={handleRunApiTest}
              disabled={testLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Zap className="w-4 h-4" />
              <span>{testLoading ? 'Executing Request...' : 'Send Live API Request'}</span>
            </button>

            {testResponse && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 block">JSON Response Output:</span>
                <pre className="bg-slate-900 text-amber-300 font-mono text-xs p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-80 leading-relaxed shadow-inner">
                  {testResponse}
                </pre>
              </div>
            )}
          </div>

          {/* Code Snippet Example for External Frontend */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-amber-600" />
                <span>Frontend Fetch Snippet for {selectedEndpoint.split(' ')[1]}</span>
              </h3>
              <button
                onClick={() => copyToClipboard(getCodeSnippet())}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSnippet ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 overflow-x-auto shadow-inner">
              {getCodeSnippet()}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
