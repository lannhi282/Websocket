// server.js - Enhanced Version
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
console.log("✅ WebSocket server running at ws://localhost:8080");

const clients = new Map(); // ws -> {name, id, joinedAt}
const messageHistory = []; // Lưu lịch sử tin nhắn
const MAX_HISTORY = 100;

wss.on("connection", (ws) => {
  const clientId = generateId();
  console.log(`🔗 New client connected: ${clientId}`);

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);

      // Người dùng mới tham gia
      if (msg.type === "join") {
        clients.set(ws, {
          name: msg.name,
          id: clientId,
          joinedAt: new Date(),
        });

        // Gửi lịch sử tin nhắn cho user mới
        ws.send(
          JSON.stringify({
            type: "history",
            messages: messageHistory,
          })
        );

        // Gửi danh sách online cho tất cả
        broadcastOnlineUsers();

        const joinMsg = {
          type: "system",
          text: `👋 ${msg.name} joined the chat`,
          time: new Date().toISOString(),
        };
        broadcast(joinMsg);
        addToHistory(joinMsg);
        return;
      }

      // Tin nhắn chat
      if (msg.type === "chat") {
        const client = clients.get(ws);
        if (!client) return;

        const chatMsg = {
          type: "chat",
          id: generateId(),
          name: client.name,
          userId: client.id,
          text: msg.text,
          time: new Date().toISOString(),
        };
        broadcast(chatMsg);
        addToHistory(chatMsg);
      }

      // Typing indicator
      if (msg.type === "typing") {
        const client = clients.get(ws);
        if (!client) return;

        broadcastToOthers(ws, {
          type: "typing",
          name: client.name,
          isTyping: msg.isTyping,
        });
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  // Khi client rời đi
  ws.on("close", () => {
    const client = clients.get(ws);
    if (client) {
      const leaveMsg = {
        type: "system",
        text: `🚪 ${client.name} left the chat`,
        time: new Date().toISOString(),
      };
      broadcast(leaveMsg);
      addToHistory(leaveMsg);
      clients.delete(ws);
      broadcastOnlineUsers();
      console.log(`❌ Client disconnected: ${client.name}`);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Gửi tin nhắn đến tất cả client
function broadcast(message) {
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      // OPEN = 1
      client.send(JSON.stringify(message));
    }
  }
}

// Gửi đến tất cả trừ sender
function broadcastToOthers(sender, message) {
  for (const client of wss.clients) {
    if (client !== sender && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }
}

// Gửi danh sách người dùng online
function broadcastOnlineUsers() {
  const users = Array.from(clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    joinedAt: c.joinedAt,
  }));

  broadcast({
    type: "online_users",
    users,
    count: users.length,
  });
}

// Thêm vào lịch sử
function addToHistory(message) {
  messageHistory.push(message);
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory.shift();
  }
}

// Tạo ID ngẫu nhiên
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Định kỳ gửi ping để giữ kết nối
setInterval(() => {
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }
}, 30000); // 30 giây
