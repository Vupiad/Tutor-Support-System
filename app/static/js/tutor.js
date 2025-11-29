// static/tutor.js

// ---------- MENU ACTIVE ----------
function setActiveMenu(menu) {
  // reset
  document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));

  const activeItem = document.getElementById(`menu-${menu}`);
  if (activeItem) activeItem.classList.add("active");
}

// ---------- ROUTER ----------
function loadPage(page) {
  setActiveMenu(page);

  switch(page) {
    case "home": loadHome(); break;
    case "event": loadEvent(); break;
    case "students": loadStudents(); break;
    case "notifications": loadNotifications(); break;
    case "document": loadDocument(); break;
    default: loadHome(); break;
  }
}

// ---------- HTML RENDER ----------
function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

// ---------- HOME — LỊCH DẠY ----------
async function loadHome() {
  try {
    const res = await fetch('/schedule/accepted'); // <-- CHỈ TẠM THỜI
    if (!res.ok) throw new Error("API accepted sessions không tồn tại");
    
    const data = await res.json();

    let html = `<h2>Lịch Dạy</h2><div>`;
    if (!data || data.length === 0) {
      html += `<div class="card">Không có buổi học nào.</div>`;
    } else {
      data.forEach(s => {
        html += `
          <div class="schedule-card">
            <div class="schedule-color" style="background:#6C63FF;"></div>
            <div class="schedule-details">
              <div class="schedule-title">${s.name || "Buổi học"}</div>
              <div class="schedule-sub">${s.subject || "Môn học"}</div>
              <div class="schedule-info">
                <span><i class="ri-calendar-line"></i> ${s.day || ""}</span>
                <span><i class="ri-time-line"></i> ${s.gio || ""}</span>
              </div>
            </div>
          </div>`;
      });
    }

    html += `</div>`;
    setContent(html);

  } catch (err) {
    setContent(`<div class="card"><p style="color:red">❗ ${err.message}</p></div>`);
  }
}


// ---------- EVENT — LỊCH RẢNH ----------
async function loadEvent() {
  try {
    // // 1) Lấy tutorId từ cookie session (backend lưu trong session_id)
    // const me = await fetch('/api/v1/auth/me').then(r => r.json());
    // const tutorId = me.sso_id;

    // // 2) Tạo khoảng thời gian mặc định (1 năm)
    // const start = "2025-01-01T00:00:00Z";
    // const end   = "2026-01-01T00:00:00Z";

    // TẠM THỜI: hardcode tutorId để API chạy được
    const tutorId = "1";  // đổi thành ID thực tế nếu cần

    // 2) Tạo khoảng thời gian mặc định (1 năm)
    const start = "2025-01-01T00:00:00Z";
    const end   = "2026-01-01T00:00:00Z";


    // 3) Gọi API đúng chuẩn backend
    const res = await fetch(`/schedule/${tutorId}?start=${start}&end=${end}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      setContent(`<div class='card alert alert-danger'>Lỗi API event</div>`);
      return;
    }

    const slots = await res.json();

    let html = `
      <h2>Lịch rảnh</h2>
      <div class="card">
        <button class="btn" onclick="showAddSlotForm()">+ Add Slot</button>
        <div id="slot-form-area"></div>
      </div>
    `;

    if (slots.length === 0) {
      html += `<div class="card">Bạn chưa có slot nào.</div>`;
    } else {
      slots.forEach(slot => {
        html += `
          <div class="card">
            <p><b>Start:</b> ${slot.start}</p>
            <p><b>End:</b> ${slot.end}</p>
            <button class="btn small" onclick="deleteSlot('${slot.id}')">Delete</button>
          </div>`;
      });
    }

    setContent(html);

  } catch (err) {
    setContent(`<div class="card alert alert-danger">Lỗi loadEvent: ${err.message}</div>`);
    console.error(err);
  }
}


// ---------- STUDENTS ----------
function loadStudents() {
  setContent(`<h2>Students</h2><p>Đang cập nhật…</p>`);
}

// ---------- NOTIFICATIONS ----------
function loadNotifications() {
  setContent(`<h2>Notifications</h2><p>Đang cập nhật…</p>`);
}

// ---------- DOCUMENT ----------
function loadDocument() {
  setContent(`<h2>Document</h2><p>Đang cập nhật…</p>`);
}
// Toggle dropdown open/close
function toggleUserMenu() {
  document.getElementById("dropdown-menu").classList.toggle("hidden");
}

// Load user info into the header
async function loadUserInfo() {
  try {
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    const user = await res.json();

    document.getElementById("user-name").textContent = user.display_name || user.username;
    document.getElementById("user-role").textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  } catch (err) {
    console.error("Cannot load user info");
  }
}

// Logout function
async function logoutNow() {
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  // After logout → go to login page
  window.location.href = "/api/v1/auth/login";
}

// Load user info when dashboard loads
document.addEventListener("DOMContentLoaded", loadUserInfo);

// ---------- LOAD TRANG MẶC ĐỊNH ----------
document.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
});
