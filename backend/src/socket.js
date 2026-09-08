const { Server } = require("socket.io");
const socketAuth = require("./middlewares/socketAuth");
const socketEmitter = require("./services/socketEmitter");

let io;

const initSocket = (server) => {
  // Initialize Socket.IO with CORS settings matching the Express app
  const defaultAllowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://sands-ornaments-ten.vercel.app",
    "https://sandsjewels.com"
  ];

  const configuredAllowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

  const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins])];

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        try {
          const { hostname } = new URL(origin);
          if (hostname.endsWith(".vercel.app")) {
            return callback(null, true);
          }
        } catch (error) {}
        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  // Attach authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.userId} (Role: ${user.role}) - Socket ID: ${socket.id}`);

    // Join specific rooms based on user role to segment event emission
    if (user.role === "admin") {
      socket.join("room:admin");
      console.log(`[Socket] Socket ${socket.id} joined room:admin`);
    } else if (user.role === "seller") {
      // For sellers, join the seller specific room
      socket.join(`room:seller_${user.userId}`);
      console.log(`[Socket] Socket ${socket.id} joined room:seller_${user.userId}`);
    } else {
      // Normal users
      socket.join(`room:user_${user.userId}`);
      console.log(`[Socket] Socket ${socket.id} joined room:user_${user.userId}`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${user.userId} - Socket ID: ${socket.id}`);
    });
  });

  // Wire the io instance into the emitter service so controllers can emit
  socketEmitter.setIo(io);

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getIo
};
