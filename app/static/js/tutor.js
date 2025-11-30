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

    let html = `<h2>Lịch Dạy</h2>`;

    if (!sessions || sessions.length === 0) {
      html += `<div class="card">Không có buổi học nào.</div>`;
    } else {
      html += `<div class="sessions-grid">`;
      sessions.forEach(s => {
        // Format date time
        const dateObj = new Date(s.date_time);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM';
        const displayHours = dateObj.getHours() % 12 || 12;
        
        const monthName = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                          'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'][month - 1];
        
        // Status color mapping
        const statusColors = {
          'scheduled': '#4CAF50',
          'completed': '#2196F3',
          'cancelled': '#F44336'
        };
        const statusColor = statusColors[s.status] || '#999';
        
        html += `
          <div class="session-card">
            <div class="session-card-header">
              <i class="ri-book-open-line"></i>
              <h3>${s.course_name}</h3>
            </div>
            <div class="session-card-content">
              <div class="session-date">
                <i class="ri-calendar-line"></i>
                <span>${day} ${monthName} năm ${year}</span>
              </div>
              <div class="session-time">
                <i class="ri-time-line"></i>
                <span>${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}</span>
              </div>
              <div class="session-location">
                <i class="ri-map-pin-line"></i>
                <span>${s.location || 'N/A'}</span>
              </div>
              <div class="session-students">
                <i class="ri-group-line"></i>
                <span>${s.student_count} sinh viên</span>
              </div>
            </div>
            <div class="session-status-badge" style="background-color: ${statusColor};">
              ${s.status}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

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
      <div class="event-actions">
        <button class="btn btn-success" onclick="showAddSlotModal()">
          <i class="ri-add-line"></i> Thêm Lịch Rảnh
        </button>
        <button class="btn btn-danger" onclick="showDeleteSlotModal()">
          <i class="ri-delete-bin-line"></i> Xóa Lịch Rảnh
        </button>
      </div>
    `;

    if (!slots || slots.length === 0) {
      html += `<div class="event-empty">
        <i class="ri-calendar-blank-line"></i>
        <p>Bạn chưa có lịch rảnh nào</p>
      </div>`;
    } else {
      html += `<div class="slots-grid">`;
      slots.forEach(slot => {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const dayMonth = startDate.toLocaleDateString('vi-VN');
        const startTime = startDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        const endTime = endDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        
        html += `
          <div class="slot-card" data-slot-id="${slot.id}">
            <div class="slot-header">
              <i class="ri-calendar-event-line"></i>
              <span class="slot-date">${dayMonth}</span>
            </div>
            <div class="slot-body">
              <div class="slot-time">
                <span class="time-label">Từ:</span>
                <span class="time-value">${startTime}</span>
              </div>
              <div class="slot-divider"></div>
              <div class="slot-time">
                <span class="time-label">Đến:</span>
                <span class="time-value">${endTime}</span>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Add modals
    html += `
      <!-- Add Slot Modal -->
      <div id="add-slot-modal" class="event-modal hidden">
        <div class="modal-overlay" onclick="closeAddSlotModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="ri-add-circle-line"></i> Thêm Lịch Rảnh Mới</h3>
            <button class="modal-close-btn" onclick="closeAddSlotModal()">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời gian bắt đầu</label>
              <input type="datetime-local" id="slot_start" class="form-input">
            </div>
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời gian kết thúc</label>
              <input type="datetime-local" id="slot_end" class="form-input">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeAddSlotModal()">Hủy</button>
            <button class="btn btn-success" onclick="submitAddSlot()">
              <i class="ri-check-line"></i> Thêm
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Slot Modal -->
      <div id="delete-slot-modal" class="event-modal hidden">
        <div class="modal-overlay" onclick="closeDeleteSlotModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="ri-delete-bin-line"></i> Xóa Lịch Rảnh</h3>
            <button class="modal-close-btn" onclick="closeDeleteSlotModal()">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 16px; color: #666;">Chọn lịch rảnh cần xóa:</p>
            <div id="delete-slots-list" class="delete-slots-list"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeDeleteSlotModal()">Hủy</button>
          </div>
        </div>
      </div>
    `;

    setContent(html);
    
    // Populate delete slots list
    if (slots && slots.length > 0) {
      const deleteList = document.getElementById('delete-slots-list');
      slots.forEach(slot => {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const dayMonth = startDate.toLocaleDateString('vi-VN');
        const startTime = startDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        const endTime = endDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        
        deleteList.innerHTML += `
          <div class="delete-slot-option" onclick="confirmDeleteSlot('${slot.id}')">
            <div class="option-content">
              <span class="option-date">${dayMonth}</span>
              <span class="option-time">${startTime} - ${endTime}</span>
            </div>
            <i class="ri-delete-bin-2-line"></i>
          </div>
        `;
      });
    }

  } catch (err) {
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
}

// Modal functions for Add Slot
function showAddSlotModal() {
  const modal = document.getElementById('add-slot-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddSlotModal() {
  const modal = document.getElementById('add-slot-modal');
  if (modal) modal.classList.add('hidden');
  document.getElementById('slot_start').value = '';
  document.getElementById('slot_end').value = '';
}

// Modal functions for Delete Slot
function showDeleteSlotModal() {
  const modal = document.getElementById('delete-slot-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeDeleteSlotModal() {
  const modal = document.getElementById('delete-slot-modal');
  if (modal) modal.classList.add('hidden');
}

async function confirmDeleteSlot(slotId) {
  if (confirm('Bạn có chắc chắn muốn xóa lịch rảnh này?')) {
    try {
      const tutorId = (await fetch('/auth/me', { credentials: 'include' }).then(r=>r.json())).data.user_id;
      await fetch(`/schedule/${encodeURIComponent(tutorId)}/slot/${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      closeDeleteSlotModal();
      loadEvent();
    } catch (err) {
      alert('Xóa thất bại: ' + err.message);
      console.error(err);
    }
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
    const start = document.getElementById('slot_start').value;
    const end = document.getElementById('slot_end').value;
    
    if (!start || !end) {
      alert('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc');
      return;
    }
    
    if (new Date(start) >= new Date(end)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    
    // Convert datetime-local to ISO 8601 format with Z
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();
    
    const tutorId = (await fetch('/auth/me', { credentials: 'include' }).then(r=>r.json())).data.user_id;
    const res = await fetch(`/schedule/${encodeURIComponent(tutorId)}/slot/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ start: startISO, end: endISO })
    });
    
    if (!res.ok) {
      let errorMsg = 'Lỗi khi thêm slot';
      try {
        const errorData = await res.json();
        errorMsg = 'Lỗi khi thêm slot: ' + (errorData.error || errorData.message || 'Unknown error');
      } catch (e) {
        const text = await res.text();
        console.error('Server response:', text);
        errorMsg = `Lỗi khi thêm slot (${res.status}): ${text.substring(0, 100)}`;
      }
      alert(errorMsg);
      return;
    }
    
    closeAddSlotModal();
    loadEvent();
  } catch (err) {
    alert('Lỗi khi thêm slot: ' + err.message);
    console.error(err);
  }
}

// ---------- Students / Notifications / Document ----------
async function loadStudents() {
  try {
    // Get current tutor info
    const meRes = await fetch("/auth/me", { credentials: "include" });
    const meJson = await meRes.json();
    const tutorId = meJson.data.user_id;

    // Fetch all users from datacore
    const dataRes = await fetch(`/api/tutor/students`, { credentials: "include" });
    const dataJson = await dataRes.json();
    
    // Get students only
    let students = [];
    if (dataJson.status === "success" && dataJson.data && dataJson.data.students) {
      students = dataJson.data.students;
    }

    let html = `
      <h2>Danh Sách Học Sinh</h2>
      <div class="search-section" style="margin-bottom: 30px;">
        <div class="search-box">
          <input type="text" id="student_search_input" 
                 placeholder="Tìm kiếm học sinh theo tên hoặc MSSV..." 
                 class="search-input" onkeyup="filterStudents()">
        </div>
      </div>
      <p style="margin-bottom: 20px;"><b>Tổng số học sinh:</b> <span id="student-count">${students.length}</span></p>
    `;

    if (!students || students.length === 0) {
      html += `<div class="card alert alert-info">Hiện chưa có học sinh được phân công.</div>`;
    } else {
      html += `<div class="students-grid" id="students-container">`;
      students.forEach((st, index) => {
        const courses = st.courses ? st.courses.join(', ') : 'N/A';
        html += `
          <div class="student-card" data-student-name="${st.name}" data-student-id="${st.student_id}">
            <div class="student-card-header">
              <div class="student-avatar">
                <i class="ri-user-3-fill"></i>
              </div>
              <div class="student-info-basic">
                <h3>${st.name}</h3>
                <p class="student-id">${st.student_id}</p>
              </div>
            </div>
            <div class="student-card-content">
              <div class="student-item">
                <i class="ri-book-line"></i>
                <span>${courses}</span>
              </div>
              <div class="student-item">
                <i class="ri-building-line"></i>
                <span>${st.faculty || 'N/A'}</span>
              </div>
              <div class="student-item">
                <i class="ri-mail-line"></i>
                <span>${st.email || 'N/A'}</span>
              </div>
            </div>
            <button class="btn btn-info" onclick="toggleStudentDetail(${index})">
              <i class="ri-eye-line"></i> Chi Tiết
            </button>
            
            <div id="student-detail-${index}" class="student-detail-modal hidden">
              <div class="detail-modal-content">
                <button class="detail-close-btn" onclick="toggleStudentDetail(${index})">
                  <i class="ri-close-line"></i>
                </button>
                <h3>${st.name}</h3>
                <div class="detail-info">
                  <p><b><i class="ri-id-card-line"></i> MSSV:</b> ${st.student_id}</p>
                  <p><b><i class="ri-mail-line"></i> Email:</b> ${st.email || 'N/A'}</p>
                  <p><b><i class="ri-phone-line"></i> Điện thoại:</b> ${st.phone || 'N/A'}</p>
                  <p><b><i class="ri-building-line"></i> Khoa:</b> ${st.faculty || 'N/A'}</p>
                  <p><b><i class="ri-organization-chart"></i> Bộ môn:</b> ${st.department || 'N/A'}</p>
                  <p><b><i class="ri-book-open-line"></i> Các môn học:</b> ${courses}</p>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    setContent(html);

  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi loadStudents: ${err.message}</div>`);
  }
}

// Filter students by name or ID
function filterStudents() {
  const searchInput = document.getElementById('student_search_input');
  const searchValue = searchInput.value.toLowerCase().trim();
  const studentCards = document.querySelectorAll('.student-card');
  const studentCount = document.getElementById('student-count');
  
  let visibleCount = 0;
  
  studentCards.forEach(card => {
    const name = card.getAttribute('data-student-name').toLowerCase();
    const id = card.getAttribute('data-student-id').toLowerCase();
    
    if (name.includes(searchValue) || id.includes(searchValue) || searchValue === '') {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  studentCount.textContent = visibleCount;
}

// Toggle the detail modal
function toggleStudentDetail(index) {
  const modal = document.getElementById(`student-detail-${index}`);
  if (modal) {
    modal.classList.toggle("hidden");
  }
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
        // Format timestamp
        const createdDate = new Date(n.created_at);
        const dateStr = createdDate.toLocaleDateString('vi-VN');
        const timeStr = createdDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        const formattedTime = `${dateStr} ${timeStr}`;
        
        // Extract details from related_data
        let details = '';
        if (n.related_data) {
          if (n.event_type === 'course_request' && n.related_data.student_id) {
            // Booking notification - show course and date
            details = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
              <strong>Khóa học:</strong> ${n.related_data.course_name || 'N/A'}<br>
              <strong>Thời gian:</strong> ${n.related_data.date_time || 'N/A'}
            </div>`;
          } else if ((n.event_type === 'schedule_create' || n.event_type === 'schedule_update' || n.event_type === 'schedule_delete') && n.related_data.schedule_info) {
            // Schedule notification
            details = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
              <strong>Lịch:</strong> ${n.related_data.schedule_info.time || 'N/A'}<br>
              <strong>Ngày:</strong> ${n.related_data.schedule_info.date || 'N/A'}
            </div>`;
          }
        }
        
        html += `
          <div class="card notif-item ${!n.is_read ? 'notif-unread' : ''}">
            <div class="notif-header">
              <h3>${n.title}</h3>
              <small>${formattedTime}</small>
            </div>

            <p>${n.message}</p>
            ${details}

            <div class="notif-actions">
              ${!n.is_read ? `<button class="btn small" onclick="markNotificationRead('${n.id}', '${userId}')">Đánh dấu đã đọc</button>` : ''}
              
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
