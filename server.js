// server.js
const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = [];

function broadcast(data, exclude = null) {
  clients.forEach((client) => {
    if (client !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", (ws) => {
  let user = null;

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);

      if (msg.type === "join") {
        user = { name: msg.name, ws };
        clients.push(user);

        // gửi lịch sử người online
        broadcast({
          type: "online_users",
          users: clients.map((u) => ({ name: u.name })),
          count: clients.length,
        });

        // gửi thông báo hệ thống
        broadcast(
          { type: "system", text: `${msg.name} đã tham gia phòng chat.` },
          ws
        );
      }

      // Tin nhắn văn bản
      else if (msg.type === "chat") {
        const chatData = {
          type: "chat",
          name: user.name,
          text: msg.text,
          time: new Date(),
        };
        broadcast(chatData);
      }

      // Tin nhắn hình ảnh (Base64)
      else if (msg.type === "image") {
        const imgData = {
          type: "image",
          name: user.name,
          image: msg.image, // base64
          time: new Date(),
        };
        broadcast(imgData);
      }

      // Typing indicator
      else if (msg.type === "typing") {
        broadcast(
          { type: "typing", name: user.name, isTyping: msg.isTyping },
          ws
        );
      }
    } catch (err) {
      console.error("Lỗi parse message:", err);
    }
  });

  ws.on("close", () => {
    if (user) {
      clients = clients.filter((c) => c !== user);
      broadcast({
        type: "system",
        text: `${user.name} đã rời phòng.`,
      });
      broadcast({
        type: "online_users",
        users: clients.map((u) => ({ name: u.name })),
        count: clients.length,
      });
    }
  });
});

server.listen(8080, () => {
  console.log("✅ WebSocket server đang chạy tại ws://localhost:8080");
});