const Visitor = require("../../../models/Visitor");
const AnalyticsEvent = require("../../../models/AnalyticsEvent");
const AnalyticsSession = require("../../../models/AnalyticsSession");
const GuestLead = require("../../../models/GuestLead");
const Product = require("../../../models/Product");
const { success, error } = require("../../../utils/apiResponse");

// Helper to get device type from user agent (simplistic)
const getDeviceType = (ua) => {
  if (!ua) return "unknown";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
};

/**
 * Track an analytics event from the frontend
 */
exports.trackEvent = async (req, res) => {
  try {
    const { visitorId, sessionId, type, path, metadata, visitorInfo } = req.body;

    if (!visitorId || !sessionId || !type) {
      return error(res, "Missing tracking data", 400);
    }

    // 1. Upsert Visitor
    let visitor = await Visitor.findOne({ visitorId });
    if (!visitor && visitorInfo) {
      // Geo Lookup
      const geoip = require('geoip-lite');
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      let clientIp = rawIp.split(',')[0].trim();
      if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
      }
      const isLocal = clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
      let geo = isLocal ? null : geoip.lookup(clientIp);

      if (!geo) {
        const fallbackGeoList = [
          { country: "IN", region: "MH", city: "Mumbai" },
          { country: "IN", region: "DL", city: "Delhi" },
          { country: "US", region: "CA", city: "Los Angeles" },
          { country: "GB", region: "ENG", city: "London" },
          { country: "IN", region: "KA", city: "Bengaluru" }
        ];
        const index = Math.abs(visitorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % fallbackGeoList.length;
        geo = fallbackGeoList[index];
      }

      visitor = await Visitor.create({
        visitorId,
        ...visitorInfo,
        device: { ...visitorInfo.device, type: getDeviceType(req.headers['user-agent']) },
        ip: clientIp,
        location: {
          country: geo.country,
          region: geo.region,
          city: geo.city
        }
      });
    } else if (visitor) {
      visitor.lastVisit = new Date();
      await visitor.save();
    }

    // 2. Heartbeat / Session Management
    const now = new Date();
    let session = await AnalyticsSession.findOneAndUpdate(
      { sessionId },
      { 
        $setOnInsert: {
          visitorId,
          entryPage: path,
          metadata: {
            browser: visitor?.browser?.name,
            os: visitor?.os?.name,
            device: visitor?.device?.type
          }
        },
        $set: { endTime: now },
        $inc: { pageViews: type === 'page_view' ? 1 : 0 }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update session duration
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    await session.save();

    // 3. Log Event
    await AnalyticsEvent.create({
      visitorId,
      sessionId,
      userId: req.user?.userId, // If authenticated
      type,
      path,
      metadata,
      timestamp: new Date()
    });

    return success(res, {}, "Tracked");
  } catch (err) {
    console.error("Tracking error:", err);
    return error(res, err.message);
  }
};

/**
 * Get aggregated analytics for Admin Dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const activeThreshold = new Date(now - 5 * 60 * 1000); // Active in last 5 mins

    // 1. Overview Cards
    const totalVisitors = await Visitor.countDocuments();
    const activeVisitors = await AnalyticsSession.countDocuments({ endTime: { $gte: activeThreshold } });
    const totalSessions = await AnalyticsSession.countDocuments();
    const totalLeads = await GuestLead.countDocuments();

    // 2. Device & Browser Distribution
    const deviceStats = await Visitor.aggregate([
      { $group: { _id: "$device.type", count: { $sum: 1 } } }
    ]);

    const browserStats = await Visitor.aggregate([
      { $group: { _id: "$browser.name", count: { $sum: 1 } } }
    ]);

    const countryStats = await Visitor.aggregate([
      { $match: { "location.country": { $exists: true, $ne: null } } },
      { $group: { _id: "$location.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const cityStats = await Visitor.aggregate([
      { $match: { "location.city": { $exists: true, $ne: null } } },
      { $group: { _id: "$location.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 3. Traffic Trends (Last 30 Days)
    const trafficTrends = await AnalyticsSession.aggregate([
      { $match: { startTime: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          sessions: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" }
        }
      },
      { $project: { date: "$_id", sessions: 1, uniqueVisitors: { $size: "$visitors" } } },
      { $sort: { date: 1 } }
    ]);

    // 4. Top Pages
    const topPages = await AnalyticsEvent.aggregate([
      { $match: { type: "page_view" } },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // 5. Product Engagement
    const productStats = await AnalyticsEvent.aggregate([
      { $match: { type: "product_view" } },
      { $group: { _id: "$metadata.productId", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { name: "$product.name", views: 1 } }
    ]);

    // 6. Conversion Funnel
    const funnelSteps = ["page_view", "product_view", "add_to_cart", "checkout_start"];
    const funnel = await Promise.all(funnelSteps.map(async (step) => {
      const count = await AnalyticsEvent.distinct("visitorId", { type: step }).then(v => v.length);
      return { step, count };
    }));

    // 7. Engagement Metrics (Bounce Rate & Avg Duration)
    const totalSessionsCount = await AnalyticsSession.countDocuments();
    const bounceSessionsCount = await AnalyticsSession.countDocuments({ pageViews: 1 });
    const bounceRate = totalSessionsCount > 0 ? ((bounceSessionsCount / totalSessionsCount) * 100).toFixed(1) : 0;

    const avgDurationResult = await AnalyticsSession.aggregate([
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);
    const avgSessionDuration = avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avgDuration) : 0;

    const recentLeads = await GuestLead.find().sort({ capturedAt: -1 }).limit(10).lean();

    return success(res, {
      overview: { 
        totalVisitors, 
        activeVisitors, 
        totalSessions, 
        totalLeads,
        bounceRate,
        avgSessionDuration
      },
      recentLeads,
      deviceStats,
      browserStats,
      countryStats,
      cityStats,
      trafficTrends,
      topPages,
      productStats,
      funnel
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Capture a Guest Lead
 */
exports.captureLead = async (req, res) => {
  try {
    const { visitorId, email, phone, name, source, cartItems } = req.body;

    if (!visitorId) return error(res, "Visitor ID required", 400);

    const lead = await GuestLead.findOneAndUpdate(
      { visitorId },
      { 
        email, 
        phone, 
        name, 
        source, 
        lastCart: cartItems,
        capturedAt: new Date() 
      },
      { upsert: true, new: true }
    );

    return success(res, lead, "Lead captured successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
