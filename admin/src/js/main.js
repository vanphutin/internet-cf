// src/js/main.js
import { getToken, clearToken, loadHtmlFragment, showToast } from "./utils.js";
import { initLoginPage, initRegisterPage } from "./auth.js";
import { initDashboardPage } from "./dashboard-module.js";
import { initCustomersPage } from "./customers-module.js";
import { initComputersPage } from "./computers-module.js";
import { initReportsPage } from "./reports-module.js";
import { initChatPage } from "./chat-module.js";
import { connectWebSocket } from "./realtime.js";

const pageInits = {
  login: initLoginPage,
  register: initRegisterPage,
  dashboard: initDashboardPage,
  customers: initCustomersPage,
  computers: initComputersPage,
  reports: initReportsPage,
  chat: initChatPage,
};

function setActiveNav(pageName) {
  const links = document.querySelectorAll(".nav-link[data-page]");
  links.forEach((btn) => {
    const p = btn.dataset.page;
    if (p && p === pageName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function applyAuthMode(pageName) {
  const isAuth = pageName === "login" || pageName === "register";
  if (isAuth) {
    document.body.classList.add("auth-mode");
  } else {
    document.body.classList.remove("auth-mode");
  }
}

/** Router: load page + gọi init tương ứng */
export async function goTo(pageName) {
  const token = getToken();
  const protectedPages = ["dashboard", "customers", "computers", "reports"];

  // Nếu chưa login -> luôn chuyển về login
  if (!token && protectedPages.includes(pageName)) {
    pageName = "login";
  }

  applyAuthMode(pageName);

  await loadHtmlFragment(pageName);

  if (protectedPages.includes(pageName)) {
    setActiveNav(pageName);
  } else {
    setActiveNav(null);
  }

  // Gọi hàm init của từng page, truyền context (goTo) nếu cần
  const initFn = pageInits[pageName];
  if (typeof initFn === "function") {
    initFn({ goTo });
  }
}

function setupNavEvents() {
  document.querySelectorAll(".nav-link[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      goTo(page);
    });
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearToken();
      showToast("Đã đăng xuất!", true);
      goTo("login");
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setupNavEvents();

  const token = getToken();
  if (!token) {
    goTo("login");
  } else {
    goTo("dashboard");

    setTimeout(() => {
      const path = location.hash.replace("#", "");
      if (["dashboard", "customers", "computers", "reports"].includes(path)) {
        connectWebSocket();
      }
    }, 200);
  }
});
