const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const Return = require("../src/models/Return");

async function check() {
  await connectDB();
  const sellerId = "6a2a699ca7a3d5a3ab85c893";
  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

  // ---------- Products (fast + scalable) ----------
  const [totalProducts, stockAgg, sellerProductIds] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.aggregate([
      { $match: { sellerId } },
      { $project: { name: 1, categories: 1, variants: 1 } },
      { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },
      {
        $group: { _id: null, value: { $sum: { $ifNull: ["$variants.stock", 0] } } }
      }
    ]),
    Product.find({ sellerId }).select("_id").lean()
  ]);

  const totalStock = Number(stockAgg?.[0]?.value || 0);
  console.log("Total Products:", totalProducts);
  console.log("Total Stock:", totalStock);

  const ordersAgg = await Order.aggregate([
    { $match: { "items.sellerId": sellerObjectId } },
    {
      $addFields: {
        sellerItems: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $eq: ["$$item.sellerId", sellerObjectId] }
          }
        }
      }
    },
    {
      $addFields: {
        sellerSubtotal: {
          $sum: {
            $map: {
              input: "$sellerItems",
              as: "si",
              in: { $multiply: [{ $ifNull: ["$$si.price", 0] }, { $ifNull: ["$$si.quantity", 0] }] }
            }
          }
        },
        sellerUnits: {
          $sum: {
            $map: {
              input: "$sellerItems",
              as: "si",
              in: { $ifNull: ["$$si.quantity", 0] }
            }
          }
        }
      }
    },
    {
      $facet: {
        statusCounts: [
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ],
        deliveredTotals: [
          { $match: { status: "Delivered" } },
          { $group: { _id: null, revenue: { $sum: "$sellerSubtotal" }, units: { $sum: "$sellerUnits" }, deliveredOrders: { $sum: 1 } } }
        ],
        weeklyRevenue: [
          { $match: { status: "Delivered" } },
          {
            $group: {
              _id: { $dateTrunc: { date: "$createdAt", unit: "week" } },
              revenue: { $sum: "$sellerSubtotal" }
            }
          }
        ]
      }
    }
  ]);

  const facet = ordersAgg?.[0] || {};
  console.log("Facet Status Counts:", facet.statusCounts);
  console.log("Facet Delivered Totals:", facet.deliveredTotals);
  console.log("Facet Weekly Revenue:", facet.weeklyRevenue);

  mongoose.connection.close();
}

check().catch(console.error);
