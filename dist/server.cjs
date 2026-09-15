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
var import_cors = __toESM(require("cors"), 1);
var import_express2 = __toESM(require("express"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_swagger_ui_express = __toESM(require("swagger-ui-express"), 1);

// src/backend/routes.ts
var import_express = require("express");
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_multer2 = __toESM(require("multer"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_fluent_ffmpeg = __toESM(require("fluent-ffmpeg"), 1);

// src/backend/db.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DEFAULT_PASSWORD_HASH = import_bcryptjs.default.hashSync("admin123", 10);
var DATA_FILE = import_path.default.join(process.cwd(), "data.json");
var DatabaseStore = class {
  constructor() {
    this.packages = [];
    this.subscribers = [];
    this.inquiries = [];
    this.gallery = [];
    this.adminUsers = [];
    this.smsLogs = [];
    this.socialLinks = [];
    this.priceLogs = [];
    this.faqs = [];
    this.teamMembers = [];
    this.officeImages = [];
    this.testimonials = [];
    this.loadFromFile();
    if (this.packages.length === 0 && this.gallery.length === 0 && this.adminUsers.length === 0) {
      this.seedDefaults();
      this.saveToFile();
    }
  }
  loadFromFile() {
    try {
      if (import_fs.default.existsSync(DATA_FILE)) {
        const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        const data = JSON.parse(raw);
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
        console.log(`\u{1F4C2} Loaded ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members, ${this.officeImages.length} office images, ${this.testimonials.length} testimonials from data.json`);
      } else {
        console.log("\u{1F4C2} No data.json found, seeding defaults...");
        this.seedDefaults();
        this.saveToFile();
      }
    } catch (err) {
      console.error("\u274C Error loading data file, seeding defaults:", err);
      this.seedDefaults();
      this.saveToFile();
    }
  }
  saveToFile() {
    try {
      const data = {
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
        testimonials: this.testimonials
      };
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
      console.log(`\u{1F4BE} Saved ${this.packages.length} packages, ${this.gallery.length} gallery items, ${this.faqs.length} FAQs, ${this.teamMembers.length} team members, ${this.officeImages.length} office images, ${this.testimonials.length} testimonials to data.json`);
    } catch (err) {
      console.error("\u274C Error saving data file:", err);
    }
  }
  seedDefaults() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.socialLinks = [];
    this.priceLogs = [];
    this.faqs = [];
    this.teamMembers = [];
    this.packages = [];
    this.officeImages = [];
    this.testimonials = [];
    this.subscribers = [];
    this.inquiries = [];
    this.gallery = [];
    this.adminUsers = [
      {
        id: "usr-1",
        username: "admin",
        email: "admin@deltatravel.com",
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: "Admin",
        lastLogin: null,
        isActive: true,
        status: "Active",
        createdAt: now,
        updatedAt: now
      }
    ];
    this.smsLogs = [];
  }
  // ===== ADD METHODS =====
  addPackage(pkg) {
    this.packages.unshift(pkg);
    this.saveToFile();
  }
  addGalleryItem(item) {
    if (item.type === "video" && !item.thumbnailUrl) {
      item.thumbnailUrl = item.imageUrl || "";
    }
    this.gallery.unshift(item);
    this.saveToFile();
  }
  addSubscriber(sub) {
    this.subscribers.unshift(sub);
    this.saveToFile();
  }
  addInquiry(inquiry) {
    this.inquiries.unshift(inquiry);
    this.saveToFile();
  }
  addSmsLog(log) {
    this.smsLogs.unshift(log);
    this.saveToFile();
  }
  addAdminUser(user) {
    this.adminUsers.push(user);
    this.saveToFile();
  }
  addSocialLink(link) {
    this.socialLinks.push(link);
    this.saveToFile();
  }
  addPriceLog(log) {
    this.priceLogs.unshift(log);
    this.saveToFile();
  }
  // ===== FAQ METHODS =====
  addFaq(faq) {
    this.faqs.push(faq);
    this.saveToFile();
  }
  updateFaq(index, faq) {
    this.faqs[index] = faq;
    this.saveToFile();
  }
  deleteFaq(index) {
    this.faqs.splice(index, 1);
    this.saveToFile();
  }
  // ===== TEAM MEMBER METHODS =====
  addTeamMember(member) {
    this.teamMembers.push(member);
    this.saveToFile();
  }
  updateTeamMember(index, member) {
    this.teamMembers[index] = member;
    this.saveToFile();
  }
  deleteTeamMember(index) {
    this.teamMembers.splice(index, 1);
    this.saveToFile();
  }
  // ===== OFFICE IMAGE METHODS =====
  addOfficeImage(image) {
    this.officeImages.push(image);
    this.saveToFile();
  }
  updateOfficeImage(index, image) {
    this.officeImages[index] = image;
    this.saveToFile();
  }
  deleteOfficeImage(index) {
    this.officeImages.splice(index, 1);
    this.saveToFile();
  }
  // ===== TESTIMONIAL METHODS =====
  addTestimonial(testimonial) {
    this.testimonials.push(testimonial);
    this.saveToFile();
  }
  updateTestimonial(index, testimonial) {
    this.testimonials[index] = testimonial;
    this.saveToFile();
  }
  deleteTestimonial(index) {
    this.testimonials.splice(index, 1);
    this.saveToFile();
  }
  // ===== UPDATE METHODS =====
  updatePackage(index, pkg, reason) {
    const existing = this.packages[index];
    if (existing) {
      const priceChanged = existing.priceUsd !== pkg.priceUsd || existing.priceEtb !== pkg.priceEtb || existing.priceSar !== pkg.priceSar;
      if (priceChanged) {
        const log = {
          id: `pl-${Date.now()}`,
          packageId: pkg.id,
          priceUsd: pkg.priceUsd,
          priceEtb: pkg.priceEtb,
          priceSar: pkg.priceSar,
          previousPriceUsd: existing.priceUsd,
          previousPriceEtb: existing.priceEtb,
          previousPriceSar: existing.priceSar,
          reason: reason || "Price updated via admin",
          updatedBy: "Admin",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.priceLogs.unshift(log);
        console.log(`\u{1F4DD} Price log created for ${pkg.id}: ETB ${existing.priceEtb} -> ETB ${pkg.priceEtb}`);
      }
    }
    this.packages[index] = pkg;
    this.saveToFile();
  }
  updateGalleryItem(index, item) {
    this.gallery[index] = item;
    this.saveToFile();
  }
  updateSubscriber(index, sub) {
    this.subscribers[index] = sub;
    this.saveToFile();
  }
  updateInquiry(index, inquiry) {
    this.inquiries[index] = inquiry;
    this.saveToFile();
  }
  updateAdminUser(index, user) {
    this.adminUsers[index] = user;
    this.saveToFile();
  }
  updateSocialLink(index, link) {
    this.socialLinks[index] = link;
    this.saveToFile();
  }
  // ===== DELETE METHODS =====
  deletePackage(index) {
    this.packages.splice(index, 1);
    this.saveToFile();
  }
  deleteGalleryItem(index) {
    this.gallery.splice(index, 1);
    this.saveToFile();
  }
  deleteSubscriber(index) {
    this.subscribers.splice(index, 1);
    this.saveToFile();
  }
  deleteInquiry(index) {
    this.inquiries.splice(index, 1);
    this.saveToFile();
  }
  deleteAdminUser(index) {
    this.adminUsers.splice(index, 1);
    this.saveToFile();
  }
  deleteSocialLink(index) {
    this.socialLinks.splice(index, 1);
    this.saveToFile();
  }
};
var db = new DatabaseStore();

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
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var uploadPath = import_path2.default.resolve(process.env.UPLOAD_PATH || "./uploads");
var videosPath = import_path2.default.join(uploadPath, "videos");
var imagesPath = import_path2.default.join(uploadPath, "images");
var packagesPath = import_path2.default.join(uploadPath, "packages");
var teamPath = import_path2.default.join(uploadPath, "team");
var officePath = import_path2.default.join(uploadPath, "office");
[videosPath, imagesPath, packagesPath, teamPath, officePath].forEach((dir) => {
  if (!import_fs2.default.existsSync(dir)) {
    import_fs2.default.mkdirSync(dir, { recursive: true });
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
var uploadPaths = {
  uploadPath,
  videosPath,
  imagesPath,
  packagesPath,
  teamPath,
  officePath
};

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
var packageStorage = import_multer2.default.diskStorage({
  destination: (req, file, cb) => {
    const packagesPath2 = uploadPaths.packagesPath;
    if (!import_fs3.default.existsSync(packagesPath2)) import_fs3.default.mkdirSync(packagesPath2, { recursive: true });
    cb(null, packagesPath2);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
    cb(null, uniqueSuffix + "-" + sanitizedName);
  }
});
var packageUploadMiddleware = (0, import_multer2.default)({
  storage: packageStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed for package thumbnail"));
  }
}).single("packageImage");
apiRouter.get("/exchange-rate", async (req, res) => {
  try {
    const rateData = await getExchangeRate();
    res.json({
      status: "success",
      success: true,
      data: {
        rate: rateData.rate,
        updatedAt: rateData.updatedAt,
        source: rateData.source,
        isFallback: rateData.isFallback
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", success: false, error: "Failed to fetch exchange rate", details: error.message });
  }
});
apiRouter.get("/admin/exchange-rate", authenticateJWT, async (req, res) => {
  try {
    const rateData = await getExchangeRate();
    res.json({
      status: "success",
      success: true,
      data: {
        rate: rateData.rate,
        updatedAt: rateData.updatedAt,
        source: rateData.source,
        isFallback: rateData.isFallback
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", success: false, error: "Failed to fetch exchange rate", details: error.message });
  }
});
apiRouter.post("/admin/exchange-rate", authenticateJWT, (req, res) => {
  const { rate } = req.body;
  if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
    return res.status(400).json({ status: "error", success: false, error: "Valid rate number is required" });
  }
  const updatedData = setAdminOverrideRate(Number(rate));
  res.json({
    status: "success",
    success: true,
    message: "Exchange rate updated successfully",
    data: updatedData
  });
});
var handleLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "Username and password are required"
    });
  }
  const user = db.adminUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    return res.status(401).json({
      status: "error",
      success: false,
      error: "Invalid credentials"
    });
  }
  if (!user.isActive) {
    return res.status(401).json({
      status: "error",
      success: false,
      error: "Account is inactive. Contact administrator."
    });
  }
  const isPasswordValid = import_bcryptjs2.default.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      status: "error",
      success: false,
      error: "Invalid credentials"
    });
  }
  user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
  db.saveToFile();
  const tokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  const token = import_jsonwebtoken2.default.sign(tokenPayload, JWT_SECRET2, { expiresIn: "24h" });
  return res.json({
    status: "success",
    success: true,
    message: "Login successful",
    token,
    user: {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      status: user.status || "Active"
    }
  });
};
apiRouter.post("/login", handleLogin);
apiRouter.post("/admin/login", handleLogin);
apiRouter.post("/auth/login", handleLogin);
apiRouter.post("/admin/auth/login", handleLogin);
var handleGetMe = async (req, res) => {
  const reqUser = req.user;
  if (!reqUser) {
    return res.status(401).json({ status: "error", success: false, error: "Unauthorized" });
  }
  const user = db.adminUsers.find((u) => u.id === reqUser.id);
  if (!user) {
    return res.status(404).json({ status: "error", success: false, error: "User not found" });
  }
  const userData = {
    id: String(user.id),
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: user.status || "Active"
  };
  res.json({
    status: "success",
    success: true,
    data: userData,
    user: userData
  });
};
apiRouter.get("/admin/me", authenticateJWT, handleGetMe);
apiRouter.get("/admin/auth/me", authenticateJWT, handleGetMe);
apiRouter.get("/admin/social-links", authenticateJWT, (req, res) => {
  res.json({
    status: "success",
    success: true,
    data: db.socialLinks
  });
});
apiRouter.post("/admin/social-links", authenticateJWT, (req, res) => {
  const { platform, url, isActive, icon } = req.body;
  if (!platform || !url) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "Platform and URL are required"
    });
  }
  const existing = db.socialLinks.find((s) => s.platform.toLowerCase() === platform.toLowerCase());
  if (existing) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: `Platform "${platform}" already exists`
    });
  }
  const newLink = {
    id: `sl-${Date.now()}`,
    platform: platform.toLowerCase(),
    url: url.trim(),
    isActive: isActive !== void 0 ? isActive : true,
    icon: icon || platform.charAt(0).toUpperCase() + platform.slice(1)
  };
  db.addSocialLink(newLink);
  res.status(201).json({
    status: "success",
    success: true,
    message: "Social Media link added successfully",
    data: newLink
  });
});
apiRouter.put("/admin/social-links/:id", authenticateJWT, (req, res) => {
  const index = db.socialLinks.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Social Media link not found" });
  }
  const { url, isActive } = req.body;
  const existing = db.socialLinks[index];
  const updated = {
    ...existing,
    url: url !== void 0 ? url : existing.url,
    isActive: isActive !== void 0 ? isActive : existing.isActive
  };
  db.updateSocialLink(index, updated);
  res.json({
    status: "success",
    success: true,
    message: "Social Media link updated successfully",
    data: updated
  });
});
apiRouter.delete("/admin/social-links/:id", authenticateJWT, (req, res) => {
  const index = db.socialLinks.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Social Media link not found" });
  }
  db.deleteSocialLink(index);
  res.json({
    status: "success",
    success: true,
    message: "Social Media link deleted successfully"
  });
});
apiRouter.get("/social-links", (req, res) => {
  res.json({
    status: "success",
    success: true,
    data: db.socialLinks.filter((s) => s.isActive !== false)
  });
});
apiRouter.get("/faqs", (req, res) => {
  res.json({
    status: "success",
    success: true,
    count: db.faqs.length,
    data: db.faqs
  });
});
apiRouter.get("/admin/faqs", authenticateJWT, (req, res) => {
  res.json({
    status: "success",
    success: true,
    count: db.faqs.length,
    data: db.faqs
  });
});
apiRouter.post("/admin/faqs", authenticateJWT, (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "Question and answer are required"
    });
  }
  const existing = db.faqs.find((f) => f.question.toLowerCase() === question.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "A FAQ with this question already exists"
    });
  }
  const newFaq = {
    id: `faq-${Date.now()}`,
    question: question.trim(),
    answer: answer.trim()
  };
  db.addFaq(newFaq);
  res.status(201).json({
    status: "success",
    success: true,
    message: "FAQ added successfully",
    data: newFaq
  });
});
apiRouter.put("/admin/faqs/:id", authenticateJWT, (req, res) => {
  const index = db.faqs.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "FAQ not found" });
  }
  const { question, answer } = req.body;
  const existing = db.faqs[index];
  const duplicate = db.faqs.find(
    (f) => f.question.toLowerCase() === question?.trim().toLowerCase() && f.id !== req.params.id
  );
  if (duplicate) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "A FAQ with this question already exists"
    });
  }
  const updated = {
    id: existing.id,
    question: question !== void 0 ? question.trim() : existing.question,
    answer: answer !== void 0 ? answer.trim() : existing.answer
  };
  db.updateFaq(index, updated);
  res.json({
    status: "success",
    success: true,
    message: "FAQ updated successfully",
    data: updated
  });
});
apiRouter.delete("/admin/faqs/:id", authenticateJWT, (req, res) => {
  const index = db.faqs.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "FAQ not found" });
  }
  db.deleteFaq(index);
  res.json({
    status: "success",
    success: true,
    message: "FAQ deleted successfully"
  });
});
apiRouter.get("/admin/price-logs", authenticateJWT, (req, res) => {
  const sortedLogs = [...db.priceLogs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const logsWithDetails = sortedLogs.map((log) => {
    const pkg = db.packages.find((p) => p.id === log.packageId);
    return {
      ...log,
      packageTitle: pkg ? pkg.titleEn : "Unknown Package",
      packageCategory: pkg ? pkg.category : "Unknown",
      packageIsActive: pkg ? pkg.isActive : false
    };
  });
  res.json({
    status: "success",
    success: true,
    count: logsWithDetails.length,
    data: logsWithDetails
  });
});
apiRouter.post("/admin/price-logs", authenticateJWT, (req, res) => {
  const { packageId, priceUsd, priceEtb, priceSar, previousPriceUsd, previousPriceEtb, previousPriceSar, reason, updatedBy } = req.body;
  if (!packageId) {
    return res.status(400).json({ status: "error", success: false, error: "Package ID is required" });
  }
  const log = {
    id: `pl-${Date.now()}`,
    packageId,
    priceUsd,
    priceEtb,
    priceSar,
    previousPriceUsd,
    previousPriceEtb,
    previousPriceSar,
    reason: reason || "Manual price update",
    updatedBy: updatedBy || "Admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addPriceLog(log);
  res.status(201).json({
    status: "success",
    success: true,
    message: "Price log created successfully",
    data: log
  });
});
apiRouter.get("/packages", async (req, res) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const packagesList = db.packages.filter((p) => p.isActive === true);
    const data = packagesList.map((pkg) => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || "",
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || "single",
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
      // <-- This includes discountType
      persons: pkg.persons || [],
      durationDays: pkg.durationDays,
      departureCity: pkg.departureCity || "Addis Ababa",
      inclusions: pkg.inclusions || [],
      availableDates: pkg.availableDates || [],
      itinerary: pkg.itinerary || [],
      imageUrl: pkg.imageUrl,
      isActive: pkg.isActive,
      whatsappClicks: pkg.whatsappClicks || 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    }));
    res.json({
      status: "success",
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error("\u274C Error fetching packages:", err);
    res.status(500).json({ status: "error", success: false, error: err.message });
  }
});
apiRouter.get("/packages/:id", async (req, res) => {
  try {
    const pkg = db.packages.find((p) => String(p.id) === String(req.params.id));
    if (!pkg || pkg.isActive === false) {
      return res.status(404).json({ status: "error", success: false, error: "Package not found" });
    }
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const data = {
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || "",
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || "single",
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
      durationDays: pkg.durationDays,
      departureCity: pkg.departureCity || "Addis Ababa",
      inclusions: pkg.inclusions || [],
      availableDates: pkg.availableDates || [],
      itinerary: pkg.itinerary || [],
      imageUrl: pkg.imageUrl,
      isActive: pkg.isActive,
      whatsappClicks: pkg.whatsappClicks || 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    };
    res.json({
      status: "success",
      success: true,
      data
    });
  } catch (err) {
    console.error("\u274C Error fetching package:", err);
    res.status(500).json({ status: "error", success: false, error: err.message });
  }
});
apiRouter.post("/packages/:id/click-whatsapp", async (req, res) => {
  try {
    const index = db.packages.findIndex((p) => String(p.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: "error", success: false, error: "Package not found" });
    }
    const pkg = db.packages[index];
    const updatedPkg = {
      ...pkg,
      whatsappClicks: (pkg.whatsappClicks || 0) + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.updatePackage(index, updatedPkg);
    res.json({
      status: "success",
      success: true,
      message: "WhatsApp click tracked",
      data: { whatsappClicks: updatedPkg.whatsappClicks }
    });
  } catch (err) {
    console.error("\u274C Error tracking WhatsApp click:", err);
    res.status(500).json({ status: "error", success: false, error: err.message });
  }
});
apiRouter.get("/admin/packages", authenticateJWT, async (req, res) => {
  try {
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const packagesList = db.packages;
    const data = packagesList.map((pkg) => ({
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || "",
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || "single",
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
      persons: pkg.persons || [],
      // ✅ IMPORTANT: Include persons
      durationDays: pkg.durationDays,
      departureCity: pkg.departureCity || "Addis Ababa",
      inclusions: pkg.inclusions || [],
      availableDates: pkg.availableDates || [],
      itinerary: pkg.itinerary || [],
      imageUrl: pkg.imageUrl,
      isActive: pkg.isActive,
      whatsappClicks: pkg.whatsappClicks || 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    }));
    res.json({
      status: "success",
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error("\u274C Error fetching admin packages:", err);
    res.status(500).json({ status: "error", success: false, error: err.message });
  }
});
apiRouter.get("/admin/packages/:id", authenticateJWT, async (req, res) => {
  try {
    const pkg = db.packages.find((p) => String(p.id) === String(req.params.id));
    if (!pkg) {
      return res.status(404).json({ status: "error", success: false, error: "Package not found" });
    }
    const rateData = await getExchangeRate();
    const rate = rateData.rate;
    const data = {
      id: String(pkg.id),
      titleEn: pkg.titleEn,
      titleAr: pkg.titleAr,
      titleAm: pkg.titleAm || "",
      category: pkg.category,
      priceUsd: pkg.priceUsd,
      priceEtb: pkg.priceEtb || Math.round(pkg.priceUsd * rate),
      priceSar: pkg.priceSar || Math.round(pkg.priceUsd * 3.75),
      priceType: pkg.priceType || "single",
      priceUsdMin: pkg.priceUsdMin || null,
      priceUsdMax: pkg.priceUsdMax || null,
      priceEtbMin: pkg.priceEtbMin || null,
      priceEtbMax: pkg.priceEtbMax || null,
      priceSarMin: pkg.priceSarMin || null,
      priceSarMax: pkg.priceSarMax || null,
      discounts: pkg.discounts || [],
      durationDays: pkg.durationDays,
      departureCity: pkg.departureCity || "Addis Ababa",
      inclusions: pkg.inclusions || [],
      availableDates: pkg.availableDates || [],
      itinerary: pkg.itinerary || [],
      imageUrl: pkg.imageUrl,
      isActive: pkg.isActive,
      whatsappClicks: pkg.whatsappClicks || 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    };
    res.json({
      status: "success",
      success: true,
      data
    });
  } catch (err) {
    console.error("\u274C Error fetching package:", err);
    res.status(500).json({ status: "error", success: false, error: err.message });
  }
});
apiRouter.post("/admin/packages", authenticateJWT, (req, res) => {
  packageUploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("\u274C Multer error:", err);
      return res.status(400).json({ status: "error", success: false, error: err.message || "File upload failed" });
    }
    try {
      const {
        titleEn,
        titleAr,
        titleAm,
        category,
        priceUsd,
        priceEtb,
        priceSar,
        priceType,
        priceUsdMin,
        priceUsdMax,
        priceEtbMin,
        priceEtbMax,
        priceSarMin,
        priceSarMax,
        discounts,
        persons,
        durationDays,
        departureCity,
        inclusions,
        availableDates,
        itinerary,
        isActive
      } = req.body;
      const parsedInclusions = typeof inclusions === "string" ? JSON.parse(inclusions) : inclusions || [];
      const parsedAvailableDates = typeof availableDates === "string" ? JSON.parse(availableDates) : availableDates || [];
      const parsedItinerary = typeof itinerary === "string" ? JSON.parse(itinerary) : itinerary || [];
      const parsedDiscounts = typeof discounts === "string" ? JSON.parse(discounts) : discounts || [];
      const parsedPersons = typeof persons === "string" ? JSON.parse(persons) : persons || [];
      const file = req.file;
      let imageUrl = "";
      if (file) {
        imageUrl = `/uploads/packages/${file.filename}`;
        console.log(`\u{1F4E6} Package image uploaded: ${file.filename} -> ${imageUrl}`);
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }
      if (!titleEn || !titleEn.trim()) {
        return res.status(400).json({ status: "error", success: false, error: "English Title is required." });
      }
      if (!category) {
        return res.status(400).json({ status: "error", success: false, error: "Category is required." });
      }
      if (!priceUsd || Number(priceUsd) <= 0) {
        return res.status(400).json({ status: "error", success: false, error: "Valid USD price is required." });
      }
      if (!durationDays || Number(durationDays) <= 0) {
        return res.status(400).json({ status: "error", success: false, error: "Duration must be at least 1 day." });
      }
      if (!imageUrl) {
        return res.status(400).json({ status: "error", success: false, error: "Image is required." });
      }
      const validCategories = ["Economy", "Standard", "Premium", "VIP"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          status: "error",
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`
        });
      }
      const validPriceTypes = ["single", "range"];
      const finalPriceType = priceType && validPriceTypes.includes(priceType) ? priceType : "single";
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const priceUsdNum = Number(priceUsd);
      const rate = 159.98;
      const newPkg = {
        id: `pkg-${Date.now()}`,
        titleEn: titleEn.trim(),
        titleAr: (titleAr || "").trim(),
        titleAm: (titleAm || "").trim(),
        category,
        priceUsd: priceUsdNum,
        priceEtb: priceEtb ? Number(priceEtb) : Math.round(priceUsdNum * rate),
        priceSar: priceSar ? Number(priceSar) : Math.round(priceUsdNum * 3.75),
        priceType: finalPriceType,
        durationDays: Number(durationDays),
        departureCity: departureCity || "Addis Ababa",
        inclusions: Array.isArray(parsedInclusions) ? parsedInclusions : [],
        availableDates: Array.isArray(parsedAvailableDates) ? parsedAvailableDates : [],
        itinerary: Array.isArray(parsedItinerary) ? parsedItinerary : [],
        imageUrl: imageUrl.trim(),
        isActive: isActive !== void 0 ? Boolean(isActive) : true,
        status: isActive !== void 0 ? Boolean(isActive) ? "Active" : "Inactive" : "Active",
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now,
        discounts: [],
        persons: []
      };
      if (finalPriceType === "range") {
        newPkg.priceUsdMin = priceUsdMin ? Number(priceUsdMin) : priceUsdNum;
        newPkg.priceUsdMax = priceUsdMax ? Number(priceUsdMax) : priceUsdNum;
        newPkg.priceEtbMin = priceEtbMin ? Number(priceEtbMin) : Math.round(priceUsdNum * rate);
        newPkg.priceEtbMax = priceEtbMax ? Number(priceEtbMax) : Math.round(priceUsdNum * rate);
        newPkg.priceSarMin = priceSarMin ? Number(priceSarMin) : Math.round(priceUsdNum * 3.75);
        newPkg.priceSarMax = priceSarMax ? Number(priceSarMax) : Math.round(priceUsdNum * 3.75);
      }
      if (Array.isArray(parsedDiscounts) && parsedDiscounts.length > 0) {
        newPkg.discounts = parsedDiscounts.map((d) => ({
          ...d,
          id: d.id || `disc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          isActive: d.isActive !== void 0 ? d.isActive : true
        }));
      }
      if (Array.isArray(parsedPersons) && parsedPersons.length > 0) {
        newPkg.persons = parsedPersons.map((p) => ({
          id: p.id || `person-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          age: p.age || void 0,
          gender: p.gender || void 0
        }));
      }
      db.addPackage(newPkg);
      const log = {
        id: `pl-${Date.now()}`,
        packageId: newPkg.id,
        priceUsd: newPkg.priceUsd,
        priceEtb: newPkg.priceEtb,
        priceSar: newPkg.priceSar,
        previousPriceUsd: null,
        previousPriceEtb: null,
        previousPriceSar: null,
        reason: "Initial package creation",
        updatedBy: "Admin",
        updatedAt: now
      };
      db.addPriceLog(log);
      res.status(201).json({
        status: "success",
        success: true,
        message: "Package created successfully",
        data: newPkg
      });
    } catch (err2) {
      console.error("\u274C Error creating package:", err2);
      res.status(500).json({
        status: "error",
        success: false,
        error: "Something went wrong while creating the package.",
        details: err2.message
      });
    }
  });
});
apiRouter.put("/admin/packages/:id", authenticateJWT, (req, res) => {
  packageUploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("\u274C Multer error on update:", err);
      return res.status(400).json({ status: "error", success: false, error: err.message || "File upload failed" });
    }
    try {
      const index = db.packages.findIndex((p) => String(p.id) === String(req.params.id));
      if (index === -1) {
        return res.status(404).json({ status: "error", success: false, error: "Package not found" });
      }
      const existing = db.packages[index];
      const {
        titleEn,
        titleAr,
        titleAm,
        category,
        priceUsd,
        priceEtb,
        priceSar,
        priceType,
        priceUsdMin,
        priceUsdMax,
        priceEtbMin,
        priceEtbMax,
        priceSarMin,
        priceSarMax,
        discounts,
        persons,
        durationDays,
        departureCity,
        inclusions,
        availableDates,
        itinerary,
        isActive,
        reason
      } = req.body;
      const file = req.file;
      let imageUrl = existing.imageUrl;
      if (file) {
        imageUrl = `/uploads/packages/${file.filename}`;
        console.log(`\u{1F4E6} Package image updated: ${file.filename} -> ${imageUrl}`);
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }
      if (category && !["Economy", "Standard", "Premium", "VIP"].includes(category)) {
        return res.status(400).json({
          status: "error",
          success: false,
          error: "Invalid category. Must be Economy, Standard, Premium, or VIP."
        });
      }
      const validPriceTypes = ["single", "range"];
      const finalPriceType = priceType && validPriceTypes.includes(priceType) ? priceType : existing.priceType || "single";
      const parsedInclusions = typeof inclusions === "string" ? JSON.parse(inclusions) : inclusions !== void 0 ? inclusions : existing.inclusions;
      const parsedAvailableDates = typeof availableDates === "string" ? JSON.parse(availableDates) : availableDates !== void 0 ? availableDates : existing.availableDates;
      const parsedItinerary = typeof itinerary === "string" ? JSON.parse(itinerary) : itinerary !== void 0 ? itinerary : existing.itinerary;
      const parsedDiscounts = typeof discounts === "string" ? JSON.parse(discounts) : discounts !== void 0 ? discounts : existing.discounts || [];
      const parsedPersons = typeof persons === "string" ? JSON.parse(persons) : persons !== void 0 ? persons : existing.persons || [];
      const rate = 159.98;
      const priceUsdNew = priceUsd !== void 0 ? Number(priceUsd) : existing.priceUsd;
      const priceEtbNew = priceEtb !== void 0 ? Number(priceEtb) : existing.priceEtb || Math.round(priceUsdNew * rate);
      const priceSarNew = priceSar !== void 0 ? Number(priceSar) : existing.priceSar || Math.round(priceUsdNew * 3.75);
      const updatedPkg = {
        ...existing,
        titleEn: titleEn !== void 0 ? titleEn.trim() : existing.titleEn,
        titleAr: titleAr !== void 0 ? titleAr.trim() : existing.titleAr,
        titleAm: titleAm !== void 0 ? titleAm.trim() : existing.titleAm,
        category: category ? category : existing.category,
        priceUsd: priceUsdNew,
        priceEtb: priceEtbNew,
        priceSar: priceSarNew,
        priceType: finalPriceType,
        durationDays: durationDays !== void 0 ? Number(durationDays) : existing.durationDays,
        departureCity: departureCity !== void 0 ? departureCity : existing.departureCity,
        inclusions: Array.isArray(parsedInclusions) ? parsedInclusions : [],
        availableDates: Array.isArray(parsedAvailableDates) ? parsedAvailableDates : [],
        itinerary: Array.isArray(parsedItinerary) ? parsedItinerary : [],
        imageUrl,
        isActive: isActive !== void 0 ? Boolean(isActive) : existing.isActive,
        status: isActive !== void 0 ? Boolean(isActive) ? "Active" : "Inactive" : existing.status,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        discounts: Array.isArray(parsedDiscounts) ? parsedDiscounts : existing.discounts || [],
        persons: Array.isArray(parsedPersons) ? parsedPersons : existing.persons || []
      };
      if (finalPriceType === "range") {
        if (existing.priceType !== "range") {
          updatedPkg.priceUsdMin = priceUsdMin !== void 0 ? Number(priceUsdMin) : existing.priceUsd;
          updatedPkg.priceUsdMax = priceUsdMax !== void 0 ? Number(priceUsdMax) : existing.priceUsd;
          updatedPkg.priceEtbMin = priceEtbMin !== void 0 ? Number(priceEtbMin) : existing.priceEtb || Math.round(existing.priceUsd * rate);
          updatedPkg.priceEtbMax = priceEtbMax !== void 0 ? Number(priceEtbMax) : existing.priceEtb || Math.round(existing.priceUsd * rate);
          updatedPkg.priceSarMin = priceSarMin !== void 0 ? Number(priceSarMin) : existing.priceSar || Math.round(existing.priceUsd * 3.75);
          updatedPkg.priceSarMax = priceSarMax !== void 0 ? Number(priceSarMax) : existing.priceSar || Math.round(existing.priceUsd * 3.75);
        } else {
          updatedPkg.priceUsdMin = priceUsdMin !== void 0 ? Number(priceUsdMin) : existing.priceUsdMin || existing.priceUsd;
          updatedPkg.priceUsdMax = priceUsdMax !== void 0 ? Number(priceUsdMax) : existing.priceUsdMax || existing.priceUsd;
          updatedPkg.priceEtbMin = priceEtbMin !== void 0 ? Number(priceEtbMin) : existing.priceEtbMin || Math.round(existing.priceUsd * rate);
          updatedPkg.priceEtbMax = priceEtbMax !== void 0 ? Number(priceEtbMax) : existing.priceEtbMax || Math.round(existing.priceUsd * rate);
          updatedPkg.priceSarMin = priceSarMin !== void 0 ? Number(priceSarMin) : existing.priceSarMin || Math.round(existing.priceUsd * 3.75);
          updatedPkg.priceSarMax = priceSarMax !== void 0 ? Number(priceSarMax) : existing.priceSarMax || Math.round(existing.priceUsd * 3.75);
        }
      } else {
        delete updatedPkg.priceUsdMin;
        delete updatedPkg.priceUsdMax;
        delete updatedPkg.priceEtbMin;
        delete updatedPkg.priceEtbMax;
        delete updatedPkg.priceSarMin;
        delete updatedPkg.priceSarMax;
      }
      const priceChanged = priceUsdNew !== existing.priceUsd || priceEtbNew !== existing.priceEtb || priceSarNew !== existing.priceSar;
      const updateReason = reason || (priceChanged ? "Price updated via admin" : "Package details updated");
      db.updatePackage(index, updatedPkg, updateReason);
      console.log(`\u2705 Package ${existing.id} updated successfully`);
      res.json({
        status: "success",
        success: true,
        message: "Package updated successfully",
        data: updatedPkg
      });
    } catch (err2) {
      console.error("\u274C Error updating package:", err2);
      res.status(500).json({
        status: "error",
        success: false,
        error: "Something went wrong while updating the package.",
        details: err2.message
      });
    }
  });
});
apiRouter.delete("/admin/packages/:id", authenticateJWT, (req, res) => {
  const index = db.packages.findIndex((p) => String(p.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Package not found" });
  }
  const pkg = db.packages[index];
  db.deletePackage(index);
  console.log(`\u{1F5D1}\uFE0F Package ${pkg.id} (${pkg.titleEn}) deleted`);
  res.json({
    status: "success",
    success: true,
    message: "Package deleted successfully"
  });
});
apiRouter.get("/admin/price-logs", authenticateJWT, (req, res) => {
  const sortedLogs = [...db.priceLogs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const logsWithDetails = sortedLogs.map((log) => {
    const pkg = db.packages.find((p) => p.id === log.packageId);
    return {
      ...log,
      packageTitle: pkg ? pkg.titleEn : log.packageTitle || "Unknown Package",
      packageCategory: pkg ? pkg.category : "Unknown",
      packageIsActive: pkg ? pkg.isActive : false
    };
  });
  res.json({
    status: "success",
    success: true,
    count: logsWithDetails.length,
    data: logsWithDetails
  });
});
function extractYouTubeVideoId(url) {
  if (!url) return null;
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split("?")[0] || null;
  }
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1]?.split("&")[0] || null;
  }
  if (url.includes("youtube.com/embed/")) {
    return url.split("youtube.com/embed/")[1]?.split("?")[0] || null;
  }
  if (url.includes("youtube.com/v/")) {
    return url.split("youtube.com/v/")[1]?.split("?")[0] || null;
  }
  if (url.includes("youtube.com/shorts/")) {
    return url.split("youtube.com/shorts/")[1]?.split("?")[0] || null;
  }
  return null;
}
apiRouter.get("/gallery", (req, res) => {
  let items = db.gallery.filter((g) => g.isActive !== false);
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;
  if (typeFilter === "photo" || typeFilter === "video") {
    items = items.filter((g) => g.type === typeFilter);
  }
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const formattedItems = sorted.map((item) => {
    let thumbnailUrl = item.thumbnailUrl || "";
    let imageUrl = item.imageUrl || "";
    if (item.type === "video") {
      if (!thumbnailUrl && imageUrl) {
        thumbnailUrl = imageUrl;
      }
      if (!thumbnailUrl) {
        thumbnailUrl = "";
      }
    }
    return {
      ...item,
      thumbnailUrl,
      imageUrl
    };
  });
  res.json({
    status: "success",
    success: true,
    count: formattedItems.length,
    data: formattedItems
  });
});
apiRouter.get("/gallery/:id", (req, res) => {
  const item = db.gallery.find((g) => String(g.id) === String(req.params.id));
  if (!item || !item.isActive) {
    return res.status(404).json({ status: "error", success: false, error: "Gallery item not found" });
  }
  res.json({ status: "success", success: true, data: item });
});
apiRouter.get("/admin/gallery", authenticateJWT, (req, res) => {
  const typeFilter = req.query.type ? String(req.query.type).toLowerCase() : null;
  let items = db.gallery;
  if (typeFilter === "photo" || typeFilter === "video") {
    items = items.filter((g) => g.type === typeFilter);
  }
  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ status: "success", success: true, count: sorted.length, data: sorted });
});
apiRouter.post("/admin/gallery", authenticateJWT, galleryUploadFields, async (req, res) => {
  try {
    const body = req.body || {};
    const type = body.type === "video" ? "video" : "photo";
    const titleEn = body.titleEn || body.title_en || body.title;
    const titleAr = body.titleAr || body.title_ar || "";
    const duration = body.duration || "";
    const location = body.location || "Makkah Al-Mukarramah";
    const description = body.description || "";
    const isActive = body.isActive !== void 0 ? String(body.isActive) === "true" || body.isActive === true : true;
    const sortOrder = body.sortOrder !== void 0 ? Number(body.sortOrder) : body.sort_order !== void 0 ? Number(body.sort_order) : 0;
    let imageUrl = body.imageUrl || body.image_url || "";
    let videoUrl = body.videoUrl || body.video_url || "";
    let thumbnailUrl = body.thumbnailUrl || "";
    if (req.files) {
      const files = req.files;
      if (files.image && files.image[0]) {
        const file = files.image[0];
        imageUrl = `/uploads/images/${file.filename}`;
        if (type === "photo") {
          thumbnailUrl = imageUrl;
        }
        console.log(`\u{1F5BC}\uFE0F Image uploaded: ${file.filename} -> ${imageUrl}`);
      }
      if (files.video && files.video[0]) {
        const file = files.video[0];
        videoUrl = `/uploads/videos/${file.filename}`;
        console.log(`\u{1F3AC} Video uploaded: ${file.filename} -> ${videoUrl}`);
        const videoPath = import_path3.default.join(uploadPaths.videosPath, file.filename);
        const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        try {
          await new Promise((resolve, reject) => {
            (0, import_fluent_ffmpeg.default)(videoPath).screenshots({
              timestamps: [1],
              filename: thumbnailFilename,
              folder: uploadPaths.imagesPath,
              size: "320x180"
            }).on("end", resolve).on("error", reject);
          });
          thumbnailUrl = `/uploads/images/${thumbnailFilename}`;
          imageUrl = thumbnailUrl;
          console.log(`\u{1F3AC} Thumbnail generated: ${thumbnailFilename}`);
        } catch (ffmpegErr) {
          console.error("\u274C Failed to generate video thumbnail:", ffmpegErr);
          thumbnailUrl = "";
        }
      }
    }
    if (type === "video" && videoUrl) {
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        const videoId = extractYouTubeVideoId(videoUrl);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          imageUrl = thumbnailUrl;
          console.log(`\u{1F3AC} YouTube thumbnail set: ${thumbnailUrl}`);
        }
      }
    }
    if (!titleEn) {
      return res.status(400).json({ status: "error", success: false, error: "Title (English) is required." });
    }
    if (type === "photo" && !imageUrl) {
      return res.status(400).json({ status: "error", success: false, error: "Image file is required for photo type." });
    }
    if (type === "video" && !videoUrl) {
      return res.status(400).json({ status: "error", success: false, error: "Video file or URL is required for video type." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newItem = {
      id: `gal-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      type,
      titleEn,
      titleAr,
      imageUrl: imageUrl || "",
      thumbnailUrl: thumbnailUrl || imageUrl || "",
      videoUrl: videoUrl || "",
      duration,
      location,
      description,
      isActive,
      sortOrder,
      uploadDate: now.substring(0, 10),
      createdAt: now,
      updatedAt: now
    };
    db.addGalleryItem(newItem);
    res.status(201).json({
      status: "success",
      success: true,
      message: "Gallery item created successfully",
      data: newItem
    });
  } catch (err) {
    console.error("Error creating gallery item:", err);
    res.status(500).json({ status: "error", success: false, error: "Failed to create gallery item." });
  }
});
apiRouter.post("/admin/gallery/bulk", authenticateJWT, bulkUpload, async (req, res) => {
  try {
    const files = req.files;
    const body = req.body || {};
    let items = [];
    try {
      if (body.items) {
        items = typeof body.items === "string" ? JSON.parse(body.items) : body.items;
      }
    } catch (e) {
      console.error("Failed to parse items:", e);
      return res.status(400).json({ status: "error", success: false, error: "Invalid items data" });
    }
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemData = items[i] || {};
        const isVideo = file.mimetype.startsWith("video/");
        const type = isVideo ? "video" : "photo";
        let imageUrl = "";
        let videoUrl = "";
        let thumbnailUrl = "";
        if (isVideo) {
          videoUrl = `/uploads/videos/${file.filename}`;
          const videoPath = import_path3.default.join(uploadPaths.videosPath, file.filename);
          const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
          try {
            await new Promise((resolve, reject) => {
              (0, import_fluent_ffmpeg.default)(videoPath).screenshots({
                timestamps: [1],
                filename: thumbnailFilename,
                folder: uploadPaths.imagesPath,
                size: "320x180"
              }).on("end", resolve).on("error", reject);
            });
            thumbnailUrl = `/uploads/images/${thumbnailFilename}`;
            imageUrl = thumbnailUrl;
            console.log(`\u{1F3AC} Thumbnail generated for bulk upload: ${thumbnailFilename}`);
          } catch (ffmpegErr) {
            console.error("\u274C Failed to generate video thumbnail:", ffmpegErr);
            thumbnailUrl = "";
          }
        } else {
          imageUrl = `/uploads/images/${file.filename}`;
          thumbnailUrl = imageUrl;
        }
        const isYouTube = itemData.videoUrl && (itemData.videoUrl.includes("youtube.com") || itemData.videoUrl.includes("youtu.be"));
        if (isYouTube) {
          const videoId = extractYouTubeVideoId(itemData.videoUrl);
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            imageUrl = thumbnailUrl;
          }
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const newItem = {
          id: `gal-${Date.now()}-${Math.floor(Math.random() * 1e3)}-${i}`,
          type,
          titleEn: itemData.titleEn || file.originalname || `Untitled ${type}`,
          titleAr: itemData.titleAr || "",
          imageUrl: imageUrl || "",
          thumbnailUrl: thumbnailUrl || imageUrl || "",
          videoUrl: isVideo ? videoUrl : itemData.videoUrl || "",
          duration: itemData.duration || "",
          location: itemData.location || "Makkah Al-Mukarramah",
          description: itemData.description || "",
          isActive: itemData.isActive !== void 0 ? itemData.isActive : true,
          sortOrder: itemData.sortOrder || 0,
          uploadDate: now.substring(0, 10),
          createdAt: now,
          updatedAt: now
        };
        db.addGalleryItem(newItem);
        items[i] = newItem;
      }
      res.status(201).json({
        status: "success",
        success: true,
        message: `Successfully uploaded ${files.length} items`,
        data: items
      });
    } else {
      const createdItems = [];
      for (const itemData of items) {
        const isYouTube = itemData.videoUrl && (itemData.videoUrl.includes("youtube.com") || itemData.videoUrl.includes("youtu.be"));
        let thumbnailUrl = "";
        let imageUrl = "";
        if (isYouTube) {
          const videoId = extractYouTubeVideoId(itemData.videoUrl);
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            imageUrl = thumbnailUrl;
          }
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const newItem = {
          id: `gal-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
          type: itemData.type || "video",
          titleEn: itemData.titleEn || "Untitled",
          titleAr: itemData.titleAr || "",
          imageUrl: imageUrl || itemData.imageUrl || "",
          thumbnailUrl: thumbnailUrl || itemData.thumbnailUrl || imageUrl || "",
          videoUrl: itemData.videoUrl || "",
          duration: itemData.duration || "",
          location: itemData.location || "Makkah Al-Mukarramah",
          description: itemData.description || "",
          isActive: itemData.isActive !== void 0 ? itemData.isActive : true,
          sortOrder: itemData.sortOrder || 0,
          uploadDate: now.substring(0, 10),
          createdAt: now,
          updatedAt: now
        };
        db.addGalleryItem(newItem);
        createdItems.push(newItem);
      }
      res.status(201).json({
        status: "success",
        success: true,
        message: `Successfully created ${createdItems.length} items`,
        data: createdItems
      });
    }
  } catch (err) {
    console.error("Error in bulk upload:", err);
    res.status(500).json({ status: "error", success: false, error: "Failed to bulk upload gallery items." });
  }
});
apiRouter.delete("/admin/gallery/:id", authenticateJWT, (req, res) => {
  const index = db.gallery.findIndex((g) => String(g.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Gallery item not found" });
  }
  db.deleteGalleryItem(index);
  res.json({ status: "success", success: true, message: "Gallery item deleted successfully" });
});
apiRouter.delete("/admin/gallery/:id", authenticateJWT, (req, res) => {
  const index = db.gallery.findIndex((g) => String(g.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Gallery item not found" });
  }
  db.deleteGalleryItem(index);
  res.json({ status: "success", success: true, message: "Gallery item deleted successfully" });
});
apiRouter.get("/admin/inquiries", authenticateJWT, (req, res) => {
  try {
    const sorted = [...db.inquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      status: "success",
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (error) {
    console.error("\u274C Error fetching inquiries:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to fetch inquiries" });
  }
});
apiRouter.post("/inquiries", (req, res) => {
  try {
    const { fullName, phone, email, subject, message, source } = req.body;
    if (!fullName || !phone || !message) {
      return res.status(400).json({ status: "error", success: false, error: "Missing required fields" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newInquiry = {
      id: `inq-${Date.now()}`,
      fullName,
      phone,
      email: email || "",
      subject: subject || "Umrah Tour Inquiry",
      message,
      source: source || "Contact Form",
      status: "New",
      dateReceived: now,
      createdAt: now,
      updatedAt: now
    };
    db.inquiries.unshift(newInquiry);
    db.saveToFile();
    res.status(201).json({ status: "success", success: true, message: "Inquiry submitted", data: newInquiry });
  } catch (error) {
    console.error("\u274C Error creating inquiry:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to create inquiry" });
  }
});
apiRouter.put("/admin/inquiries/bulk-status", authenticateJWT, (req, res) => {
  console.log("\u{1F525} BULK STATUS ENDPOINT HIT!");
  console.log("\u{1F4E5} Request body:", req.body);
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "No inquiry IDs provided"
      });
    }
    const validStatuses = ["New", "Contacted", "Resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }
    let updatedCount = 0;
    const updatedInquiries = [];
    for (const id of ids) {
      const inquiry = db.inquiries.find((i) => String(i.id) === String(id));
      if (inquiry) {
        inquiry.status = status;
        inquiry.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        updatedCount++;
        updatedInquiries.push(inquiry);
      }
    }
    db.saveToFile();
    console.log(`\u2705 Updated ${updatedCount} inquiries to ${status}`);
    res.json({
      status: "success",
      success: true,
      message: `Updated ${updatedCount} inquiries to ${status}`,
      data: {
        updatedCount,
        updatedInquiries
      }
    });
  } catch (error) {
    console.error("\u274C Bulk status update error:", error);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to update inquiry statuses"
    });
  }
});
apiRouter.put("/admin/inquiries/:id", authenticateJWT, (req, res) => {
  try {
    const inquiry = db.inquiries.find((i) => String(i.id) === String(req.params.id));
    if (!inquiry) {
      return res.status(404).json({ status: "error", success: false, error: "Inquiry not found" });
    }
    const { status } = req.body;
    const validStatuses = ["New", "Contacted", "Resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ status: "error", success: false, error: "Invalid status" });
    }
    inquiry.status = status;
    inquiry.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveToFile();
    res.json({ status: "success", success: true, message: "Inquiry updated", data: inquiry });
  } catch (error) {
    console.error("\u274C Error updating inquiry:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to update inquiry" });
  }
});
apiRouter.delete("/admin/inquiries/:id", authenticateJWT, (req, res) => {
  try {
    const index = db.inquiries.findIndex((i) => String(i.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: "error", success: false, error: "Inquiry not found" });
    }
    db.deleteInquiry(index);
    res.json({ status: "success", success: true, message: "Inquiry deleted" });
  } catch (error) {
    console.error("\u274C Error deleting inquiry:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to delete inquiry" });
  }
});
apiRouter.delete("/admin/inquiries/bulk-delete", authenticateJWT, (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", success: false, error: "No inquiry IDs provided" });
    }
    let deletedCount = 0;
    for (let i = db.inquiries.length - 1; i >= 0; i--) {
      if (ids.includes(String(db.inquiries[i].id))) {
        db.inquiries.splice(i, 1);
        deletedCount++;
      }
    }
    db.saveToFile();
    res.json({ status: "success", success: true, message: `Deleted ${deletedCount} inquiries` });
  } catch (error) {
    console.error("\u274C Error bulk deleting inquiries:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to delete inquiries" });
  }
});
apiRouter.post("/admin/sms/campaign", authenticateJWT, (req, res) => {
  const { message, recipientFilter, channelFilter, packageInterestId, sendToAll, recipientType, packageId } = req.body;
  if (!message) {
    return res.status(400).json({ status: "error", success: false, error: "Message content is required" });
  }
  let recipients = [];
  let recipientPhones = [];
  let recipientTypeLabel = "";
  const recType = recipientType || "subscribers";
  if (recType === "persons") {
    recipientTypeLabel = "Persons on Package";
    if (packageId) {
      const pkg = db.packages.find((p) => String(p.id) === String(packageId));
      if (pkg && pkg.persons && Array.isArray(pkg.persons)) {
        recipients = pkg.persons.map((p) => ({
          phone: p.phone,
          name: p.name || "",
          email: p.email || "",
          packageTitle: pkg.titleEn
        }));
        recipientPhones = recipients.map((r) => r.phone);
        console.log(`\u{1F4F1} Found ${recipients.length} persons in package "${pkg.titleEn}"`);
      }
    } else {
      db.packages.forEach((pkg) => {
        if (pkg.persons && Array.isArray(pkg.persons)) {
          pkg.persons.forEach((p) => {
            if (p.phone) {
              recipients.push({
                phone: p.phone,
                name: p.name || "",
                email: p.email || "",
                packageTitle: pkg.titleEn
              });
            }
          });
        }
      });
      recipientPhones = recipients.map((r) => r.phone);
      console.log(`\u{1F4F1} Found ${recipients.length} total persons across all packages`);
    }
  } else {
    recipientTypeLabel = "SMS Subscribers";
    let subscribers = db.subscribers.filter((s) => s.optInStatus === "Active" || s.optInStatus === true);
    if (recipientFilter && typeof recipientFilter === "string") {
      if (recipientFilter.startsWith("channel:")) {
        const channel = recipientFilter.replace("channel:", "");
        subscribers = subscribers.filter((s) => s.channel?.toLowerCase() === channel.toLowerCase());
      } else if (recipientFilter.startsWith("package:")) {
        const pkgId = recipientFilter.replace("package:", "");
        subscribers = subscribers.filter((s) => String(s.packageInterestId) === String(pkgId));
      } else if (recipientFilter.startsWith("Package:")) {
        const pkgTitle = recipientFilter.replace("Package:", "").trim();
        subscribers = subscribers.filter(
          (s) => s.packageInterest && s.packageInterest.toLowerCase().includes(pkgTitle.toLowerCase())
        );
      }
    } else if (sendToAll === false) {
      if (channelFilter) {
        subscribers = subscribers.filter((s) => s.channel === channelFilter);
      }
      if (packageInterestId) {
        subscribers = subscribers.filter((s) => String(s.packageInterestId) === String(packageInterestId));
      }
    }
    recipients = subscribers.map((s) => ({
      phone: s.phone,
      name: s.name || "",
      email: s.email || "",
      packageInterest: s.packageInterest || ""
    }));
    recipientPhones = recipients.map((r) => r.phone);
  }
  const recipientsCount = recipientPhones.length;
  const campaignId = `camp_${Date.now()}`;
  recipients.forEach((rec, idx) => {
    db.smsLogs.unshift({
      id: `sms-${Date.now()}-${idx}`,
      phone: rec.phone,
      message,
      status: "Delivered",
      campaignName: campaignId,
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  db.saveToFile();
  res.json({
    status: "success",
    success: true,
    message: "SMS campaign sent successfully",
    data: {
      recipientsCount,
      recipients: recipientsCount,
      sentCount: recipientsCount,
      failedCount: 0,
      campaignId,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Delivered",
      recipientType: recipientTypeLabel,
      recipientPhones: recipientPhones.slice(0, 10)
      // Return first 10 for preview
    }
  });
});
var handleGetSmsLogs = (req, res) => {
  res.json({
    status: "success",
    success: true,
    count: db.smsLogs.length,
    data: db.smsLogs
  });
};
apiRouter.get("/admin/sms/logs", authenticateJWT, handleGetSmsLogs);
apiRouter.get("/admin/sms/campaigns", authenticateJWT, handleGetSmsLogs);
apiRouter.get("/admin/dashboard/stats", authenticateJWT, (req, res) => {
  const totalPackages = db.packages.length;
  const activePackages = db.packages.filter((p) => p.isActive).length;
  const totalGalleryItems = db.gallery.length;
  const totalInquiries = db.inquiries.length;
  const totalSubscribers = db.subscribers.length;
  const totalWhatsappClicks = db.packages.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
  const smsSentThisMonth = db.smsLogs.length;
  const categories = ["Economy", "Standard", "Premium", "VIP"];
  const clicksByCategory = categories.map((cat) => ({
    category: cat,
    clicks: db.packages.filter((p) => p.category === cat).reduce((acc, p) => acc + (p.whatsappClicks || 0), 0)
  }));
  const recentInquiries = db.inquiries.slice(0, 5).map((inq) => ({
    id: String(inq.id),
    fullName: inq.fullName,
    phone: inq.phone,
    email: inq.email,
    subject: inq.subject,
    status: inq.status,
    createdAt: inq.createdAt
  }));
  const recentGalleryUploads = db.gallery.slice(0, 5).map((gal) => ({
    id: String(gal.id),
    titleEn: gal.titleEn,
    imageUrl: gal.imageUrl,
    type: gal.type,
    createdAt: gal.createdAt
  }));
  res.json({
    status: "success",
    success: true,
    data: {
      totalPackages,
      activePackages,
      totalGalleryItems,
      totalInquiries,
      totalSubscribers,
      totalWhatsappClicks,
      smsSentThisMonth,
      clicksByCategory,
      recentInquiries,
      recentGalleryUploads
    }
  });
});
apiRouter.get("/team-members", (req, res) => {
  const activeMembers = db.teamMembers.filter((m) => m.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({
    status: "success",
    success: true,
    count: activeMembers.length,
    data: activeMembers
  });
});
apiRouter.get("/admin/team-members", authenticateJWT, (req, res) => {
  const sorted = [...db.teamMembers].sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({
    status: "success",
    success: true,
    count: sorted.length,
    data: sorted
  });
});
apiRouter.post("/admin/team-members", authenticateJWT, teamUpload, (req, res) => {
  try {
    console.log("\u{1F4E5} POST /admin/team-members - Request received");
    console.log("\u{1F4CB} Body:", req.body);
    console.log("\u{1F4C1} File:", req.file);
    const { name, role, bio, order, isActive } = req.body;
    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = `/uploads/team/${file.filename}`;
      console.log(`\u{1F464} Team member image uploaded: ${file.filename} -> ${imageUrl}`);
    }
    if (!name || !role || !bio) {
      console.error("\u274C Missing required fields:", { name, role, bio });
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Name, role, and bio are required"
      });
    }
    if (!imageUrl) {
      console.error("\u274C No image uploaded");
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Image is required. Please upload a photo."
      });
    }
    const existing = db.teamMembers.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "A team member with this name already exists"
      });
    }
    const newMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      imageUrl,
      order: order !== void 0 ? Number(order) : db.teamMembers.length + 1,
      isActive: isActive !== void 0 ? Boolean(isActive) : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.addTeamMember(newMember);
    console.log("\u2705 Team member created:", newMember);
    res.status(201).json({
      status: "success",
      success: true,
      message: "Team member added successfully",
      data: newMember
    });
  } catch (err) {
    console.error("\u274C Error creating team member:", err);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to create team member: " + err.message
    });
  }
});
apiRouter.put("/admin/team-members/:id", authenticateJWT, teamUpload, (req, res) => {
  try {
    console.log(`\u{1F4E5} PUT /admin/team-members/${req.params.id}`);
    const index = db.teamMembers.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ status: "error", success: false, error: "Team member not found" });
    }
    const { name, role, bio, order, isActive } = req.body;
    const file = req.file;
    const existing = db.teamMembers[index];
    let imageUrl = existing.imageUrl;
    if (file) {
      imageUrl = `/uploads/team/${file.filename}`;
      console.log(`\u{1F464} Team member image updated: ${file.filename} -> ${imageUrl}`);
    }
    if (name) {
      const duplicate = db.teamMembers.find(
        (m) => m.name.toLowerCase() === name.trim().toLowerCase() && m.id !== req.params.id
      );
      if (duplicate) {
        return res.status(400).json({
          status: "error",
          success: false,
          error: "A team member with this name already exists"
        });
      }
    }
    const updated = {
      id: existing.id,
      name: name !== void 0 ? name.trim() : existing.name,
      role: role !== void 0 ? role.trim() : existing.role,
      bio: bio !== void 0 ? bio.trim() : existing.bio,
      imageUrl,
      order: order !== void 0 ? Number(order) : existing.order,
      isActive: isActive !== void 0 ? Boolean(isActive) : existing.isActive,
      createdAt: existing.createdAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.updateTeamMember(index, updated);
    res.json({
      status: "success",
      success: true,
      message: "Team member updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("\u274C Error updating team member:", err);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to update team member: " + err.message
    });
  }
});
apiRouter.delete("/admin/team-members/:id", authenticateJWT, (req, res) => {
  const index = db.teamMembers.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Team member not found" });
  }
  db.deleteTeamMember(index);
  res.json({
    status: "success",
    success: true,
    message: "Team member deleted successfully"
  });
});
apiRouter.get("/office-images", (req, res) => {
  try {
    const activeImages = db.officeImages.filter((img) => img.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const formattedData = activeImages.map((img) => ({
      id: img.id,
      title: img.title || "",
      imageUrl: img.imageUrl,
      description: img.description || "",
      order: img.order || 0,
      isActive: img.isActive,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt
    }));
    res.json({
      status: "success",
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error("\u274C Error fetching office images:", error);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to fetch office images"
    });
  }
});
apiRouter.get("/admin/office-images", authenticateJWT, (req, res) => {
  const sorted = [...db.officeImages].sort((a, b) => (a.order || 0) - (b.order || 0));
  const formattedData = sorted.map((img) => ({
    id: img.id,
    title: img.title || "",
    imageUrl: img.imageUrl,
    description: img.description || "",
    order: img.order || 0,
    isActive: img.isActive,
    createdAt: img.createdAt,
    updatedAt: img.updatedAt
  }));
  res.json({
    status: "success",
    success: true,
    count: formattedData.length,
    data: formattedData
  });
});
apiRouter.post("/admin/office-images", authenticateJWT, officeUpload, (req, res) => {
  try {
    const { title, description, order, isActive } = req.body;
    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = `/uploads/office/${file.filename}`;
      console.log(`\u{1F4C1} Office image uploaded: ${file.filename} -> ${imageUrl}`);
    }
    if (!imageUrl) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Image is required"
      });
    }
    const newImage = {
      id: `office-${Date.now()}`,
      title: title || "",
      imageUrl,
      description: description || "",
      order: order !== void 0 ? Number(order) : db.officeImages.length + 1,
      isActive: isActive !== void 0 ? Boolean(isActive) : true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.addOfficeImage(newImage);
    res.status(201).json({
      status: "success",
      success: true,
      message: "Office image added successfully",
      data: newImage
    });
  } catch (err) {
    console.error("\u274C Error creating office image:", err);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to create office image: " + err.message
    });
  }
});
apiRouter.put("/admin/office-images/:id", authenticateJWT, (req, res) => {
  try {
    const index = db.officeImages.findIndex((img) => img.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ status: "error", success: false, error: "Office image not found" });
    }
    const { title, description, order, isActive } = req.body;
    const existing = db.officeImages[index];
    const updated = {
      id: existing.id,
      title: title !== void 0 ? title : existing.title,
      imageUrl: existing.imageUrl,
      description: description !== void 0 ? description : existing.description,
      order: order !== void 0 ? Number(order) : existing.order,
      isActive: isActive !== void 0 ? Boolean(isActive) : existing.isActive,
      createdAt: existing.createdAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.updateOfficeImage(index, updated);
    res.json({
      status: "success",
      success: true,
      message: "Office image updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("\u274C Error updating office image:", err);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to update office image: " + err.message
    });
  }
});
apiRouter.delete("/admin/office-images/:id", authenticateJWT, (req, res) => {
  const index = db.officeImages.findIndex((img) => img.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Office image not found" });
  }
  db.deleteOfficeImage(index);
  res.json({
    status: "success",
    success: true,
    message: "Office image deleted successfully"
  });
});
apiRouter.get("/testimonials", (req, res) => {
  try {
    console.log("\u{1F4E5} GET /testimonials - Fetching testimonials");
    const activeTestimonials = db.testimonials.filter((t) => t.isActive !== false).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const formattedData = activeTestimonials.map((t) => ({
      id: t.id || `test-${Date.now()}`,
      name: t.name || "Anonymous",
      location: t.location || "",
      rating: t.rating || 5,
      text: t.text || "",
      textAr: t.textAr || t.text || "",
      date: t.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isActive: t.isActive !== void 0 ? t.isActive : true,
      createdAt: t.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: t.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    }));
    res.json({
      status: "success",
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error("\u274C Error fetching testimonials:", error);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to fetch testimonials",
      details: error.message
    });
  }
});
apiRouter.get("/admin/testimonials", authenticateJWT, (req, res) => {
  const sorted = [...db.testimonials].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const formattedData = sorted.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location || "",
    rating: t.rating || 5,
    text: t.text,
    textAr: t.textAr || t.text,
    date: t.date,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  }));
  res.json({
    status: "success",
    success: true,
    count: formattedData.length,
    data: formattedData
  });
});
apiRouter.post("/admin/testimonials", authenticateJWT, (req, res) => {
  const { name, location, rating, text, textAr, date, isActive } = req.body;
  if (!name || !text || !rating) {
    return res.status(400).json({
      status: "error",
      success: false,
      error: "Name, text, and rating are required"
    });
  }
  const newTestimonial = {
    id: `test-${Date.now()}`,
    name: name.trim(),
    location: location || "",
    rating: Number(rating),
    text: text.trim(),
    textAr: textAr || text.trim(),
    // avatar: '', // REMOVED
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    isActive: isActive !== void 0 ? Boolean(isActive) : true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addTestimonial(newTestimonial);
  res.status(201).json({
    status: "success",
    success: true,
    message: "Testimonial added successfully",
    data: newTestimonial
  });
});
apiRouter.put("/admin/testimonials/:id", authenticateJWT, (req, res) => {
  const index = db.testimonials.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Testimonial not found" });
  }
  const { name, location, rating, text, textAr, date, isActive } = req.body;
  const existing = db.testimonials[index];
  const updated = {
    id: existing.id,
    name: name !== void 0 ? name.trim() : existing.name,
    location: location !== void 0 ? location : existing.location,
    rating: rating !== void 0 ? Number(rating) : existing.rating,
    text: text !== void 0 ? text.trim() : existing.text,
    textAr: textAr !== void 0 ? textAr.trim() : existing.textAr || existing.text,
    // avatar: existing.avatar, // REMOVED
    date: date !== void 0 ? date : existing.date,
    isActive: isActive !== void 0 ? Boolean(isActive) : existing.isActive,
    createdAt: existing.createdAt,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.updateTestimonial(index, updated);
  res.json({
    status: "success",
    success: true,
    message: "Testimonial updated successfully",
    data: updated
  });
});
apiRouter.delete("/admin/testimonials/:id", authenticateJWT, (req, res) => {
  const index = db.testimonials.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ status: "error", success: false, error: "Testimonial not found" });
  }
  db.deleteTestimonial(index);
  res.json({
    status: "success",
    success: true,
    message: "Testimonial deleted successfully"
  });
});
apiRouter.get("/admin/subscribers", authenticateJWT, (req, res) => {
  try {
    const sorted = [...db.subscribers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      status: "success",
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (error) {
    console.error("\u274C Error fetching subscribers:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to fetch subscribers" });
  }
});
apiRouter.post("/subscribers", (req, res) => {
  try {
    const { phone, email, name, channel, packageInterestId, optInStatus } = req.body;
    if (!phone) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Phone number is required"
      });
    }
    const existing = db.subscribers.find((s) => s.phone === phone);
    if (existing) {
      existing.email = email || existing.email;
      existing.name = name || existing.name;
      existing.channel = channel || existing.channel;
      existing.packageInterestId = packageInterestId || existing.packageInterestId;
      existing.optInStatus = true;
      existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db.saveToFile();
      return res.json({
        status: "success",
        success: true,
        message: "Subscriber updated successfully",
        data: existing
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSubscriber = {
      id: `sub-${Date.now()}`,
      phone,
      email: email || "",
      name: name || "",
      channel: channel || "Web Banner",
      // Default for website signups
      packageInterestId: packageInterestId || null,
      optInStatus: optInStatus !== void 0 ? optInStatus : true,
      dateSubscribed: now,
      createdAt: now,
      updatedAt: now
    };
    db.subscribers.unshift(newSubscriber);
    db.saveToFile();
    res.status(201).json({
      status: "success",
      success: true,
      message: "Subscriber created successfully",
      data: newSubscriber
    });
  } catch (error) {
    console.error("\u274C Error creating subscriber:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to create subscriber" });
  }
});
apiRouter.post("/admin/subscribers", authenticateJWT, (req, res) => {
  try {
    const { phone, email, name, channel, packageInterestId, optInStatus } = req.body;
    if (!phone) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Phone number is required"
      });
    }
    const existing = db.subscribers.find((s) => s.phone === phone);
    if (existing) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Subscriber with this phone number already exists"
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSubscriber = {
      id: `sub-${Date.now()}`,
      phone,
      email: email || "",
      name: name || "",
      channel: channel || "Others",
      // Default for admin added
      packageInterestId: packageInterestId || null,
      optInStatus: optInStatus !== void 0 ? optInStatus : true,
      dateSubscribed: now,
      createdAt: now,
      updatedAt: now
    };
    db.subscribers.unshift(newSubscriber);
    db.saveToFile();
    res.status(201).json({
      status: "success",
      success: true,
      message: "Subscriber added successfully",
      data: newSubscriber
    });
  } catch (error) {
    console.error("\u274C Error creating subscriber:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to create subscriber" });
  }
});
apiRouter.delete("/admin/subscribers/bulk-delete", authenticateJWT, (req, res) => {
  console.log("\u{1F525}\u{1F525}\u{1F525} BULK DELETE SUBSCRIBERS ENDPOINT HIT! \u{1F525}\u{1F525}\u{1F525}");
  console.log("\u{1F4E5} Request body:", req.body);
  try {
    const { ids, id } = req.body;
    let idsToDelete = [];
    if (ids && Array.isArray(ids)) {
      idsToDelete = ids;
    } else if (id) {
      idsToDelete = [id];
    } else {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "No subscriber IDs provided"
      });
    }
    console.log("\u{1F4E5} IDs to delete:", idsToDelete);
    console.log("\u{1F4CA} Current subscribers:", db.subscribers.map((s) => ({ id: s.id, phone: s.phone })));
    let deletedCount = 0;
    const deletedIds = [];
    for (let i = db.subscribers.length - 1; i >= 0; i--) {
      const subscriber = db.subscribers[i];
      const subscriberId = String(subscriber.id);
      const shouldDelete = idsToDelete.some((idToDelete) => String(idToDelete) === subscriberId);
      if (shouldDelete) {
        console.log(`\u{1F5D1}\uFE0F Deleting subscriber: ${subscriberId} - ${subscriber.phone}`);
        deletedIds.push(subscriberId);
        db.subscribers.splice(i, 1);
        deletedCount++;
      }
    }
    db.saveToFile();
    console.log(`\u2705 Deleted ${deletedCount} subscribers`);
    if (deletedCount === 0) {
      return res.status(404).json({
        status: "error",
        success: false,
        error: "No matching subscribers found to delete"
      });
    }
    res.json({
      status: "success",
      success: true,
      message: `Deleted ${deletedCount} subscribers`,
      data: {
        deletedCount,
        deletedIds
      }
    });
  } catch (error) {
    console.error("\u274C Error bulk deleting subscribers:", error);
    res.status(500).json({
      status: "error",
      success: false,
      error: "Failed to bulk delete subscribers"
    });
  }
});
apiRouter.delete("/admin/subscribers/:id", authenticateJWT, (req, res) => {
  try {
    const index = db.subscribers.findIndex((s) => String(s.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ status: "error", success: false, error: "Subscriber not found" });
    }
    db.deleteSubscriber(index);
    res.json({
      status: "success",
      success: true,
      message: "Subscriber deleted successfully"
    });
  } catch (error) {
    console.error("\u274C Error deleting subscriber:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to delete subscriber" });
  }
});
apiRouter.put("/admin/subscribers/:id", authenticateJWT, (req, res) => {
  try {
    const subscriber = db.subscribers.find((s) => String(s.id) === String(req.params.id));
    if (!subscriber) {
      return res.status(404).json({ status: "error", success: false, error: "Subscriber not found" });
    }
    const { optInStatus, email, name, channel, packageInterestId } = req.body;
    if (optInStatus !== void 0) subscriber.optInStatus = optInStatus;
    if (email !== void 0) subscriber.email = email;
    if (name !== void 0) subscriber.name = name;
    if (channel !== void 0) subscriber.channel = channel;
    if (packageInterestId !== void 0) subscriber.packageInterestId = packageInterestId;
    subscriber.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveToFile();
    res.json({
      status: "success",
      success: true,
      message: "Subscriber updated successfully",
      data: subscriber
    });
  } catch (error) {
    console.error("\u274C Error updating subscriber:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to update subscriber" });
  }
});
apiRouter.post("/admin/subscribers/bulk", authenticateJWT, (req, res) => {
  try {
    const { subscribers } = req.body;
    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "No subscribers provided for import"
      });
    }
    let addedCount = 0;
    let updatedCount = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const sub of subscribers) {
      if (!sub.phone) continue;
      const existing = db.subscribers.find((s) => s.phone === sub.phone);
      if (existing) {
        existing.email = sub.email || existing.email;
        existing.name = sub.name || existing.name;
        existing.channel = sub.channel || existing.channel;
        existing.packageInterestId = sub.packageInterestId || existing.packageInterestId;
        existing.optInStatus = true;
        existing.updatedAt = now;
        updatedCount++;
      } else {
        const newSubscriber = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          phone: sub.phone,
          email: sub.email || "",
          name: sub.name || "",
          channel: sub.channel || "Bulk Import",
          packageInterestId: sub.packageInterestId || null,
          optInStatus: true,
          dateSubscribed: now,
          createdAt: now,
          updatedAt: now
        };
        db.subscribers.unshift(newSubscriber);
        addedCount++;
      }
    }
    db.saveToFile();
    res.json({
      status: "success",
      success: true,
      message: `Imported ${addedCount} new subscribers, updated ${updatedCount} existing`,
      data: {
        added: addedCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    console.error("\u274C Error bulk importing subscribers:", error);
    res.status(500).json({ status: "error", success: false, error: "Failed to bulk import subscribers" });
  }
});

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
      url: "https://delta-travel-backend.onrender.com",
      description: "\u{1F680} Production Server (Primary)"
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
var import_multer4 = __toESM(require("multer"), 1);
var import_fs4 = __toESM(require("fs"), 1);
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  initExchangeRateService();
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()) : [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://delta-admin-beta.vercel.app",
    "https://delta-public-website.vercel.app",
    "https://delta-travel-backend.onrender.com"
  ];
  app.use((0, import_cors.default)({
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
  }));
  app.use(import_express2.default.json({ limit: "50mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "50mb" }));
  const uploadPath2 = import_path4.default.resolve(process.env.UPLOAD_PATH || "./uploads");
  const videosPath2 = import_path4.default.join(uploadPath2, "videos");
  const imagesPath2 = import_path4.default.join(uploadPath2, "images");
  const packagesPath2 = import_path4.default.join(uploadPath2, "packages");
  const teamPath2 = import_path4.default.join(uploadPath2, "team");
  const officePath2 = import_path4.default.join(uploadPath2, "office");
  [uploadPath2, videosPath2, imagesPath2, packagesPath2, teamPath2, officePath2].forEach((dir) => {
    if (!import_fs4.default.existsSync(dir)) {
      import_fs4.default.mkdirSync(dir, { recursive: true });
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
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
    res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  };
  app.use("/uploads", staticCors);
  app.use("/uploads", import_express2.default.static(uploadPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
      else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads/images", staticCors);
  app.use("/uploads/images", import_express2.default.static(imagesPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads/videos", staticCors);
  app.use("/uploads/videos", import_express2.default.static(videosPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
      else if (filePath.endsWith(".webm")) res.setHeader("Content-Type", "video/webm");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads/packages", staticCors);
  app.use("/uploads/packages", import_express2.default.static(packagesPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads/team", staticCors);
  app.use("/uploads/team", import_express2.default.static(teamPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads/office", staticCors);
  app.use("/uploads/office", import_express2.default.static(officePath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
      else if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  app.use("/uploads", staticCors);
  app.use("/uploads", import_express2.default.static(uploadPath2, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
      else if (filePath.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");
      else if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));
  const storage2 = import_multer4.default.diskStorage({
    destination: (req, file, cb) => {
      if (file.mimetype.startsWith("video/")) {
        console.log(`\u{1F3AC} Saving video to: ${videosPath2}`);
        cb(null, videosPath2);
      } else if (file.mimetype.startsWith("image/")) {
        console.log(`\u{1F5BC}\uFE0F Saving image to: ${imagesPath2}`);
        cb(null, imagesPath2);
      } else {
        console.log(`\u{1F4C1} Saving to default: ${imagesPath2}`);
        cb(null, imagesPath2);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
      cb(null, uniqueSuffix + "-" + sanitizedName);
    }
  });
  const upload3 = (0, import_multer4.default)({
    storage: storage2,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("Only images and videos are allowed"));
      }
    }
  });
  app.use((req, res, next) => {
    req.upload = upload3;
    next();
  });
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
          "GET /api/health"
        ],
        auth: [
          "POST /api/admin/auth/login",
          "GET /api/admin/auth/me"
        ],
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
          "DELETE /api/admin/office-images/:id"
        ]
      }
    });
  });
  app.use("/api", apiRouter);
  app.get("/api-docs/openapi.json", (req, res) => {
    res.json(openApiSpec);
  });
  app.use("/api-docs", import_swagger_ui_express.default.serve, import_swagger_ui_express.default.setup(openApiSpec, {
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
  }));
  app.use((err, req, res, next) => {
    if (err instanceof import_multer4.default.MulterError) {
      if (err.code === "FILE_TOO_LARGE") {
        return res.status(413).json({ success: false, message: "File too large. Maximum size is 500MB." });
      }
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    }
    if (err.message === "Only images and videos are allowed") {
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
    console.log(`=======================================================`);
    console.log(`\u2708\uFE0F Delta Travel & Tour Server running on http://0.0.0.0:${PORT}`);
    console.log(`\u{1F4C4} Swagger OpenAPI Docs available at http://0.0.0.0:${PORT}/api-docs`);
    console.log(`\u{1F4CA} API Root JSON available at http://0.0.0.0:${PORT}/`);
    console.log(`\u{1F4C1} Uploads directory: ${uploadPath2}`);
    console.log(`\u{1F4F9} Videos directory: ${videosPath2}`);
    console.log(`\u{1F5BC}\uFE0F Images directory: ${imagesPath2}`);
    console.log(`\u{1F4E6} Packages directory: ${packagesPath2}`);
    console.log(`\u{1F464} Team directory: ${teamPath2}`);
    console.log(`\u{1F464} Office Images directory: ${officePath2}`);
    console.log(`=======================================================`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
