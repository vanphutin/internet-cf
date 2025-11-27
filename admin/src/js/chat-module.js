import { API_BASE, getToken, showToast } from "./utils.js";

let ws = null;
let currentChatCustomerId = null;
let customerNameMap = new Map(); // Lưu customerName cho openChat

export function initChatPage() {
  connectWebSocket();
  loadChatList();

  document.getElementById("chatSend")?.addEventListener("click", sendMessage);
  document.getElementById("chatInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

/* ============================================================
   SEND
============================================================ */
function sendMessage() {
  const input = document.getElementById("chatInput");
  const content = input.value.trim(); // <-- moved lên đầu, FIX hoisting error

  if (!currentChatCustomerId) {
    showToast("Chọn khách hàng để chat", false);
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast("WebSocket mất kết nối", false);
    return;
  }

  if (!content) return;

  console.log(
    "Admin sending chat to customer",
    currentChatCustomerId,
    ":",
    content
  );

  ws.send(
    JSON.stringify({
      type: "chat",
      receiverId: currentChatCustomerId,
      receiverRole: "customer",
      content,
    })
  );

  // 🔥 APPEND NGAY UI (optimistic)
  const senderRole = getTokenPayload().role || "admin";
  renderMessage({
    sender_role: senderRole,
    sender_name: "Admin",
    content,
    sent_at: new Date().toISOString(),
  });
  input.value = "";
}

/* ============================================================
   WEBSOCKET
============================================================ */
function connectWebSocket() {
  const token = getToken();
  if (!token) return showToast("Chưa đăng nhập", false);

  ws = new WebSocket(`ws://localhost:3000?token=${token}`);

  ws.onopen = () => console.log("✅ Chat WS connected");

  ws.onerror = (e) => {
    console.error("❌ Chat WS error", e);
    showToast("Lỗi WebSocket", false);
  };

  ws.onmessage = (evt) => {
    console.log("Admin received chat:", evt.data);
    try {
      const msg = JSON.parse(evt.data);

      if (msg.type === "history") {
        renderChatHistory(msg.data || []);
        return;
      }

      if (msg.type === "chat") {
        const { data } = msg;

        let customerId = null;
        let customerName = null;

        if (data.sender_role === "customer") {
          customerId = data.sender_id;
          customerName = data.sender_name || `Customer ${customerId}`;
        } else if (data.receiver_role === "customer") {
          customerId = data.receiver_id;
          customerName = data.receiver_name || `Customer ${customerId}`;
        }

        if (!customerId) return;

        customerNameMap.set(customerId, customerName);

        addOrUpdateChatListItem(customerId, customerName);

        if (currentChatCustomerId === customerId) {
          console.log("Admin received real-time chat:", data.content);
          renderMessage(data); // append OK
        }

        return;
      }

      if (msg.type === "topupReplyDone") {
        const item = document.querySelector(
          `.topup-request-item[data-request-id="${msg.requestId}"]`
        );
        if (item) {
          item.remove();
          updatePendingCount();
        }
        return;
      }

      function updatePendingCount() {
        const container = document.getElementById("topupRequests");
        const countEl = document.getElementById("pendingCount");
        if (!container || !countEl) return;
        const count = container.children.length;
        countEl.textContent = count;
        countEl.style.display = count > 0 ? "inline" : "none";
      }

      if (msg.type === "topupRequest") {
        console.log("ADMIN RECEIVED TOPUP:", msg);

        const { data } = msg;
        showToast(
          `📢 ${
            data.customerName
          } yêu cầu nạp ${data.amount.toLocaleString()} VNĐ`,
          true
        );

        // Store topup request for later approval
        storeTopupRequest({
          requestId: data.requestId,
          customerId: data.customerId,
          customerName: data.customerName,
          amount: data.amount,
        });

        return;
      }
    } catch (e) {
      console.error("Error parsing WS message", e);
    }
  };

  ws.onclose = () => {
    console.log("Chat WS closed, reconnect in 3s");
    setTimeout(connectWebSocket, 3000);
  };
}

/* ============================================================
   LOAD CHAT LIST
============================================================ */
async function loadChatList() {
  const API_URL = `${API_BASE}/messages`;
  const token = getToken();

  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const json = await res.json();
    const messages = json.data || [];

    console.log("Messages loaded for admin:", messages);

    const chatMap = new Map();

    messages.forEach((msg) => {
      let customerId = null;
      let customerName = null;

      if (msg.sender_role === "customer") {
        customerId = msg.sender_id;
        customerName = msg.sender_name || `Customer ${customerId}`;
      } else if (msg.receiver_role === "customer") {
        customerId = msg.receiver_id;
        customerName = msg.receiver_name || `Customer ${customerId}`;
      }

      if (!customerId) return;

      customerNameMap.set(customerId, customerName);

      if (!chatMap.has(customerId)) {
        chatMap.set(customerId, {
          customerId,
          customerName,
          lastMessage: msg.content,
          lastTime: msg.sent_at,
        });
      } else {
        const existing = chatMap.get(customerId);
        if (new Date(msg.sent_at) > new Date(existing.lastTime)) {
          existing.lastMessage = msg.content;
          existing.lastTime = msg.sent_at;
        }
      }
    });

    const chats = Array.from(chatMap.values()).sort(
      (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
    );

    console.log("Grouped chats:", chats);

    renderChatList(chats);
  } catch (e) {
    console.error("Error loading chat list", e);
  }
}

/* ============================================================
   RENDER CHAT LIST
============================================================ */
function renderChatList(chats) {
  const container = document.getElementById("chatList");
  if (!container) return;

  if (!chats.length) {
    container.innerHTML =
      '<div class="chat-item no-chat">Chưa có tin nhắn từ khách hàng.</div>';
    return;
  }

  container.innerHTML = chats
    .map(
      (c) => `
    <div class="chat-item" data-customer-id="${c.customerId}">
      <div class="chat-name">${c.customerName}</div>
      <div class="chat-preview">${c.lastMessage}</div>
      <div class="chat-time">${new Date(c.lastTime).toLocaleTimeString(
        "vi-VN"
      )}</div>
    </div>
  `
    )
    .join("");

  // Add click
  container.querySelectorAll(".chat-item").forEach((item) => {
    item.onclick = () => {
      const id = Number(item.dataset.customerId);
      const name = customerNameMap.get(id) || `Customer ${id}`;
      openChat(id, name);
    };
  });
}

/* ============================================================
   REAL-TIME LIST UPDATE
============================================================ */
function addOrUpdateChatListItem(customerId, customerName) {
  const container = document.getElementById("chatList");
  if (!container) return;

  let item = container.querySelector(`[data-customer-id="${customerId}"]`);

  if (!item) {
    const newItem = document.createElement("div");
    newItem.className = "chat-item";
    newItem.dataset.customerId = customerId;
    newItem.onclick = () => openChat(customerId, customerName);
    newItem.innerHTML = `
      <div class="chat-name">${customerName}</div>
      <div class="chat-preview">New message</div>
      <div class="chat-time">${new Date().toLocaleTimeString("vi-VN")}</div>
    `;
    container.prepend(newItem);
  } else {
    item.querySelector(".chat-preview").textContent = "New message";
    item.querySelector(".chat-time").textContent =
      new Date().toLocaleTimeString("vi-VN");
    container.prepend(item);
  }
}

/* ============================================================
   OPEN CHAT
============================================================ */
async function openChat(customerId, customerName) {
  currentChatCustomerId = customerId;

  document.getElementById("chatTitle").innerText = `Chat với ${customerName}`;

  const box = document.getElementById("chatMessages");
  box.innerHTML = '<p class="loading-text">Đang tải...</p>';

  const API_URL = `${API_BASE}/messages?customerId=${customerId}`;
  const token = getToken();

  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const json = await res.json();
    renderChatHistory(json.data || []);
  } catch (e) {
    console.error("Error load chat:", e);
    box.innerHTML = "<p>Lỗi tải tin nhắn</p>";
  }
}

/* ============================================================
   RENDER CHAT HISTORY
============================================================ */
function renderChatHistory(messages) {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  box.innerHTML = "";

  // 🔥 backend trả DESC → cần reverse ASC
  messages.reverse().forEach((m) => renderMessage(m));

  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   RENDER ONE MESSAGE
============================================================ */
function renderMessage(m) {
  console.log("Admin rendering message:", m.content);

  const box = document.getElementById("chatMessages");
  if (!box) return;

  const isMe = m.sender_role === "employee" || m.sender_role === "admin";

  const div = document.createElement("div");
  div.className = `msg ${isMe ? "me" : "customer"}`;
  div.innerHTML = `
    <strong>${m.sender_name || "Customer"}:</strong> ${m.content}
    <small>${new Date(m.sent_at).toLocaleTimeString("vi-VN")}</small>
  `;

  box.appendChild(div); // ALWAYS append
  box.scrollTop = box.scrollHeight; // ALWAYS scroll
}

function storeTopupRequest(req) {
  const container = document.getElementById("topupRequests");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "topup-request-item";
  item.dataset.requestId = req.requestId;
  item.innerHTML = `
    <div class="topup-req-info">
      <strong>${
        req.customerName
      }</strong> yêu cầu nạp <span class="amount">${req.amount.toLocaleString()} VNĐ</span>
    </div>
    <div class="topup-req-actions">
      <button class="btn-small btn-success" onclick="approveTopup(${
        req.requestId
      })">Duyệt</button>
      <button class="btn-small btn-danger" onclick="rejectTopup(${
        req.requestId
      })">Từ chối</button>
    </div>
  `;
  container.insertBefore(item, container.firstChild);
}

function approveTopup(requestId) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast("Mất kết nối WebSocket", false);
    return;
  }

  ws.send(
    JSON.stringify({
      type: "topupReply",
      requestId,
      status: "approved",
    })
  );
  showToast("Đã duyệt yêu cầu nạp tiền", true);
}

function rejectTopup(requestId) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast("Mất kết nối WebSocket", false);
    return;
  }

  ws.send(
    JSON.stringify({
      type: "topupReply",
      requestId,
      status: "rejected",
    })
  );
  showToast("Đã từ chối yêu cầu nạp tiền", true);
}
export { connectWebSocket };
