// src/types.ts
export type Language = 'EN' | 'AR' | 'AM';

export type Currency = 'USD' | 'ETB' | 'SAR';

export type PageId = 
  | 'home' 
  | 'about' 
  | 'packages' 
  | 'hotels-flights' 
  | 'gallery' 
  | 'faqs'
  | 'contact';

export type PackageCategory = 'Economy' | 'Standard' | 'Premium' | 'VIP';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
}

export interface PackageItem {
  id: string;
  titleEn: string;
  titleAr: string;
  titleAm?: string;
  category: PackageCategory;
  price: number;
  priceUsd?: number;
  priceEtb?: number;
  priceSar?: number;
  durationDays: number;
  departureCity: string;
  inclusions: string[];
  exclusions?: string[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  popular?: boolean;
  image: string;
  imageUrl?: string;
  availableDates: string[];
  itinerary: ItineraryDay[];
  whatsappClicks?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Standalone FAQ Item (no packageId)
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Keep PackageFAQ for backward compatibility if needed
export interface PackageFAQ {
  id: string;
  packageId: string;
  questions: FAQItem[];
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
  icon: string;
}

export interface PriceLog {
  id: string;
  packageId: string;
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  previousPriceUsd: number | null;
  previousPriceEtb: number | null;
  previousPriceSar: number | null;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SmsSubscriber {
  id?: string;
  phone: string;
  email?: string;
  channel?: string;
  packageInterestId?: string;
  subscribedAt?: string;
}

export interface InquiryForm {
  fullName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  source?: string;
}

export interface GalleryItem {
  id: string;
  titleEn: string;
  titleAr: string;
  type: 'photo' | 'video';
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: string;
  location: string;
  description: string;
  isActive?: boolean;
  sortOrder?: number;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  textAr: string;
  packageTaken: string;
  date: string;
  avatar: string;
}

// Admin Types
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  lastLogin: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = 'Admin' | 'Manager' | 'Editor' | 'Viewer';

export interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
}

// Inquiry Types
export interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = 'New' | 'Contacted' | 'Resolved';

// Subscriber Types
export interface Subscriber {
  id: string;
  phone: string;
  email: string;
  name: string;
  channel: string;
  packageInterestId: string | null;
  optInStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

// SmsLog Types
export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  campaignName: string;
  sentAt: string;
}

// TravelPackage Types
export interface TravelPackage {
  id: string;
  titleEn: string;
  titleAr: string;
  titleAm: string;
  category: PackageCategory;
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  durationDays: number;
  departureCity: string;
  inclusions: string[];
  availableDates: string[];
  itinerary: ItineraryDay[];
  imageUrl: string;
  isActive: boolean;
  whatsappClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}