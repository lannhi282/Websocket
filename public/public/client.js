let socket;
let username = "";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const chatBox = document.getElementById("chatBox");
const loginBox = document.getElementById("login");
const nameInput = document.getElementById("nameInput");

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
    displayMessage(msg);
  };
}

function sendMessage() {
  const text = msgInput.value.trim();
  if (text && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "chat", text }));
    msgInput.value = "";
  }
}

function displayMessage(msg) {
  const msgDiv = document.createElement("div");

  if (msg.type === "system") {
    msgDiv.className = "system";
    msgDiv.textContent = msg.text;
  }

  if (msg.type === "chat") {
    msgDiv.className =
      msg.name === username ? "message my-message" : "message other-message";

    const nameTag = document.createElement("div");
    nameTag.className = "name";
    nameTag.textContent = msg.name;

    const textTag = document.createElement("div");
    textTag.className = "text";
    textTag.textContent = msg.text;

    msgDiv.appendChild(nameTag);
    msgDiv.appendChild(textTag);
  }

  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
