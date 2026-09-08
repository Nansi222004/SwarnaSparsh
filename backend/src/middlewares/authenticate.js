const { verifyToken } = require("../config/jwt");
const { error } = require("../utils/apiResponse");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Access denied. No token provided.", 401, "UNAUTHENTICATED");
  }
  try {
    const token = authHeader.split(" ")[1];
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return error(res, "Invalid or expired token.", 401, "TOKEN_INVALID");
  }
};

module.exports = authenticate;
