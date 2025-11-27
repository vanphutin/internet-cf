// utils
function formatCurrency(value) {
  let num = Number(value);
  if (isNaN(num)) return "0 ₫";

  if (num < 100 && num % 1 !== 0) num = num * 10000;
  else if (num < 100 && Number.isInteger(num)) num = num * 10000;

  return num.toLocaleString("vi-VN") + " ₫";
}

function showToast(msg, ok = true) {
  console.log(ok ? "✅" : "❌", msg);
}

// Time bar
function updateTime() {
  document.getElementById("currentTime").innerText =
    new Date().toLocaleTimeString("vi-VN");
}
setInterval(updateTime, 1000);
updateTime();

// Load user
const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");
if (!user || !token) window.location.href = "login.html";

// Fix: ensure customer_id exists for customer role
if (!user.customer_id && user.role === "customer") {
  user.customer_id = user.id;
}

let chatReceiverId = 2;

// fetch employee to chat
fetch(`http://localhost:3000/api/v1/employees`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((json) => {
    if (json.success && json.data.length > 0) {
      chatReceiverId = json.data[0].employee_id;
      console.log(`Chat receiver ID: ${chatReceiverId}`);
    }
  })
  .catch((e) => console.error("Error fetch employees", e));

// fill UI
document.getElementById("username").innerText = user.username;
document.getElementById("name").innerText = user.name;
document.getElementById("balance").innerText = formatCurrency(user.balance);
document.getElementById("email").innerText = user.email || "—";
document.getElementById("phone").innerText = user.phone || "—";
document.getElementById(
  "avatar"
).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;

// IP
fetch("https://api.ipify.org?format=json")
  .then((r) => r.json())
  .then((d) => {
    const ip = d.ip;
    const el = document.getElementById("computer");
    if (user.current_computer_id)
      el.innerText = `${user.current_computer_id} (${ip})`;
    else el.innerText = ip;
  })
  .catch(() => {
    document.getElementById("computer").innerText = "Không lấy IP";
  });

// uptime
const start = Date.now();
setInterval(() => {
  const ms = Date.now() - start;
  const hr = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  document.getElementById("uptime").innerText =
    String(hr).padStart(2, "0") +
    ":" +
    String(min).padStart(2, "02") +
    ":" +
    String(sec).padStart(2, "02");
}, 1000);

// menu
fetch("http://localhost:3000/api/v1/menu")
  .then((r) => r.json())
  .then((json) => {
    const grid = document.getElementById("menuGrid");
    grid.innerHTML = "";
    json.data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "menu-item";
      div.innerHTML = `
        <div class="name">${item.name}</div>
        <div class="price">${formatCurrency(item.price)}</div>
        <div class="stock">Còn: ${item.stock}</div>
      `;
      grid.appendChild(div);
    });
  })
  .catch(() => {
    document.getElementById("menuGrid").innerText = "Không thể tải menu.";
  });

// WebSocket
const ws = new WebSocket(`ws://localhost:3000?token=${token}`);
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

ws.onopen = () => console.log("WS connected");
ws.onerror = (e) => console.error("WS error", e);

ws.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);

  // HISTORY
  if (msg.type === "history") {
    console.log("History loaded:", msg.data);

    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = ""; // CLEAR UI trước

    const history = msg.data || [];

    // BACKEND TRẢ DESC → PHẢI REVERSE
    history.reverse().forEach((m) => renderMsg(m));

    // Scroll to bottom sau khi load
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return;
  }

  // CHAT
  if (msg.type === "chat") {
    console.log("Client received chat echo:", msg.data.content);
    const { data: m } = msg;
    renderMsg(m);
    return;
  }

  // TOPUP SENT CONFIRM
  if (msg.type === "topupRequestSent") {
    console.log("Topup sent confirm:", msg);
    showToast("Yêu cầu nạp đã gửi! Chờ admin...", true);
    document.getElementById("topupStatus").innerText = "Đã gửi, chờ duyệt...";
    return;
  }

  // TOPUP DONE
  if (msg.type === "topupDone") {
    console.log("Client received topup done:", msg);

    const { status, amount = 0, newBalance = user.balance } = msg;

    if (status === "approved") {
      user.balance = newBalance || user.balance + amount;

      document.getElementById("balance").innerText = formatCurrency(
        user.balance
      );

      showToast(
        `Nạp thành công! Số dư mới: ${formatCurrency(user.balance)}`,
        true
      );
    } else {
      showToast("Yêu cầu nạp bị từ chối.", false);
    }

    document.getElementById("topupStatus").innerText = "";
    return;
  }
};

// render chat message
function renderMsg(m) {
  const senderId = m.sender_id ?? m.senderId;
  const senderRole = m.sender_role ?? m.senderRole;
  const senderName = m.sender_name ?? m.senderName;

  const isMe = senderRole === "customer" && senderId === user.customer_id;

  const div = document.createElement("div");
  div.className = "msg " + (isMe ? "me" : "admin");

  const label = senderName || (senderRole === "customer" ? "Bạn" : "Admin");
  div.textContent = `${label}: ${m.content}`;

  const box = document.getElementById("chatMessages");

  // ALWAYS append (dù là echo hay từ admin)
  box.appendChild(div);

  // Ensure scroll bottom
  box.scrollTop = box.scrollHeight;
}

// SEND CHAT
document.getElementById("chatSend").onclick = () => {
  const content = chatInput.value.trim();
  if (!content) return;

  if (ws.readyState !== WebSocket.OPEN) {
    showToast("WS không kết nối", false);
    return;
  }

  console.log("Client sending chat:", content, "to employee", chatReceiverId);

  ws.send(
    JSON.stringify({
      type: "chat",
      receiverId: chatReceiverId,
      receiverRole: "employee",
      content,
    })
  );

  chatInput.value = "";
};

// topup request handler
document.getElementById("btnTopupRequest").onclick = () => {
  const amount = Number(document.getElementById("topupAmount").value);
  if (!amount || amount <= 0) {
    showToast("Số tiền không hợp lệ", false);
    return;
  }

  // Ensure WS is connected before sending
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast("Chưa kết nối WebSocket, vui lòng thử lại", false);
    return;
  }

  document.getElementById("topupStatus").innerText = "Đang gửi yêu cầu...";

  ws.send(
    JSON.stringify({
      type: "topupRequest",
      amount,
      customerId: user.customer_id || user.id, // ensure customer_id is sent
    })
  );

  document.getElementById("topupAmount").value = "";
};

// logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// mouse trail
document.addEventListener("mousemove", (e) => {
  const trail = document.createElement("div");
  trail.style.position = "fixed";
  trail.style.left = e.clientX + "px";
  trail.style.top = e.clientY + "px";
  trail.style.width = "6px";
  trail.style.height = "6px";
  trail.style.background = "var(--cyan)";
  trail.style.borderRadius = "50%";
  trail.style.pointerEvents = "none";
  trail.style.zIndex = "999";
  trail.style.opacity = "0.6";
  document.body.appendChild(trail);

  requestAnimationFrame(() => {
    trail.style.transition = "opacity 300ms ease, transform 300ms ease";
    trail.style.opacity = "0";
    trail.style.transform = "scale(0.5)";
  });
  setTimeout(() => {
    if (trail.parentNode) trail.parentNode.removeChild(trail);
  }, 350);
});
