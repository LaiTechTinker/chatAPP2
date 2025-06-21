const express = require("express");
const dotenv = require("dotenv");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const http = require("http"); // Import HTTP module
const { Server } = require("socket.io"); // Import Server class for socket.io

const { notFound, errorHandler } = require("./middleware/errormiddleware");

dotenv.config({ path: "./custom.env" });

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Routes
const userRoutes = require("./Routes/UserRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");

// Connect to MongoDB
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STR);
    console.log("Server is connected to the database");
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
};
connectDb();

// Base route
app.get("/", (req, res) => {
  res.send("API is running");
});

// API Routes
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app); // 

// Initialize socket.io on that HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  pingTimeout: 60000,
});

// WebSocket logic
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

  socket.on("setup", (user) => {
    socket.join(user._id); // join user-specific room
    console.log("User joined room:", user._id);
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("Joined chat room:", room);
  });

  socket.on("new message", (newMessageStatus) => {
    const chat = newMessageStatus.chat;
    if (!chat.users) {
      return console.log("chat.users not defined");
    }

    chat.users.forEach((user) => {
      if (user._id === newMessageStatus.sender._id) return;

      socket.in(user._id).emit("message received", newMessageStatus);
    });
  });

  socket.on("disconnect", () => {
    console.log(" Socket disconnected:", socket.id);
  });
});

// Start HTTP + Socket.IO server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
