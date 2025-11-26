document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".btn");
  const PORT = " http://localhost:3000";
  loginBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    // Lấy dữ liệu từ form
    const email = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      // Gọi API login
      const res = await fetch(`${PORT}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Đăng nhập thành công!");
        console.log("User:", data.user);

        // Ví dụ: lưu user vào localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // chuyển trang (dashboard/home)
        window.location.href = "/frontend_order/order.html";
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi khi kết nối server!");
    }
  });

  // Link Đăng ký
  const linkDangKy = document.querySelector(".links a:last-child");
  linkDangKy?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../SignIn.html";
  });
});
