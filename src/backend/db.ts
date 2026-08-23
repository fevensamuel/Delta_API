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

    // Default social links
    this.socialLinks = [];

    // Default price logs
    this.priceLogs = [];

    // Default FAQs 
    this.faqs = [];

    // Default Team Members
    this.teamMembers = [];

    // Default Packages - WITH new pricing structure
    this.packages = [
      {
        id: 'pkg-1',
        titleEn: 'Premium Umrah Package',
        titleAr: 'باقة العمرة الممتازة',
        titleAm: 'የተሻሻለ ዑምራ ፓኬጅ',
        category: 'Premium' as PackageCategory,
        
        // Main pricing
        priceUsd: 2999,
        priceEtb: 179940,
        priceSar: 11246,
        priceType: 'single' as PriceType,
        
        durationDays: 10,
        departureCity: 'Addis Ababa',
        inclusions: [
          'Return flights (Ethiopian Airlines)',
          '3-star hotel in Makkah (Dar Al Eiman)',
          '2-star hotel in Madinah (Anwar Al Madinah)',
          'Private transport between cities',
          'Daily breakfast and dinner',
          'Guided ziyarat tours',
          '24/7 support from Mutawwif'
        ],
        availableDates: ['2026-12-01', '2026-12-15', '2027-01-05'],
        itinerary: [
          {
            dayNumber: 1,
            title: 'Arrival in Madinah',
            description: 'Arrive at Madinah Airport, transfer to hotel, rest and prepare for Umrah'
          },
          {
            dayNumber: 2,
            title: 'Madinah Ziyarat',
            description: 'Visit Masjid Nabawi, Quba Mosque, Uhud Mountain, and other historical sites'
          },
          {
            dayNumber: 3,
            title: 'Travel to Makkah',
            description: 'Travel to Makkah by private bus, check-in to hotel, prepare for Umrah'
          },
          {
            dayNumber: 4,
            title: 'Perform Umrah',
            description: 'Perform Umrah rituals with guidance from Mutawwif'
          },
          {
            dayNumber: 5,
            title: 'Makkah Ziyarat',
            description: 'Visit Arafat, Muzdalifah, Mina, and other significant sites'
          },
          {
            dayNumber: 6,
            title: 'Second Umrah',
            description: 'Second Umrah opportunity for those who wish to perform again'
          },
          {
            dayNumber: 7,
            title: 'Free Day in Makkah',
            description: 'Free time for prayer, reflection, and shopping'
          },
          {
            dayNumber: 8,
            title: 'Travel to Madinah',
            description: 'Travel back to Madinah, check-in to hotel'
          },
          {
            dayNumber: 9,
            title: 'Madinah Ziyarat',
            description: 'Additional Ziyarat in Madinah'
          },
          {
            dayNumber: 10,
            title: 'Departure',
            description: 'Transfer to Madinah Airport for return flight'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1583434103998-6b4f8a9d7d8a?auto=format&fit=crop&q=80&w=800',
        isActive: true,
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pkg-2',
        titleEn: 'Standard Umrah Package',
        titleAr: 'باقة العمرة القياسية',
        titleAm: 'መደበኛ ዑምራ ፓኬጅ',
        category: 'Standard' as PackageCategory,
        
        priceUsd: 1999,
        priceEtb: 119940,
        priceSar: 7496,
        priceType: 'single' as PriceType,
        
        durationDays: 8,
        departureCity: 'Addis Ababa',
        inclusions: [
          'Return flights (Saudia Airlines)',
          '3-star hotel in Makkah',
          '2-star hotel in Madinah',
          'Shared transport between cities',
          'Daily breakfast',
          'Guided ziyarat tours'
        ],
        availableDates: ['2026-12-10', '2027-01-15'],
        itinerary: [
          {
            dayNumber: 1,
            title: 'Arrival in Madinah',
            description: 'Arrive at Madinah Airport, transfer to hotel'
          },
          {
            dayNumber: 2,
            title: 'Madinah Ziyarat',
            description: 'Visit Masjid Nabawi and other historical sites'
          },
          {
            dayNumber: 3,
            title: 'Travel to Makkah',
            description: 'Travel to Makkah by bus, check-in to hotel'
          },
          {
            dayNumber: 4,
            title: 'Perform Umrah',
            description: 'Perform Umrah rituals with guidance'
          },
          {
            dayNumber: 5,
            title: 'Makkah Ziyarat',
            description: 'Visit significant sites around Makkah'
          },
          {
            dayNumber: 6,
            title: 'Free Day',
            description: 'Free time for prayer and reflection'
          },
          {
            dayNumber: 7,
            title: 'Travel to Madinah',
            description: 'Travel back to Madinah'
          },
          {
            dayNumber: 8,
            title: 'Departure',
            description: 'Transfer to Madinah Airport for return flight'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=800',
        isActive: true,
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pkg-3',
        titleEn: 'Economy Umrah Package',
        titleAr: 'باقة العمرة الاقتصادية',
        titleAm: 'ኢኮኖሚ ዑምራ ፓኬጅ',
        category: 'Economy' as PackageCategory,
        
        priceUsd: 1299,
        priceEtb: 77940,
        priceSar: 4871,
        priceType: 'single' as PriceType,
        
        durationDays: 6,
        departureCity: 'Addis Ababa',
        inclusions: [
          'Return flights (Flydubai)',
          '2-star hotel in Makkah',
          '1-star hotel in Madinah',
          'Shared transport between cities',
          'Daily breakfast'
        ],
        availableDates: ['2027-01-20', '2027-02-10'],
        itinerary: [
          {
            dayNumber: 1,
            title: 'Arrival in Madinah',
            description: 'Arrive at Madinah Airport, transfer to hotel'
          },
          {
            dayNumber: 2,
            title: 'Madinah Ziyarat',
            description: 'Visit Masjid Nabawi'
          },
          {
            dayNumber: 3,
            title: 'Travel to Makkah',
            description: 'Travel to Makkah by bus'
          },
          {
            dayNumber: 4,
            title: 'Perform Umrah',
            description: 'Perform Umrah rituals'
          },
          {
            dayNumber: 5,
            title: 'Free Day',
            description: 'Free time for prayer'
          },
          {
            dayNumber: 6,
            title: 'Departure',
            description: 'Transfer to airport for return flight'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
        isActive: true,
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Default Office Images - Empty (no placeholders)
    this.officeImages = [];

    // Default Testimonials
    this.testimonials = [
      {
        id: 'test-1',
        name: 'Ahmed Mohammed',
        location: 'Addis Ababa, Ethiopia',
        rating: 5,
        text: 'An unforgettable spiritual journey! Delta Travel made our Umrah experience seamless and stress-free. The hotels were excellent and the guidance was exceptional.',
        textAr: 'رحلة روحية لا تنسى! جعلت دلتا ترافيل تجربة العمرة لدينا سلسة وخالية من الإجهاد. كانت الفنادق ممتازة والإرشاد استثنائي.',
        date: '2026-01-15',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'test-2',
        name: 'Fatima Zewde',
        location: 'Addis Ababa, Ethiopia',
        rating: 5,
        text: 'The best travel agency for Umrah! Everything was perfectly organized from flights to accommodations. The Mutawwif was very knowledgeable and helpful.',
        textAr: 'أفضل وكالة سفر للعمرة! كل شيء كان منظمًا بشكل مثالي من الرحلات إلى الإقامة. كان المطوف على دراية كبيرة ومفيدًا.',
        date: '2026-01-20',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'test-3',
        name: 'Bilal Ibrahim',
        location: 'Addis Ababa, Ethiopia',
        rating: 5,
        text: 'I highly recommend Delta Travel for anyone planning Umrah. The team was professional, responsive, and made sure every detail was taken care of.',
        textAr: 'أنصح بشدة دلتا ترافيل لأي شخص يخطط للعمرة. كان الفريق محترفًا ومستجيبًا وتأكد من العناية بكل التفاصيل.',
        date: '2026-02-01',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Subscribers (sample)
    this.subscribers = [
      {
        id: 'sub-1',
        phone: '+251911223344',
        email: 'subscriber1@example.com',
        name: 'Abebe Bikila',
        channel: 'Footer Newsletter',
        packageInterestId: 'pkg-1',
        optInStatus: 'Active',
        dateSubscribed: now,
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
        optInStatus: 'Active',
        dateSubscribed: now,
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
        dateReceived: now,
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
        dateReceived: now,
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