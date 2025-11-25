// src/js/reports-module.js
import { API_BASE, showToast } from "./utils.js";

let charts = {};

function showError(message) {
  const errorDiv = document.getElementById("error");
  if (!errorDiv) return;
  errorDiv.textContent = "❌ " + message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

function formatCurrency(value) {
  let num = Number(value);
  if (isNaN(num)) return "0 ₫";

  // Chart.js thường scale từ 10000 → 10 → mình sẽ detect
  if (num < 100 && num % 1 !== 0) {
    // ví dụ: 4.8 => có thể là 4800
    num = num * 1000;
  } else if (num < 100 && Number.isInteger(num)) {
    // ví dụ: 10 => có thể là 10000
    num = num * 1000;
  }

  return num.toLocaleString("vi-VN") + " ₫";
}

export function initReportsPage() {
  const filterBtn = document.getElementById("filterBtn");
  filterBtn?.addEventListener("click", () => loadData());

  // Set default date range: 30 ngày gần đây
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  document.getElementById("dateTo").value = today.toISOString().split("T")[0];
  document.getElementById("dateFrom").value = thirtyDaysAgo
    .toISOString()
    .split("T")[0];

  loadData();
}

async function loadData() {
  try {
    await Promise.all([
      loadDashboard(),
      loadRevenueDaily(),
      loadRevenueMonthly(),
      loadComputerUsage(),
      loadComputerStatus(),
      loadTopProducts(),
      loadTopCustomers(),
      loadInventory(),
    ]);
  } catch (e) {
    console.error(e);
    showError(e.message);
    showToast(e.message, false);
  }
}

function getRangeQuery() {
  const from =
    document.getElementById("dateFrom").value ||
    new Date().toISOString().split("T")[0];
  const to =
    document.getElementById("dateTo").value ||
    new Date().toISOString().split("T")[0];
  return `from=${from}&to=${to}`;
}

// ------- SUMMARY -------

async function loadDashboard() {
  try {
    const query = getRangeQuery();
    const res = await fetch(`${API_BASE}/reports/dashboard?${query}`);
    if (!res.ok) throw new Error("Không thể tải dữ liệu tổng quan");
    const data = await res.json();
    document.getElementById("revenue").textContent = formatCurrency(
      data.data.revenue ?? 0
    );
    document.getElementById("newCustomers").textContent =
      data.data.newCustomers ?? 0;
    document.getElementById("activeComputers").textContent =
      data.data.activeComputers ?? 0;
    document.getElementById("pendingOrders").textContent =
      data.data.pendingOrders ?? 0;
  } catch (e) {
    throw e;
  }
}

// ------- REVENUE DAILY -------

async function loadRevenueDaily() {
  try {
    const query = getRangeQuery();
    const res = await fetch(`${API_BASE}/reports/revenue/daily?${query}`);
    if (!res.ok) throw new Error("Không thể tải doanh thu theo ngày");
    const data = await res.json();
    const labels = data.data.map((i) =>
      new Date(i.day).toLocaleDateString("vi-VN")
    );
    const values = data.data.map((i) => Number(i.revenue));

    if (charts.revenueDaily) charts.revenueDaily.destroy();

    const ctx = document.getElementById("revenueDaily").getContext("2d");
    charts.revenueDaily = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Doanh thu (VND)",
            data: values,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (v) => formatCurrency(v),
            },
          },
        },
      },
    });
  } catch (e) {
    throw e;
  }
}

// ------- REVENUE MONTHLY -------

async function loadRevenueMonthly() {
  try {
    const query = getRangeQuery();
    const res = await fetch(`${API_BASE}/reports/revenue/monthly?${query}`);
    if (!res.ok) throw new Error("Không thể tải doanh thu theo tháng");

    const json = await res.json();
    const { labels = [], data: raw = [] } = json.data;
    const values = raw.map(Number);

    if (charts.revenueMonthly) charts.revenueMonthly.destroy();

    const ctx = document.getElementById("revenueMonthly").getContext("2d");
    charts.revenueMonthly = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Doanh thu (VND)",
            data: values,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => formatCurrency(v),
            },
          },
        },
      },
    });
  } catch (e) {
    console.error(e);
    toast.error(e.message); // nếu bạn dùng thư viện toast
  }
}

// ------- COMPUTER USAGE -------

async function loadComputerUsage() {
  try {
    const query = getRangeQuery();
    const res = await fetch(`${API_BASE}/reports/computers/usage?${query}`);
    if (!res.ok) throw new Error("Không thể tải sử dụng máy tính");
    const data = await res.json();

    const labels = data.labels ?? ["Sáng", "Chiều", "Tối"];
    const values = data.data ?? [0, 0, 0];

    if (charts.computerUsage) charts.computerUsage.destroy();

    const ctx = document.getElementById("computerUsage").getContext("2d");
    charts.computerUsage = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  } catch (e) {
    throw e;
  }
}

// ------- COMPUTER STATUS -------

async function loadComputerStatus() {
  try {
    const res = await fetch(`${API_BASE}/reports/computers/status`);
    if (!res.ok) throw new Error("Không thể tải trạng thái máy tính");
    const data = await res.json();

    const available = data.data.available ?? data.data.AVAILABLE ?? 0;
    const inUse = data.data.in_use ?? data.IN_USE ?? 0;
    const maintenance = data.data.maintenance ?? data.data.MAINTENANCE ?? 0;

    document.getElementById("statusAvailable").textContent = available;
    document.getElementById("statusInUse").textContent = inUse;
    document.getElementById("statusMaintenance").textContent = maintenance;

    if (charts.statusChart) charts.statusChart.destroy();

    const ctx = document.getElementById("statusChart").getContext("2d");
    charts.statusChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Available", "In Use", "Maintenance"],
        datasets: [
          {
            data: [available, inUse, maintenance],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  } catch (e) {
    throw e;
  }
}

// ------- TOP PRODUCTS -------

async function loadTopProducts() {
  try {
    const query = getRangeQuery();
    const res = await fetch(
      `${API_BASE}/reports/products/top?${query}&limit=10`
    );
    if (!res.ok) throw new Error("Không thể tải sản phẩm bán chạy");
    const data = await res.json();

    const list = data.data ?? data;

    const tbody = document.getElementById("topProducts");
    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="empty-text">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map(
        (p) => `
        <tr>
          <td>${p.name ?? "N/A"}</td>
          <td>${p.qtySold ?? p.quantity ?? 0}</td>
          <td>${formatCurrency(p.revenue ?? 0)}</td>
        </tr>
      `
      )
      .join("");
  } catch (e) {
    throw e;
  }
}

// ------- TOP CUSTOMERS -------

async function loadTopCustomers() {
  try {
    const query = getRangeQuery();
    const res = await fetch(
      `${API_BASE}/reports/customers/top?${query}&limit=10`
    );
    if (!res.ok) throw new Error("Không thể tải khách hàng top");
    const data = await res.json();

    const list = data.data ?? data;
    const tbody = document.getElementById("topCustomers");

    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML =
        '<tr><td colspan="2" class="empty-text">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map(
        (c) => `
        <tr>
          <td>${c.name ?? c.username ?? "N/A"}</td>
          <td>${formatCurrency(c.totalSpending ?? c.total ?? 0)}</td>
        </tr>
      `
      )
      .join("");
  } catch (e) {
    throw e;
  }
}

// ------- INVENTORY -------

async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/reports/inventory/low-stock`);
    if (!res.ok) throw new Error("Không thể tải tồn kho");
    const data = await res.json();

    const list = data.data ?? data;
    const tbody = document.getElementById("inventory");

    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="empty-text">Không có cảnh báo tồn kho</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map(
        (item) => `
        <tr>
          <td>${item.name ?? "N/A"}</td>
          <td>${item.currentQty ?? item.quantity ?? 0}</td>
          <td>${item.threshold ?? item.minQty ?? 0}</td>
        </tr>
      `
      )
      .join("");
  } catch (e) {
    throw e;
  }
}
