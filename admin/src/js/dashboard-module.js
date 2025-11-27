// src/js/dashboard-module.js
import { API_BASE, showToast } from "./utils.js";

export function initDashboardPage(ctx = {}) {
  const { goTo } = ctx;

  // Quick actions
  document.querySelectorAll(".quick-actions [data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-go");
      goTo && goTo(page);
    });
  });

  loadDashboardSummary();
}

async function loadDashboardSummary() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error("Không tải được dữ liệu dashboard");
    const data = await res.json();

    document.getElementById("dash-revenue-today").textContent =
      (data.data.revenueToday ?? 0).toLocaleString("vi-VN") + " ₫";
    document.getElementById("dash-online-customers").textContent =
      data.data.onlineCustomers ?? 0;
    document.getElementById("dash-inuse-computers").textContent =
      data.data.inUseComputers ?? 0;
    document.getElementById("dash-maintenance-computers").textContent =
      data.data.maintenanceComputers ?? 0;

    const activityList = document.getElementById("dash-activity");
    if (
      Array.isArray(data.data.activities) &&
      data.data.activities.length > 0
    ) {
      activityList.innerHTML = data.data.activities
        .map(
          (a) => `
        <li>
          <span class="activity-time">${a.time ?? ""}</span>
          <span class="activity-text">${a.text ?? ""}</span>
        </li>
      `
        )
        .join("");
    } else {
      activityList.innerHTML = "<li>Không có hoạt động gần đây.</li>";
    }
  } catch (err) {
    console.error(err);
    showToast(err.message, false);
  }
}

let pollingInterval;
async function loadTopupRequests() {
  try {
    const res = await fetch(API + "/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    renderRequests(json.data);
  } catch (e) {
    console.error(e);
  }
}

function renderRequests(requests) {
  const container = document.getElementById("topupRequests");
  const countEl = document.getElementById("pendingCount");
  const noReq = document.getElementById("noRequests");

  if (!requests || requests.length === 0) {
    countEl.textContent = "0";
    noReq.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }

  countEl.textContent = requests.length;
  noReq.classList.add("hidden");

  container.innerHTML = requests
    .map(
      (req) => `
        <div class="topup-request-card fade-in">
            <h3>${req.customer_name} (@${req.username})</h3>
            <div class="amount">${formatVND(req.amount)}</div>
            <div class="time">${new Date(req.created_at).toLocaleString(
              "vi-VN"
            )}</div>
            <div class="topup-request-actions">
                <button onclick="approveTopup(${req.request_id}, ${
        req.customer_id
      })"
                        class="btn-modern btn-green text-sm">Duyệt</button>
                <button onclick="rejectTopup(${req.request_id})"
                        class="btn-modern btn-red text-sm">Từ chối</button>
            </div>
        </div>
    `
    )
    .join("");
}

// Duyệt nạp tiền
window.approveTopup = async (requestId, customerId) => {
  if (!confirm("Duyệt nạp tiền này?")) return;

  try {
    const res = await fetch(`${API}/${requestId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast(`Đã nạp ${formatVND(json.amount)} cho ${json.customer_name}!`);
    loadTopupRequests();
  } catch (e) {
    showToast(e.message, false);
  }
};

// Từ chối
window.rejectTopup = async (requestId) => {
  if (!confirm("Từ chối yêu cầu này?")) return;

  try {
    const res = await fetch(`${API}/${requestId}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    showToast("Đã từ chối yêu cầu nạp tiền");
    loadTopupRequests();
  } catch (e) {
    showToast("Lỗi khi từ chối", false);
  }
};

// Polling mỗi 5 giây (hoặc dùng WebSocket nếu muốn realtime 100%)
function startPolling() {
  loadTopupRequests();
  pollingInterval = setInterval(loadTopupRequests, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (
    location.hash.includes("dashboard") ||
    location.hash.includes("customers")
  ) {
    startPolling();
  }
});

// Dừng polling khi rời trang
window.addEventListener("hashchange", () => {
  if (
    !location.hash.includes("dashboard") &&
    !location.hash.includes("customers")
  ) {
    clearInterval(pollingInterval);
  }
});
