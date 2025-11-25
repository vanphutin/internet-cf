import { API_BASE, getToken, showToast } from "./utils.js";

const API_URL = `${API_BASE}/customers`;

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;

export function initCustomersPage() {
  loadCustomers();

  document.getElementById("searchBtn")?.addEventListener("click", () => {
    currentPage = 1;
    loadCustomers();
  });

  document.getElementById("reloadBtn")?.addEventListener("click", () => {
    loadCustomers();
  });

  document.getElementById("addCustomerBtn")?.addEventListener("click", () => {
    openModal("modalAdd");
  });

  document
    .getElementById("btnAddConfirm")
    ?.addEventListener("click", addCustomer);
  document
    .getElementById("btnEditConfirm")
    ?.addEventListener("click", updateCustomer);
  document
    .getElementById("btnTopupConfirm")
    ?.addEventListener("click", confirmTopup);

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add("show");
}

function closeAllModals() {
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("show"));
}

async function loadCustomers() {
  const tbody = document.getElementById("customerTableBody");

  tbody.innerHTML = `<tr><td colspan="7" class="loading-text">Đang tải...</td></tr>`;

  const token = getToken();
  const username = document.getElementById("searchUsername").value;
  const phone = document.getElementById("searchPhone").value;

  const url = new URL(API_URL);
  url.searchParams.set("page", currentPage);
  url.searchParams.set("size", pageSize);
  if (username) url.searchParams.set("username", username);
  if (phone) url.searchParams.set("phone", phone);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();

  const customers = json.data?.items || json.data || [];
  totalPages = json.data?.totalPages || 1;

  renderTable(customers);
  renderPagination();
}

function renderTable(customers) {
  const tbody = document.getElementById("customerTableBody");

  if (!customers.length) {
    tbody.innerHTML = `<tr><td colspan="7">Không tìm thấy khách hàng</td></tr>`;
    return;
  }

  tbody.innerHTML = customers
    .map(
      (c) => `
      <tr>
        <td>${c.customer_id}</td>
        <td>${c.name}</td>
        <td>${c.username}</td>
        <td>${c.phone ?? "-"}</td>
        <td>${c.email ?? "-"}</td>
        <td>${(c.balance || 0).toLocaleString()}</td>
        <td>
          <button class="btn-ghost" onclick="editCustomer(${c.customer_id}, '${
        c.name
      }', '${c.phone ?? ""}', '${c.email ?? ""}')">✏ Sửa</button>
          <button class="btn-ghost" onclick="topupCustomer(${
            c.customer_id
          })">💰 Nạp</button>
          <button class="btn-ghost btn-danger-ghost" onclick="deleteCustomer(${
            c.customer_id
          }, '${c.name}')">🗑 Xóa</button>
        </td>
      </tr>
  `
    )
    .join("");

  window.editCustomer = openEdit;
  window.topupCustomer = openTopup;
  window.deleteCustomer = handleDelete;
}

function renderPagination() {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  const prev = document.createElement("span");
  prev.className = "page-item";
  prev.innerText = "«";
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadCustomers();
    }
  };

  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("span");
    pageBtn.className = "page-item" + (i === currentPage ? " active" : "");
    pageBtn.innerText = i;
    pageBtn.onclick = () => {
      currentPage = i;
      loadCustomers();
    };

    container.appendChild(pageBtn);
  }

  const next = document.createElement("span");
  next.className = "page-item";
  next.innerText = "»";
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCustomers();
    }
  };

  container.appendChild(next);
}

function openEdit(id, name, phone, email) {
  document.getElementById("editId").value = id;
  document.getElementById("editName").value = name;
  document.getElementById("editPhone").value = phone;
  document.getElementById("editEmail").value = email;

  openModal("modalEdit");
}

function openTopup(id) {
  document.getElementById("topupId").value = id;
  openModal("modalTopup");
}

async function addCustomer() {
  const data = {
    name: document.getElementById("addName").value,
    username: document.getElementById("addUsername").value,
    password: document.getElementById("addPassword").value,
    phone: document.getElementById("addPhone").value,
    email: document.getElementById("addEmail").value,
  };

  if (!data.name || !data.username || !data.password) {
    return showToast("Vui lòng nhập đủ thông tin", false);
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    showToast("Thêm khách hàng thành công!");
    closeAllModals();
    loadCustomers();
  } else {
    const err = await res.json();
    showToast(err.message, false);
  }
}

async function updateCustomer() {
  const id = document.getElementById("editId").value;

  const data = {
    name: document.getElementById("editName").value,
    phone: document.getElementById("editPhone").value,
    email: document.getElementById("editEmail").value,
  };

  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    showToast("Cập nhật thành công!");
    closeAllModals();
    loadCustomers();
  } else {
    const err = await res.json();
    showToast(err.message, false);
  }
}

async function confirmTopup() {
  const id = document.getElementById("topupId").value;
  const amount = Number(document.getElementById("topupAmount").value);

  if (!amount || amount <= 0) {
    return showToast("Số tiền không hợp lệ", false);
  }

  try {
    const res = await fetch(`${API_URL}/${id}/balance`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ amount }),
    });

    const json = await res.json();

    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Lỗi nạp tiền");
    }

    showToast("Nạp tiền thành công!");
    closeAllModals();
    loadCustomers();
  } catch (error) {
    console.error(error);
    showToast(error.message, false);
  }
}

async function handleDelete(id, name) {
  if (!confirm(`Xóa khách hàng "${name}" ?`)) return;

  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (res.ok) {
    showToast("Đã xóa khách hàng!");
    loadCustomers();
  } else {
    const err = await res.json();
    showToast(err.message, false);
  }
}
