/**
 * Delta Travel & Tour Types Definitions (Standardized camelCase)
 */

export type Language = 'en' | 'ar' | 'am';

export type PackageCategory = 'Economy' | 'Standard' | 'Premium' | 'VIP';

export interface ItineraryDay {
  day: number;
  titleEn: string;
  titleAr: string;
  titleAm: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionAm: string;
}

export interface TravelPackage {
  id: string | number;
  titleEn: string;
  titleAr: string;
  titleAm?: string;
  category: PackageCategory;
  priceUsd: number;
  priceEtb?: number;
  priceSar?: number;
  durationDays: number;
  departureCity?: string;
  inclusions: string[];
  availableDates: string[];
  itinerary: ItineraryDay[];
  imageUrl: string;
  isActive: boolean;
  whatsappClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string | number;
  phone: string;
  email?: string;
  name?: string;
  channel?: string;
  packageInterestId?: string | number | null;
  optInStatus: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type InquiryStatus = 'New' | 'Contacted' | 'Resolved';

export interface Inquiry {
  id: string | number;
  fullName: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  source?: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
}

export type GalleryType = 'photo' | 'video';

export interface GalleryItem {
  id: string | number;
  type: GalleryType;
  titleEn: string;
  titleAr?: string;
  imageUrl: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  location?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  uploadDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// Only one role now: Admin
export type AdminRole = 'Admin';

export interface AdminUser {
  id: string | number;
  username: string;
  email: string;
  passwordHash?: string;
  role: AdminRole;
  lastLogin?: string | null;
  isActive: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsLog {
  id: string | number;
  phone: string;
  message: string;
  status: 'Delivered' | 'Failed' | 'Queued';
  campaignName?: string;
  sentAt: string;
}

export interface AuthTokenPayload {
  id: string | number;
  username: string;
  email: string;
  role: AdminRole;
}

export interface ApiResponse<T = any> {
  status?: 'success' | 'error';
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
  error?: string;
  meta?: any;
}