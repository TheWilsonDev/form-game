// Basic server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// --- Serve Static Frontend Files ---
// Use path.join to correctly navigate from /server back to root and then to /build
app.use(express.static(path.join(__dirname, "..", "build"))); // <-- Serve files from the 'build' directory

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin (OK for LAN, adjust for production)
    methods: ["GET", "POST"],
  },
});

// --- Configuration ---
const PORT = process.env.PORT || 3001; // IMPORTANT: Use a different port than your React app (which uses 3000 usually)

// --- State Management ---
let players = {}; // Simple object to store connected players { socketId: { /* player data */ } }

// --- Socket Event Handlers ---
io.on("connection", (socket) => {
  console.log(`[Server] Player connected: ${socket.id}`);

  // Initialize player data (can be expanded later)
  players[socket.id] = {
    id: socket.id,
    // Add initial position, color, etc. if needed
    // x: Math.random() * 300, // Example initial position
    // y: 50
  };
  console.log("[Server] Current players:", Object.keys(players));

  // TODO: Send the connecting player their ID and the current state of other players

  // TODO: Inform other players about the new player

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`[Server] Player disconnected: ${socket.id}`);
    delete players[socket.id]; // Remove player from our state
    console.log("[Server] Current players:", Object.keys(players));
    // TODO: Inform other players about the disconnection (e.g., broadcast 'playerLeft')
  });

  // TODO: Add handlers for game-specific events (e.g., 'playerPositionUpdate')
});

// --- Catch-all route to serve index.html ---
// This should be after other specific routes (if any) and static serving
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`[Server] Socket.IO server listening on *:${PORT}`);
});
