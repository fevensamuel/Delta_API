import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import type {
  AdminUser,
  GalleryItem,
  Inquiry,
  SmsLog,
  Subscriber,
  TravelPackage,
  SocialLink,
  PriceLog,
  FAQItem,
  TeamMember,
  OfficeImage,
  Testimonial,
  PackageCategory,
  PriceType
} from '../types.js';

// Only one admin user with password "admin123"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

// Paths
const DATA_FILE = path.join(process.cwd(), 'data.json');

interface DatabaseData {
  packages: TravelPackage[];
  subscribers: Subscriber[];
  inquiries: Inquiry[];
  gallery: GalleryItem[];
  adminUsers: AdminUser[];
  smsLogs: SmsLog[];
  socialLinks: SocialLink[];
  priceLogs: PriceLog[];
  faqs: FAQItem[];
  teamMembers: TeamMember[];
  officeImages: OfficeImage[];
  testimonials: Testimonial[];
}

class DatabaseStore {
  public packages: TravelPackage[] = [];
  public subscribers: Subscriber[] = [];
  public inquiries: Inquiry[] = [];
  public gallery: GalleryItem[] = [];
  public adminUsers: AdminUser[] = [];
  public smsLogs: SmsLog[] = [];
  public socialLinks: SocialLink[] = [];
  public priceLogs: PriceLog[] = [];
  public faqs: FAQItem[] = [];
  public teamMembers: TeamMember[] = [];
  public officeImages: OfficeImage[] = [];
  public testimonials: Testimonial[] = [];

  constructor() {
    this.loadFromFile();
    if (this.packages.length === 0 && this.gallery.length === 0 && this.adminUsers.length === 0) {
      this.seedDefaults();
      this.saveToFile();
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data: DatabaseData = JSON.parse(raw);
        this.packages = data.packages || [];
        this.subscribers = data.subscribers || [];
        this.inquiries = data.inquiries || [];
        this.gallery = data.gallery || [];
        this.adminUsers = data.adminUsers || [];
        this.smsLogs = data.smsLogs || [];
        this.socialLinks = data.socialLinks || [];
        this.priceLogs = data.priceLogs || [];
        this.faqs = data.faqs || [];
        this.teamMembers = data.teamMembers || [];
        this.officeImages = data.officeImages || [];
        this.testimonials = data.testimonials || [];
        console.log(`📂 Loaded ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members, ${this.officeImages.length} office images, ${this.testimonials.length} testimonials from data.json`);
      } else {
        console.log('📂 No data.json found, seeding defaults...');
        this.seedDefaults();
        this.saveToFile();
      }
    } catch (err) {
      console.error('❌ Error loading data file, seeding defaults:', err);
      this.seedDefaults();
      this.saveToFile();
    }
  }

  public saveToFile() {
    try {
      const data: DatabaseData = {
        packages: this.packages,
        subscribers: this.subscribers,
        inquiries: this.inquiries,
        gallery: this.gallery,
        adminUsers: this.adminUsers,
        smsLogs: this.smsLogs,
        socialLinks: this.socialLinks,
        priceLogs: this.priceLogs,
        faqs: this.faqs,
        teamMembers: this.teamMembers,
        officeImages: this.officeImages,
        testimonials: this.testimonials,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Saved ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members, ${this.officeImages.length} office images, ${this.testimonials.length} testimonials to data.json`);
    } catch (err) {
      console.error('❌ Error saving data file:', err);
    }
  }

  private seedDefaults() {
    const now = new Date().toISOString();

    // All arrays empty - data will be added via admin page
    
    // Default social links
    this.socialLinks = [];

    // Default price logs
    this.priceLogs = [];

    // Default FAQs 
    this.faqs = [];

    // Default Team Members
    this.teamMembers = [];

    // Default Packages - EMPTY
    this.packages = [];

    // Default Office Images - EMPTY
    this.officeImages = [];

    // Default Testimonials - EMPTY
    this.testimonials = [];

    // Subscribers - EMPTY
    this.subscribers = [];

    // Inquiries - EMPTY
    this.inquiries = [];

    // Gallery - EMPTY
    this.gallery = [];

    // Admin users – only one default admin
    this.adminUsers = [
      {
        id: 'usr-1',
        username: 'admin',
        email: 'admin@deltatravel.com',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Admin',
        lastLogin: null,
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      }
    ];

    // SMS logs - EMPTY
    this.smsLogs = [];
  }

  // ===== ADD METHODS =====
  addPackage(pkg: TravelPackage) {
    this.packages.unshift(pkg);
    this.saveToFile();
  }

  addGalleryItem(item: GalleryItem) {
    // Ensure thumbnailUrl is set for videos
    if (item.type === 'video' && !item.thumbnailUrl) {
      item.thumbnailUrl = item.imageUrl || '';
    }
    this.gallery.unshift(item);
    this.saveToFile();
  }

  addSubscriber(sub: Subscriber) {
    this.subscribers.unshift(sub);
    this.saveToFile();
  }

  addInquiry(inquiry: Inquiry) {
    this.inquiries.unshift(inquiry);
    this.saveToFile();
  }

  addSmsLog(log: SmsLog) {
    this.smsLogs.unshift(log);
    this.saveToFile();
  }

  addAdminUser(user: AdminUser) {
    this.adminUsers.push(user);
    this.saveToFile();
  }

  addSocialLink(link: SocialLink) {
    this.socialLinks.push(link);
    this.saveToFile();
  }

  addPriceLog(log: PriceLog) {
    this.priceLogs.unshift(log);
    this.saveToFile();
  }

  // ===== FAQ METHODS =====
  addFaq(faq: FAQItem) {
    this.faqs.push(faq);
    this.saveToFile();
  }

  updateFaq(index: number, faq: FAQItem) {
    this.faqs[index] = faq;
    this.saveToFile();
  }

  deleteFaq(index: number) {
    this.faqs.splice(index, 1);
    this.saveToFile();
  }

  // ===== TEAM MEMBER METHODS =====
  addTeamMember(member: TeamMember) {
    this.teamMembers.push(member);
    this.saveToFile();
  }

  updateTeamMember(index: number, member: TeamMember) {
    this.teamMembers[index] = member;
    this.saveToFile();
  }

  deleteTeamMember(index: number) {
    this.teamMembers.splice(index, 1);
    this.saveToFile();
  }

  // ===== OFFICE IMAGE METHODS =====
  addOfficeImage(image: OfficeImage) {
    this.officeImages.push(image);
    this.saveToFile();
  }

  updateOfficeImage(index: number, image: OfficeImage) {
    this.officeImages[index] = image;
    this.saveToFile();
  }

  deleteOfficeImage(index: number) {
    this.officeImages.splice(index, 1);
    this.saveToFile();
  }

  // ===== TESTIMONIAL METHODS =====
  addTestimonial(testimonial: Testimonial) {
    this.testimonials.push(testimonial);
    this.saveToFile();
  }

  updateTestimonial(index: number, testimonial: Testimonial) {
    this.testimonials[index] = testimonial;
    this.saveToFile();
  }

  deleteTestimonial(index: number) {
    this.testimonials.splice(index, 1);
    this.saveToFile();
  }

  // ===== UPDATE METHODS =====
  updatePackage(index: number, pkg: TravelPackage, reason?: string) {
    // Check if price changed
    const existing = this.packages[index];
    if (existing) {
      const priceChanged = existing.priceUsd !== pkg.priceUsd || 
                          existing.priceEtb !== pkg.priceEtb || 
                          existing.priceSar !== pkg.priceSar;
      
      if (priceChanged) {
        // Create price log with ETB as primary
        const log: PriceLog = {
          id: `pl-${Date.now()}`,
          packageId: pkg.id,
          priceUsd: pkg.priceUsd,
          priceEtb: pkg.priceEtb,
          priceSar: pkg.priceSar,
          previousPriceUsd: existing.priceUsd,
          previousPriceEtb: existing.priceEtb,
          previousPriceSar: existing.priceSar,
          reason: reason || 'Price updated via admin',
          updatedBy: 'Admin',
          updatedAt: new Date().toISOString()
        };
        this.priceLogs.unshift(log);
        console.log(`📝 Price log created for ${pkg.id}: ETB ${existing.priceEtb} -> ETB ${pkg.priceEtb}`);
      }
    }
    
    this.packages[index] = pkg;
    this.saveToFile();
  }

  updateGalleryItem(index: number, item: GalleryItem) {
    this.gallery[index] = item;
    this.saveToFile();
  }

  updateSubscriber(index: number, sub: Subscriber) {
    this.subscribers[index] = sub;
    this.saveToFile();
  }

  updateInquiry(index: number, inquiry: Inquiry) {
    this.inquiries[index] = inquiry;
    this.saveToFile();
  }

  updateAdminUser(index: number, user: AdminUser) {
    this.adminUsers[index] = user;
    this.saveToFile();
  }

  updateSocialLink(index: number, link: SocialLink) {
    this.socialLinks[index] = link;
    this.saveToFile();
  }

  // ===== DELETE METHODS =====
  deletePackage(index: number) {
    this.packages.splice(index, 1);
    this.saveToFile();
  }

  deleteGalleryItem(index: number) {
    this.gallery.splice(index, 1);
    this.saveToFile();
  }

  deleteSubscriber(index: number) {
    this.subscribers.splice(index, 1);
    this.saveToFile();
  }

  deleteInquiry(index: number) {
    this.inquiries.splice(index, 1);
    this.saveToFile();
  }

  deleteAdminUser(index: number) {
    this.adminUsers.splice(index, 1);
    this.saveToFile();
  }

  deleteSocialLink(index: number) {
    this.socialLinks.splice(index, 1);
    this.saveToFile();
  }
}

export const db = new DatabaseStore();