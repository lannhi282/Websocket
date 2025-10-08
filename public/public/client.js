let socket;
let username = "";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const imgInput = document.getElementById("imgInput");
const chatBox = document.getElementById("chatBox");
const loginBox = document.getElementById("login");
const nameInput = document.getElementById("nameInput");
const onlineCount = document.getElementById("onlineCount");
const userList = document.getElementById("userList");

nameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") joinChat();
});
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function joinChat() {
  username = nameInput.value.trim();
  if (!username) return alert("Vui lòng nhập tên!");

  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", name: username }));
    loginBox.style.display = "none";
    chatBox.style.display = "flex";
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "system") {
      showSystemMessage(msg.text);
    } else if (msg.type === "online_users") {
      updateOnlineUsers(msg.users, msg.count);
    } else if (msg.type === "chat") {
      showMessage(msg.name, msg.text, msg.time);
    } else if (msg.type === "image") {
      showImage(msg.name, msg.image, msg.time);
    }
  };

  socket.onerror = () => alert("Lỗi kết nối WebSocket!");
  socket.onclose = () => alert("Mất kết nối với server!");
}

function sendMessage() {
  const text = msgInput.value.trim();
  const file = imgInput.files[0];

  // Gửi ảnh nếu có
  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      socket.send(JSON.stringify({ type: "image", image: reader.result }));
    };
    reader.readAsDataURL(file);
    imgInput.value = "";
  }

  // Gửi text
  if (text) {
    socket.send(JSON.stringify({ type: "chat", text }));
    msgInput.value = "";
  }
}

function showMessage(name, text, time) {
  const div = document.createElement("div");
  div.className = name === username ? "my-message" : "other-message";
  div.innerHTML = `<b>${name}:</b> ${text} <div class="time">${new Date(
    time
  ).toLocaleTimeString("vi-VN")}</div>`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showImage(name, imgData, time) {
  const div = document.createElement("div");
  div.className = name === username ? "my-message" : "other-message";
  div.innerHTML = `<b>${name}:</b><br><img src="${imgData}" style="max-width:200px;border-radius:8px"><div class="time">${new Date(
    time
  ).toLocaleTimeString("vi-VN")}</div>`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateOnlineUsers(users, count) {
  onlineCount.textContent = `🟢 ${count} online`;
  userList.innerHTML = users
    .map((u) => `<div class="user-item">${u.name}</div>`)
    .join("");
}