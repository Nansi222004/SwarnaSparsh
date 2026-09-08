const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string().required().trim().min(2),
  phone: Joi.string().required().pattern(/^[6-9]\d{9}$/),
  type: Joi.string().valid("Home", "Work", "Other").default("Home"),
  flatNo: Joi.string().required(),
  area: Joi.string().required(),
  city: Joi.string().required(),
  district: Joi.string().allow(""),
  state: Joi.string().required(),
  pincode: Joi.string().required().length(6),
  isDefault: Joi.boolean(),
});

module.exports = { addressSchema };
