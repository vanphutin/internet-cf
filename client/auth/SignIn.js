document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.querySelector(".btn");
  const PORT = " http://localhost:3000";

  registerBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    // Lấy dữ liệu từ form
    const username = document.querySelector("#username").value.trim();
    const name = document.querySelector("#name").value.trim();
    const password = document.querySelector("#password").value.trim();
    const rePassword = document.querySelector("#rePassword").value.trim();

    if (!rePassword || !username || !password || !name) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // Gọi API signup
      const res = await fetch(`${PORT}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rePassword, username, password, name }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Đăng ký thành công! Mời bạn đăng nhập.");
        // Chuyển sang trang Login
        window.location.href = "Login.html";
      } else {
        alert("❌ " + (data.message || "Đăng ký thất bại!"));
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("🚨 Không thể kết nối server!");
    }
  });

  // Link chuyển sang Login nếu đã có tài khoản
  const linkDangNhap = document.querySelector(".links a");
  linkDangNhap?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "Login.html";
  });
});
