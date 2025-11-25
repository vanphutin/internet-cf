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
