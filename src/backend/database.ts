import { Pool, type PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

// ============================================================
// DATABASE CONNECTION
// ============================================================
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// ============================================================
// HELPERS
// ============================================================
const json = (value: unknown, fallback: unknown[] = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value ?? fallback;
};

const mapRow = (row: any): any => {
  if (!row) return undefined;
  const mapped: any = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  // JSON fields stored as JSONB
  for (const field of ['inclusions', 'availableDates', 'itinerary', 'discounts', 'persons']) {
    if (field in mapped) mapped[field] = json(mapped[field]);
  }
  // Date fields → ISO strings
  for (const field of ['createdAt', 'updatedAt', 'lastLogin', 'sentAt']) {
    if (mapped[field] instanceof Date) mapped[field] = mapped[field].toISOString();
  }
  return mapped;
};

const rows = (result: { rows: any[] }) => result.rows.map(mapRow);
const one = (result: { rows: any[] }) => mapRow(result.rows[0]);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

// ============================================================
// CONNECTION TEST
// ============================================================
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
}

// ============================================================
// TABLE CREATION
// ============================================================
async function createTables(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Admin',
      last_login TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_ar TEXT NOT NULL DEFAULT '',
      title_am TEXT DEFAULT '',
      category TEXT NOT NULL,
      price_usd NUMERIC NOT NULL,
      price_etb NUMERIC,
      price_sar NUMERIC,
      price_type TEXT DEFAULT 'single',
      price_usd_min NUMERIC,
      price_usd_max NUMERIC,
      price_etb_min NUMERIC,
      price_etb_max NUMERIC,
      price_sar_min NUMERIC,
      price_sar_max NUMERIC,
      base_price_usd NUMERIC,
      base_price_etb NUMERIC,
      base_price_sar NUMERIC,
      duration_days INTEGER NOT NULL,
      departure_city TEXT DEFAULT 'Addis Ababa',
      inclusions JSONB NOT NULL DEFAULT '[]',
      available_dates JSONB NOT NULL DEFAULT '[]',
      itinerary JSONB NOT NULL DEFAULT '[]',
      discounts JSONB NOT NULL DEFAULT '[]',
      persons JSONB NOT NULL DEFAULT '[]',
      image_url TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN DEFAULT TRUE,
      whatsapp_clicks INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_ar TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      location TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      email TEXT DEFAULT '',
      name TEXT DEFAULT '',
      channel TEXT DEFAULT '',
      package_interest_id TEXT,
      opt_in_status BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      message TEXT NOT NULL,
      source TEXT DEFAULT '',
      status TEXT DEFAULT 'New',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Delivered',
      campaign_name TEXT,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      icon TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS office_images (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT DEFAULT '',
      rating NUMERIC DEFAULT 5,
      text TEXT NOT NULL,
      text_ar TEXT DEFAULT '',
      package_taken TEXT DEFAULT '',
      date TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS price_logs (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      price_usd NUMERIC,
      price_etb NUMERIC,
      price_sar NUMERIC,
      previous_price_usd NUMERIC,
      previous_price_etb NUMERIC,
      previous_price_sar NUMERIC,
      reason TEXT DEFAULT '',
      updated_by TEXT DEFAULT 'Admin',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// ============================================================
// DATABASE INITIALIZATION
// ============================================================
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await createTables(client);
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO admin_users (id, username, email, password_hash, role, is_active, status)
       VALUES ($1, $2, $3, $4, 'Admin', TRUE, 'Active')
       ON CONFLICT (username) DO NOTHING`,
      ['usr-1', 'admin', 'admin@deltatravel.com', passwordHash]
    );
    console.log('✅ PostgreSQL tables initialized and default admin verified');
  } finally {
    client.release();
  }
}

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================
const list = (table: string, order = 'created_at DESC', where = '') => async () =>
  rows(await pool.query(`SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''} ORDER BY ${order}`));

const find = (table: string) => async (value: string) =>
  one(await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [value]));

const remove = (table: string) => async (value: string) =>
  one(await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [value]));

async function createEntity(table: string, data: any, fields: string[], prefix: string) {
  const entityId = data.id || makeId(prefix);
  const values = [entityId, ...fields.map((field) => data[field] ?? null)];
  return one(
    await pool.query(
      `INSERT INTO ${table} (id, ${fields.join(', ')}) VALUES (${values
        .map((_, index) => `$${index + 1}`)
        .join(', ')}) RETURNING *`,
      values
    )
  );
}

async function updateEntity(table: string, entityId: string, data: any, fields: string[]) {
  const entries = fields.filter((field) => data[field] !== undefined);
  if (!entries.length) return find(table)(entityId);
  const values = entries.map((field) => data[field]);
  values.push(entityId);
  return one(
    await pool.query(
      `UPDATE ${table} SET ${entries.map((field, i) => `${field} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    )
  );
}

// ============================================================
// PACKAGE FIELD MAPPING
// ============================================================
const packageFields = [
  'title_en', 'title_ar', 'title_am', 'category',
  'price_usd', 'price_etb', 'price_sar', 'price_type',
  'price_usd_min', 'price_usd_max', 'price_etb_min', 'price_etb_max', 'price_sar_min', 'price_sar_max',
  'base_price_usd', 'base_price_etb', 'base_price_sar',
  'duration_days', 'departure_city',
  'inclusions', 'available_dates', 'itinerary', 'discounts', 'persons',
  'image_url', 'is_active', 'whatsapp_clicks',
];

const packageData = (data: any) =>
  Object.fromEntries(
    packageFields.map((field) => {
      const camel = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let value = data[camel];
      if (['inclusions', 'availableDates', 'itinerary', 'discounts', 'persons'].includes(camel)) {
        value = JSON.stringify(value ?? []);
      }
      return [field, value];
    })
  );

// ============================================================
// DB OPERATIONS
// ============================================================
export const dbOperations = {
  // ---------- PACKAGES ----------
  getAllPackages: list('packages'),
  getActivePackages: list('packages', 'created_at DESC', 'is_active = TRUE'),
  findPackageById: find('packages'),

  async createPackage(data: any) {
    const values = packageData(data);
    return one(
      await pool.query(
        `INSERT INTO packages (id, ${packageFields.join(',')}) VALUES ($1, ${packageFields
          .map((_, i) => `$${i + 2}`)
          .join(',')}) RETURNING *`,
        [data.id || makeId('pkg'), ...packageFields.map((field) => values[field] ?? null)]
      )
    );
  },

  async updatePackage(entityId: string, data: any, reason?: string) {
    const existing = await this.findPackageById(entityId);
    const updated = await updateEntity('packages', entityId, packageData(data), packageFields);

    if (
      reason &&
      existing &&
      updated &&
      (existing.priceUsd !== updated.priceUsd ||
        existing.priceEtb !== updated.priceEtb ||
        existing.priceSar !== updated.priceSar)
    ) {
      await this.createPriceLog({
        packageId: entityId,
        priceUsd: updated.priceUsd,
        priceEtb: updated.priceEtb,
        priceSar: updated.priceSar,
        previousPriceUsd: existing.priceUsd,
        previousPriceEtb: existing.priceEtb,
        previousPriceSar: existing.priceSar,
        reason,
        updatedBy: 'Admin',
      });
    }
    return updated;
  },

  deletePackage: remove('packages'),

  async incrementPackageWhatsappClicks(entityId: string) {
    return one(
      await pool.query(
        'UPDATE packages SET whatsapp_clicks = whatsapp_clicks + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
        [entityId]
      )
    );
  },

  // ---------- GALLERY ----------
  getAllGalleryItems: list('gallery', 'sort_order ASC, created_at DESC'),
  getActiveGalleryItems: list('gallery', 'sort_order ASC, created_at DESC', 'is_active = TRUE'),
  findGalleryItemById: find('gallery'),

  async createGalleryItem(data: any) {
    return createEntity(
      'gallery',
      {
        ...data,
        title_en: data.titleEn,
        title_ar: data.titleAr,
        image_url: data.imageUrl,
        thumbnail_url: data.thumbnailUrl,
        video_url: data.videoUrl,
        sort_order: data.sortOrder,
        is_active: data.isActive,
      },
      ['type', 'title_en', 'title_ar', 'image_url', 'thumbnail_url', 'video_url', 'duration', 'location', 'description', 'is_active', 'sort_order'],
      'gal'
    );
  },

  async createManyGalleryItems(items: any[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = [];
      for (const item of items) created.push(await this.createGalleryItem(item));
      await client.query('COMMIT');
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  updateGalleryItem: (entityId: string, data: any) =>
    updateEntity(
      'gallery',
      entityId,
      {
        ...data,
        title_en: data.titleEn,
        title_ar: data.titleAr,
        image_url: data.imageUrl,
        thumbnail_url: data.thumbnailUrl,
        video_url: data.videoUrl,
        is_active: data.isActive,
        sort_order: data.sortOrder,
      },
      ['type', 'title_en', 'title_ar', 'image_url', 'thumbnail_url', 'video_url', 'duration', 'location', 'description', 'is_active', 'sort_order']
    ),

  deleteGalleryItem: remove('gallery'),

  // ---------- SUBSCRIBERS ----------
  getAllSubscribers: list('subscribers'),
  getOptedInSubscribers: list('subscribers', 'created_at DESC', 'opt_in_status = TRUE'),
  findSubscriberByPhone: async (phone: string) =>
    one(await pool.query('SELECT * FROM subscribers WHERE phone = $1', [phone])),

  async createSubscriber(data: any) {
    return one(
      await pool.query(
        `INSERT INTO subscribers (id, phone, email, name, channel, package_interest_id, opt_in_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (phone) DO UPDATE SET
           email=EXCLUDED.email,
           name=EXCLUDED.name,
           channel=EXCLUDED.channel,
           package_interest_id=EXCLUDED.package_interest_id,
           opt_in_status=EXCLUDED.opt_in_status,
           updated_at=NOW()
         RETURNING *`,
        [
          data.id || makeId('sub'),
          data.phone,
          data.email || '',
          data.name || '',
          data.channel || 'Web Form',
          data.packageInterestId || null,
          data.optInStatus !== false,
        ]
      )
    );
  },

  updateSubscriber: (entityId: string, data: any) =>
    updateEntity(
      'subscribers',
      entityId,
      {
        email: data.email,
        name: data.name,
        channel: data.channel,
        package_interest_id: data.packageInterestId,
        opt_in_status: data.optInStatus,
      },
      ['email', 'name', 'channel', 'package_interest_id', 'opt_in_status']
    ),

  deleteSubscriber: remove('subscribers'),

  async deleteSubscribers(ids: string[] = [], phones: string[] = []) {
    const result = await pool.query(
      'DELETE FROM subscribers WHERE id = ANY($1::text[]) OR phone = ANY($2::text[])',
      [ids, phones]
    );
    return result.rowCount || 0;
  },

  async bulkImportSubscribers(items: any[]) {
    return Promise.all(items.map((item) => this.createSubscriber(item)));
  },

  // ---------- INQUIRIES ----------
  getAllInquiries: list('inquiries'),
  findInquiryById: find('inquiries'),

  createInquiry: (data: any) =>
    createEntity(
      'inquiries',
      { ...data, full_name: data.fullName },
      ['full_name', 'phone', 'email', 'subject', 'message', 'source', 'status'],
      'inq'
    ),

  updateInquiryStatus: (entityId: string, status: string) =>
    updateEntity('inquiries', entityId, { status }, ['status']),

  async updateManyInquiryStatus(ids: string[], status: string) {
    return rows(
      await pool.query(
        'UPDATE inquiries SET status=$1, updated_at=NOW() WHERE id=ANY($2::text[]) RETURNING *',
        [status, ids]
      )
    );
  },

  deleteInquiry: remove('inquiries'),

  async deleteManyInquiries(ids: string[]) {
    const result = await pool.query('DELETE FROM inquiries WHERE id=ANY($1::text[])', [ids]);
    return result.rowCount || 0;
  },

  // ---------- FAQS ----------
  getAllFaqs: list('faqs'),
  getActiveFaqs: list('faqs', 'created_at DESC', 'is_active = TRUE'),
  findFaqById: find('faqs'),
  createFaq: (data: any) =>
    createEntity('faqs', data, ['question', 'answer', 'is_active'], 'faq'),
  updateFaq: (entityId: string, data: any) =>
    updateEntity('faqs', entityId, data, ['question', 'answer', 'is_active']),
  deleteFaq: remove('faqs'),

  // ---------- SOCIAL LINKS ----------
  getAllSocialLinks: list('social_links'),
  getActiveSocialLinks: list('social_links', 'created_at DESC', 'is_active = TRUE'),
  findSocialLinkById: find('social_links'),
  createSocialLink: (data: any) =>
    createEntity('social_links', data, ['platform', 'url', 'is_active', 'icon'], 'sl'),
  updateSocialLink: (entityId: string, data: any) =>
    updateEntity('social_links', entityId, data, ['platform', 'url', 'is_active', 'icon']),
  deleteSocialLink: remove('social_links'),

  // ---------- TEAM MEMBERS ----------
  getAllTeamMembers: list('team_members', 'sort_order ASC, created_at DESC'),
  getActiveTeamMembers: list('team_members', 'sort_order ASC, created_at DESC', 'is_active = TRUE'),
  findTeamMemberById: find('team_members'),

  createTeamMember: (data: any) =>
    createEntity(
      'team_members',
      { ...data, image_url: data.imageUrl, sort_order: data.order },
      ['name', 'role', 'bio', 'image_url', 'sort_order', 'is_active'],
      'team'
    ),

  updateTeamMember: (entityId: string, data: any) =>
    updateEntity(
      'team_members',
      entityId,
      data,
      ['name', 'role', 'bio', 'image_url', 'sort_order', 'is_active']
    ),

  deleteTeamMember: remove('team_members'),

  // ---------- OFFICE IMAGES ----------
  getAllOfficeImages: list('office_images', 'sort_order ASC, created_at DESC'),
  getActiveOfficeImages: list('office_images', 'sort_order ASC, created_at DESC', 'is_active = TRUE'),
  findOfficeImageById: find('office_images'),

  createOfficeImage: (data: any) =>
    createEntity(
      'office_images',
      { ...data, image_url: data.imageUrl, sort_order: data.order },
      ['title', 'image_url', 'description', 'sort_order', 'is_active'],
      'office'
    ),

  updateOfficeImage: (entityId: string, data: any) =>
    updateEntity(
      'office_images',
      entityId,
      data,
      ['title', 'image_url', 'description', 'sort_order', 'is_active']
    ),

  deleteOfficeImage: remove('office_images'),

  // ---------- TESTIMONIALS ----------
  getAllTestimonials: list('testimonials', 'created_at DESC'),
  getActiveTestimonials: list('testimonials', 'created_at DESC', 'is_active = TRUE'),
  findTestimonialById: find('testimonials'),

  createTestimonial: (data: any) =>
    createEntity(
      'testimonials',
      {
        ...data,
        text_ar: data.textAr,
        package_taken: data.packageTaken,
        is_active: data.isActive,
      },
      ['name', 'location', 'rating', 'text', 'text_ar', 'package_taken', 'date', 'avatar', 'is_active'],
      'test'
    ),

  updateTestimonial: (entityId: string, data: any) =>
    updateEntity(
      'testimonials',
      entityId,
      {
        ...data,
        text_ar: data.textAr,
        package_taken: data.packageTaken,
        is_active: data.isActive,
      },
      ['name', 'location', 'rating', 'text', 'text_ar', 'package_taken', 'date', 'avatar', 'is_active']
    ),

  deleteTestimonial: remove('testimonials'),

  // ---------- PRICE LOGS ----------
  getAllPriceLogs: list('price_logs', 'updated_at DESC'),

  createPriceLog: (data: any) =>
    createEntity(
      'price_logs',
      {
        ...data,
        package_id: data.packageId,
        price_usd: data.priceUsd,
        price_etb: data.priceEtb,
        price_sar: data.priceSar,
        previous_price_usd: data.previousPriceUsd,
        previous_price_etb: data.previousPriceEtb,
        previous_price_sar: data.previousPriceSar,
        updated_by: data.updatedBy,
      },
      [
        'package_id',
        'price_usd',
        'price_etb',
        'price_sar',
        'previous_price_usd',
        'previous_price_etb',
        'previous_price_sar',
        'reason',
        'updated_by',
      ],
      'pl'
    ),

  // ---------- SMS LOGS ----------
  getAllSmsLogs: list('sms_logs', 'sent_at DESC'),
  createSmsLog: (data: any) =>
    createEntity(
      'sms_logs',
      { ...data, campaign_name: data.campaignName },
      ['phone', 'message', 'status', 'campaign_name'],
      'sms'
    ),

  // ---------- ADMIN USERS ----------
  getAllAdminUsers: list('admin_users', 'created_at ASC'),
  findAdminUserById: find('admin_users'),
  findAdminUserByUsername: async (username: string) =>
    one(await pool.query('SELECT * FROM admin_users WHERE LOWER(username)=LOWER($1)', [username])),
  findAdminUserByEmail: async (email: string) =>
    one(await pool.query('SELECT * FROM admin_users WHERE LOWER(email)=LOWER($1)', [email])),

  createAdminUser: (data: any) =>
    createEntity(
      'admin_users',
      {
        ...data,
        password_hash: data.passwordHash,
        is_active: data.isActive,
        last_login: data.lastLogin,
      },
      ['username', 'email', 'password_hash', 'role', 'last_login', 'is_active', 'status'],
      'usr'
    ),

  updateAdminUser: (entityId: string, data: any) =>
    updateEntity(
      'admin_users',
      entityId,
      { ...data, password_hash: data.passwordHash, is_active: data.isActive },
      ['username', 'email', 'password_hash', 'role', 'is_active', 'status']
    ),

  deleteAdminUser: remove('admin_users'),

  updateAdminUserLastLogin: async (entityId: string) =>
    one(
      await pool.query(
        'UPDATE admin_users SET last_login=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *',
        [entityId]
      )
    ),

  // ---------- DASHBOARD ----------
  async getDashboardStats() {
    return one(
      await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM packages)::int AS "totalPackages",
          (SELECT COUNT(*) FROM packages WHERE is_active)::int AS "activePackages",
          (SELECT COUNT(*) FROM gallery)::int AS "totalGalleryItems",
          (SELECT COUNT(*) FROM inquiries)::int AS "totalInquiries",
          (SELECT COUNT(*) FROM subscribers)::int AS "totalSubscribers",
          (SELECT COALESCE(SUM(whatsapp_clicks),0))::int AS "totalWhatsappClicks",
          (SELECT COUNT(*) FROM sms_logs WHERE sent_at >= date_trunc('month', NOW()))::int AS "smsSentThisMonth"
      `)
    );
  },
};

// ============================================================
// COMPATIBILITY EXPORT
// ============================================================
export const db = dbOperations;