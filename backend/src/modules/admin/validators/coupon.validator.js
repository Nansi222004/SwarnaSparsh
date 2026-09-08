const Joi = require("joi");

const couponSchema = Joi.object({
  code: Joi.string().required().uppercase().trim(),
  type: Joi.string().valid("flat", "percentage", "free_shipping").required(),
  value: Joi.number().min(0).required(),
  minOrderValue: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().min(0).optional().allow(null),
  validFrom: Joi.date().required(),
  validUntil: Joi.date().greater(Joi.ref("validFrom")).required(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null),
  perUserLimit: Joi.number().integer().min(1).default(1),
  applicabilityType: Joi.string().valid("all", "category", "product", "new_user").default("all"),
  applicableCategories: Joi.array().items(Joi.string().hex().length(24)).optional(),
  applicableProducts: Joi.array().items(Joi.string().hex().length(24)).optional(),
  userEligibility: Joi.string().valid("all", "new").default("all"),
  active: Joi.boolean().default(true),
  description: Joi.string().optional().allow("")
});

module.exports = { couponSchema };
