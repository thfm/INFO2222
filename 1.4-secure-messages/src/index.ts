import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { join } from "path";
import messageRoutes from "./routes/message";
import { initializeWebSocketHandler } from "./services/websocket";

const app = express();
app.use(express.json());

// Serve static files from public folder
app.use(express.static(join(__dirname, "..", "public")));

app.use("/messages", messageRoutes);

const PORT = 3000;
const server = createServer(app);

// Setup WebSocket server
const wss = new WebSocketServer({ server });
initializeWebSocketHandler(wss);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
