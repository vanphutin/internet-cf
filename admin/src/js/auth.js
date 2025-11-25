// src/js/auth.js
import { API_BASE, setToken, showToast } from "./utils.js";

/**
 * Khởi tạo page Login
 * @param {{goTo: (page: string) => void}} ctx
 */
export function initLoginPage(ctx = {}) {
  const { goTo } = ctx;

  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");

  // Nút chuyển sang register
  document
    .querySelectorAll('[data-link="register"]')
    .forEach((btn) =>
      btn.addEventListener("click", () => goTo && goTo("register"))
    );

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showToast("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu", false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data) {
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      // tuỳ backend: giả sử trả về { token, user }
      const token = data.token || data.data?.token;
      if (!token) {
        throw new Error("Không nhận được token từ server");
      }

      setToken(token);
      showToast("Đăng nhập thành công!");

      if (goTo) goTo("dashboard");
    } catch (error) {
      console.error(error);
      showToast(error.message, false);
    }
  });
}

/**
 * Khởi tạo page Register
 * @param {{goTo: (page: string) => void}} ctx
 */
export function initRegisterPage(ctx = {}) {
  const { goTo } = ctx;

  const form = document.getElementById("registerForm");
  if (!form) return;

  document
    .querySelectorAll('[data-link="login"]')
    .forEach((btn) =>
      btn.addEventListener("click", () => goTo && goTo("login"))
    );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("reg-fullname").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const rePassword = document.getElementById("reg-repassword").value.trim();

    if (!name || !username || !password || !rePassword) {
      showToast("Vui lòng nhập đầy đủ thông tin", false);
      return;
    }
    if (password !== rePassword) {
      showToast("Mật khẩu nhập lại không khớp", false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, rePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Đăng ký thất bại");
      }

      showToast("Đăng ký thành công! Mời bạn đăng nhập.");
      if (goTo) goTo("login");
    } catch (error) {
      console.error(error);
      showToast(error.message, false);
    }
  });
}
