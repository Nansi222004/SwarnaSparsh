const multer = require("multer");
const { CloudinaryStorage } = require("@fluidjs/multer-cloudinary");
const cloudinary = require("../config/cloudinary");

const makeStorage = (folder, allowedFormats = ["jpg", "jpeg", "png", "webp"]) =>
  new CloudinaryStorage({
    cloudinary,
    params: { 
      folder: `sands-ornaments/${folder}`, 
      allowed_formats: allowedFormats,
      resource_type: "auto"
    },
  });

const productUpload   = multer({ storage: makeStorage("products"),   limits: { fileSize: 10 * 1024 * 1024 } });
// Product media upload supports optional product videos. Keep images-only upload for other contexts.
const productMediaUpload = multer({
  storage: makeStorage("products", ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"]),
  limits: { fileSize: 50 * 1024 * 1024 }
});
const categoryUpload  = multer({ storage: makeStorage("categories"), limits: { fileSize: 5  * 1024 * 1024 } });
const bannerUpload    = multer({ storage: makeStorage("banners"),    limits: { fileSize: 10 * 1024 * 1024 } });
const blogUpload      = multer({ storage: makeStorage("blogs"),      limits: { fileSize: 5  * 1024 * 1024 } });
const evidenceUpload  = multer({
  storage: makeStorage("returns", ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"]),
  limits: { fileSize: 50 * 1024 * 1024 }
});
const sellerUpload    = multer({ 
  storage: makeStorage("sellers", ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx"]), 
  limits: { fileSize: 10 * 1024 * 1024 } 
});
const sectionUpload   = multer({ storage: makeStorage("sections"),   limits: { fileSize: 10 * 1024 * 1024 } });

const upload = productUpload; // Alias for generic use

module.exports = { 
  productUpload, 
  productMediaUpload,
  categoryUpload, 
  bannerUpload, 
  blogUpload, 
  evidenceUpload, 
  sellerUpload,
  sectionUpload,
  upload 
};
