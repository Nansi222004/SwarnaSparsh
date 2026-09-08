const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param {String} file - Path to the local file
 * @param {String} folder - Cloudinary folder name
 */
exports.uploadImage = async (file, folder = "sands-ornaments") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: "auto",
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (err) {
    console.error("[Cloudinary] Upload failed:", err.message);
    throw new Error("Image upload failed");
  }
};

/**
 * Delete an image from Cloudinary
 * @param {String} public_id - Public ID of the resource
 */
exports.deleteImage = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
    return true;
  } catch (err) {
    console.error("[Cloudinary] Delete failed:", err.message);
    return false;
  }
};
