// server.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
console.log("✅ WebSocket server running at ws://localhost:8080");

const clients = new Map();

wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    // Người dùng mới tham gia
    if (msg.type === "join") {
      clients.set(ws, msg.name);
      broadcast({
        type: "system",
        text: `👋 ${msg.name} joined the chat`,
        time: new Date().toLocaleTimeString(),
      });
      return;
    }

    // Tin nhắn chat
    if (msg.type === "chat") {
      const name = clients.get(ws) || "Anonymous";
      broadcast({
        type: "chat",
        name,
        text: msg.text,
        time: new Date().toLocaleTimeString(),
      });
    }
  });

  // Khi client rời đi
  ws.on("close", () => {
    const name = clients.get(ws);
    if (name) {
      broadcast({
        type: "system",
        text: `🚪 ${name} left the chat`,
        time: new Date().toLocaleTimeString(),
      });
      clients.delete(ws);
    }
  });
});

// Gửi tin nhắn đến tất cả client
function broadcast(message) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}
