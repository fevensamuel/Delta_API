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
export type PriceType = 'single' | 'range' | 'perPerson';
export type DiscountType = 'percentage' | 'fixed';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
}

// Person/Group pricing for per-person packages
export interface PersonPrice {
  id: string;
  label: string; // e.g., "Adult", "Child (6-12)", "Senior (60+)"
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  minAge?: number;
  maxAge?: number;
  isDefault?: boolean;
  isActive: boolean;
}

// Discount structure
export interface Discount {
  id: string;
  type: DiscountType; // 'percentage' or 'fixed'
  value: number; // percentage (e.g., 15) or fixed amount (e.g., 50)
  discountedPriceUsd?: number; // Calculated price after discount
  discountedPriceEtb?: number;
  discountedPriceSar?: number;
  label: string; // e.g., "Family Discount", "Group Discount", "Senior Citizens"
  description?: string;
  minPersons?: number; // Minimum persons for group discount
  maxPersons?: number; // Maximum persons for group discount
  ageGroup?: string; // e.g., "0-12", "13-17", "60+"
  isActive: boolean;
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
  textAr?: string;
  packageTaken?: string;
  date: string;
  avatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
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

// TravelPackage Types - UPDATED with new pricing
export interface TravelPackage {
  id: string;
  titleEn: string;
  titleAr: string;
  titleAm: string;
  category: PackageCategory;
  
  // Main pricing
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  priceType: PriceType; // 'single', 'range', 'perPerson'
  
  // Price range (if priceType === 'range')
  priceUsdMin?: number;
  priceUsdMax?: number;
  priceEtbMin?: number;
  priceEtbMax?: number;
  priceSarMin?: number;
  priceSarMax?: number;
  
  // Per person pricing (if priceType === 'perPerson')
  basePriceUsd?: number;
  basePriceEtb?: number;
  basePriceSar?: number;
  persons?: PersonPrice[];
  
  // Discounts
  discounts?: Discount[];
  
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

export interface OfficeImage {
  id: string;
  title?: string;
  imageUrl: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}