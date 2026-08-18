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
  TeamMember 
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
  teamMembers: TeamMember[];  // Add this
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

  constructor() {
    this.loadFromFile();
    if (this.packages.length === 0 && this.gallery.length === 0) {
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
        this.teamMembers = data.teamMembers || [];  // Add this
        console.log(`📂 Loaded ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members from data.json`);
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
        teamMembers: this.teamMembers,  // Add this
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Saved ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members to data.json`);
    } catch (err) {
      console.error('❌ Error saving data file:', err);
    }
  }

  private seedDefaults() {
    const now = new Date().toISOString();

    // Default social links
    this.socialLinks = [];

    // Default price logs
    this.priceLogs = [];

    // Default FAQs 
    this.faqs = [];

    // Default Team Members
    this.teamMembers = [];

    //Default Packages 
    this.packages = [];

    // Subscribers (sample)
    this.subscribers = [
      {
        id: 'sub-1',
        phone: '+251911223344',
        email: 'subscriber1@example.com',
        name: 'Abebe Bikila',
        channel: 'Footer Newsletter',
        packageInterestId: 'pkg-1',
        optInStatus: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-2',
        phone: '+251911887766',
        email: 'subscriber2@example.com',
        name: 'Sara Mohammed',
        channel: 'Umrah Package Modal',
        packageInterestId: 'pkg-2',
        optInStatus: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Inquiries (sample)
    this.inquiries = [
      {
        id: 'inq-1',
        fullName: 'Mohammed Ahmed Al-Sayed',
        phone: '+251922334455',
        email: 'mohammed.ahmed@example.com',
        subject: 'Inquiry regarding Ramadan Umrah 2026 Group Booking',
        message: 'Assalamu Alaikum. We have a family group of 8 persons interested in the Premium Umrah package.',
        status: 'New',
        source: 'Contact Us Form',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'inq-2',
        fullName: 'Fatima Zewde',
        phone: '+251911001122',
        email: 'fatima.z@example.com',
        subject: 'Visa requirement for family members',
        message: 'Hello Delta Travel, I want to confirm if children under 12 need separate medical certificates.',
        status: 'Contacted',
        source: 'Package Page',
        createdAt: now,
        updatedAt: now
      }
    ];

    // Gallery 
    this.gallery = [];

    // Admin users – only one
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

    // SMS logs (sample)
    this.smsLogs = [
      {
        id: 'sms-1',
        phone: '+251911223344',
        message: 'Thank you for subscribing to Delta Travel & Tour updates!',
        status: 'Delivered',
        campaignName: 'Subscription Welcome SMS',
        sentAt: now
      }
    ];
  }

  // ===== ADD METHODS =====
  addPackage(pkg: TravelPackage) {
    this.packages.unshift(pkg);
    this.saveToFile();
  }

  addGalleryItem(item: GalleryItem) {
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

  // ===== UPDATE METHODS =====
  updatePackage(index: number, pkg: TravelPackage) {
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