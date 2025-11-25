// src/js/utils.js

// Chỉnh lại URL backend nếu cần
export const API_BASE = "http://localhost:3000/api/v1";

// Token auth (JWT hoặc tương tự)
export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

// Toast message đơn giản
export function showToast(message, isSuccess = true) {
  const box = document.createElement("div");
  box.className = "toast";
  box.textContent = message;

  if (isSuccess) {
    box.classList.add("toast-success");
  } else {
    box.classList.add("toast-error");
  }

  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3000);
}

/**
 * Load 1 file HTML vào #page-container
 * @param {string} pageName - vd: 'dashboard', 'customers'
 */
export async function loadHtmlFragment(pageName) {
  const container = document.getElementById("page-container");
  container.innerHTML = '<p class="loading-text">Đang tải...</p>';

  try {
    const res = await fetch(`./src/html/${pageName}-page.html`);
    if (!res.ok) {
      container.innerHTML = `<p class="error-text">Không tải được trang ${pageName}</p>`;
      throw new Error(`Cannot load page: ${pageName}`);
    }
    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="error-text">Lỗi: ${err.message}</p>`;
  }
}
