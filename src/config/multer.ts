import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define upload directories
const uploadPath = path.resolve(process.env.UPLOAD_PATH || './uploads');
const videosPath = path.join(uploadPath, 'videos');
const imagesPath = path.join(uploadPath, 'images');
const packagesPath = path.join(uploadPath, 'packages');
const teamPath = path.join(uploadPath, 'team'); // Make sure this exists

// Ensure directories exist
[videosPath, imagesPath, packagesPath, teamPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check if it's a team member image
    if (req.path && req.path.includes('/team')) {
      console.log(`👤 Saving team image to: ${teamPath}`);
      cb(null, teamPath);
    } else if (file.mimetype.startsWith('video/')) {
      console.log(`🎬 Saving video to: ${videosPath}`);
      cb(null, videosPath);
    } else if (file.mimetype.startsWith('image/')) {
      console.log(`🖼️ Saving image to: ${imagesPath}`);
      cb(null, imagesPath);
    } else {
      console.log(`📁 Saving to default: ${imagesPath}`);
      cb(null, imagesPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const finalName = uniqueSuffix + '-' + sanitizedName;
    console.log(`📄 Saving as: ${finalName}`);
    cb(null, finalName);
  }
});

// Create multer instance
export const upload = multer({
  storage,
  limits: { 
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Export upload fields
export const galleryUploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

export const teamUpload = upload.single('image');

export const packageUpload = upload.single('packageImage');

export const bulkUpload = upload.array('files', 50);

// Export paths for use in routes
export const uploadPaths = {
  uploadPath,
  videosPath,
  imagesPath,
  packagesPath,
  teamPath 
};