import {
  AlertCircle,
  BarChart2,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileCode,
  FileText,
  Film,
  Globe2,
  Hotel,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Play,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Video
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type {
  AdminRole,
  AdminUser,
  GalleryItem,
  Inquiry,
  SmsLog,
  Subscriber,
  TravelPackage
} from '../types.js';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('delta_admin_token'));
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; role: AdminRole } | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('superadmin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Tab Navigation
  const [activeTab, setActiveTab] = useState<'metrics' | 'packages' | 'subscribers' | 'inquiries' | 'gallery' | 'users' | 'swagger'>('metrics');

  // Backend Data Collections
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [visas, setVisas] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);

  // Feedback Messages
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals & Forms State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<TravelPackage> | null>(null);

  const [showVisaModal, setShowVisaModal] = useState(false);
  const [editingVisa, setEditingVisa] = useState<any>(null);

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);

  // Gallery Form State (Photo vs Video)
  const [galType, setGalType] = useState<'photo' | 'video'>('photo');
  const [galTitle, setGalTitle] = useState('');
  const [galTitleAr, setGalTitleAr] = useState('');
  const [galLocation, setGalLocation] = useState('Makkah');
  const [galDescription, setGalDescription] = useState('');
  const [galSortOrder, setGalSortOrder] = useState<number>(1);
  const [galIsActive, setGalIsActive] = useState<boolean>(true);

  // Photo Source State
  const [photoSourceMode, setPhotoSourceMode] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState('');

  // Video Source State
  const [videoSourceMode, setVideoSourceMode] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPosterMode, setVideoPosterMode] = useState<'upload' | 'url'>('url');
  const [videoPosterUrl, setVideoPosterUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);

  // Gallery Editing Modal State
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);

  // Helper function to auto calculate video duration from file or URL
  const autoCalculateVideoDuration = (src: string) => {
    if (!src) return;
    setIsCalculatingDuration(true);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = src;

    tempVideo.onloadedmetadata = () => {
      const totalSecs = Math.round(tempVideo.duration);
      if (!isNaN(totalSecs) && totalSecs > 0) {
        const minutes = Math.floor(totalSecs / 60);
        const seconds = totalSecs % 60;
        const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        setVideoDuration(formatted);
      }
      setIsCalculatingDuration(false);
      tempVideo.remove();
    };

    tempVideo.onerror = () => {
      setIsCalculatingDuration(false);
      tempVideo.remove();
    };
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setPhotoUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    autoCalculateVideoDuration(objectUrl);

    // Auto generate poster frame from video
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.currentTime = 1;
    tempVideo.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          if (!videoPosterUrl) {
            setVideoPosterUrl(dataUrl);
          }
        }
      } catch (err) {
        // Fallback
      }
    };
  };

  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setVideoPosterUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImageUrl = galType === 'photo' ? photoUrl : videoPosterUrl;
    const finalVideoUrl = galType === 'video' ? videoUrl : '';

    if (!galTitle) {
      setActionError('Please enter a title for the media item');
      return;
    }

    if (galType === 'photo' && !finalImageUrl) {
      setActionError('Please upload a photo file or enter an Image URL');
      return;
    }

    if (galType === 'video' && !finalVideoUrl) {
      setActionError('Please upload a video file or enter a Stream URL');
      return;
    }

    const payload = {
      type: galType,
      title: galTitle,
      titleAr: galTitleAr,
      imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80',
      videoUrl: finalVideoUrl,
      duration: galType === 'video' ? videoDuration : '',
      location: galLocation,
      description: galDescription,
      sort_order: Number(galSortOrder) || 0,
      is_active: galIsActive
    };

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(json.message || 'Gallery media item published successfully!');
        setGallery([json.data, ...gallery]);

        // Reset form
        setGalTitle('');
        setGalTitleAr('');
        setGalDescription('');
        setPhotoUrl('');
        setVideoUrl('');
        setVideoPosterUrl('');
        setVideoDuration('');
      } else {
        setActionError(json.error || 'Failed to publish gallery item');
      }
    } catch (err) {
      setActionError('Network error creating gallery item');
    }
  };

  const handleToggleGalleryActive = async (item: GalleryItem) => {
    const updatedActive = !(item.isActive ?? (item as any).is_active);
    try {
      const res = await fetch(`/api/admin/gallery/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: updatedActive, is_active: updatedActive })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(`Status updated to ${updatedActive ? 'Active' : 'Hidden'}`);
        setGallery(gallery.map(g => g.id === item.id ? { ...g, isActive: updatedActive, is_active: updatedActive } as any : g));
      } else {
        setActionError(json.error || 'Failed to update item status');
      }
    } catch (err) {
      setActionError('Network error updating item status');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery item?')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess('Gallery item deleted successfully');
        setGallery(gallery.filter(g => g.id !== id));
      } else {
        setActionError(json.error || 'Failed to delete gallery item');
      }
    } catch (err) {
      setActionError('Network error deleting gallery item');
    }
  };

  const handleUpdateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;

    try {
      const res = await fetch(`/api/admin/gallery/${editingGalleryItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingGalleryItem.title || editingGalleryItem.title_en,
          titleAr: editingGalleryItem.title_ar || editingGalleryItem.titleAr,
          description: editingGalleryItem.description,
          location: editingGalleryItem.location,
          sort_order: Number(editingGalleryItem.sort_order) || 0,
          is_active: Boolean(editingGalleryItem.is_active),
          type: editingGalleryItem.type,
          imageUrl: editingGalleryItem.imageUrl || editingGalleryItem.image_url,
          videoUrl: editingGalleryItem.videoUrl || editingGalleryItem.video_url,
          duration: editingGalleryItem.duration
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess('Gallery item updated successfully!');
        setGallery(gallery.map(g => g.id === editingGalleryItem.id ? json.data : g));
        setEditingGalleryItem(null);
      } else {
        setActionError(json.error || 'Failed to update gallery item');
      }
    } catch (err) {
      setActionError('Network error updating gallery item');
    }
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', email: '', password: '', role: 'Admin' as AdminRole });

  // SMS Campaign Form
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  // CSV Import String
  const [bulkCsvText, setBulkCsvText] = useState('');

  // Fetch / Validation Effect
  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        loadAdminData();
      } else {
        localStorage.removeItem('delta_admin_token');
        setToken(null);
        setCurrentUser(null);
      }
    } catch (err) {
      localStorage.removeItem('delta_admin_token');
      setToken(null);
      setCurrentUser(null);
    }
  };

  const loadAdminData = async () => {
    if (!token) return;
    const authHeader = { Authorization: `Bearer ${token}` };

    try {
      const [pkgRes, subRes, inqRes, galRes, smsRes] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/admin/subscribers', { headers: authHeader }),
        fetch('/api/admin/inquiries', { headers: authHeader }),
        fetch('/api/gallery'),
        fetch('/api/admin/sms/logs', { headers: authHeader })
      ]);

      const [pkgs, subs, inqs, gals, smss] = await Promise.all([
        pkgRes.json().catch(() => ({ data: [] })),
        subRes.json().catch(() => ({ data: [] })),
        inqRes.json().catch(() => ({ data: [] })),
        galRes.json().catch(() => ({ data: [] })),
        smsRes.json().catch(() => ({ data: [] }))
      ]);

      if (pkgs.data) setPackages(pkgs.data);
      if (subs.data) setSubscribers(subs.data);
      if (inqs.data) setInquiries(inqs.data);
      if (gals.data) setGallery(gals.data);
      if (smss.data) setSmsLogs(smss.data);

      // If SuperAdmin, fetch users
      if (currentUser?.role === 'SuperAdmin') {
        const uRes = await fetch('/api/admin/users', { headers: authHeader });
        const uData = await uRes.json();
        if (uData.data) setAdminUsers(uData.data);
      }
    } catch (err) {
      console.error('Failed loading admin data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('delta_admin_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        loadAdminData();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server connection error.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delta_admin_token');
    setToken(null);
    setCurrentUser(null);
    onLogout();
  };

  // Quick fill credential helper
  const quickFill = (user: string, pass: string) => {
    setLoginUsername(user);
    setLoginPassword(pass);
  };

  // Generic Save Handlers
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !token) return;

    const isEdit = !!editingPackage.id;
    const url = isEdit ? `/api/admin/packages/${editingPackage.id}` : '/api/admin/packages';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingPackage)
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setShowPackageModal(false);
        setEditingPackage(null);
        loadAdminData();
      } else {
        setActionError(data.error);
      }
    } catch (err) {
      setActionError('Error saving package');
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (!token || !confirm('Are you sure you want to archive this package?')) return;
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Package archived');
        loadAdminData();
      }
    } catch (err) {
      setActionError('Failed deleting package');
    }
  };

  const handleUpdateInquiryStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Inquiry marked as ${status}`);
        loadAdminData();
      }
    } catch (err) {
      setActionError('Failed updating inquiry status');
    }
  };

  const handleSendSmsCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage || !token) return;

    setSmsSending(true);
    try {
      const res = await fetch('/api/admin/sms/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: smsMessage })
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setSmsMessage('');
        loadAdminData();
      } else {
        setActionError(data.error);
      }
    } catch (err) {
      setActionError('Failed broadcasting SMS campaign');
    } finally {
      setSmsSending(false);
    }
  };

  const handleBulkCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText || !token) return;

    try {
      const res = await fetch('/api/admin/subscribers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ csvData: bulkCsvText })
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setBulkCsvText('');
        loadAdminData();
      }
    } catch (err) {
      setActionError('CSV Import error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUserForm)
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess('Admin user created successfully');
        setShowUserModal(false);
        setNewUserForm({ username: '', email: '', password: '', role: 'Admin' });
        loadAdminData();
      } else {
        setActionError(data.error);
      }
    } catch (err) {
      setActionError('Error creating user');
    }
  };

  // Render Login View if not authenticated
  if (!token || !currentUser) {
    return (
      <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4 text-slate-900">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Delta Admin Portal</h2>
            <p className="text-xs text-slate-500">
              Protected authentication gateway for travel agency operations.
            </p>
          </div>

          {/* Quick Credential Fill Buttons */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              ⚡ Quick Select Test Accounts
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => quickFill('superadmin', 'admin123')}
                className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-lg border border-slate-300 font-bold shadow-xs"
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin', 'admin123')}
                className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-lg border border-slate-300 font-bold shadow-xs"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => quickFill('editor', 'editor123')}
                className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-lg border border-slate-300 font-bold shadow-xs"
              >
                Editor
              </button>
            </div>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username / Email</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : 'Sign In to Admin Panel'}</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Admin Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900 font-serif">Delta Travel Operations Hub</h1>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">Logged in as {currentUser.username} ({currentUser.email})</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center space-x-2 self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'metrics', label: 'Metrics Overview', icon: BarChart2 },
            { id: 'packages', label: `Packages (${packages.length})`, icon: Layers },
            { id: 'subscribers', label: `Subscribers (${subscribers.length})`, icon: Smartphone },
            { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: Mail },
            { id: 'gallery', label: `Gallery (${gallery.length})`, icon: ImageIcon },
            ...(currentUser.role === 'SuperAdmin' ? [{ id: 'users', label: 'Admin RBAC Users', icon: Users }] : []),
            { id: 'swagger', label: 'Swagger API Tester', icon: FileCode }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: METRICS OVERVIEW */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Total Active Packages</span>
                <span className="text-3xl font-black text-amber-600 font-serif mt-1 block">{packages.length}</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">SMS Subscribers</span>
                <span className="text-3xl font-black text-emerald-600 font-serif mt-1 block">{subscribers.length}</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Inquiries Submitted</span>
                <span className="text-3xl font-black text-teal-600 font-serif mt-1 block">{inquiries.length}</span>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Twilio SMS Logs</span>
                <span className="text-3xl font-black text-amber-700 font-serif mt-1 block">{smsLogs.length}</span>
              </div>
            </div>

            {/* Package Click Lead Analytics */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-serif">Package Click-To-Chat Analytics</h3>
              <div className="space-y-3">
                {packages.map((p: any) => (
                  <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.titleEn || p.title_en}</span>
                      <span className="text-slate-500 block">{p.category} | ${p.priceUsd ?? p.price_usd} USD</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-full">
                      {p.whatsappClicks ?? p.clicks_count ?? 0} Leads Triggered
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PACKAGES CRUD */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-serif">Package Management</h3>
              <button
                onClick={() => {
                  setEditingPackage({
                    titleEn: '', titleAr: '', titleAm: '', category: 'Standard',
                    priceUsd: 1500, durationDays: 10, inclusions: ['Flight Included', 'Visa Included'],
                    itinerary: [{ day: 1, titleEn: 'Arrival', titleAr: 'الوصول', titleAm: 'መድረስ', descriptionEn: 'Arrival in Jeddah', descriptionAr: 'الوصول لجدة', descriptionAm: 'ጅዳ መድረስ' }]
                  });
                  setShowPackageModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Package</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Package Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price (USD)</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">WhatsApp Clicks</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {packages.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{p.titleEn || p.title_en}</td>
                      <td className="p-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-amber-400">{p.category}</span></td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">${p.priceUsd ?? p.price_usd}</td>
                      <td className="p-3">{p.durationDays ?? p.duration_days} Days</td>
                      <td className="p-3 text-emerald-400 font-bold font-mono">{p.whatsappClicks ?? p.clicks_count ?? 0} clicks</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingPackage(p);
                            setShowPackageModal(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(p.id)}
                          className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: VISA REQUIREMENTS */}
        {activeTab === 'visas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-serif">Visa Requirements Rules</h3>
              <button
                onClick={() => {
                  setEditingVisa({
                    nationality: '', visa_type: 'Saudi Tourist E-Visa',
                    required_documents: ['Passport copy 6+ months', 'Passport Photo'],
                    processing_time_days: 3, price_usd: 150
                  });
                  setShowVisaModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Visa Rule</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nationality</th>
                    <th className="p-3">Visa Type</th>
                    <th className="p-3">Processing Days</th>
                    <th className="p-3">Fee (USD)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {visas.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{v.nationality}</td>
                      <td className="p-3">{v.visa_type}</td>
                      <td className="p-3">{v.processing_time_days} Days</td>
                      <td className="p-3 font-mono text-amber-400 font-bold">${v.price_usd}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingVisa(v);
                            setShowVisaModal(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PARTNERS */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Airline & Hotel Partners</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partners.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {p.type}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{p.name}</h4>
                  </div>
                  <span className="text-amber-400 font-semibold">{p.is_featured ? 'Featured' : 'Standard'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SUBSCRIBERS & TWILIO SMS CAMPAIGN */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            
            {/* Twilio Campaign Composer */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Radio className="w-5 h-5" />
                <span>Twilio SMS Broadcast Campaign Composer</span>
              </div>
              <form onSubmit={handleSendSmsCampaign} className="space-y-3 text-xs">
                <textarea
                  rows={3}
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Type promotional SMS broadcast message (e.g. 'Delta Travel Alert: 20% Early Bird Discount for Ramadan Umrah packages! Call +251911223344')..."
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Targeting {subscribers.filter(s => s.opt_in_status).length} Active Subscribed Mobile Numbers</span>
                  <button
                    type="submit"
                    disabled={smsSending}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{smsSending ? 'Sending...' : 'Broadcast SMS Campaign'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* CSV Import */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-teal-400 font-bold">
                <Upload className="w-4 h-4" />
                <span>Bulk CSV Subscriber Import</span>
              </div>
              <form onSubmit={handleBulkCsvImport} className="space-y-2">
                <textarea
                  rows={2}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="+251911000111, pilgrim1@example.com, Web Bulk&#10;+251911000222, pilgrim2@example.com, Phone Directory"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 font-mono"
                />
                <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg">
                  Import CSV Subscribers
                </button>
              </form>
            </div>

            {/* Subscriber List Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-serif">Subscriber List</h3>
              <a
                href="/api/admin/subscribers/export"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Source Channel</th>
                    <th className="p-3">Opt-In</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {subscribers.map((s: any) => {
                    const isOptIn = s.optInStatus ?? s.opt_in_status ?? true;
                    const dateVal = s.createdAt || s.created_at || new Date().toISOString();
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-emerald-400">{s.phone}</td>
                        <td className="p-3 text-slate-300">{s.email || '-'}</td>
                        <td className="p-3 font-sans text-slate-400">{s.channel}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOptIn ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                            {isOptIn ? 'Active' : 'Opted Out'}
                          </span>
                        </td>
                        <td className="p-3 font-sans text-slate-400">{new Date(dateVal).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 6: INQUIRIES DESK */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Customer Inquiries Desk</h3>
            <div className="space-y-3">
              {inquiries.map((inq: any) => (
                <div key={inq.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{inq.fullName || inq.full_name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{inq.phone} | {inq.email || 'No email'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        inq.status === 'New' ? 'bg-amber-500 text-slate-950' :
                        inq.status === 'Contacted' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        Status: {inq.status}
                      </span>
                      <div className="flex space-x-1">
                        {['New', 'Contacted', 'Resolved'].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateInquiryStatus(inq.id, st)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 rounded"
                          >
                            Mark {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-400 block">{inq.subject}</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{inq.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: GALLERY MANAGER (PHOTOS & VIDEOS) */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Holy Gallery Manager (Photos & Videos)</h3>
                <p className="text-xs text-slate-400">
                  Upload photos and videos directly from your device or stream URLs. Automatically calculate video durations, manage descriptions, location tags, ordering, and active status.
                </p>
              </div>
            </div>

            {/* Add Photo/Video Form with Conditional Rendering */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Publish New Holy Media Item</span>
                </h4>

                {/* Media Type Segmented Toggle */}
                <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGalType('photo')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      galType === 'photo'
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photo 📸</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalType('video')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      galType === 'video'
                        ? 'bg-rose-500 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video 🎥</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateGalleryItem} className="space-y-4 text-xs">
                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Title (English) *</label>
                    <input
                      required
                      type="text"
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder={galType === 'photo' ? "e.g. Sunset Tawaf at Kaaba" : "e.g. Friday Khutbah Live Stream"}
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Title (Arabic)</label>
                    <input
                      type="text"
                      value={galTitleAr}
                      onChange={(e) => setGalTitleAr(e.target.value)}
                      placeholder="e.g. الطواف حول الكعبة المشرفة"
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                    />
                  </div>
                </div>

                {/* CONDITIONAL FIELD RENDERING: PHOTO ONLY */}
                {galType === 'photo' && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-amber-400 font-bold">Photo Image File / Source *</label>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPhotoSourceMode('upload')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            photoSourceMode === 'upload' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          Upload from Device
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoSourceMode('url')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            photoSourceMode === 'url' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          Enter Image URL
                        </button>
                      </div>
                    </div>

                    {photoSourceMode === 'upload' ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileUpload}
                          className="w-full text-slate-300 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
                        />
                        {photoUrl && (
                          <div className="flex items-center space-x-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                            <img src={photoUrl} alt="Preview" className="w-16 h-12 object-cover rounded-md" />
                            <span className="text-[11px] text-emerald-400 font-bold">✓ Photo uploaded from device ready</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                      />
                    )}
                  </div>
                )}

                {/* CONDITIONAL FIELD RENDERING: VIDEO ONLY */}
                {galType === 'video' && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-rose-900/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-rose-400 font-bold">Video File / Stream Source *</label>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setVideoSourceMode('upload')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            videoSourceMode === 'upload' ? 'bg-rose-500 text-white' : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          Upload Video File
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSourceMode('url')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            videoSourceMode === 'url' ? 'bg-rose-500 text-white' : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          Video Stream URL
                        </button>
                      </div>
                    </div>

                    {videoSourceMode === 'upload' ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="w-full text-slate-300 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
                        />
                        {videoUrl && (
                          <p className="text-[11px] text-emerald-400 font-bold">✓ Video file selected from device</p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setVideoUrl(url);
                          if (url && (url.startsWith('http') || url.startsWith('blob'))) {
                            autoCalculateVideoDuration(url);
                          }
                        }}
                        placeholder="https://cdn.example.com/stream.mp4 or HLS stream URL"
                        className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                      />
                    )}

                    {/* Video Poster Thumbnail & Auto Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-300 font-bold">Video Thumbnail / Poster Image</label>
                          <div className="flex space-x-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setVideoPosterMode('upload')}
                              className={`px-2 py-0.5 rounded ${videoPosterMode === 'upload' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                            >
                              Device
                            </button>
                            <button
                              type="button"
                              onClick={() => setVideoPosterMode('url')}
                              className={`px-2 py-0.5 rounded ${videoPosterMode === 'url' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                            >
                              URL
                            </button>
                          </div>
                        </div>

                        {videoPosterMode === 'upload' ? (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterFileUpload}
                            className="w-full text-slate-300 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer bg-slate-950 p-1.5 rounded-xl border border-slate-800"
                          />
                        ) : (
                          <input
                            type="text"
                            value={videoPosterUrl}
                            onChange={(e) => setVideoPosterUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                          />
                        )}
                      </div>

                      {/* Auto Calculated Duration */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-300 font-bold">Video Duration</label>
                          {isCalculatingDuration ? (
                            <span className="text-[10px] text-amber-400 font-mono animate-pulse">Calculating...</span>
                          ) : videoDuration ? (
                            <span className="text-[10px] text-emerald-400 font-bold">⚡ Auto-Detected</span>
                          ) : null}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                            placeholder="e.g. 3:45"
                            className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-mono"
                          />
                          {videoUrl && (
                            <button
                              type="button"
                              onClick={() => autoCalculateVideoDuration(videoUrl)}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[11px] whitespace-nowrap"
                            >
                              Recalculate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMMON METADATA: Location, Ordering Index, Active Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Location Tag</label>
                    <input
                      type="text"
                      value={galLocation}
                      onChange={(e) => setGalLocation(e.target.value)}
                      placeholder="e.g. Makkah Al-Mukarramah"
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Ordering Index (`sort_order`)</label>
                    <input
                      type="number"
                      value={galSortOrder}
                      onChange={(e) => setGalSortOrder(Number(e.target.value))}
                      placeholder="1"
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Active Status</label>
                    <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 h-[42px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={galIsActive}
                          onChange={(e) => setGalIsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <span className={`font-bold ${galIsActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {galIsActive ? 'Active (Public)' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Description (English / Arabic)</label>
                  <textarea
                    rows={2}
                    value={galDescription}
                    onChange={(e) => setGalDescription(e.target.value)}
                    placeholder="Enter detailed description of the holy location or pilgrim moment..."
                    className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center space-x-2 shadow-lg transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Publish {galType === 'photo' ? 'Photo' : 'Video'} Item</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Gallery Items Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300">Published Holy Media Items ({gallery.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map(g => (
                  <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3.5 space-y-3 shadow-xl relative group flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-40 overflow-hidden rounded-xl relative bg-black">
                        <img
                          src={g.image_url || g.imageUrl}
                          alt={g.title_en || g.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                        
                        {/* Type Tag */}
                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                          g.type === 'video' ? 'bg-rose-600 text-white shadow' : 'bg-slate-950/90 text-amber-400 border border-slate-700'
                        }`}>
                          {g.type === 'video' ? (
                            <>
                              <Video className="w-3 h-3" />
                              <span>Video</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3" />
                              <span>Photo</span>
                            </>
                          )}
                        </span>

                        {/* Active Status Badge */}
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          g.is_active ? 'bg-emerald-500/90 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {g.is_active ? 'Active' : 'Hidden'}
                        </span>

                        {/* Duration Badge if video */}
                        {g.duration && (
                          <span className="absolute bottom-2 right-2 bg-slate-950/90 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded">
                            {g.duration}
                          </span>
                        )}

                        {/* Order Index Badge */}
                        <span className="absolute bottom-2 left-2 bg-slate-950/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          Order #{g.sort_order || 0}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{g.title || g.title_en}</h4>
                        {g.title_ar && <p className="text-[11px] text-amber-400/90 line-clamp-1 font-serif">{g.title_ar}</p>}
                      </div>

                      {g.location && (
                        <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{g.location}</span>
                        </p>
                      )}

                      {g.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                          {g.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        onClick={() => handleToggleGalleryActive(g)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                          g.is_active
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {g.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => setEditingGalleryItem(g)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                        title="Edit Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteGalleryItem(g.id)}
                        className="p-1.5 bg-rose-900/30 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/40"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SUPERADMIN USER MANAGEMENT & RBAC */}
        {activeTab === 'users' && currentUser.role === 'SuperAdmin' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-serif">Admin Accounts & RBAC Roles</h3>
              <button
                onClick={() => setShowUserModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Create Admin User</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Username</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{u.username}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <span className="bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: SWAGGER API TESTER */}
        {activeTab === 'swagger' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Swagger OpenAPI Interactive Tester</h3>
                <p className="text-xs text-slate-400">REST API specification hosted at /api-docs and /api-docs/openapi.json</p>
              </div>
              <a
                href="/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2"
              >
                <FileCode className="w-4 h-4" />
                <span>Open Raw Swagger UI</span>
              </a>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 space-y-2 overflow-x-auto">
              <p className="text-slate-300 font-bold">Public & Admin Endpoint Cheatsheet:</p>
              <p>GET  /api/packages (Public listing)</p>
              <p>GET  /api/packages/:id (Package details & click log)</p>
              <p>POST /api/admin/packages (Bearer JWT required)</p>
              <p>GET  /api/visa-info (Public visa requirements)</p>
              <p>POST /api/subscribers (Public SMS alert signup)</p>
              <p>POST /api/inquiries (Public contact form submission)</p>
              <p>POST /api/auth/login (Admin JWT authentication)</p>
            </div>
          </div>
        )}

      </div>

      {/* Package Edit/Create Modal */}
      {showPackageModal && editingPackage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white font-serif">
              {editingPackage.id ? 'Edit Package' : 'Create New Umrah Package'}
            </h3>
            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Title (English) *</label>
                <input
                  type="text"
                  required
                  value={(editingPackage as any).titleEn || (editingPackage as any).title_en || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, titleEn: e.target.value, title_en: e.target.value } as any)}
                  className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Title (Arabic)</label>
                  <input
                    type="text"
                    value={(editingPackage as any).titleAr || (editingPackage as any).title_ar || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, titleAr: e.target.value, title_ar: e.target.value } as any)}
                    className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Title (Amharic)</label>
                  <input
                    type="text"
                    value={(editingPackage as any).titleAm || (editingPackage as any).title_am || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, titleAm: e.target.value, title_am: e.target.value } as any)}
                    className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={editingPackage.category || 'Standard'}
                    onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value as any })}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-medium"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    required
                    value={(editingPackage as any).priceUsd ?? (editingPackage as any).price_usd ?? 1500}
                    onChange={(e) => setEditingPackage({ ...editingPackage, priceUsd: Number(e.target.value), price_usd: Number(e.target.value) } as any)}
                    className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={(editingPackage as any).durationDays ?? (editingPackage as any).duration_days ?? 10}
                    onChange={(e) => setEditingPackage({ ...editingPackage, durationDays: Number(e.target.value), duration_days: Number(e.target.value) } as any)}
                    className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Package Image URL</label>
                <input
                  type="text"
                  value={(editingPackage as any).imageUrl || (editingPackage as any).image_url || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, imageUrl: e.target.value, image_url: e.target.value } as any)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-serif">Create New Admin User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-slate-950 text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Role Permission</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as AdminRole })}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-medium"
                >
                  <option value="Admin">Admin (Full CRUD)</option>
                  <option value="Editor">Editor (Edit content only)</option>
                  <option value="SuperAdmin">SuperAdmin (Full Control)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Gallery Item Modal */}
      {editingGalleryItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif">Edit Gallery Media Item</h3>
              <button
                onClick={() => setEditingGalleryItem(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateGalleryItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingGalleryItem.title || editingGalleryItem.title_en || ''}
                    onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, title: e.target.value, title_en: e.target.value })}
                    className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Title (Arabic)</label>
                  <input
                    type="text"
                    value={editingGalleryItem.title_ar || editingGalleryItem.titleAr || ''}
                    onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, title_ar: e.target.value, titleAr: e.target.value })}
                    className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Media Type</label>
                <select
                  value={editingGalleryItem.type || 'photo'}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, type: e.target.value as 'photo' | 'video' })}
                  className="w-full bg-slate-950 text-white font-medium p-2.5 rounded-xl border border-slate-800"
                >
                  <option value="photo">Photo 📸</option>
                  <option value="video">Video 🎥</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Image / Poster Thumbnail URL</label>
                <input
                  type="text"
                  value={editingGalleryItem.imageUrl || editingGalleryItem.image_url || ''}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, imageUrl: e.target.value, image_url: e.target.value })}
                  className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              {editingGalleryItem.type === 'video' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Video Stream URL</label>
                    <input
                      type="text"
                      value={editingGalleryItem.videoUrl || editingGalleryItem.video_url || ''}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, videoUrl: e.target.value, video_url: e.target.value })}
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Duration</label>
                    <input
                      type="text"
                      value={editingGalleryItem.duration || ''}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, duration: e.target.value })}
                      className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Location Tag</label>
                  <input
                    type="text"
                    value={editingGalleryItem.location || ''}
                    onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, location: e.target.value })}
                    className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ordering Index (`sort_order`)</label>
                  <input
                    type="number"
                    value={editingGalleryItem.sort_order ?? 0}
                    onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Active Status</label>
                <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingGalleryItem.is_active)}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className={`font-bold ${editingGalleryItem.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {editingGalleryItem.is_active ? 'Active (Visible on public site)' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingGalleryItem.description || ''}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, description: e.target.value })}
                  className="w-full bg-slate-950 text-white font-medium placeholder-slate-500 p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGalleryItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
