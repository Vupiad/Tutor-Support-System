// static/js/tutor.js

// ---------- MENU ACTIVE ----------
function setActiveMenu(menu) {
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

// ---------- set content ----------
function setContent(html) {
  const el = document.getElementById('content');
  if (el) el.innerHTML = html;
}

// ---------- HOME ----------
async function loadHome() {
  try {
    const res = await fetch("/api/tutor/sessions", { credentials: "include" });
    const json = await res.json();

    if (!res.ok || json.status !== "success") {
      setContent(`<div class="card alert alert-danger">Không tải được lịch dạy</div>`);
      return;
    }

    const sessions = json.data.sessions;

    let html = `<h2>Lịch Dạy</h2><div>`;

    if (!sessions || sessions.length === 0) {
      html += `<div class="card">Không có buổi học nào.</div>`;
    } else {
      sessions.forEach(s => {
        html += `
          <div class="card">
            <h3>${s.course_name}</h3>
            <p><b>Thời gian:</b> ${s.date_time}</p>
            <p><b>Số lượng:</b> ${s.student_count} sinh viên</p>
            <p><b>Trạng thái:</b> ${s.status}</p>
          </div>
        `;
      });
    }

    html += `</div>`;
    setContent(html);

  } catch (err) {
    setContent(`<div class="card alert alert-danger">${err.message}</div>`);
  }
}

// ---------- EVENT (free slots) ----------
async function loadEvent() {
  try {
    // 1. get current user
    const meRes = await fetch("/auth/me", { credentials: "include" });
    const me = await meRes.json();

    if (!meRes.ok || !me.data) {
      setContent(`<div class="card alert alert-danger">Bạn chưa đăng nhập</div>`);
      return;
    }

    const tutorId = me.data.user_id;

    // 2. Date range
    const start = "2025-01-01T00:00:00Z";
    const end = "2026-01-01T00:00:00Z";

    // 3. Call schedule API
    const res = await fetch(`/schedule/${tutorId}?start=${start}&end=${end}`, {
      credentials: "include"
    });

    const slots = await res.json();

    if (!res.ok) {
      setContent(`<div class="card alert alert-danger">Lỗi API event</div>`);
      return;
    }

    // 4. Render UI
    let html = `
      <h2>Lịch Rảnh</h2>
      <div class="card">
        <button class="btn" onclick="showAddSlotForm()">+ Add Slot</button>
        <div id="slot-form-area"></div>
      </div>
    `;

    if (!slots || slots.length === 0) {
      html += `<div class="card">Bạn chưa có slot nào.</div>`;
    } else {
      slots.forEach(slot => {
        html += `
          <div class="card">
            <p><b>Start:</b> ${slot.start}</p>
            <p><b>End:</b> ${slot.end}</p>
            <button class="btn small" onclick="deleteSlot('${slot.id}')">Delete</button>
          </div>
        `;
      });
    }

    setContent(html);

  } catch (err) {
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
}


// show add slot form
function showAddSlotForm() {
  const area = document.getElementById('slot-form-area');
  if (!area) return;
  area.innerHTML = `
    <div style="margin-top:12px;">
      <label>Start: <input id="slot_start" type="datetime-local"></label>
      <label>End: <input id="slot_end" type="datetime-local"></label>
      <button class="btn small" onclick="submitAddSlot()">Submit</button>
    </div>
  `;
}

async function submitAddSlot() {
  try {
    const tutorId = (await fetch('/auth/me', { credentials: 'include' }).then(r=>r.json())).data.user_id;
    const start = document.getElementById('slot_start').value;
    const end = document.getElementById('slot_end').value;
    await fetch(`/schedule/${encodeURIComponent(tutorId)}/slot/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ start, end })
    });
    loadEvent();
  } catch (err) {
    alert('Lỗi khi thêm slot: ' + err.message);
    console.error(err);
  }
}

async function deleteSlot(slotId) {
  try {
    const tutorId = (await fetch('/auth/me', { credentials: 'include' }).then(r=>r.json())).data.user_id;
    await fetch(`/schedule/${encodeURIComponent(tutorId)}/slot/${encodeURIComponent(slotId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    loadEvent();
  } catch (err) {
    alert('Xóa thất bại: ' + err.message);
    console.error(err);
  }
}

// ---------- Students / Notifications / Document ----------
async function loadStudents() {
  try {
    const res = await fetch("/api/tutor/students", { credentials: "include" });
    const json = await res.json();

    if (!res.ok || json.status !== "success") {
      setContent(`<div class="card alert alert-danger">Không tải được danh sách học sinh</div>`);
      return;
    }

    const students = json.data.students;

    let html = `
      <h2>Danh sách học sinh</h2>
      <p><b>Tổng số học sinh:</b> ${json.data.total_students}</p>
      <div>
    `;

    if (!students || students.length === 0) {
      html += `<div class="card">Bạn chưa được phân công học sinh nào.</div>`;
    } else {
      students.forEach((st, index) => {
        html += `
          <div class="card student-card">
            <div class="student-header">
              <h3>${st.student_name}</h3>
              <p><b>MSSV:</b> ${st.student_id}</p>
              <button class="btn small" onclick="toggleStudentDetail(${index})">
                Chi tiết
              </button>
            </div>

            <div id="student-detail-${index}" class="student-detail hidden">
              <p><b>Môn:</b> ${st.course_name}</p>
              <p><b>Lớp:</b> ${st.class_name}</p>
              <p><b>Bắt đầu từ:</b> ${st.start_date}</p>
              <p><b>Đánh giá:</b> ⭐ ${st.rating}</p>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    setContent(html);

  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi loadStudents: ${err.message}</div>`);
  }
}

// Toggle the hidden/visible detail block
function toggleStudentDetail(index) {
  const box = document.getElementById(`student-detail-${index}`);
  box.classList.toggle("hidden");
}


async function loadNotifications() {
  try {
    // 1. Lấy user hiện tại
    const meRes = await fetch("/auth/me", { credentials: "include" });
    const meJson = await meRes.json();

    if (!meRes.ok || !meJson.data) {
      setContent(`<div class="card alert alert-danger">Bạn chưa đăng nhập.</div>`);
      return;
    }

    const userId = meJson.data.user_id;

    // 2. Lấy danh sách notification
    const notifRes = await fetch(`/notification/user/${userId}`, { credentials: "include" });
    const notifJson = await notifRes.json();

    if (!notifRes.ok || !notifJson.success) {
      setContent(`<div class="card alert alert-danger">Không tải được thông báo.</div>`);
      return;
    }

    const notifications = notifJson.data;
    const unreadCount = notifJson.unread_count;

    // 3. Render HTML
    let html = `
      <h2>Thông báo</h2>
      <p>Bạn có <b>${unreadCount}</b> thông báo chưa đọc.</p>

      <button class="btn" onclick="markAllNotificationsAsRead('${userId}')">
        Đánh dấu tất cả là đã đọc
      </button>

      <div class="notif-list">
    `;

    if (notifications.length === 0) {
      html += `<div class="card">Không có thông báo nào.</div>`;
    } else {
      notifications.forEach((n, index) => {
        html += `
          <div class="card notif-item ${n.read ? '' : 'notif-unread'}">
            <div class="notif-header">
              <h3>${n.title}</h3>
              <small>${n.timestamp}</small>
            </div>

            <p>${n.message}</p>

            <div class="notif-actions">
              ${!n.read ? `<button class="btn small" onclick="markNotificationRead('${n.id}', '${userId}')">Đánh dấu đã đọc</button>` : ''}
              
              <button class="btn small danger" onclick="deleteNotification('${n.id}', '${userId}')">Xoá</button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    setContent(html);

  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi loadNotifications: ${err.message}</div>`);
  }
}

async function markNotificationRead(id, userId) {
  await fetch(`/notification/${id}/read`, {
    method: "PUT",
    credentials: "include"
  });

  loadNotifications(); // reload UI
}

async function markAllNotificationsAsRead(userId) {
  await fetch(`/notification/user/${userId}/read-all`, {
    method: "PUT",
    credentials: "include"
  });

  loadNotifications();
}

async function deleteNotification(id, userId) {
  if (!confirm("Bạn có chắc muốn xoá thông báo này?")) return;

  await fetch(`/notification/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  loadNotifications();
}


function loadDocument() {
  setContent(`<h2>Document</h2><p>Đang cập nhật…</p>`);
}

// ---------- User info / logout ----------
async function loadUserInfo() {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    if (!res.ok) return; // not logged in

    const json = await res.json();
    if (!json || !json.data) return;

    const nameEl = document.getElementById("sidebar-name");
    const roleEl = document.getElementById("sidebar-role");
    if (nameEl) nameEl.innerText = json.data.display_name || json.data.username || '•••';
    if (roleEl) roleEl.innerText = json.data.role || '';
  } catch (err) {
    console.error("Lỗi load user info:", err);
  }
}

async function logoutNow() {
  try {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    console.warn('Logout request failed', err);
  } finally {
    // go to login HTML page
    window.location.href = '/auth/login';
  }
}

// small helper
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// on load
document.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
  loadUserInfo();
});
