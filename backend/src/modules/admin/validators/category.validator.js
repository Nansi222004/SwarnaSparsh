const Joi = require("joi");

const boolField = Joi.boolean().truthy("true").falsy("false");

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  slug: Joi.string().trim().lowercase().optional(),
  description: Joi.string().allow("").max(500).optional(),
  bannerTitle: Joi.string().allow("").max(100).optional(),
  bannerSubtitle: Joi.string().allow("").max(300).optional(),
  showInNavbar: boolField.optional(),
  showInCollection: boolField.optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  image: Joi.any(),
  bannerImage: Joi.any(),
  isActive: boolField.optional(),
  deletedImages: Joi.array().items(Joi.string()).optional(),
  bannerDeletedImages: Joi.array().items(Joi.string()).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  slug: Joi.string().trim().lowercase().optional(),
  description: Joi.string().allow("").max(500).optional(),
  bannerTitle: Joi.string().allow("").max(100).optional(),
  bannerSubtitle: Joi.string().allow("").max(300).optional(),
  showInNavbar: boolField.optional(),
  showInCollection: boolField.optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  image: Joi.any(),
  bannerImage: Joi.any(),
  isActive: boolField.optional(),
  deletedImages: Joi.array().items(Joi.string()).optional(),
  bannerDeletedImages: Joi.array().items(Joi.string()).optional(),
});

module.exports = { createCategorySchema, updateCategorySchema };
