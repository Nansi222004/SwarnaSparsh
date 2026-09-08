const { error } = require("../utils/apiResponse");

const mapJoiErrorPath = (msg) => {
  let cleanMsg = msg;
  const mappings = {
    'shippingAddress.email': 'Email Address',
    'shippingAddress.firstName': 'First Name',
    'shippingAddress.lastName': 'Last Name',
    'shippingAddress.phone': 'Phone Number',
    'shippingAddress.flatNo': 'Flat/House No',
    'shippingAddress.area': 'Area/Street',
    'shippingAddress.city': 'City',
    'shippingAddress.district': 'District',
    'shippingAddress.state': 'State',
    'shippingAddress.pincode': 'Pincode',
    'shippingAddress.country': 'Country',
  };

  // Find matches of double-quoted strings (e.g., "shippingAddress.email")
  cleanMsg = cleanMsg.replace(/"([^"]+)"/g, (match, pathStr) => {
    // Check if we have an explicit mapping
    if (mappings[pathStr]) {
      return `"${mappings[pathStr]}"`;
    }
    
    // Otherwise, convert dynamically
    // Get last part of dot notation
    let label = pathStr.split('.').pop();
    // Split camelCase
    label = label.replace(/([A-Z])/g, ' $1');
    // Capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);
    return `"${label.trim()}"`;
  });

  return cleanMsg;
};

// Usage: validate(schema) where schema is a Joi schema
const validate = (schema) => (req, res, next) => {
  const { error: err, value } = schema.validate(req.body, { abortEarly: false });
  if (err) {
    const messages = err.details.map((d) => mapJoiErrorPath(d.message)).join(", ");
    return error(res, messages, 400, "VALIDATION_ERROR");
  }
  req.body = value;
  next();
};

module.exports = validate;
