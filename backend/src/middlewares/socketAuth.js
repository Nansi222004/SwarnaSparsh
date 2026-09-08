const { verifyToken } = require("../config/jwt");

/**
 * Socket.IO Authentication Middleware
 * 
 * Verifies JWT from handshake auth payload.
 * Expected:
 * socket.handshake.auth.token = "Bearer <jwt>" OR "<jwt>"
 */
const socketAuth = (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token;
    if (!authHeader) {
      return next(new Error("Authentication error: No token provided"));
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    
    // Verify token
    const user = verifyToken(token);
    
    // Attach user to socket
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

module.exports = socketAuth;
