import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Use your Render PostgreSQL URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://deltauser:kOi8ukzM5Q12FiuRZ8R5xwtg9JKzmYyY@dpg-d9qtmf2jnfac73e6tgh0-a.oregon-postgres.render.com/deltatravel_nxah';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
};

// Seed default admin users
const seedAdminUsers = async () => {
  const client = await pool.connect();
  try {
    // Check if users already exist
    const existing = await client.query('SELECT * FROM admin_users LIMIT 1');
    if (existing.rows.length > 0) {
      console.log('✅ Admin users already seeded, skipping.');
      return;
    }

    console.log('🔑 Seeding admin users...');

    const now = new Date().toISOString();
    
    // Generate proper bcrypt hashes
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const editorPasswordHash = await bcrypt.hash('editor123', 10);

    const users = [
      {
        id: 'usr-1',
        username: 'superadmin',
        email: 'superadmin@deltatravel.com',
        passwordHash: adminPasswordHash,
        role: 'SuperAdmin',
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr-2',
        username: 'admin',
        email: 'admin@deltatravel.com',
        passwordHash: adminPasswordHash,
        role: 'Admin',
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr-3',
        username: 'editor',
        email: 'editor@deltatravel.com',
        passwordHash: editorPasswordHash,
        role: 'Editor',
        isActive: true,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO admin_users (
          id, username, email, password_hash, role, is_active, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (username) DO NOTHING`,
        [
          user.id,
          user.username,
          user.email,
          user.passwordHash,
          user.role,
          user.isActive,
          user.status,
          user.createdAt,
          user.updatedAt,
        ]
      );
    }

    console.log('✅ Admin users seeded successfully.');
    console.log('🔑 Login credentials:');
    console.log('   admin@deltatravel.com / admin123');
    console.log('   superadmin@deltatravel.com / admin123');
    console.log('   editor@deltatravel.com / editor123');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  } finally {
    client.release();
  }
};

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('📦 Initializing PostgreSQL...');

    // Create admin_users table first (needed for seeding)
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Editor',
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create packages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        title_am TEXT,
        category TEXT NOT NULL,
        price_usd DECIMAL NOT NULL,
        duration_days INTEGER NOT NULL,
        departure_city TEXT DEFAULT 'Addis Ababa',
        inclusions TEXT[] DEFAULT '{}',
        available_dates TEXT[] DEFAULT '{}',
        itinerary JSONB DEFAULT '[]',
        image_url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        whatsapp_clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create gallery table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_ar TEXT,
        image_url TEXT,
        video_url TEXT,
        duration TEXT,
        location TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create subscribers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        name TEXT,
        channel TEXT,
        package_interest_id TEXT,
        opt_in_status BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create inquiries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        source TEXT,
        status TEXT DEFAULT 'New',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sms_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'Delivered',
        campaign_name TEXT,
        sent_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables created successfully');

    // Seed admin users - THIS WILL CREATE THE USERS
    await seedAdminUsers();
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ==================== DATABASE OPERATIONS ====================
export const dbOperations = {
  // ==================== PACKAGES ====================
  async getAllPackages() {
    const result = await pool.query('SELECT * FROM packages ORDER BY created_at DESC');
    return result.rows;
  },

  async getActivePackages() {
    const result = await pool.query('SELECT * FROM packages WHERE is_active = true ORDER BY created_at DESC');
    return result.rows;
  },

  async findPackageById(id: string) {
    const result = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    return result.rows[0];
  },

  async createPackage(data: any) {
    const id = data.id || `pkg-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO packages (
        id, title_en, title_ar, title_am, category, price_usd, duration_days,
        departure_city, inclusions, available_dates, itinerary, image_url, is_active, whatsapp_clicks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        id, data.titleEn, data.titleAr, data.titleAm || '', data.category,
        data.priceUsd, data.durationDays, data.departureCity || 'Addis Ababa',
        data.inclusions || [], data.availableDates || [], JSON.stringify(data.itinerary || []),
        data.imageUrl, data.isActive !== undefined ? data.isActive : true, data.whatsappClicks || 0
      ]
    );
    return result.rows[0];
  },

  async updatePackage(id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMapping: Record<string, string> = {
      'title_en': 'titleEn',
      'title_ar': 'titleAr',
      'title_am': 'titleAm',
      'category': 'category',
      'price_usd': 'priceUsd',
      'duration_days': 'durationDays',
      'departure_city': 'departureCity',
      'inclusions': 'inclusions',
      'available_dates': 'availableDates',
      'itinerary': 'itinerary',
      'image_url': 'imageUrl',
      'is_active': 'isActive'
    };

    for (const [dbField, objField] of Object.entries(fieldMapping)) {
      if (data[objField] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        if (dbField === 'inclusions' || dbField === 'available_dates') {
          values.push(data[objField] || []);
        } else if (dbField === 'itinerary') {
          values.push(JSON.stringify(data[objField] || []));
        } else if (dbField === 'is_active') {
          values.push(data[objField] !== undefined ? data[objField] : true);
        } else {
          values.push(data[objField]);
        }
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE packages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deletePackage(id: string) {
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async incrementPackageWhatsappClicks(id: string) {
    const result = await pool.query(
      'UPDATE packages SET whatsapp_clicks = whatsapp_clicks + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // ==================== GALLERY ====================
  async getAllGalleryItems() {
    const result = await pool.query('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC');
    return result.rows;
  },

  async getActiveGalleryItems() {
    const result = await pool.query('SELECT * FROM gallery WHERE is_active = true ORDER BY sort_order ASC, created_at DESC');
    return result.rows;
  },

  async findGalleryItemById(id: string) {
    const result = await pool.query('SELECT * FROM gallery WHERE id = $1', [id]);
    return result.rows[0];
  },

  async createGalleryItem(data: any) {
    const id = data.id || `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const result = await pool.query(
      `INSERT INTO gallery (
        id, type, title_en, title_ar, image_url, video_url, duration,
        location, description, is_active, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id, data.type, data.titleEn, data.titleAr || '',
        data.imageUrl || '', data.videoUrl || '', data.duration || '',
        data.location || '', data.description || '',
        data.isActive !== undefined ? data.isActive : true,
        data.sortOrder || 0
      ]
    );
    return result.rows[0];
  },

  async updateGalleryItem(id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMapping: Record<string, string> = {
      'type': 'type',
      'title_en': 'titleEn',
      'title_ar': 'titleAr',
      'image_url': 'imageUrl',
      'video_url': 'videoUrl',
      'duration': 'duration',
      'location': 'location',
      'description': 'description',
      'is_active': 'isActive',
      'sort_order': 'sortOrder'
    };

    for (const [dbField, objField] of Object.entries(fieldMapping)) {
      if (data[objField] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(data[objField]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE gallery SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteGalleryItem(id: string) {
    const result = await pool.query('DELETE FROM gallery WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  // ==================== SUBSCRIBERS ====================
  async getAllSubscribers() {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
    return result.rows;
  },

  async getOptedInSubscribers() {
    const result = await pool.query('SELECT * FROM subscribers WHERE opt_in_status = true ORDER BY created_at DESC');
    return result.rows;
  },

  async findSubscriberByPhone(phone: string) {
    const result = await pool.query('SELECT * FROM subscribers WHERE phone = $1', [phone]);
    return result.rows[0];
  },

  async createSubscriber(data: any) {
    const id = data.id || `sub-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO subscribers (
        id, phone, email, name, channel, package_interest_id, opt_in_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (phone) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        channel = EXCLUDED.channel,
        package_interest_id = EXCLUDED.package_interest_id,
        opt_in_status = true,
        updated_at = NOW()
      RETURNING *`,
      [
        id, data.phone, data.email || '', data.name || '',
        data.channel || 'Web Form', data.packageInterestId || null,
        data.optInStatus !== undefined ? data.optInStatus : true
      ]
    );
    return result.rows[0];
  },

  async updateSubscriber(id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) { updates.push(`email = $${paramIndex}`); values.push(data.email); paramIndex++; }
    if (data.name !== undefined) { updates.push(`name = $${paramIndex}`); values.push(data.name); paramIndex++; }
    if (data.channel !== undefined) { updates.push(`channel = $${paramIndex}`); values.push(data.channel); paramIndex++; }
    if (data.packageInterestId !== undefined) { updates.push(`package_interest_id = $${paramIndex}`); values.push(data.packageInterestId); paramIndex++; }
    if (data.optInStatus !== undefined) { updates.push(`opt_in_status = $${paramIndex}`); values.push(data.optInStatus); paramIndex++; }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE subscribers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteSubscriber(id: string) {
    const result = await pool.query('DELETE FROM subscribers WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async deleteSubscribers(ids: string[], phones: string[]) {
    if (ids.length === 0 && phones.length === 0) return 0;
    
    let query = 'DELETE FROM subscribers WHERE ';
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (ids.length > 0) {
      conditions.push(`id = ANY($${paramIndex})`);
      values.push(ids);
      paramIndex++;
    }
    if (phones.length > 0) {
      conditions.push(`phone = ANY($${paramIndex})`);
      values.push(phones);
      paramIndex++;
    }

    query += conditions.join(' OR ');
    query += ' RETURNING id';

    const result = await pool.query(query, values);
    return result.rowCount || 0;
  },

  // ==================== INQUIRIES ====================
  async getAllInquiries() {
    const result = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    return result.rows;
  },

  async findInquiryById(id: string) {
    const result = await pool.query('SELECT * FROM inquiries WHERE id = $1', [id]);
    return result.rows[0];
  },

  async createInquiry(data: any) {
    const id = data.id || `inq-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO inquiries (
        id, full_name, phone, email, subject, message, source, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id, data.fullName, data.phone, data.email || '',
        data.subject || 'Umrah Tour Inquiry', data.message,
        data.source || 'Contact Form', data.status || 'New'
      ]
    );
    return result.rows[0];
  },

  async updateInquiryStatus(id: string, status: string) {
    const result = await pool.query(
      'UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async deleteInquiry(id: string) {
    const result = await pool.query('DELETE FROM inquiries WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  // ==================== ADMIN USERS ====================
  async getAllAdminUsers() {
    const result = await pool.query('SELECT * FROM admin_users ORDER BY created_at ASC');
    return result.rows;
  },

  async findAdminUserById(id: string) {
    const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findAdminUserByUsername(username: string) {
    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    return result.rows[0];
  },

  async findAdminUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async createAdminUser(data: any) {
    const id = data.id || `usr-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO admin_users (
        id, username, email, password_hash, role, is_active, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id, data.username, data.email, data.passwordHash,
        data.role || 'Editor', data.isActive !== undefined ? data.isActive : true,
        data.status || 'Active'
      ]
    );
    return result.rows[0];
  },

  async updateAdminUser(id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.role !== undefined) { updates.push(`role = $${paramIndex}`); values.push(data.role); paramIndex++; }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex}`); values.push(data.isActive); paramIndex++; }
    if (data.status !== undefined) { updates.push(`status = $${paramIndex}`); values.push(data.status); paramIndex++; }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteAdminUser(id: string) {
    const result = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async updateAdminUserLastLogin(id: string) {
    const result = await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // ==================== SMS LOGS ====================
  async getAllSmsLogs() {
    const result = await pool.query('SELECT * FROM sms_logs ORDER BY sent_at DESC');
    return result.rows;
  },

  async createSmsLog(data: any) {
    const id = data.id || `sms-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO sms_logs (id, phone, message, status, campaign_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.phone, data.message, data.status || 'Delivered', data.campaignName || null]
    );
    return result.rows[0];
  },
};