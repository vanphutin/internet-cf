// src/js/computers-module.js
import { API_BASE, getToken, showToast } from "./utils.js";

const API = `${API_BASE}/computers`;

export function initComputersPage() {
  const searchInput = document.getElementById("pcSearch");
  const addBtn = document.getElementById("btnAddComputer");
  const updateBtn = document.getElementById("btnUpdateComputer");
  const deleteBtn = document.getElementById("btnDeleteComputer");
  const clearBtn = document.getElementById("btnClearComputer");

  searchInput?.addEventListener("keyup", () => loadComputers());
  addBtn?.addEventListener("click", addComputer);
  updateBtn?.addEventListener("click", updateComputer);
  deleteBtn?.addEventListener("click", deleteComputer);
  clearBtn?.addEventListener("click", clearForm);

  loadComputers();
}

async function loadComputers() {
  const grid = document.getElementById("computerGrid");
  if (!grid) return;

  grid.innerHTML = '<p class="loading-text">Đang tải…</p>';
  clearForm();

  try {
    const token = getToken();
    const q = document.getElementById("pcSearch")?.value.trim();
    const url = new URL(API);
    if (q) url.searchParams.set("q", q);

    const res = await fetch(url.toString(), {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    const json = await res.json();

    if (!res.ok || json.success === false) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }

    const list = json.data || json;
    renderGrid(list);
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p class="error-text">Lỗi: ${e.message}</p>`;
    showToast(e.message, false);
  }
}

function renderGrid(list) {
  const grid = document.getElementById("computerGrid");
  if (!grid) return;

  if (!Array.isArray(list) || !list.length) {
    grid.innerHTML = "<p class='empty-text'>Không có máy nào.</p>";
    return;
  }

  grid.innerHTML = list
    .map((pc, i) => {
      const id = pc.computer_id ?? pc.id;
      const status = pc.status ?? "available";
      return `
      <div class="pc-card pc-status-${status}"
           data-id="${id}"
           data-name="${pc.name ?? ""}"
           data-ip="${pc.ip_address ?? ""}"
           data-location="${pc.location ?? ""}"
           data-status="${status}"
           style="animation-delay:${i * 0.03}s">
        <div class="pc-title">${pc.name ?? "Máy không tên"}</div>
        <div class="pc-sub">IP: ${pc.ip_address ?? "-"}</div>
        <div class="pc-sub">Vị trí: ${pc.location ?? "-"}</div>
        <span class="pc-badge">${status}</span>
      </div>
      `;
    })
    .join("");

  grid.querySelectorAll(".pc-card").forEach((card) => {
    card.addEventListener("click", () => selectCard(card));
  });
}

function selectCard(card) {
  document
    .querySelectorAll(".pc-card")
    .forEach((c) => c.classList.remove("selected"));

  card.classList.add("selected");

  document.getElementById("computerIdHidden").value = card.dataset.id;
  document.getElementById("pcName").value = card.dataset.name;
  document.getElementById("pcIP").value = card.dataset.ip;
  document.getElementById("pcLocation").value = card.dataset.location;
  document.getElementById("pcStatus").value = card.dataset.status;
}

function getFormData() {
  return {
    name: document.getElementById("pcName").value.trim(),
    ip_address: document.getElementById("pcIP").value.trim(),
    location: document.getElementById("pcLocation").value.trim(),
    status: document.getElementById("pcStatus").value,
  };
}

async function addComputer() {
  const token = getToken();
  const body = getFormData();

  if (!body.name || !body.ip_address) {
    showToast("Tên và IP không được để trống", false);
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message);
    showToast("Thêm máy thành công!");
    loadComputers();
  } catch (e) {
    console.error(e);
    showToast(e.message, false);
  }
}

async function updateComputer() {
  const token = getToken();
  const id = document.getElementById("computerIdHidden").value;
  if (!id) {
    showToast("Chưa chọn máy để sửa", false);
    return;
  }

  const body = getFormData();

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message);
    showToast("Cập nhật thành công!");
    loadComputers();
  } catch (e) {
    console.error(e);
    showToast(e.message, false);
  }
}

async function deleteComputer() {
  const token = getToken();
  const id = document.getElementById("computerIdHidden").value;
  if (!id) {
    showToast("Chưa chọn máy để xóa", false);
    return;
  }
  if (!confirm("Bạn có chắc chắn muốn xóa máy này?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message);
    showToast("Đã xóa máy thành công!");
    loadComputers();
    clearForm();
  } catch (e) {
    console.error(e);
    showToast(e.message, false);
  }
}

function clearForm() {
  document.getElementById("computerIdHidden").value = "";
  document.getElementById("pcName").value = "";
  document.getElementById("pcIP").value = "";
  document.getElementById("pcLocation").value = "";
  const status = document.getElementById("pcStatus");
  if (status) status.value = "available";

  document
    .querySelectorAll(".pc-card")
    .forEach((c) => c.classList.remove("selected"));
}
