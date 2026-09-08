const Banner = require("../../../models/Banner");
const { success, error } = require("../../../utils/apiResponse");

exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: null },
            { validFrom: { $lte: now } },
          ],
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: null },
            { validUntil: { $gte: now } },
          ],
        },
      ],
    }).sort({ sortOrder: 1, createdAt: -1 });
    return success(res, { banners });
  } catch (err) { return error(res, err.message); }
};
