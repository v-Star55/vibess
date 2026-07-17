const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS configuration
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Socket server is healthy" });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // In development, allow any origin to prevent CORS blocking socket connection
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user's personal room for direct notifications
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(String(userId));
    console.log(`User ${socket.id} joined personal room: ${userId}`);
  }

  // Join a specific chat or group room
  socket.on("join-room", (roomId) => {
    if (!roomId) return;
    const roomName = String(roomId);
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  // Leave a room
  socket.on("leave-room", (roomId) => {
    if (!roomId) return;
    const roomName = String(roomId);
    socket.leave(roomName);
    console.log(`User ${socket.id} left room: ${roomName}`);
  });

  // Handle new chat message
  socket.on("send-message", (data) => {
    const { chatId, message, receiverId } = data;
    if (!chatId || !message) return;

    const roomName = String(chatId);
    console.log(`Message in ${roomName} from ${message.sender?._id || message.sender}: ${message.text}`);
    
    // Broadcast the message to all clients in the room (including sender, who will safely filter duplicates)
    io.to(roomName).emit("receive-message", data);

    // Notify the recipient's personal room if they are online but not in this chat room
    if (receiverId) {
      const recipientRoom = String(receiverId);
      socket.to(recipientRoom).emit("message-notification", { chatId, message });
    }
  });

  // Handle real-time updates (e.g. typing indicators)
  socket.on("typing", (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(chatId).emit("user-typing", { userId, isTyping });
  });

  // Handle game actions (invitations, accept, moves, truth/dare selections)
  socket.on("game-action", (data) => {
    const { chatId } = data;
    if (!chatId) return;

    // Broadcast to other participant in room
    socket.to(chatId).emit("game-action", data);
  });

  // Sparks Events (exactly like connect app!)
  socket.on("sparksEvent", (data) => {
    const targetRoom = String(data.chatId);
    console.log(`Socket [${socket.id}] broadcasting sparksEvent to room [${targetRoom}]`, data.action);
    socket.to(targetRoom).emit("sparksStateUpdate", data);
  });

  socket.on("sparksSyncRequest", (data) => {
    const targetRoom = String(data.chatId);
    console.log(`Socket [${socket.id}] broadcasting sparksSyncRequest to room [${targetRoom}]`);
    socket.to(targetRoom).emit("sparksSyncRequested", data);
  });

  socket.on("sparksSyncResponse", (data) => {
    const targetRoom = String(data.chatId);
    console.log(`Socket [${socket.id}] broadcasting sparksSyncResponse to room [${targetRoom}]`);
    socket.to(targetRoom).emit("sparksSyncResponded", data);
  });

  // Listen feature real-time events
  socket.on("new-listen-offer", (data) => {
    const { cardOwnerId, cardId } = data;
    if (!cardOwnerId) return;
    console.log(`New listen offer on card ${cardId} for owner ${cardOwnerId}`);
    socket.to(String(cardOwnerId)).emit("listen-offer-received", { cardId });
  });

  socket.on("listen-chat-started", (data) => {
    const { listenerId, chatId } = data;
    if (!listenerId || !chatId) return;
    console.log(`Listen chat started between owner and listener ${listenerId} in chat ${chatId}`);
    socket.to(String(listenerId)).emit("listen-chat-started-notify", { chatId });
  });

  socket.on("create-listen-card", (data) => {
    if (!data.card) return;
    console.log(`Socket [${socket.id}] broadcast new listen card created:`, data.card._id);
    socket.broadcast.emit("listen-card-created", data);
  });

  socket.on("cancel-listen-card", (data) => {
    if (!data.cardId) return;
    console.log(`Socket [${socket.id}] broadcast listen card cancelled:`, data.cardId);
    socket.broadcast.emit("listen-card-cancelled", data);
  });

  socket.on("listen-card-accepted", (data) => {
    if (!data.cardId) return;
    console.log(`Socket [${socket.id}] broadcast listen card accepted:`, data.cardId);
    socket.broadcast.emit("listen-card-removed", data);
  });

  socket.on("listen-chat-ended", (data) => {
    const { chatId, receiverId } = data;
    if (!chatId) return;
    console.log(`Socket [${socket.id}] broadcast listen chat ended:`, chatId);
    socket.to(String(chatId)).emit("listen-chat-ended-notify", { chatId });
    if (receiverId) {
      socket.to(String(receiverId)).emit("listen-chat-ended-notify", { chatId });
    }
  });

  // Polls & Challenges updates
  socket.on("polls-challenges-update", (data) => {
    const { chatId } = data;
    if (!chatId) return;
    console.log(`Polls/Challenges updated in room [${chatId}]`);
    socket.to(String(chatId)).emit("polls-challenges-update", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`CORS allowed origin: ${CLIENT_URL}`);
});
