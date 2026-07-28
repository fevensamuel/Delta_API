import bcrypt from 'bcryptjs';
import type {
  AdminUser,
  GalleryItem,
  Inquiry,
  SmsLog,
  Subscriber,
  TravelPackage
} from '../types.js';

// Pre-hashed password for default users ("admin123" and "editor123")
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);
const EDITOR_PASSWORD_HASH = bcrypt.hashSync('editor123', 10);

class DatabaseStore {
  public packages: TravelPackage[] = [];
  public subscribers: Subscriber[] = [];
  public inquiries: Inquiry[] = [];
  public gallery: GalleryItem[] = [];
  public adminUsers: AdminUser[] = [];
  public smsLogs: SmsLog[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date().toISOString();

    // 1. Initial Packages (Umrah packages only: Economy, Standard, Premium, VIP)
    this.packages = [
      {
        id: 'pkg-1',
        titleEn: 'Economy Saver Umrah Package',
        titleAr: 'باقة العمرة الاقتصادية',
        titleAm: 'የኢኮኖሚ ዑምራ ፓኬጅ',
        category: 'Economy',
        priceUsd: 890,
        durationDays: 10,
        departureCity: 'Addis Ababa',
        inclusions: [
          '3-Star Hotel Accommodation (Shuttle Bus to Haram)',
          'Saudi Tourist E-Visa & Health Insurance',
          'Roundtrip Flights via Ethiopian Airlines',
          'Group Bus Ground Transport',
          'Experienced Guide & Group Coordinator'
        ],
        availableDates: ['2026-08-20', '2026-09-15', '2026-10-05'],
        itinerary: [
          {
            day: 1,
            titleEn: 'Arrival in Jeddah & Hotel Transfer',
            titleAr: 'الوصول إلى جدة والانتقال للفندق',
            titleAm: 'ጅዳ 도착 እና ወደ ሆቴል መሄድ',
            descriptionEn: 'Arrival at King Abdulaziz Intl Airport. Transfer by shuttle bus to hotel and perform Umrah.',
            descriptionAr: 'الوصول لمطار الملك عبد العزيز والتسكين بالفندق وأداء مناسك العمرة.',
            descriptionAm: 'አየር መንገድ መድረስ እና ወደ ሆቴል በመሄድ የዑምራ ስነስርዓት ማከናወን።'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        whatsappClicks: 34,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pkg-2',
        titleEn: 'Standard Family Umrah Package',
        titleAr: 'باقة العمرة العائلية القياسية',
        titleAm: 'የስታንዳርድ ቤተሰብ ዑምራ ፓኬጅ',
        category: 'Standard',
        priceUsd: 1250,
        durationDays: 12,
        departureCity: 'Addis Ababa',
        inclusions: [
          '4-Star Hotels Close to Mosques (150m walking distance)',
          'Saudi Tourist E-Visa & Medical Insurance',
          'Daily Breakfast Buffet Included',
          'Air-Conditioned GMC Family Transfers',
          'Ziyarah Tour of Historical Holy Sites in Makkah & Madinah'
        ],
        availableDates: ['2026-08-15', '2026-09-01', '2026-10-10'],
        itinerary: [
          {
            day: 1,
            titleEn: 'Arrival & Umrah Rituals',
            titleAr: 'الوصول وأداء مناسك العمرة',
            titleAm: 'መድረስ እና የዑምራ ስነስርዓት',
            descriptionEn: 'Hotel check-in and guided Umrah ritual at Masjid al-Haram.',
            descriptionAr: 'التسكين في الفندق والانطلاق لأداء مناسك العمرة مع المرشد.',
            descriptionAm: 'ሆቴል በመግባት ከመርህ ጋር ዑምራ ማከናወን።'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        whatsappClicks: 52,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pkg-3',
        titleEn: 'Premium Umrah Deluxe Package 2026',
        titleAr: 'باقة العمرة الفاخرة الممتازة 2026',
        titleAm: 'የፕሪሚየም ዑምራ ደሉክስ ፓኬጅ 2026',
        category: 'Premium',
        priceUsd: 1650,
        durationDays: 14,
        departureCity: 'Addis Ababa',
        inclusions: [
          '5-Star Luxury Hotels with Direct Haram Views',
          'Direct Flights with Ethiopian / Saudia Airlines',
          'Saudi Tourist E-Visa Processing & Full Insurance',
          'Daily Buffet Breakfast & Dinner',
          'VIP GMC Private Transport in Makkah & Madinah',
          'Experienced Multilingual Scholars (English/Arabic/Amharic)',
          'Guided Historical Ziyarah Tours',
          'Complimentary Zamzam Water 5L Bottle'
        ],
        availableDates: ['2026-08-15', '2026-09-01', '2026-10-10', '2026-11-20'],
        itinerary: [
          {
            day: 1,
            titleEn: 'Arrival in Jeddah & Transfer to Makkah',
            titleAr: 'الوصول إلى جدة والانتقال إلى مكة المكرمة',
            titleAm: 'ጅዳ 도착 እና ወደ መካ መሄድ',
            descriptionEn: 'Arrival at King Abdulaziz Intl Airport. Transfer by luxury GMC to hotel and perform Umrah.',
            descriptionAr: 'الوصول لمطار الملك عبد العزيز بجدة والتسكين بالفندق وأداء العمرة.',
            descriptionAm: 'በኪንግ አብዱልአዚዝ አየር መንገድ መድረስ እና የዑምራ ስነስርዓትን ማከናወን።'
          },
          {
            day: 7,
            titleEn: 'Travel to Al-Madinah Al-Munawwarah via High-Speed Train',
            titleAr: 'الانتقال إلى المدينة المنورة عبر القطار السريع',
            titleAm: 'በፈጣን ባቡር ወደ መዲና አል-ሙነወራ ጉዞ',
            descriptionEn: 'Board the Haramain High Speed Railway to Madinah near Prophet’s Mosque.',
            descriptionAr: 'السفر عبر قطار الحرمين السريع إلى المدينة المنورة.',
            descriptionAm: 'በሀረመይን ፈጣን ባቡር ወደ መዲና መጓዝ።'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        whatsappClicks: 88,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pkg-4',
        titleEn: 'VIP Gold Executive Umrah Package',
        titleAr: 'باقة العمرة الذهبية لكبار الشخصيات',
        titleAm: 'ቪአይፒ ጎልድ ኤክስኪዩቲቭ ዑምራ',
        category: 'VIP',
        priceUsd: 2450,
        durationDays: 14,
        departureCity: 'Addis Ababa',
        inclusions: [
          'Exclusive Executive Suites directly inside Abraj Al-Bait Complex',
          'Private Chauffeured GMC Yukon for all movements',
          'Private Scholar & Mutawwif for family group',
          'High-Speed Haramain Train Business Class Tickets',
          'Full-Board Luxury Buffet Catering'
        ],
        availableDates: ['2026-09-01', '2026-10-15', '2026-11-10'],
        itinerary: [
          {
            day: 1,
            titleEn: 'VIP Airport Meet & Assist',
            titleAr: 'الاستقبال الفاخر بالمطار',
            titleAm: 'በአየር መንገድ የቪአይፒ አቀባበል',
            descriptionEn: 'Private lounge greeting and chauffeured GMC transport.',
            descriptionAr: 'الاستقبال بالصالة الخاصة والنقل مسبق الحجز.',
            descriptionAm: 'በልዩ ሳሎን አቀባበል ተደርጎ በቅንጡ መኪና መሄድ።'
          }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        whatsappClicks: 45,
        createdAt: now,
        updatedAt: now
      }
    ];

    // 2. Initial Subscribers
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

    // 3. Initial Inquiries (Status: New, Contacted, Resolved)
    this.inquiries = [
      {
        id: 'inq-1',
        fullName: 'Mohammed Ahmed Al-Sayed',
        phone: '+251922334455',
        email: 'mohammed.ahmed@example.com',
        subject: 'Inquiry regarding Ramadan Umrah 2026 Group Booking',
        message: 'Assalamu Alaikum. We have a family group of 8 persons interested in the Premium Umrah package. Please advise on custom flight options.',
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
        message: 'Hello Delta Travel, I want to confirm if children under 12 need separate medical certificates for Umrah visa.',
        status: 'Contacted',
        source: 'Package Page',
        createdAt: now,
        updatedAt: now
      }
    ];

    // 4. Initial Gallery
    this.gallery = [
      {
        id: 'gal-1',
        type: 'photo',
        titleEn: 'Holy Kaaba & Mataf Courtyard',
        titleAr: 'الكعبة المشرفة والصحن الشريف',
        imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80',
        location: 'Masjid al-Haram, Makkah',
        description: 'Serene view of the Holy Kaaba during early morning Fajr prayers.',
        isActive: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'gal-2',
        type: 'video',
        titleEn: 'Night Tawaf Around the Holy Kaaba',
        titleAr: 'طواف الليل حول الكعبة المشرفة',
        imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=1200&q=80',
        videoUrl: 'https://cdn.deltatravel.com/videos/night-tawaf.mp4',
        duration: '3:45',
        location: 'Masjid al-Haram, Makkah',
        description: 'Atmospheric video capturing peaceful spiritual night Tawaf prayers in Makkah.',
        isActive: true,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'gal-3',
        type: 'photo',
        titleEn: 'Al-Masjid an-Nabawi Courtyard Umbrellas',
        titleAr: 'مظلات ساحة المسجد النبوي الشريف',
        imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
        location: 'Madinah Al-Munawwarah',
        description: 'Peaceful atmosphere at the Prophet Mosque courtyard in Madinah.',
        isActive: true,
        sortOrder: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'gal-4',
        type: 'video',
        titleEn: 'Guided Ziyarah Tour of Mount Uhud',
        titleAr: 'جولة زيارة جبل أحد',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
        videoUrl: 'https://cdn.deltatravel.com/videos/uhud-tour.mp4',
        duration: '4:15',
        location: 'Mount Uhud, Madinah',
        description: 'Ziyarah video led by senior Mutawwif scholars.',
        isActive: true,
        sortOrder: 4,
        createdAt: now,
        updatedAt: now
      }
    ];

    // 5. Initial Admin Users
    this.adminUsers = [
      {
        id: 'usr-1',
        username: 'superadmin',
        email: 'superadmin@deltatravel.com',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'SuperAdmin',
        lastLogin: now,
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'usr-2',
        username: 'admin',
        email: 'admin@deltatravel.com',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Admin',
        lastLogin: now,
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'usr-3',
        username: 'editor',
        email: 'editor@deltatravel.com',
        passwordHash: EDITOR_PASSWORD_HASH,
        role: 'Editor',
        lastLogin: null,
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      }
    ];

    // 6. Initial SMS Logs
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
}

export const db = new DatabaseStore();
