// static/js/student.js

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
    case "my-tutors": loadMyTutors(); break;
    case "document": loadDocument(); break;
    case "calendar": loadCalendar(); break;
    case "notifications": loadNotifications(); break;
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
    const meRes = await fetch('/auth/me', { credentials: 'include' });
    if (!meRes.ok) {
      setContent(`<div class="card">Bạn chưa đăng nhập</div>`);
      return;
    }
    const meJson = await meRes.json();
    if (!meJson || !meJson.data) {
      setContent(`<div class="card">Bạn chưa đăng nhập</div>`);
      return;
    }

    const studentName = meJson.data.display_name || meJson.data.username || 'Student';
    let html = `
      <h2>Trang Chủ</h2>
      <div class="welcome-card">
        <div class="welcome-icon">
          <i class="ri-graduation-cap-line"></i>
        </div>
        <div class="welcome-content">
          <h3>Chào mừng, ${escapeHtml(studentName)}!</h3>
          <p>Bạn đang sử dụng hệ thống tìm gia sư. Hãy quản lý các gia sư và lịch học của bạn.</p>
        </div>
      </div>
      
      <div class="quick-actions">
        <div class="action-card" onclick="loadPage('my-tutors')">
          <i class="ri-user-follow-line"></i>
          <h4>Gia Sư Của Tôi</h4>
          <p>Xem danh sách các gia sư đang hợp tác</p>
        </div>
        <div class="action-card" onclick="loadPage('document')">
          <i class="ri-file-text-line"></i>
          <h4>Tài Liệu</h4>
          <p>Truy cập các tài liệu học tập</p>
        </div>
        <div class="action-card" onclick="loadPage('calendar')">
          <i class="ri-calendar-line"></i>
          <h4>Lịch Học</h4>
          <p>Xem lịch học của bạn</p>
        </div>
      </div>
    `;
    setContent(html);
  } catch (err) {
    setContent(`<div class="card"><p style="color:red">❗ Lỗi loadHome: ${err.message}</p></div>`);
    console.error(err);
  }
}

// ---------- MY TUTORS ----------
async function loadMyTutors() {
  try {
    const res = await fetch('/api/student/tutors/my-courses', {
      credentials: 'include'
    });

    if (!res.ok) {
      setContent(`<div class="card alert alert-danger">Lỗi lấy danh sách gia sư (mã ${res.status})</div>`);
      return;
    }

    const data = await res.json();
    let html = `
      <h2>Gia Sư Của Tôi</h2>
      <div class="search-section">
        <div class="search-box">
          <input type="text" id="search_course" 
                 placeholder="Tìm kiếm gia sư theo môn học (VD: CSC101, MATH101)..." 
                 class="search-input">
          <button class="btn btn-primary" onclick="searchTutors()">
            <i class="ri-search-line"></i> Tìm Kiếm
          </button>
        </div>
        <div id="search-results"></div>
      </div>
    `;

    if (!data.data || !data.data.tutors || data.data.tutors.length === 0) {
      html += `<div class="card alert alert-info">Bạn chưa có gia sư nào</div>`;
    } else {
      html += `<h3 style="margin-top: 30px; margin-bottom: 20px;">Danh Sách Gia Sư</h3>`;
      html += `<div class="tutors-list">`;
      data.data.tutors.forEach(tutor => {
        html += `
          <div class="tutor-card">
            <div class="tutor-header">
              <div class="tutor-avatar">
                <i class="ri-user-3-fill"></i>
              </div>
              <div class="tutor-basic-info">
                <div class="tutor-name">${escapeHtml(tutor.tutor_name)}</div>
                <div class="tutor-spec">${escapeHtml(tutor.specialization)}</div>
              </div>
              <div class="tutor-rating">
                <span class="rating-star">⭐ ${tutor.rating || 0}</span>
              </div>
            </div>
            <div class="tutor-info">
              <p><b>Các Môn Dạy:</b> ${tutor.teaching_courses.join(', ') || 'N/A'}</p>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    setContent(html);
  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
}

// ---------- FIND TUTORS (SEARCH) - được gọi từ My Tutors page ----------
// Hàm này không còn là page, chỉ là search functionality

// 🔗 API 1: GET /api/student/tutors/search
async function searchTutors() {
  try {
    const courseName = document.getElementById('search_course').value.trim();
    if (!courseName) {
      alert('Vui lòng nhập tên môn học');
      return;
    }

    const res = await fetch(
      `/api/student/tutors/search?course_name=${encodeURIComponent(courseName)}`,
      { credentials: 'include' }
    );

    const resultsDiv = document.getElementById('search-results');
    
    if (!res.ok) {
      resultsDiv.innerHTML = `<div class="card alert alert-warning">
        Không tìm thấy gia sư cho môn học này
      </div>`;
      return;
    }

    const data = await res.json();
    
    if (!data.data || !data.data.tutors || data.data.tutors.length === 0) {
      resultsDiv.innerHTML = `<div class="card alert alert-warning">
        Không có gia sư nào dạy môn ${escapeHtml(courseName)}
      </div>`;
      return;
    }

    let html = `<div class="search-results-header">
      <i class="ri-check-double-line"></i> Tìm thấy ${data.data.tutors.length} gia sư dạy ${escapeHtml(courseName)}
    </div>`;
    
    data.data.tutors.forEach(tutor => {
      html += `
        <div class="tutor-card">
          <div class="tutor-header">
            <div class="tutor-avatar">
              <i class="ri-user-3-fill"></i>
            </div>
            <div class="tutor-basic-info">
              <div class="tutor-name">${escapeHtml(tutor.tutor_name)}</div>
              <div class="tutor-spec">${escapeHtml(tutor.specialization)}</div>
            </div>
            <div class="tutor-rating">
              <span class="rating-star">⭐ ${tutor.rating || 0}</span>
            </div>
          </div>
          <div class="tutor-info">
            <p><b>Email:</b> ${escapeHtml(tutor.email)}</p>
            <p><b>Môn dạy:</b> ${tutor.subjects.join(', ') || 'N/A'}</p>
          </div>
          <button class="btn btn-info" 
                  onclick="viewTutorDetail('${escapeHtml(tutor.tutor_id)}')">
            <i class="ri-eye-line"></i> Xem Chi Tiết
          </button>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
  } catch (err) {
    console.error(err);
    document.getElementById('search-results').innerHTML = 
      `<div class="card alert alert-danger">Lỗi: ${err.message}</div>`;
  }
}

// 🔗 API 2: GET /api/student/tutors/<tutor_id>
async function viewTutorDetail(tutorId) {
  try {
    const res = await fetch(
      `/api/student/tutors/${encodeURIComponent(tutorId)}`,
      { credentials: 'include' }
    );

    if (!res.ok) {
      alert('Không thể lấy thông tin gia sư');
      return;
    }

    const data = await res.json();
    const tutor = data.data;

    let slotsHtml = '';
    if (tutor.available_slots && tutor.available_slots.length > 0) {
      slotsHtml = `<div class="slots-section">
        <h4><i class="ri-time-line"></i> Lịch Rảnh Của Gia Sư</h4>
        <div class="slots-list">`;
      tutor.available_slots.forEach(slot => {
        const startTime = new Date(slot.start).toLocaleString('vi-VN');
        const endTime = new Date(slot.end).toLocaleString('vi-VN');
        slotsHtml += `
          <div class="slot-item">
            <p><i class="ri-calendar-event-line"></i> ${startTime}</p>
            <p style="margin-left: 20px; color: #666;">→ ${endTime}</p>
            <button class="btn btn-small btn-success" 
                    onclick="bookSlot('${escapeHtml(tutorId)}', ${slot.id})">
              <i class="ri-check-line"></i> Đặt
            </button>
          </div>
        `;
      });
      slotsHtml += `</div></div>`;
    } else {
      slotsHtml = `<div class="card alert alert-info">
        <i class="ri-information-line"></i> Gia sư này hiện chưa có lịch rảnh
      </div>`;
    }

    let html = `
      <div style="margin-bottom: 20px;">
        <button class="btn btn-secondary" onclick="loadFindTutors()" style="margin-bottom: 10px;">
          <i class="ri-arrow-left-line"></i> Quay Lại
        </button>
      </div>
      <h2>${escapeHtml(tutor.tutor_name)}</h2>
      <div class="tutor-detail-card">
        <div class="detail-info">
          <p><b><i class="ri-mail-line"></i> Email:</b> ${escapeHtml(tutor.contact_email)}</p>
          <p><b><i class="ri-medal-line"></i> Chuyên Ngành:</b> ${escapeHtml(tutor.specialization)}</p>
          <p><b><i class="ri-star-line"></i> Đánh Giá:</b> ⭐ ${tutor.rating || 0}</p>
          <p><b><i class="ri-bank-line"></i> Khoa:</b> ${escapeHtml(tutor.department || 'N/A')}</p>
          <p><b><i class="ri-book-line"></i> Môn Dạy:</b> ${tutor.teaching_courses.join(', ') || 'N/A'}</p>
        </div>
      </div>
      ${slotsHtml}
    `;
    setContent(html);
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
}

// Helper function for booking
async function bookSlot(tutorId, slotId) {
  alert('Tính năng đặt lịch sẽ được cập nhật sớm!');
}

// ---------- DOCUMENT ----------
function loadDocument() {
  setContent(`
    <h2><i class="ri-file-text-line"></i> Tài Liệu</h2>
    <div class="card alert alert-info">
      <i class="ri-information-line"></i> Tính năng tài liệu đang được phát triển…
    </div>
  `);
}

// ---------- CALENDAR ----------
function loadCalendar() {
  setContent(`
    <h2><i class="ri-calendar-line"></i> Lịch Học</h2>
    <div class="card alert alert-info">
      <i class="ri-information-line"></i> Tính năng lịch học đang được phát triển…
    </div>
  `);
}

// ---------- NOTIFICATIONS ----------
// 🔗 API 5: GET /notification/user/<user_id>
async function loadNotifications() {
  try {
    const meRes = await fetch('/auth/me', { credentials: 'include' });
    if (!meRes.ok) {
      setContent(`<div class="card">Bạn chưa đăng nhập</div>`);
      return;
    }
    const meJson = await meRes.json();
    const userId = meJson.data.user_id;

    const res = await fetch(
      `/notification/user/${encodeURIComponent(userId)}`,
      { credentials: 'include' }
    );

    if (!res.ok) {
      setContent(`<div class="card alert alert-danger">
        Lỗi lấy thông báo (mã ${res.status})
      </div>`);
      return;
    }

    const data = await res.json();
    let html = `<h2><i class="ri-notification-line"></i> Thông Báo</h2>`;

    if (!data.notifications || data.notifications.length === 0) {
      html += `<div class="card alert alert-info">
        <i class="ri-inbox-line"></i> Bạn không có thông báo nào
      </div>`;
    } else {
      html += `<div class="notifications-list">`;
      data.notifications.forEach(notif => {
        const isRead = notif.read_at;
        html += `
          <div class="notification-item ${isRead ? 'read' : 'unread'}">
            <div class="notif-content">
              <div class="notif-title">${escapeHtml(notif.title)}</div>
              <div class="notif-message">${escapeHtml(notif.message)}</div>
              <div class="notif-time">
                <i class="ri-time-line"></i> ${new Date(notif.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
            <div class="notif-actions">
              ${!isRead ? `
                <button class="btn btn-small" 
                        onclick="markNotificationAsRead('${notif.notification_id}')">
                  <i class="ri-check-line"></i> Đánh dấu đã đọc
                </button>
              ` : ''}
              <button class="btn btn-small btn-danger" 
                      onclick="deleteNotification('${notif.notification_id}')">
                <i class="ri-delete-bin-line"></i> Xóa
              </button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    setContent(html);
  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
}

// 🔗 API 7: PUT /notification/<notification_id>/read
async function markNotificationAsRead(notificationId) {
  try {
    const res = await fetch(
      `/notification/${encodeURIComponent(notificationId)}/read`,
      {
        method: 'PUT',
        credentials: 'include'
      }
    );

    if (!res.ok) {
      alert('Lỗi cập nhật thông báo');
      return;
    }

    loadNotifications();
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
}

// 🔗 API 8: DELETE /notification/<notification_id>
async function deleteNotification(notificationId) {
  if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;

  try {
    const res = await fetch(
      `/notification/${encodeURIComponent(notificationId)}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    );

    if (!res.ok) {
      alert('Lỗi xóa thông báo');
      return;
    }

    loadNotifications();
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
}

// 🔗 API 6: GET /notification/unread-count/<user_id>
async function updateUnreadNotificationCount() {
  try {
    const meRes = await fetch('/auth/me', { credentials: 'include' });
    if (!meRes.ok) return;
    const meJson = await meRes.json();
    const userId = meJson.data.user_id;

    const res = await fetch(
      `/notification/unread-count/${encodeURIComponent(userId)}`,
      { credentials: 'include' }
    );

    if (!res.ok) return;
    
    const data = await res.json();
    const badge = document.getElementById('unread-count');
    if (badge) {
      badge.innerText = data.unread_count || 0;
      badge.style.display = data.unread_count > 0 ? 'inline' : 'none';
    }
  } catch (err) {
    console.error('Lỗi lấy số thông báo chưa đọc:', err);
  }
}

// ---------- User info / logout ----------
async function loadUserInfo() {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    if (!res.ok) return;

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
    window.location.href = '/auth/login';
  }
}

// Toggle user menu
function toggleUserMenu() {
  const logoutBox = document.getElementById('logout-box');
  if (logoutBox) {
    logoutBox.style.display = logoutBox.style.display === 'none' ? 'block' : 'none';
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
  updateUnreadNotificationCount();
});
