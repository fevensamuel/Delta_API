// src/types.ts

// ============================================================
// ADMIN USERS
// ============================================================

/**
 * Admin role — only two levels:
 * - SuperAdmin: full access; can manage other admins.
 * - Admin: access is limited to the pages/permissions granted by a SuperAdmin.
 */
export type AdminRole = 'SuperAdmin' | 'Admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  permissions: string[];
  lastLogin: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
}

// ============================================================
// PACKAGES
// ============================================================

export type PackageCategory = 'Economy' | 'Standard' | 'Premium' | 'VIP';
export type PriceType = 'single' | 'range' | 'perPerson';
export type DiscountType = 'percentage' | 'fixed';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  image?: string;
}

export interface PersonPrice {
  id: string;
  label: string;
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  minAge?: number;
  maxAge?: number;
  isDefault?: boolean;
  isActive: boolean;
}

export interface Discount {
  id: string;
  type: DiscountType;
  value: number;
  discountedPriceUsd?: number;
  discountedPriceEtb?: number;
  discountedPriceSar?: number;
  label: string;
  labelAr?: string;
  description?: string;
  minPersons?: number;
  maxPersons?: number;
  ageGroup?: string;
  ageMin?: number;
  ageMax?: number;
  discountType: 'age' | 'group' | 'general';
  isActive: boolean;
}

export interface TravelPackage {
  id: string;
  titleEn: string;
  titleAr: string;
  titleAm: string;
  category: string;

  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  priceType: PriceType;

  priceUsdMin?: number;
  priceUsdMax?: number;
  priceEtbMin?: number;
  priceEtbMax?: number;
  priceSarMin?: number;
  priceSarMax?: number;

  basePriceUsd?: number;
  basePriceEtb?: number;
  basePriceSar?: number;
  persons?: PersonPrice[];

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

// ============================================================
// GALLERY
// ============================================================

export interface GalleryItem {
  id: string;
  type: 'photo' | 'video';
  titleEn: string;
  titleAr: string;
  imageUrl: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  location: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// SUBSCRIBERS
// ============================================================

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

// ============================================================
// INQUIRIES
// ============================================================

export type InquiryStatus = 'New' | 'Contacted' | 'Resolved';

export interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// FLIGHT INQUIRIES
// ============================================================

export type FlightInquiryStatus = 'New' | 'Booked' | 'Cancelled';
export type TripType = 'One Way' | 'Round Trip';

export interface FlightInquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  fromCity: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: string;
  passengers: number;
  cabinClass: string;
  preferredAirline: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// SMS
// ============================================================

export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  campaignName: string | null;
  sentAt: string;
}

// ============================================================
// FAQS
// ============================================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// SOCIAL LINKS
// ============================================================

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// TEAM MEMBERS
// ============================================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// OFFICE IMAGES
// ============================================================

export interface OfficeImage {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// TESTIMONIALS
// ============================================================

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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PRICE LOGS
// ============================================================

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

// ============================================================
// AUDIO TRACKS
// ============================================================

export interface AudioTrack {
  id: string;
  titleEn: string;
  titleAm: string;
  titleAr: string;
  audioUrl: string;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CONTACT SETTINGS
// ============================================================

export interface ContactSettings {
  id: number;
  whatsappNumber: string;
  phoneNumber: string;
  smsNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}