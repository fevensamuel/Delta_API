var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_cors = __toESM(require("cors"), 1);
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_swagger_ui_express = __toESM(require("swagger-ui-express"), 1);

// src/backend/routes.ts
var import_express = require("express");
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);

// src/backend/database.ts
var import_pg = require("pg");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var DATABASE_URL = process.env.DATABASE_URL || "";
var useSSL = !DATABASE_URL.includes("localhost") && !DATABASE_URL.includes("127.0.0.1") && !DATABASE_URL.includes("/var/run/postgresql");
var pool = new import_pg.Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 1e4
});
console.log(
  `\u{1F50C} PostgreSQL: ${DATABASE_URL ? "URL configured" : "\u274C DATABASE_URL missing"} | SSL: ${useSSL}`
);
var json = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value ?? fallback;
};
var mapRow = (row) => {
  if (!row) return void 0;
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  for (const field of ["inclusions", "availableDates", "itinerary", "discounts", "persons"]) {
    if (field in mapped) mapped[field] = json(mapped[field]);
  }
  for (const field of ["createdAt", "updatedAt", "lastLogin", "sentAt"]) {
    if (mapped[field] instanceof Date) {
      mapped[field] = mapped[field].toISOString();
    }
  }
  return mapped;
};
var rows = (result) => result.rows.map(mapRow);
var one = (result) => mapRow(result.rows[0]);
var makeId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("\u2705 PostgreSQL connection successful");
    return true;
  } catch (error) {
    console.error("\u274C PostgreSQL connection failed:", error);
    return false;
  }
}
async function createTables(client) {
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
      inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
      available_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
      itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
      discounts JSONB NOT NULL DEFAULT '[]'::jsonb,
      persons JSONB NOT NULL DEFAULT '[]'::jsonb,
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
  await client.query(`
    -- packages
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS title_am TEXT DEFAULT '';
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_etb NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_sar NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'single';
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_usd_min NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_usd_max NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_etb_min NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_etb_max NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_sar_min NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_sar_max NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS base_price_usd NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS base_price_etb NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS base_price_sar NUMERIC;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS discounts JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS persons JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS whatsapp_clicks INTEGER DEFAULT 0;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS departure_city TEXT DEFAULT 'Addis Ababa';

    -- gallery
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT '';
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '';
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE gallery ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

    -- subscribers
    ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
    ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
    ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT '';
    ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS package_interest_id TEXT;
    ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS opt_in_status BOOLEAN DEFAULT TRUE;

    -- inquiries
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';

    -- sms_logs
    ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS campaign_name TEXT;
    ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Delivered';

    -- faqs
    ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

    -- social_links
    ALTER TABLE social_links ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '';
    ALTER TABLE social_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

    -- team_members
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

    -- office_images
    ALTER TABLE office_images ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
    ALTER TABLE office_images ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE office_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE office_images ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

    -- testimonials
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS text_ar TEXT DEFAULT '';
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS package_taken TEXT DEFAULT '';
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5;
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

    -- price_logs
    ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS previous_price_usd NUMERIC;
    ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS previous_price_etb NUMERIC;
    ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS previous_price_sar NUMERIC;
    ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT '';
    ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'Admin';

    -- admin_users
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `);
}
async function initDatabase() {
  const client = await pool.connect();
  try {
    await createTables(client);
    const existingAdmins = await client.query("SELECT COUNT(*) FROM admin_users");
    if (Number(existingAdmins.rows[0].count) === 0) {
      const passwordHash = await import_bcryptjs.default.hash("Password_Admin@1526", 10);
      await client.query(
        `INSERT INTO admin_users (id, username, email, password_hash, role, is_active, status)
     VALUES ($1, $2, $3, $4, 'Admin', TRUE, 'Active')
     ON CONFLICT (username) DO NOTHING`,
        ["usr-1", "adminUser", "admin@deltatravel.com", passwordHash]
      );
      console.log("\u2705 Default admin created: adminUser / admin@deltatravel.com");
    } else {
      console.log("\u2705 Admin users already exist, skipping seed");
    }
    console.log("\u2705 PostgreSQL tables initialized and migrations applied");
  } finally {
    client.release();
  }
}
var list = (table, order = "created_at DESC", where = "") => async () => rows(
  await pool.query(
    `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ""} ORDER BY ${order}`
  )
);
var find = (table) => async (value) => one(await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [value]));
var remove = (table) => async (value) => one(await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [value]));
async function createEntity(table, data, fields, prefix) {
  const entityId = data.id || makeId(prefix);
  const values = [entityId, ...fields.map((field) => data[field] ?? null)];
  return one(
    await pool.query(
      `INSERT INTO ${table} (id, ${fields.join(", ")}) VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")}) RETURNING *`,
      values
    )
  );
}
async function updateEntity(table, entityId, data, fields) {
  const entries = fields.filter((field) => data[field] !== void 0);
  if (!entries.length) return find(table)(entityId);
  const values = entries.map((field) => data[field]);
  values.push(entityId);
  return one(
    await pool.query(
      `UPDATE ${table} SET ${entries.map((field, i) => `${field} = $${i + 1}`).join(", ")}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    )
  );
}
var packageFields = [
  "title_en",
  "title_ar",
  "title_am",
  "category",
  "price_usd",
  "price_etb",
  "price_sar",
  "price_type",
  "price_usd_min",
  "price_usd_max",
  "price_etb_min",
  "price_etb_max",
  "price_sar_min",
  "price_sar_max",
  "base_price_usd",
  "base_price_etb",
  "base_price_sar",
  "duration_days",
  "departure_city",
  "inclusions",
  "available_dates",
  "itinerary",
  "discounts",
  "persons",
  "image_url",
  "is_active",
  "whatsapp_clicks"
];
var packageData = (data) => Object.fromEntries(
  packageFields.map((field) => {
    const camel = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    let value = data[camel];
    if (["inclusions", "availableDates", "itinerary", "discounts", "persons"].includes(camel)) {
      value = JSON.stringify(value ?? []);
    }
    return [field, value];
  })
);
var dbOperations = {
  // ---------- PACKAGES ----------
  getAllPackages: list("packages"),
  getActivePackages: list("packages", "created_at DESC", "is_active = TRUE"),
  findPackageById: find("packages"),
  async createPackage(data) {
    const values = packageData(data);
    return one(
      await pool.query(
        `INSERT INTO packages (id, ${packageFields.join(",")}) VALUES ($1, ${packageFields.map((_, i) => `$${i + 2}`).join(",")}) RETURNING *`,
        [data.id || makeId("pkg"), ...packageFields.map((field) => values[field] ?? null)]
      )
    );
  },
  async updatePackage(entityId, data, reason) {
    const existing = await this.findPackageById(entityId);
    const updated = await updateEntity("packages", entityId, packageData(data), packageFields);
    if (reason && existing && updated && (existing.priceUsd !== updated.priceUsd || existing.priceEtb !== updated.priceEtb || existing.priceSar !== updated.priceSar)) {
      await this.createPriceLog({
        packageId: entityId,
        priceUsd: updated.priceUsd,
        priceEtb: updated.priceEtb,
        priceSar: updated.priceSar,
        previousPriceUsd: existing.priceUsd,
        previousPriceEtb: existing.priceEtb,
        previousPriceSar: existing.priceSar,
        reason,
        updatedBy: "Admin"
      });
    }
    return updated;
  },
  deletePackage: remove("packages"),
  async incrementPackageWhatsappClicks(entityId) {
    return one(
      await pool.query(
        "UPDATE packages SET whatsapp_clicks = whatsapp_clicks + 1, updated_at = NOW() WHERE id = $1 RETURNING *",
        [entityId]
      )
    );
  },
  // ---------- GALLERY ----------
  getAllGalleryItems: list("gallery", "sort_order ASC, created_at DESC"),
  getActiveGalleryItems: list("gallery", "sort_order ASC, created_at DESC", "is_active = TRUE"),
  findGalleryItemById: find("gallery"),
  async createGalleryItem(data) {
    return createEntity(
      "gallery",
      {
        ...data,
        title_en: data.titleEn,
        title_ar: data.titleAr,
        image_url: data.imageUrl,
        thumbnail_url: data.thumbnailUrl,
        video_url: data.videoUrl,
        sort_order: data.sortOrder,
        is_active: data.isActive
      },
      [
        "type",
        "title_en",
        "title_ar",
        "image_url",
        "thumbnail_url",
        "video_url",
        "duration",
        "location",
        "description",
        "is_active",
        "sort_order"
      ],
      "gal"
    );
  },
  async createManyGalleryItems(items) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const created = [];
      for (const item of items) created.push(await this.createGalleryItem(item));
      await client.query("COMMIT");
      return created;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
  updateGalleryItem: (entityId, data) => updateEntity(
    "gallery",
    entityId,
    {
      ...data,
      title_en: data.titleEn,
      title_ar: data.titleAr,
      image_url: data.imageUrl,
      thumbnail_url: data.thumbnailUrl,
      video_url: data.videoUrl,
      is_active: data.isActive,
      sort_order: data.sortOrder
    },
    [
      "type",
      "title_en",
      "title_ar",
      "image_url",
      "thumbnail_url",
      "video_url",
      "duration",
      "location",
      "description",
      "is_active",
      "sort_order"
    ]
  ),
  deleteGalleryItem: remove("gallery"),
  // ---------- SUBSCRIBERS ----------
  getAllSubscribers: list("subscribers"),
  getOptedInSubscribers: list("subscribers", "created_at DESC", "opt_in_status = TRUE"),
  findSubscriberByPhone: async (phone) => one(await pool.query("SELECT * FROM subscribers WHERE phone = $1", [phone])),
  async createSubscriber(data) {
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
          data.id || makeId("sub"),
          data.phone,
          data.email || "",
          data.name || "",
          data.channel || "Web Form",
          data.packageInterestId || null,
          data.optInStatus !== false
        ]
      )
    );
  },
  updateSubscriber: (entityId, data) => updateEntity(
    "subscribers",
    entityId,
    {
      email: data.email,
      name: data.name,
      channel: data.channel,
      package_interest_id: data.packageInterestId,
      opt_in_status: data.optInStatus
    },
    ["email", "name", "channel", "package_interest_id", "opt_in_status"]
  ),
  deleteSubscriber: remove("subscribers"),
  async deleteSubscribers(ids = [], phones = []) {
    const result = await pool.query(
      "DELETE FROM subscribers WHERE id = ANY($1::text[]) OR phone = ANY($2::text[])",
      [ids, phones]
    );
    return result.rowCount || 0;
  },
  async bulkImportSubscribers(items) {
    return Promise.all(items.map((item) => this.createSubscriber(item)));
  },
  // ---------- INQUIRIES ----------
  getAllInquiries: list("inquiries"),
  findInquiryById: find("inquiries"),
  createInquiry: (data) => createEntity(
    "inquiries",
    { ...data, full_name: data.fullName },
    ["full_name", "phone", "email", "subject", "message", "source", "status"],
    "inq"
  ),
  updateInquiryStatus: (entityId, status) => updateEntity("inquiries", entityId, { status }, ["status"]),
  async updateManyInquiryStatus(ids, status) {
    return rows(
      await pool.query(
        "UPDATE inquiries SET status=$1, updated_at=NOW() WHERE id=ANY($2::text[]) RETURNING *",
        [status, ids]
      )
    );
  },
  deleteInquiry: remove("inquiries"),
  async deleteManyInquiries(ids) {
    const result = await pool.query("DELETE FROM inquiries WHERE id=ANY($1::text[])", [ids]);
    return result.rowCount || 0;
  },
  // ---------- FAQS ----------
  getAllFaqs: list("faqs"),
  getActiveFaqs: list("faqs", "created_at DESC", "is_active = TRUE"),
  findFaqById: find("faqs"),
  createFaq: (data) => createEntity("faqs", data, ["question", "answer", "is_active"], "faq"),
  updateFaq: (entityId, data) => updateEntity("faqs", entityId, data, ["question", "answer", "is_active"]),
  deleteFaq: remove("faqs"),
  // ---------- SOCIAL LINKS ----------
  getAllSocialLinks: list("social_links"),
  getActiveSocialLinks: list("social_links", "created_at DESC", "is_active = TRUE"),
  findSocialLinkById: find("social_links"),
  createSocialLink: (data) => createEntity("social_links", data, ["platform", "url", "is_active", "icon"], "sl"),
  updateSocialLink: (entityId, data) => updateEntity("social_links", entityId, data, ["platform", "url", "is_active", "icon"]),
  deleteSocialLink: remove("social_links"),
  // ---------- TEAM MEMBERS ----------
  getAllTeamMembers: list("team_members", "sort_order ASC, created_at DESC"),
  getActiveTeamMembers: list(
    "team_members",
    "sort_order ASC, created_at DESC",
    "is_active = TRUE"
  ),
  findTeamMemberById: find("team_members"),
  createTeamMember: (data) => createEntity(
    "team_members",
    { ...data, image_url: data.imageUrl, sort_order: data.order },
    ["name", "role", "bio", "image_url", "sort_order", "is_active"],
    "team"
  ),
  updateTeamMember: (entityId, data) => updateEntity(
    "team_members",
    entityId,
    data,
    ["name", "role", "bio", "image_url", "sort_order", "is_active"]
  ),
  deleteTeamMember: remove("team_members"),
  // ---------- OFFICE IMAGES ----------
  getAllOfficeImages: list("office_images", "sort_order ASC, created_at DESC"),
  getActiveOfficeImages: list(
    "office_images",
    "sort_order ASC, created_at DESC",
    "is_active = TRUE"
  ),
  findOfficeImageById: find("office_images"),
  createOfficeImage: (data) => createEntity(
    "office_images",
    { ...data, image_url: data.imageUrl, sort_order: data.order },
    ["title", "image_url", "description", "sort_order", "is_active"],
    "office"
  ),
  updateOfficeImage: (entityId, data) => updateEntity(
    "office_images",
    entityId,
    data,
    ["title", "image_url", "description", "sort_order", "is_active"]
  ),
  deleteOfficeImage: remove("office_images"),
  // ---------- TESTIMONIALS ----------
  getAllTestimonials: list("testimonials", "created_at DESC"),
  getActiveTestimonials: list("testimonials", "created_at DESC", "is_active = TRUE"),
  findTestimonialById: find("testimonials"),
  createTestimonial: (data) => createEntity(
    "testimonials",
    {
      ...data,
      text_ar: data.textAr,
      package_taken: data.packageTaken,
      is_active: data.isActive
    },
    [
      "name",
      "location",
      "rating",
      "text",
      "text_ar",
      "package_taken",
      "date",
      "avatar",
      "is_active"
    ],
    "test"
  ),
  updateTestimonial: (entityId, data) => updateEntity(
    "testimonials",
    entityId,
    {
      ...data,
      text_ar: data.textAr,
      package_taken: data.packageTaken,
      is_active: data.isActive
    },
    [
      "name",
      "location",
      "rating",
      "text",
      "text_ar",
      "package_taken",
      "date",
      "avatar",
      "is_active"
    ]
  ),
  deleteTestimonial: remove("testimonials"),
  // ---------- PRICE LOGS ----------
  getAllPriceLogs: list("price_logs", "updated_at DESC"),
  createPriceLog: (data) => createEntity(
    "price_logs",
    {
      ...data,
      package_id: data.packageId,
      price_usd: data.priceUsd,
      price_etb: data.priceEtb,
      price_sar: data.priceSar,
      previous_price_usd: data.previousPriceUsd,
      previous_price_etb: data.previousPriceEtb,
      previous_price_sar: data.previousPriceSar,
      updated_by: data.updatedBy
    },
    [
      "package_id",
      "price_usd",
      "price_etb",
      "price_sar",
      "previous_price_usd",
      "previous_price_etb",
      "previous_price_sar",
      "reason",
      "updated_by"
    ],
    "pl"
  ),
  // ---------- SMS LOGS ----------
  getAllSmsLogs: list("sms_logs", "sent_at DESC"),
  createSmsLog: (data) => createEntity(
    "sms_logs",
    { ...data, campaign_name: data.campaignName },
    ["phone", "message", "status", "campaign_name"],
    "sms"
  ),
  // ---------- ADMIN USERS ----------
  getAllAdminUsers: list("admin_users", "created_at ASC"),
  findAdminUserById: find("admin_users"),
  findAdminUserByUsername: async (username) => one(
    await pool.query("SELECT * FROM admin_users WHERE LOWER(username)=LOWER($1)", [username])
  ),
  findAdminUserByEmail: async (email) => one(await pool.query("SELECT * FROM admin_users WHERE LOWER(email)=LOWER($1)", [email])),
  createAdminUser: (data) => createEntity(
    "admin_users",
    {
      ...data,
      password_hash: data.passwordHash,
      is_active: data.isActive,
      last_login: data.lastLogin
    },
    ["username", "email", "password_hash", "role", "last_login", "is_active", "status"],
    "usr"
  ),
  updateAdminUser: (entityId, data) => updateEntity(
    "admin_users",
    entityId,
    { ...data, password_hash: data.passwordHash, is_active: data.isActive },
    ["username", "email", "password_hash", "role", "is_active", "status"]
  ),
  deleteAdminUser: remove("admin_users"),
  updateAdminUserLastLogin: async (entityId) => one(
    await pool.query(
      "UPDATE admin_users SET last_login=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *",
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
  }
};

// src/services/exchangeRateService.ts
var cachedRateData = null;
var refreshTimer = null;
async function fetchFreshExchangeRate() {
  const apiUrl = process.env.EXCHANGE_RATE_API_URL || "https://api.budjet.org/fiat/USD/ETB";
  const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK || "159.98");
  const nowMs = Date.now();
  console.log(`[ExchangeRateService] Attempting to fetch real-time exchange rate from ${apiUrl}...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5e3);
    const res = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Exchange rate API responded with status ${res.status}`);
    }
    const data = await res.json();
    let rate = null;
    let source = "budjet.org";
    if (typeof data?.rate === "number") {
      rate = data.rate;
    } else if (typeof data?.data?.rate === "number") {
      rate = data.data.rate;
    } else if (typeof data?.rates?.ETB === "number") {
      rate = data.rates.ETB;
      source = "exchangerate-api.com";
    } else if (typeof data?.result?.ETB === "number") {
      rate = data.result.ETB;
    }
    if (!rate || typeof rate !== "number" || isNaN(rate) || rate <= 0) {
      throw new Error("Received invalid or empty exchange rate value from API");
    }
    const formattedRate = Math.round(rate * 100) / 100;
    const isoNow = (/* @__PURE__ */ new Date()).toISOString();
    cachedRateData = {
      rate: formattedRate,
      updatedAt: isoNow,
      source,
      isFallback: false,
      fetchedAtMs: nowMs
    };
    console.log(`[ExchangeRateService] \u2705 Success: Fetched live rate (1 USD = ${formattedRate} ETB, Source: ${source})`);
    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback
    };
  } catch (error) {
    console.error(`[ExchangeRateService] \u274C Error fetching exchange rate (${error.message}). Using fallback rate (${fallbackRate} ETB).`);
    const isoNow = (/* @__PURE__ */ new Date()).toISOString();
    cachedRateData = {
      rate: fallbackRate,
      updatedAt: isoNow,
      source: "fallback",
      isFallback: true,
      fetchedAtMs: nowMs
    };
    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback
    };
  }
}
function setAdminOverrideRate(rate) {
  const isoNow = (/* @__PURE__ */ new Date()).toISOString();
  cachedRateData = {
    rate: Math.round(rate * 100) / 100,
    updatedAt: isoNow,
    source: "admin_override",
    isFallback: false,
    fetchedAtMs: Date.now()
  };
  return {
    rate: cachedRateData.rate,
    updatedAt: cachedRateData.updatedAt,
    source: cachedRateData.source,
    isFallback: cachedRateData.isFallback
  };
}
async function getExchangeRate(forceRefresh = false) {
  const cacheDurationMs = parseInt(process.env.EXCHANGE_RATE_CACHE_DURATION || "3600", 10) * 1e3;
  const nowMs = Date.now();
  if (!forceRefresh && cachedRateData && nowMs - cachedRateData.fetchedAtMs < cacheDurationMs) {
    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback
    };
  }
  return await fetchFreshExchangeRate();
}
function initExchangeRateService() {
  const cacheDurationSeconds = parseInt(process.env.EXCHANGE_RATE_CACHE_DURATION || "3600", 10);
  const cacheDurationMs = cacheDurationSeconds * 1e3;
  console.log(`[ExchangeRateService] Initializing service (Cache duration: ${cacheDurationSeconds}s)...`);
  getExchangeRate(true).catch((err) => {
    console.error(`[ExchangeRateService] Initial fetch failed: ${err.message}`);
  });
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(async () => {
    console.log("[ExchangeRateService] Automatic 1-hour scheduled background refresh starting...");
    try {
      await getExchangeRate(true);
    } catch (err) {
      console.error(`[ExchangeRateService] Scheduled refresh error: ${err.message}`);
    }
  }, cacheDurationMs);
}

// src/config/multer.ts
var import_multer = __toESM(require("multer"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var uploadPath = import_path.default.resolve(process.env.UPLOAD_PATH || "./uploads");
var videosPath = import_path.default.join(uploadPath, "videos");
var imagesPath = import_path.default.join(uploadPath, "images");
var packagesPath = import_path.default.join(uploadPath, "packages");
var teamPath = import_path.default.join(uploadPath, "team");
var officePath = import_path.default.join(uploadPath, "office");
[videosPath, imagesPath, packagesPath, teamPath, officePath].forEach((dir) => {
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
});
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    if (req.path && req.path.includes("/team")) {
      console.log(`\u{1F464} Saving team image to: ${teamPath}`);
      cb(null, teamPath);
    } else if (req.path && req.path.includes("/office")) {
      console.log(`\u{1F3E2} Saving office image to: ${officePath}`);
      cb(null, officePath);
    } else if (req.path && req.path.includes("/packages")) {
      console.log(`\u{1F4E6} Saving package image to: ${packagesPath}`);
      cb(null, packagesPath);
    } else if (file.mimetype.startsWith("video/")) {
      console.log(`\u{1F3AC} Saving video to: ${videosPath}`);
      cb(null, videosPath);
    } else if (file.mimetype.startsWith("image/")) {
      console.log(`\u{1F5BC}\uFE0F Saving image to: ${imagesPath}`);
      cb(null, imagesPath);
    } else {
      console.log(`\u{1F4C1} Saving to default: ${imagesPath}`);
      cb(null, imagesPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const finalName = uniqueSuffix + "-" + sanitizedName;
    console.log(`\u{1F4C4} Saving as: ${finalName}`);
    cb(null, finalName);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  }
});
var galleryUploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);
var teamUpload = upload.single("image");
var packageUpload = upload.single("packageImage");
var bulkUpload = upload.array("files", 50);
var officeUpload = upload.single("image");

// src/backend/middleware.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "delta_travel_super_secret_jwt_key_2026_256bit";
var authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Access denied. No Authorization header provided." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Access denied. Malformed token format." });
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired authorization token." });
  }
};

// src/backend/routes.ts
var apiRouter = (0, import_express.Router)();
var JWT_SECRET2 = process.env.JWT_SECRET || "delta_travel_super_secret_jwt_key_2026_256bit";
var send = (res, data, status = 200) => res.status(status).json({ status: "success", success: true, data });
var fail = (res, error, status = 500) => res.status(status).json({
  status: "error",
  success: false,
  error: error instanceof Error ? error.message : String(error)
});
var parse = (value, fallback = []) => {
  if (value === void 0 || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
var bool = (value, fallback = true) => {
  if (value === void 0 || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === 1 || value === "1";
};
var asyncRoute = (handler) => (req, res, next) => handler(req, res).catch(next);
var fileUrl = (req, field, fallback = "") => {
  const file = req.file;
  return file?.filename ? `/uploads/${field}/${file.filename}` : fallback;
};
async function login(req, res) {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return fail(res, "Username and password are required", 400);
  }
  const user = await dbOperations.findAdminUserByUsername(username) || await dbOperations.findAdminUserByEmail(username);
  if (!user || !user.isActive) {
    return fail(res, "Invalid credentials", 401);
  }
  const passwordMatches = await import_bcryptjs2.default.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return fail(res, "Invalid credentials", 401);
  }
  await dbOperations.updateAdminUserLastLogin(user.id);
  const token = import_jsonwebtoken2.default.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET2,
    { expiresIn: "24h" }
  );
  return send(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.status
    }
  });
}
apiRouter.post(["/login", "/admin/login", "/auth/login", "/admin/auth/login"], login);
apiRouter.get(
  ["/admin/me", "/admin/auth/me"],
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const user = req.user && await dbOperations.findAdminUserById(req.user.id);
    if (!user) return fail(res, "User not found", 404);
    return send(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.status
    });
  })
);
apiRouter.get(
  "/admin/users",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllAdminUsers()))
);
apiRouter.post(
  "/admin/users",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return fail(res, "Username, email and password are required", 400);
    }
    const passwordHash = await import_bcryptjs2.default.hash(req.body.password, 10);
    return send(res, await dbOperations.createAdminUser({ ...req.body, passwordHash }), 201);
  })
);
apiRouter.put(
  "/admin/users/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
      data.passwordHash = await import_bcryptjs2.default.hash(data.password, 10);
      delete data.password;
    }
    const item = await dbOperations.updateAdminUser(req.params.id, data);
    if (!item) return fail(res, "Admin user not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/users/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteAdminUser(req.params.id);
    if (!item) return fail(res, "Admin user not found", 404);
    return send(res, { message: "Admin user deleted successfully" });
  })
);
apiRouter.get(
  "/exchange-rate",
  asyncRoute(async (_req, res) => send(res, await getExchangeRate()))
);
apiRouter.get(
  "/admin/exchange-rate",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await getExchangeRate()))
);
apiRouter.post("/admin/exchange-rate", authenticateJWT, (req, res) => {
  const rate = Number(req.body.rate);
  if (!rate || rate <= 0) return fail(res, "Valid rate number is required", 400);
  return send(res, setAdminOverrideRate(rate));
});
apiRouter.get(
  "/social-links",
  asyncRoute(async (_req, res) => send(res, await dbOperations.getActiveSocialLinks()))
);
apiRouter.get(
  "/admin/social-links",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllSocialLinks()))
);
apiRouter.post(
  "/admin/social-links",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    if (!req.body.platform || !req.body.url) {
      return fail(res, "Platform and URL are required", 400);
    }
    return send(
      res,
      await dbOperations.createSocialLink({
        ...req.body,
        platform: String(req.body.platform).toLowerCase(),
        icon: req.body.icon || req.body.platform
      }),
      201
    );
  })
);
apiRouter.put(
  "/admin/social-links/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateSocialLink(req.params.id, req.body);
    if (!item) return fail(res, "Social Media link not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/social-links/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteSocialLink(req.params.id);
    if (!item) return fail(res, "Social Media link not found", 404);
    return send(res, { message: "Social Media link deleted successfully" });
  })
);
apiRouter.get(
  "/faqs",
  asyncRoute(async (_req, res) => {
    const data = await dbOperations.getActiveFaqs();
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.get(
  "/admin/faqs",
  authenticateJWT,
  asyncRoute(async (_req, res) => {
    const data = await dbOperations.getAllFaqs();
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.post(
  "/admin/faqs",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    if (!req.body.question || !req.body.answer) {
      return fail(res, "Question and answer are required", 400);
    }
    return send(res, await dbOperations.createFaq(req.body), 201);
  })
);
apiRouter.put(
  "/admin/faqs/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateFaq(req.params.id, req.body);
    if (!item) return fail(res, "FAQ not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/faqs/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteFaq(req.params.id);
    if (!item) return fail(res, "FAQ not found", 404);
    return send(res, { message: "FAQ deleted successfully" });
  })
);
var packageInput = (body, file) => ({
  titleEn: body.titleEn,
  titleAr: body.titleAr || "",
  titleAm: body.titleAm || "",
  category: body.category,
  priceUsd: Number(body.priceUsd),
  priceEtb: body.priceEtb === void 0 || body.priceEtb === "" ? void 0 : Number(body.priceEtb),
  priceSar: body.priceSar === void 0 || body.priceSar === "" ? void 0 : Number(body.priceSar),
  priceType: body.priceType || "single",
  priceUsdMin: body.priceUsdMin ? Number(body.priceUsdMin) : void 0,
  priceUsdMax: body.priceUsdMax ? Number(body.priceUsdMax) : void 0,
  priceEtbMin: body.priceEtbMin ? Number(body.priceEtbMin) : void 0,
  priceEtbMax: body.priceEtbMax ? Number(body.priceEtbMax) : void 0,
  priceSarMin: body.priceSarMin ? Number(body.priceSarMin) : void 0,
  priceSarMax: body.priceSarMax ? Number(body.priceSarMax) : void 0,
  durationDays: Number(body.durationDays),
  departureCity: body.departureCity || "Addis Ababa",
  inclusions: parse(body.inclusions),
  availableDates: parse(body.availableDates),
  itinerary: parse(body.itinerary),
  discounts: parse(body.discounts),
  persons: parse(body.persons),
  imageUrl: file ? `/uploads/packages/${file.filename}` : body.imageUrl,
  isActive: bool(body.isActive, true)
});
apiRouter.get(
  "/packages",
  asyncRoute(async (_req, res) => {
    const rate = (await getExchangeRate()).rate;
    const data = (await dbOperations.getActivePackages()).map((item) => ({
      ...item,
      priceEtb: item.priceEtb || Math.round(item.priceUsd * rate),
      priceSar: item.priceSar || Math.round(item.priceUsd * 3.75)
    }));
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.get(
  "/packages/:id",
  asyncRoute(async (req, res) => {
    const item = await dbOperations.findPackageById(req.params.id);
    if (!item || !item.isActive) return fail(res, "Package not found", 404);
    return send(res, item);
  })
);
apiRouter.post(
  "/packages/:id/click-whatsapp",
  asyncRoute(async (req, res) => {
    const item = await dbOperations.incrementPackageWhatsappClicks(req.params.id);
    if (!item) return fail(res, "Package not found", 404);
    return send(res, { whatsappClicks: item.whatsappClicks });
  })
);
apiRouter.get(
  "/admin/packages",
  authenticateJWT,
  asyncRoute(async (_req, res) => {
    const data = await dbOperations.getAllPackages();
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.get(
  "/admin/packages/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.findPackageById(req.params.id);
    if (!item) return fail(res, "Package not found", 404);
    return send(res, item);
  })
);
apiRouter.post(
  "/admin/packages",
  authenticateJWT,
  packageUpload,
  asyncRoute(async (req, res) => {
    const data = await dbOperations.createPackage(packageInput(req.body, req.file));
    await dbOperations.createPriceLog({
      packageId: data.id,
      priceUsd: data.priceUsd,
      priceEtb: data.priceEtb,
      priceSar: data.priceSar,
      reason: "Initial package creation",
      updatedBy: "Admin"
    });
    return send(res, data, 201);
  })
);
apiRouter.put(
  "/admin/packages/:id",
  authenticateJWT,
  packageUpload,
  asyncRoute(async (req, res) => {
    const existing = await dbOperations.findPackageById(req.params.id);
    if (!existing) return fail(res, "Package not found", 404);
    const data = await dbOperations.updatePackage(
      req.params.id,
      packageInput({ ...existing, ...req.body }, req.file),
      req.body.reason
    );
    return send(res, data);
  })
);
apiRouter.delete(
  "/admin/packages/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deletePackage(req.params.id);
    if (!item) return fail(res, "Package not found", 404);
    return send(res, { message: "Package deleted successfully" });
  })
);
var galleryInput = (body, files) => ({
  type: body.type === "video" ? "video" : "photo",
  titleEn: body.titleEn || body.title_en || body.title || "",
  titleAr: body.titleAr || body.title_ar || "",
  imageUrl: files?.image?.[0] ? `/uploads/images/${files.image[0].filename}` : body.imageUrl || body.image_url || "",
  thumbnailUrl: body.thumbnailUrl || "",
  videoUrl: files?.video?.[0] ? `/uploads/videos/${files.video[0].filename}` : body.videoUrl || body.video_url || "",
  duration: body.duration || "",
  location: body.location || "",
  description: body.description || "",
  isActive: bool(body.isActive, true),
  sortOrder: Number(body.sortOrder || body.sort_order || 0)
});
apiRouter.get(
  "/gallery",
  asyncRoute(async (req, res) => {
    let data = await dbOperations.getActiveGalleryItems();
    if (req.query.type) {
      data = data.filter((item) => item.type === String(req.query.type));
    }
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.get(
  "/gallery/:id",
  asyncRoute(async (req, res) => {
    const item = await dbOperations.findGalleryItemById(req.params.id);
    if (!item || !item.isActive) return fail(res, "Gallery item not found", 404);
    return send(res, item);
  })
);
apiRouter.get(
  "/admin/gallery",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    let data = await dbOperations.getAllGalleryItems();
    if (req.query.type) {
      data = data.filter((item) => item.type === String(req.query.type));
    }
    return res.json({ status: "success", success: true, count: data.length, data });
  })
);
apiRouter.post(
  "/admin/gallery",
  authenticateJWT,
  galleryUploadFields,
  asyncRoute(
    async (req, res) => send(res, await dbOperations.createGalleryItem(galleryInput(req.body, req.files)), 201)
  )
);
apiRouter.post(
  "/admin/gallery/bulk",
  authenticateJWT,
  bulkUpload,
  asyncRoute(async (req, res) => {
    const files = req.files || [];
    const data = await dbOperations.createManyGalleryItems(
      files.map((file) => ({
        type: file.mimetype.startsWith("video/") ? "video" : "photo",
        titleEn: file.originalname,
        imageUrl: file.mimetype.startsWith("image/") ? `/uploads/images/${file.filename}` : "",
        videoUrl: file.mimetype.startsWith("video/") ? `/uploads/videos/${file.filename}` : ""
      }))
    );
    return send(res, data, 201);
  })
);
apiRouter.put(
  "/admin/gallery/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateGalleryItem(req.params.id, req.body);
    if (!item) return fail(res, "Gallery item not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/gallery/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteGalleryItem(req.params.id);
    if (!item) return fail(res, "Gallery item not found", 404);
    return send(res, { message: "Gallery item deleted successfully" });
  })
);
apiRouter.get(
  "/admin/inquiries",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllInquiries()))
);
apiRouter.post(
  "/inquiries",
  asyncRoute(async (req, res) => {
    if (!req.body.fullName || !req.body.phone || !req.body.message) {
      return fail(res, "Name, phone and message are required", 400);
    }
    return send(res, await dbOperations.createInquiry(req.body), 201);
  })
);
apiRouter.put(
  "/admin/inquiries/bulk-status",
  authenticateJWT,
  asyncRoute(
    async (req, res) => send(
      res,
      await dbOperations.updateManyInquiryStatus(req.body.ids || [], req.body.status || "Contacted")
    )
  )
);
apiRouter.put(
  "/admin/inquiries/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateInquiryStatus(req.params.id, req.body.status);
    if (!item) return fail(res, "Inquiry not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/inquiries/bulk-delete",
  authenticateJWT,
  asyncRoute(
    async (req, res) => send(res, { deleted: await dbOperations.deleteManyInquiries(req.body.ids || []) })
  )
);
apiRouter.delete(
  "/admin/inquiries/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteInquiry(req.params.id);
    if (!item) return fail(res, "Inquiry not found", 404);
    return send(res, { message: "Inquiry deleted successfully" });
  })
);
apiRouter.get(
  "/admin/price-logs",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllPriceLogs()))
);
apiRouter.post(
  "/admin/price-logs",
  authenticateJWT,
  asyncRoute(async (req, res) => send(res, await dbOperations.createPriceLog(req.body), 201))
);
apiRouter.post(
  "/admin/sms/campaign",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const message = String(req.body.message || "");
    if (!message) return fail(res, "Message is required", 400);
    const recipientType = req.body.recipientType || "subscribers";
    let recipients = [];
    if (recipientType === "persons") {
      const packages = await dbOperations.getAllPackages();
      recipients = packages.flatMap(
        (pkg) => (pkg.persons || []).filter((p) => p && p.phone).map((p) => ({ phone: p.phone, name: p.name || "", packageTitle: pkg.titleEn }))
      );
    } else {
      recipients = await dbOperations.getOptedInSubscribers();
    }
    const logs = await Promise.all(
      recipients.map(
        (recipient) => dbOperations.createSmsLog({
          phone: recipient.phone,
          message,
          campaignName: req.body.campaignName,
          status: "Delivered"
        })
      )
    );
    return send(res, {
      sent: logs.length,
      recipientType,
      recipientsCount: recipients.length,
      logs
    });
  })
);
var smsLogs = asyncRoute(async (_req, res) => send(res, await dbOperations.getAllSmsLogs()));
apiRouter.get("/admin/sms/logs", authenticateJWT, smsLogs);
apiRouter.get("/admin/sms/campaigns", authenticateJWT, smsLogs);
apiRouter.get(
  "/admin/dashboard/stats",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getDashboardStats()))
);
var uploadBody = (req, field, fallback = "") => fileUrl(req, field, req.body.imageUrl || fallback);
apiRouter.get(
  "/team-members",
  asyncRoute(async (_req, res) => send(res, await dbOperations.getActiveTeamMembers()))
);
apiRouter.get(
  "/admin/team-members",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllTeamMembers()))
);
apiRouter.post(
  "/admin/team-members",
  authenticateJWT,
  teamUpload,
  asyncRoute(async (req, res) => {
    const member = await dbOperations.createTeamMember({
      name: req.body.name,
      role: req.body.role,
      bio: req.body.bio,
      imageUrl: uploadBody(req, "team"),
      order: Number(req.body.order || 0),
      isActive: bool(req.body.isActive, true)
    });
    return send(res, member, 201);
  })
);
apiRouter.put(
  "/admin/team-members/:id",
  authenticateJWT,
  teamUpload,
  asyncRoute(async (req, res) => {
    const updateData = {
      name: req.body.name,
      role: req.body.role,
      bio: req.body.bio,
      image_url: uploadBody(req, "team", req.body.imageUrl),
      sort_order: Number(req.body.order || 0),
      is_active: req.body.isActive === void 0 ? void 0 : bool(req.body.isActive, true)
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === void 0 && delete updateData[key]
    );
    const item = await dbOperations.updateTeamMember(req.params.id, updateData);
    if (!item) return fail(res, "Team member not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/team-members/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteTeamMember(req.params.id);
    if (!item) return fail(res, "Team member not found", 404);
    return send(res, { message: "Team member deleted successfully" });
  })
);
apiRouter.get(
  "/office-images",
  asyncRoute(async (_req, res) => send(res, await dbOperations.getActiveOfficeImages()))
);
apiRouter.get(
  "/admin/office-images",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllOfficeImages()))
);
apiRouter.post(
  "/admin/office-images",
  authenticateJWT,
  officeUpload,
  asyncRoute(async (req, res) => {
    const image = await dbOperations.createOfficeImage({
      title: req.body.title || "",
      imageUrl: uploadBody(req, "office"),
      description: req.body.description || "",
      order: Number(req.body.order || 0),
      isActive: bool(req.body.isActive, true)
    });
    return send(res, image, 201);
  })
);
apiRouter.put(
  "/admin/office-images/:id",
  authenticateJWT,
  officeUpload,
  asyncRoute(async (req, res) => {
    const updateData = {
      title: req.body.title,
      image_url: uploadBody(req, "office", req.body.imageUrl),
      description: req.body.description,
      sort_order: Number(req.body.order || 0),
      is_active: req.body.isActive === void 0 ? void 0 : bool(req.body.isActive, true)
    };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === void 0 && delete updateData[key]
    );
    const item = await dbOperations.updateOfficeImage(req.params.id, updateData);
    if (!item) return fail(res, "Office image not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/office-images/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteOfficeImage(req.params.id);
    if (!item) return fail(res, "Office image not found", 404);
    return send(res, { message: "Office image deleted successfully" });
  })
);
apiRouter.get(
  "/testimonials",
  asyncRoute(async (_req, res) => send(res, await dbOperations.getActiveTestimonials()))
);
apiRouter.get(
  "/admin/testimonials",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllTestimonials()))
);
apiRouter.post(
  "/admin/testimonials",
  authenticateJWT,
  asyncRoute(async (req, res) => send(res, await dbOperations.createTestimonial(req.body), 201))
);
apiRouter.put(
  "/admin/testimonials/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateTestimonial(req.params.id, req.body);
    if (!item) return fail(res, "Testimonial not found", 404);
    return send(res, item);
  })
);
apiRouter.delete(
  "/admin/testimonials/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteTestimonial(req.params.id);
    if (!item) return fail(res, "Testimonial not found", 404);
    return send(res, { message: "Testimonial deleted successfully" });
  })
);
apiRouter.get(
  "/admin/subscribers",
  authenticateJWT,
  asyncRoute(async (_req, res) => send(res, await dbOperations.getAllSubscribers()))
);
apiRouter.post(
  "/subscribers",
  asyncRoute(async (req, res) => {
    if (!req.body.phone) return fail(res, "Phone is required", 400);
    return send(res, await dbOperations.createSubscriber(req.body), 201);
  })
);
apiRouter.post(
  "/admin/subscribers",
  authenticateJWT,
  asyncRoute(async (req, res) => send(res, await dbOperations.createSubscriber(req.body), 201))
);
apiRouter.delete(
  "/admin/subscribers/bulk-delete",
  authenticateJWT,
  asyncRoute(
    async (req, res) => send(res, {
      deleted: await dbOperations.deleteSubscribers(req.body.ids || [], req.body.phones || [])
    })
  )
);
apiRouter.delete(
  "/admin/subscribers/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.deleteSubscriber(req.params.id);
    if (!item) return fail(res, "Subscriber not found", 404);
    return send(res, { message: "Subscriber deleted successfully" });
  })
);
apiRouter.put(
  "/admin/subscribers/:id",
  authenticateJWT,
  asyncRoute(async (req, res) => {
    const item = await dbOperations.updateSubscriber(req.params.id, req.body);
    if (!item) return fail(res, "Subscriber not found", 404);
    return send(res, item);
  })
);
apiRouter.post(
  "/admin/subscribers/bulk",
  authenticateJWT,
  asyncRoute(
    async (req, res) => send(res, await dbOperations.bulkImportSubscribers(req.body.subscribers || req.body), 201)
  )
);

// src/backend/swagger.ts
var openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Delta Travel & Tour REST API",
    version: "2.0.0",
    description: "REST API backend serving Umrah travel packages with real-time ETB exchange rate conversion, holy media gallery, SMS broadcasts, subscriber opt-ins, and customer inquiries."
  },
  servers: [
    {
      url: "https://api.deltagrouptravelumrah.com",
      description: "\u{1F680} Production Server (Primary)"
    },
    {
      url: "https://delta-travel-backend.onrender.com",
      description: "\u{1F680} Production Server (Render)"
    },
    {
      url: "http://localhost:3000",
      description: "\u{1F6E0}\uFE0F Local Development Server"
    },
    {
      url: "/api",
      description: "Relative API Path (if served from same domain)"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ExchangeRate: {
        type: "object",
        properties: {
          rate: { type: "number", example: 159.98 },
          updatedAt: { type: "string", example: "2026-07-27T17:50:00Z" },
          source: { type: "string", example: "budjet.org" },
          isFallback: { type: "boolean", example: false }
        }
      },
      Package: {
        type: "object",
        properties: {
          id: { type: "string", example: "pkg-1" },
          titleEn: { type: "string", example: "Economy Saver Umrah Package" },
          titleAr: { type: "string", example: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0639\u0645\u0631\u0629 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629" },
          titleAm: { type: "string", example: "\u12E8\u12A2\u12AE\u1296\u121A \u12D1\u121D\u122B \u1353\u12AC\u1305" },
          category: { type: "string", enum: ["Economy", "Standard", "Premium", "VIP"] },
          priceUsd: { type: "number", example: 890 },
          priceEtb: { type: "number", example: 99780 },
          durationDays: { type: "integer", example: 10 },
          departureCity: { type: "string", example: "Addis Ababa" },
          inclusions: { type: "array", items: { type: "string" } },
          availableDates: { type: "array", items: { type: "string" } },
          imageUrl: { type: "string" },
          isActive: { type: "boolean", example: true },
          whatsappClicks: { type: "integer", example: 34 },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },
      GalleryItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "gal-1" },
          type: { type: "string", enum: ["photo", "video"] },
          titleEn: { type: "string", example: "Holy Kaaba & Mataf Courtyard" },
          titleAr: { type: "string", example: "\u0627\u0644\u0643\u0639\u0628\u0629 \u0627\u0644\u0645\u0634\u0631\u0641\u0629 \u0648\u0627\u0644\u0635\u062D\u0646 \u0627\u0644\u0634\u0631\u064A\u0641" },
          imageUrl: { type: "string" },
          videoUrl: { type: "string" },
          duration: { type: "string", example: "3:45" },
          location: { type: "string", example: "Masjid al-Haram, Makkah" },
          description: { type: "string" },
          isActive: { type: "boolean", example: true },
          sortOrder: { type: "integer", example: 1 },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },
      Subscriber: {
        type: "object",
        properties: {
          id: { type: "string", example: "sub-1" },
          phone: { type: "string", example: "+251911223344" },
          email: { type: "string", example: "subscriber@example.com" },
          name: { type: "string", example: "Abebe Bikila" },
          channel: { type: "string", example: "Footer Newsletter" },
          packageInterestId: { type: "string", example: "pkg-1" },
          optInStatus: { type: "boolean", example: true },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },
      Inquiry: {
        type: "object",
        properties: {
          id: { type: "string", example: "inq-1" },
          fullName: { type: "string", example: "Mohammed Ahmed" },
          phone: { type: "string", example: "+251922334455" },
          email: { type: "string", example: "mohammed@example.com" },
          subject: { type: "string", example: "Group Booking" },
          message: { type: "string" },
          source: { type: "string", example: "Contact Form" },
          status: { type: "string", enum: ["New", "Contacted", "Resolved"], example: "New" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },
      FAQ: {
        type: "object",
        properties: {
          id: { type: "string", example: "faq-1" },
          question: { type: "string", example: "What is included in the Umrah package?" },
          answer: { type: "string", example: "Our Umrah packages include visa processing, round-trip flights, hotel accommodation, transportation, and a dedicated tour guide (Ustaz)." }
        }
      },
      SocialLink: {
        type: "object",
        properties: {
          id: { type: "string", example: "sl-1" },
          platform: { type: "string", example: "facebook" },
          url: { type: "string", example: "https://facebook.com/deltatravel" },
          isActive: { type: "boolean", example: true },
          icon: { type: "string", example: "Facebook" }
        }
      },
      TeamMember: {
        type: "object",
        properties: {
          id: { type: "string", example: "tm-1" },
          name: { type: "string", example: "Sheikh Omar Al-Hassan" },
          role: { type: "string", example: "Head Mutawwif & Islamic Scholar" },
          bio: { type: "string", example: "12+ years leading Tawaf and Sa'i rituals" },
          imageUrl: { type: "string", example: "/uploads/team/image.jpg" },
          order: { type: "integer", example: 1 },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },
      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string", example: "admin@deltatravel.com" },
          password: { type: "string", example: "admin123" }
        },
        required: ["username", "password"]
      },
      LoginResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              email: { type: "string" },
              role: { type: "string", example: "Admin" },
              isActive: { type: "boolean" },
              status: { type: "string" }
            }
          }
        }
      },
      DashboardStats: {
        type: "object",
        properties: {
          totalPackages: { type: "integer", example: 12 },
          activePackages: { type: "integer", example: 8 },
          totalGalleryItems: { type: "integer", example: 45 },
          totalInquiries: { type: "integer", example: 67 },
          totalSubscribers: { type: "integer", example: 234 },
          totalWhatsappClicks: { type: "integer", example: 89 },
          smsSentThisMonth: { type: "integer", example: 45 },
          clicksByCategory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", example: "Economy" },
                clicks: { type: "integer", example: 34 }
              }
            }
          },
          recentInquiries: {
            type: "array",
            items: { $ref: "#/components/schemas/Inquiry" }
          },
          recentGalleryUploads: {
            type: "array",
            items: { $ref: "#/components/schemas/GalleryItem" }
          }
        }
      }
    }
  },
  paths: {
    // ============================================================
    // PUBLIC ENDPOINTS
    // ============================================================
    "/exchange-rate": {
      get: {
        summary: "Get real-time USD to ETB exchange rate",
        tags: ["Public"],
        responses: {
          200: {
            description: "Success real-time rate",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  data: {
                    rate: 112.11,
                    updatedAt: "2026-07-27T10:00:00Z",
                    source: "budjet.org"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/packages": {
      get: {
        summary: "List active Umrah packages (with real-time ETB prices)",
        tags: ["Public"],
        responses: {
          200: {
            description: "List of packages",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  count: 4,
                  data: [
                    {
                      id: "pkg-1",
                      titleEn: "Economy Saver Umrah Package",
                      titleAr: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0639\u0645\u0631\u0629 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629",
                      category: "Economy",
                      priceUsd: 890,
                      priceEtb: 99780,
                      durationDays: 10,
                      isActive: true,
                      whatsappClicks: 34
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/packages/{id}": {
      get: {
        summary: "Get package details by ID",
        tags: ["Public"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Package details" } }
      }
    },
    "/packages/{id}/click-whatsapp": {
      post: {
        summary: "Increment WhatsApp clicks for package",
        tags: ["Public"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Updated click count",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  data: { whatsappClicks: 35 }
                }
              }
            }
          }
        }
      }
    },
    "/gallery": {
      get: {
        summary: "List active gallery photos and videos",
        tags: ["Public"],
        responses: { 200: { description: "Gallery items" } }
      }
    },
    "/gallery/{id}": {
      get: {
        summary: "Get gallery item by ID",
        tags: ["Public"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Gallery item details" } }
      }
    },
    "/faqs": {
      get: {
        summary: "Get all active FAQs",
        tags: ["Public"],
        responses: {
          200: {
            description: "List of FAQs",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  count: 5,
                  data: [
                    {
                      id: "faq-1",
                      question: "What is included in the Umrah package?",
                      answer: "Our Umrah packages include visa processing, round-trip flights, hotel accommodation, transportation, and a dedicated tour guide (Ustaz)."
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/social-links": {
      get: {
        summary: "Get all active social media links",
        tags: ["Public"],
        responses: {
          200: {
            description: "List of social links",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  data: [
                    {
                      id: "sl-1",
                      platform: "facebook",
                      url: "https://facebook.com/deltatravel",
                      isActive: true,
                      icon: "Facebook"
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/team-members": {
      get: {
        summary: "Get all active team members",
        tags: ["Public"],
        responses: {
          200: {
            description: "List of team members",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  count: 3,
                  data: [
                    {
                      id: "tm-1",
                      name: "Sheikh Omar Al-Hassan",
                      role: "Head Mutawwif & Islamic Scholar",
                      bio: "12+ years leading Tawaf and Sa'i rituals; graduate of Islamic University of Madinah.",
                      imageUrl: "/uploads/team/image.jpg",
                      order: 1,
                      isActive: true
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/subscribers": {
      post: {
        summary: "Subscribe user for SMS updates",
        tags: ["Public"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string", example: "+251911223344" },
                  email: { type: "string", example: "subscriber@example.com" },
                  name: { type: "string", example: "Abebe Bikila" },
                  channel: { type: "string", example: "Footer Newsletter" },
                  packageInterestId: { type: "string", example: "pkg-1" }
                },
                required: ["phone"]
              }
            }
          }
        },
        responses: { 201: { description: "Subscribed successfully" } }
      }
    },
    "/inquiries": {
      post: {
        summary: "Submit inquiry",
        tags: ["Public"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string", example: "Mohammed Ahmed" },
                  phone: { type: "string", example: "+251922334455" },
                  email: { type: "string", example: "mohammed@example.com" },
                  subject: { type: "string", example: "Group Booking" },
                  message: { type: "string", example: "I want to book for 5 people" },
                  source: { type: "string", example: "Contact Form" }
                },
                required: ["fullName", "phone", "message"]
              }
            }
          }
        },
        responses: { 201: { description: "Inquiry submitted" } }
      }
    },
    // ============================================================
    // ADMIN AUTH ENDPOINTS
    // ============================================================
    "/admin/auth/login": {
      post: {
        summary: "Admin Authentication Login",
        tags: ["Admin Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful with JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          }
        }
      }
    },
    "/admin/auth/me": {
      get: {
        summary: "Get current admin user profile",
        tags: ["Admin Auth"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Current admin user profile" } }
      }
    },
    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================
    "/admin/dashboard/stats": {
      get: {
        summary: "Get administrative overview stats and analytics",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard stats and recent activity",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardStats" }
              }
            }
          }
        }
      }
    },
    // ============================================================
    // ADMIN PACKAGES
    // ============================================================
    "/admin/packages": {
      get: {
        summary: "List all packages (admin view)",
        tags: ["Admin Packages"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of all packages" } }
      },
      post: {
        summary: "Create new package (USD price only)",
        tags: ["Admin Packages"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  titleEn: { type: "string", example: "Premium Umrah Package" },
                  titleAr: { type: "string", example: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0639\u0645\u0631\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629" },
                  titleAm: { type: "string", example: "\u1355\u122A\u121A\u12E8\u121D \u12D1\u121D\u122B \u1353\u12AC\u1305" },
                  category: { type: "string", enum: ["Economy", "Standard", "Premium", "VIP"] },
                  priceUsd: { type: "number", example: 1200 },
                  durationDays: { type: "integer", example: 12 },
                  departureCity: { type: "string", example: "Addis Ababa" },
                  inclusions: { type: "string", example: '["Hotel","Flight","Transport"]' },
                  availableDates: { type: "string", example: '["2026-12-01","2026-12-15"]' },
                  itinerary: { type: "string", example: '[{"day":1,"description":"Arrival"}]' },
                  isActive: { type: "boolean", example: true },
                  packageImage: { type: "string", format: "binary" }
                },
                required: ["titleEn", "category", "priceUsd", "durationDays"]
              }
            }
          }
        },
        responses: { 201: { description: "Package created successfully" } }
      }
    },
    "/admin/packages/{id}": {
      get: {
        summary: "Get package by ID (admin view)",
        tags: ["Admin Packages"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Package details" } }
      },
      put: {
        summary: "Update package",
        tags: ["Admin Packages"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Package updated successfully" } }
      },
      delete: {
        summary: "Delete package",
        tags: ["Admin Packages"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Package deleted successfully" } }
      }
    },
    // ============================================================
    // ADMIN GALLERY
    // ============================================================
    "/admin/gallery": {
      get: {
        summary: "List all gallery items (admin view)",
        tags: ["Admin Gallery"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of all gallery items" } }
      },
      post: {
        summary: "Upload single gallery item (photo or video)",
        tags: ["Admin Gallery"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["photo", "video"] },
                  titleEn: { type: "string", example: "Holy Kaaba" },
                  titleAr: { type: "string", example: "\u0627\u0644\u0643\u0639\u0628\u0629 \u0627\u0644\u0645\u0634\u0631\u0641\u0629" },
                  location: { type: "string", example: "Masjid al-Haram, Makkah" },
                  description: { type: "string" },
                  duration: { type: "string", example: "3:45" },
                  isActive: { type: "boolean", example: true },
                  image: { type: "string", format: "binary" },
                  video: { type: "string", format: "binary" }
                },
                required: ["type", "titleEn"]
              }
            }
          }
        },
        responses: { 201: { description: "Gallery item created successfully" } }
      }
    },
    "/admin/gallery/bulk": {
      post: {
        summary: "Bulk upload gallery items (photos and videos)",
        tags: ["Admin Gallery"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "string",
                    example: '[{"titleEn":"Mecca","type":"photo"},{"titleEn":"Medina","type":"photo"}]'
                  },
                  files: { type: "array", items: { type: "string", format: "binary" } }
                },
                required: ["items"]
              }
            }
          }
        },
        responses: { 201: { description: "Bulk items created" } }
      }
    },
    "/admin/gallery/{id}": {
      put: {
        summary: "Update gallery item",
        tags: ["Admin Gallery"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Gallery item updated successfully" } }
      },
      delete: {
        summary: "Delete gallery item",
        tags: ["Admin Gallery"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Gallery item deleted successfully" } }
      }
    },
    // ============================================================
    // ADMIN INQUIRIES
    // ============================================================
    "/admin/inquiries": {
      get: {
        summary: "List all customer inquiries",
        tags: ["Admin Inquiries"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of inquiries" } }
      }
    },
    "/admin/inquiries/{id}": {
      put: {
        summary: "Update inquiry status",
        tags: ["Admin Inquiries"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["New", "Contacted", "Resolved"], example: "Contacted" }
                },
                required: ["status"]
              }
            }
          }
        },
        responses: { 200: { description: "Updated inquiry status" } }
      }
    },
    // ============================================================
    // ADMIN SUBSCRIBERS
    // ============================================================
    "/admin/subscribers": {
      get: {
        summary: "List all subscribers",
        tags: ["Admin Subscribers"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of subscribers" } }
      }
    },
    "/admin/subscribers/bulk": {
      post: {
        summary: "Bulk import subscribers",
        tags: ["Admin Subscribers"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subscribers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phone: { type: "string", example: "+251911223344" },
                        email: { type: "string", example: "user@example.com" },
                        name: { type: "string", example: "Abebe Bikila" },
                        channel: { type: "string", example: "Bulk Import" }
                      },
                      required: ["phone"]
                    }
                  }
                },
                required: ["subscribers"]
              }
            }
          }
        },
        responses: { 201: { description: "Subscribers imported" } }
      }
    },
    "/admin/subscribers/bulk-delete": {
      delete: {
        summary: "Bulk delete subscribers by IDs or phone numbers",
        tags: ["Admin Subscribers"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ids: { type: "array", items: { type: "string" }, example: ["sub-1", "sub-2"] },
                  phoneNumbers: { type: "array", items: { type: "string" }, example: ["+251911223344"] }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Subscribers deleted" } }
      }
    },
    // ============================================================
    // ADMIN SMS
    // ============================================================
    "/admin/sms/campaign": {
      post: {
        summary: "Send SMS campaign with recipient filters",
        tags: ["Admin SMS"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Your Umrah package is ready!" },
                  sendToAll: { type: "boolean", example: true },
                  recipientFilter: { type: "string", example: "channel:Web Form" },
                  channelFilter: { type: "string", example: "Web Form" },
                  packageInterestId: { type: "string", example: "pkg-1" }
                },
                required: ["message"]
              }
            }
          }
        },
        responses: {
          200: {
            description: "SMS campaign status",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  success: true,
                  message: "SMS campaign sent successfully",
                  data: {
                    recipientsCount: 150,
                    sentCount: 148,
                    failedCount: 2,
                    campaignId: "camp_1734567890123",
                    sentAt: "2026-07-27T10:00:00Z",
                    status: "Delivered"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admin/sms/logs": {
      get: {
        summary: "Get SMS logs history",
        tags: ["Admin SMS"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of sent SMS logs" } }
      }
    },
    "/admin/sms/campaigns": {
      get: {
        summary: "Get SMS campaign logs",
        tags: ["Admin SMS"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of SMS campaigns" } }
      }
    },
    // ============================================================
    // ADMIN EXCHANGE RATE
    // ============================================================
    "/admin/exchange-rate": {
      get: {
        summary: "Get exchange rate for admin dashboard",
        tags: ["Admin Exchange Rate"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Exchange rate details" } }
      },
      post: {
        summary: "Override USD to ETB exchange rate",
        tags: ["Admin Exchange Rate"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rate: { type: "number", example: 160.5 }
                },
                required: ["rate"]
              }
            }
          }
        },
        responses: { 200: { description: "Exchange rate updated successfully" } }
      }
    },
    // ============================================================
    // ADMIN FAQS
    // ============================================================
    "/admin/faqs": {
      get: {
        summary: "Get all FAQs (admin view)",
        tags: ["Admin FAQs"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all FAQs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 5 },
                    data: { type: "array", items: { $ref: "#/components/schemas/FAQ" } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new FAQ",
        tags: ["Admin FAQs"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "What is the best time for Umrah?" },
                  answer: { type: "string", example: "The best time is during the cooler months from November to March." }
                },
                required: ["question", "answer"]
              }
            }
          }
        },
        responses: { 201: { description: "FAQ created successfully" } }
      }
    },
    "/admin/faqs/{id}": {
      put: {
        summary: "Update an existing FAQ",
        tags: ["Admin FAQs"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "Updated question?" },
                  answer: { type: "string", example: "Updated answer." }
                }
              }
            }
          }
        },
        responses: { 200: { description: "FAQ updated successfully" } }
      },
      delete: {
        summary: "Delete an FAQ",
        tags: ["Admin FAQs"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "FAQ deleted successfully" } }
      }
    },
    // ============================================================
    // ADMIN SOCIAL LINKS
    // ============================================================
    "/admin/social-links": {
      get: {
        summary: "Get all social links (admin view)",
        tags: ["Admin Social Links"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all social links",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/SocialLink" } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new social link",
        tags: ["Admin Social Links"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  platform: { type: "string", example: "youtube" },
                  url: { type: "string", example: "https://youtube.com/deltatravel" },
                  isActive: { type: "boolean", example: true }
                },
                required: ["platform", "url"]
              }
            }
          }
        },
        responses: { 201: { description: "Social link created successfully" } }
      }
    },
    "/admin/social-links/{id}": {
      put: {
        summary: "Update a social link",
        tags: ["Admin Social Links"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string", example: "https://youtube.com/deltatravel" },
                  isActive: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Social link updated successfully" } }
      },
      delete: {
        summary: "Delete a social link",
        tags: ["Admin Social Links"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Social link deleted successfully" } }
      }
    },
    // ============================================================
    // ADMIN TEAM MEMBERS
    // ============================================================
    "/admin/team-members": {
      get: {
        summary: "Get all team members (admin view)",
        tags: ["Admin Team Members"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all team members",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 3 },
                    data: { type: "array", items: { $ref: "#/components/schemas/TeamMember" } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new team member with image upload",
        tags: ["Admin Team Members"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Sheikh Omar Al-Hassan" },
                  role: { type: "string", example: "Head Mutawwif & Islamic Scholar" },
                  bio: { type: "string", example: "12+ years leading Tawaf and Sa'i rituals." },
                  order: { type: "integer", example: 1 },
                  isActive: { type: "boolean", example: true },
                  image: { type: "string", format: "binary", description: "Team member photo (JPG, PNG, WEBP)" }
                },
                required: ["name", "role", "bio", "image"]
              }
            }
          }
        },
        responses: { 201: { description: "Team member created successfully" } }
      }
    },
    "/admin/team-members/{id}": {
      put: {
        summary: "Update a team member with optional image upload",
        tags: ["Admin Team Members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Updated Name" },
                  role: { type: "string", example: "Updated Role" },
                  bio: { type: "string", example: "Updated bio." },
                  order: { type: "integer", example: 2 },
                  isActive: { type: "boolean", example: true },
                  image: { type: "string", format: "binary", description: "New team member photo (optional)" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Team member updated successfully" } }
      },
      delete: {
        summary: "Delete a team member",
        tags: ["Admin Team Members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Team member deleted successfully" } }
      }
    },
    // ============================================================
    // LEGACY ENDPOINTS (Aliases)
    // ============================================================
    "/login": {
      post: {
        summary: "Standardized admin login (alias)",
        tags: ["Legacy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: { 200: { description: "Login successful" } }
      }
    },
    "/admin/login": {
      post: {
        summary: "Admin login (alias)",
        tags: ["Legacy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: { 200: { description: "Login successful" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Standardized auth login (alias)",
        tags: ["Legacy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: { 200: { description: "Login successful" } }
      }
    },
    "/admin/me": {
      get: {
        summary: "Get current admin user (alias)",
        tags: ["Legacy"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Current admin profile" } }
      }
    },
    "/admin/inquiries/{id}/status": {
      put: {
        summary: "Update inquiry status (alias)",
        tags: ["Legacy"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["New", "Contacted", "Resolved"] }
                },
                required: ["status"]
              }
            }
          }
        },
        responses: { 200: { description: "Updated inquiry status" } }
      }
    },
    "/admin/subscribers/bulk-import": {
      post: {
        summary: "Bulk import subscribers (alias)",
        tags: ["Legacy"],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Subscribers imported" } }
      }
    }
  }
};

// server.ts
var import_fs2 = __toESM(require("fs"), 1);
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error("PostgreSQL connection test failed");
    }
    await initDatabase();
    console.log("\u2705 Database initialization completed");
  } catch (error) {
    console.error("\u274C Database initialization failed:", error);
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting in production due to DB failure.");
      process.exit(1);
    }
  }
  initExchangeRateService();
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.use(
    (0, import_cors.default)({
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log("\u274C Blocked by CORS:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Range"],
      exposedHeaders: ["Content-Length", "Content-Range", "Accept-Ranges"],
      credentials: true
    })
  );
  app.use(import_express2.default.json({ limit: "50mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "50mb" }));
  const uploadPath2 = process.env.UPLOAD_PATH ? import_path2.default.resolve(process.env.UPLOAD_PATH) : import_path2.default.resolve(process.cwd(), "uploads");
  const videosPath2 = import_path2.default.join(uploadPath2, "videos");
  const imagesPath2 = import_path2.default.join(uploadPath2, "images");
  const packagesPath2 = import_path2.default.join(uploadPath2, "packages");
  const teamPath2 = import_path2.default.join(uploadPath2, "team");
  const officePath2 = import_path2.default.join(uploadPath2, "office");
  [uploadPath2, videosPath2, imagesPath2, packagesPath2, teamPath2, officePath2].forEach((dir) => {
    if (!import_fs2.default.existsSync(dir)) {
      import_fs2.default.mkdirSync(dir, { recursive: true });
      console.log(`\u{1F4C1} Created directory: ${dir}`);
    }
  });
  console.log("\u{1F4C1} Uploads directory:", uploadPath2);
  console.log("\u{1F4F9} Videos directory:", videosPath2);
  console.log("\u{1F5BC}\uFE0F Images directory:", imagesPath2);
  console.log("\u{1F4E6} Packages directory:", packagesPath2);
  console.log("\u{1F464} Team directory:", teamPath2);
  console.log("\u{1F464} Office directory:", officePath2);
  const staticCors = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range"
    );
    res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  };
  const setFileHeaders = (res, filePath) => {
    if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
    else if (filePath.endsWith(".webm")) res.setHeader("Content-Type", "video/webm");
    else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
      res.setHeader("Content-Type", "image/jpeg");
    else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
    else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
    else if (filePath.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
  };
  app.use("/uploads", staticCors);
  app.use("/uploads", import_express2.default.static(uploadPath2, { setHeaders: setFileHeaders }));
  app.use("/uploads/images", staticCors);
  app.use("/uploads/images", import_express2.default.static(imagesPath2, { setHeaders: setFileHeaders }));
  app.use("/uploads/videos", staticCors);
  app.use("/uploads/videos", import_express2.default.static(videosPath2, { setHeaders: setFileHeaders }));
  app.use("/uploads/packages", staticCors);
  app.use("/uploads/packages", import_express2.default.static(packagesPath2, { setHeaders: setFileHeaders }));
  app.use("/uploads/team", staticCors);
  app.use("/uploads/team", import_express2.default.static(teamPath2, { setHeaders: setFileHeaders }));
  app.use("/uploads/office", staticCors);
  app.use("/uploads/office", import_express2.default.static(officePath2, { setHeaders: setFileHeaders }));
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "Delta Travel API Backend", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Delta Travel API Backend", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/", (req, res) => {
    res.json({
      status: "online",
      message: "Delta Travel API is running",
      version: "1.0.0",
      documentation: `${req.protocol}://${req.get("host")}/api-docs`,
      endpoints: {
        public: [
          "GET /api/packages",
          "GET /api/packages/:id",
          "POST /api/packages/:id/click-whatsapp",
          "GET /api/gallery",
          "POST /api/subscribers",
          "POST /api/inquiries",
          "GET /api/exchange-rate",
          "GET /api/faqs",
          "GET /api/social-links",
          "GET /api/team-members",
          "GET /api/office-images",
          "GET /api/testimonials",
          "GET /api/health"
        ],
        auth: ["POST /api/admin/auth/login", "GET /api/admin/auth/me"],
        admin: [
          "GET /api/admin/packages",
          "POST /api/admin/packages",
          "PUT /api/admin/packages/:id",
          "DELETE /api/admin/packages/:id",
          "GET /api/admin/gallery",
          "POST /api/admin/gallery",
          "POST /api/admin/gallery/bulk",
          "PUT /api/admin/gallery/:id",
          "DELETE /api/admin/gallery/:id",
          "GET /api/admin/inquiries",
          "PUT /api/admin/inquiries/:id",
          "DELETE /api/admin/inquiries/:id",
          "GET /api/admin/subscribers",
          "POST /api/admin/subscribers/bulk",
          "DELETE /api/admin/subscribers/bulk-delete",
          "POST /api/admin/sms/campaign",
          "GET /api/admin/sms/campaigns",
          "GET /api/admin/users",
          "POST /api/admin/users",
          "PUT /api/admin/users/:id",
          "DELETE /api/admin/users/:id",
          "GET /api/admin/exchange-rate",
          "POST /api/admin/exchange-rate",
          "GET /api/admin/dashboard/stats",
          "GET /api/admin/faqs",
          "POST /api/admin/faqs",
          "PUT /api/admin/faqs/:id",
          "DELETE /api/admin/faqs/:id",
          "GET /api/admin/social-links",
          "POST /api/admin/social-links",
          "PUT /api/admin/social-links/:id",
          "DELETE /api/admin/social-links/:id",
          "GET /api/admin/team-members",
          "POST /api/admin/team-members",
          "PUT /api/admin/team-members/:id",
          "DELETE /api/admin/team-members/:id",
          "GET /api/admin/office-images",
          "POST /api/admin/office-images",
          "PUT /api/admin/office-images/:id",
          "DELETE /api/admin/office-images/:id",
          "GET /api/admin/testimonials",
          "POST /api/admin/testimonials",
          "PUT /api/admin/testimonials/:id",
          "DELETE /api/admin/testimonials/:id"
        ]
      }
    });
  });
  app.use("/api", apiRouter);
  app.get("/api-docs/openapi.json", (req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    "/api-docs",
    import_swagger_ui_express.default.serve,
    import_swagger_ui_express.default.setup(openApiSpec, {
      swaggerOptions: {
        defaultModelExpandDepth: 3,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        displayRequestDuration: true
      }
    })
  );
  app.use((err, req, res, next) => {
    if (err?.name === "MulterError") {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large. Maximum size is 500MB." });
      }
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    }
    if (err?.message === "Only images and videos are allowed") {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  });
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : void 0
    });
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=======================================================");
    console.log(`\u2708\uFE0F Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`\u{1F4C4} Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`\u{1F4CA} API Root JSON available at http://0.0.0.0:${PORT}/`);
    console.log(`\u{1F4C1} Uploads directory: ${uploadPath2}`);
    console.log("=======================================================");
  });
}
startServer();
