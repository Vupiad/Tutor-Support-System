// static/js/tutor.js

// ---------- MENU ACTIVE ----------
function setActiveMenu(menu) {
  document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));
  const activeItem = document.getElementById(`menu-${menu}`);
  if (activeItem) activeItem.classList.add("active");
}

// Session edit UI removed — editing sessions handled via backend if needed.

// ---------- ROUTER ----------
// Helper: convert ISO datetime to 'datetime-local' input value
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Helper: convert 'datetime-local' input value to ISO string
function localInputToISO(local) {
  if (!local) return '';
  const d = new Date(local);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

// --- Session Edit Modal Handlers ---
function showEditSessionModal(sessionId) {
  const card = document.querySelector(`.session-card[data-session-id="${sessionId}"]`);
  if (!card) return;
  const dateTime = card.getAttribute('data-date-time') || '';
  const location = card.getAttribute('data-location') || '';
  const duration = card.getAttribute('data-duration') || '';

  const modal = document.getElementById('edit-session-modal');
  if (!modal) return;

  document.getElementById('edit_session_datetime').value = isoToLocalInput(dateTime);
  document.getElementById('edit_session_location').value = location;
  document.getElementById('edit_session_duration').value = duration;

  modal.setAttribute('data-edit-session-id', sessionId);
  modal.classList.remove('hidden');
}

function closeEditSessionModal() {
  const modal = document.getElementById('edit-session-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.removeAttribute('data-edit-session-id');
}

// Show session detail modal (contains details + edit button when allowed)
function showSessionDetail(sessionId) {
  // find the card and read attributes
  const card = document.querySelector(`.session-card[data-session-id="${sessionId}"]`);
  if (!card) return;
  const course = card.getAttribute('data-course') || '';
  const date_time = card.getAttribute('data-date-time') || '';
  const location = card.getAttribute('data-location') || 'N/A';
  const duration = card.getAttribute('data-duration') || '';
  const status = card.getAttribute('data-status') || '';
  const studentCount = card.getAttribute('data-student-count') || '0';

  // build human-friendly time
  const dateStr = date_time ? (new Date(date_time)).toLocaleString('vi-VN') : 'N/A';

  let bodyHtml = `
    <div class="detail-row"><strong>Khóa học:</strong> ${course}</div>
    <div class="detail-row"><strong>Thời gian:</strong> ${dateStr}</div>
    <div class="detail-row"><strong>Địa điểm:</strong> ${location}</div>
    <div class="detail-row"><strong>Thời lượng:</strong> ${duration} phút</div>
    <div class="detail-row"><strong>Số sinh viên:</strong> ${studentCount}</div>
    <div class="detail-row"><strong>Trạng thái:</strong> ${status}</div>
  `;

  const modal = document.getElementById('session-detail-modal');
  if (!modal) {
    // create modal container and append to body
    const wrapper = document.createElement('div');
    wrapper.id = 'session-detail-modal';
    wrapper.className = 'event-modal hidden';
    wrapper.innerHTML = `
      <div class="modal-overlay" onclick="closeSessionDetailModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="ri-information-line"></i> Chi Tiết Buổi Học</h3>
          <button class="modal-close-btn" onclick="closeSessionDetailModal()"><i class="ri-close-line"></i></button>
        </div>
        <div class="modal-body" id="session-detail-body">
        </div>
        <div class="modal-footer" id="session-detail-footer">
        </div>
      </div>`;
    document.body.appendChild(wrapper);
  }

  // populate body and footer
  document.getElementById('session-detail-body').innerHTML = bodyHtml;

  const footer = document.getElementById('session-detail-footer');
  footer.innerHTML = '';
  // If scheduled, add Edit button inside modal
  if (status === 'scheduled') {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary';
    editBtn.innerHTML = '<i class="ri-edit-line"></i> Chỉnh Sửa';
    editBtn.onclick = function(e) {
      e.stopPropagation();
      closeSessionDetailModal();
      showEditSessionModal(sessionId);
    };
    footer.appendChild(editBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Đóng';
  closeBtn.onclick = closeSessionDetailModal;
  footer.appendChild(closeBtn);

  // show modal
  const m = document.getElementById('session-detail-modal');
  if (m) m.classList.remove('hidden');
}

function closeSessionDetailModal() {
  const m = document.getElementById('session-detail-modal');
  if (m) m.classList.add('hidden');
}

async function submitEditSession() {
  const modal = document.getElementById('edit-session-modal');
  if (!modal) return;
  const sessionId = modal.getAttribute('data-edit-session-id');
  if (!sessionId) return alert('Không xác định buổi học để chỉnh sửa');

  const datetimeLocal = document.getElementById('edit_session_datetime').value;
  const location = document.getElementById('edit_session_location').value;
  const duration = document.getElementById('edit_session_duration').value;

  if (!datetimeLocal) return alert('Vui lòng chọn thời gian buổi học');

  const date_time = localInputToISO(datetimeLocal);
  const updates = { date_time, location, duration_minutes: Number(duration || 0) };

  try {
    const res = await fetch(`/api/tutor/session/${encodeURIComponent(sessionId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) {
      alert('Cập nhật buổi học thất bại: ' + (json.error || json.message || res.statusText));
      return;
    }
    closeEditSessionModal();
    loadPage('home');
  } catch (err) {
    console.error('Error updating session:', err);
    alert('Lỗi khi cập nhật buổi học');
  }
}
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
          <div class="session-card" onclick="showSessionDetail('${s.session_id}')" data-session-id="${s.session_id}" data-date-time="${s.date_time}" data-location="${s.location || ''}" data-duration="${s.duration_minutes || 60}" data-course="${s.course_name}" data-status="${s.status}" data-student-count="${s.student_count}">
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

    // Session edit modal (for scheduled sessions)
    html += `
      <div id="edit-session-modal" class="event-modal hidden">
        <div class="modal-overlay" onclick="closeEditSessionModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="ri-edit-2-line"></i> Chỉnh Sửa Buổi Học</h3>
            <button class="modal-close-btn" onclick="closeEditSessionModal()">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời gian</label>
              <input type="datetime-local" id="edit_session_datetime" class="form-input">
            </div>
            <div class="form-group">
              <label><i class="ri-map-pin-line"></i> Địa điểm</label>
              <input type="text" id="edit_session_location" class="form-input" placeholder="Nhập địa điểm (tùy chọn)">
            </div>
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời lượng (phút)</label>
              <input type="number" id="edit_session_duration" class="form-input" min="0" step="1">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeEditSessionModal()">Hủy</button>
            <button class="btn btn-success" onclick="submitEditSession()"><i class="ri-check-line"></i> Lưu</button>
          </div>
        </div>
      </div>
    `;

    setContent(html);

    // No session editing UI (user requested edits only for free slots)

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
          <div class="slot-card" data-slot-id="${slot.id}" data-tutor-id="${tutorId}" data-start="${slot.start}" data-end="${slot.end}">
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
            <div class="slot-actions">
              <button class="btn btn-secondary" onclick="showEditSlotModal(${slot.id})">
                <i class="ri-edit-line"></i> Chỉnh Sửa
              </button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      html += `
        <div class="event-actions">
          <button class="btn btn-success" onclick="showAddSlotModal()">
            <i class="ri-add-line"></i> Thêm Lịch Rảnh
          </button>
          <button class="btn btn-danger" onclick="showDeleteSlotModal()">
            <i class="ri-delete-bin-line"></i> Xóa Lịch Rảnh
          </button>
        </div>
      `;
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
    // Edit slot modal
    html += `
      <div id="edit-slot-modal" class="event-modal hidden">
        <div class="modal-overlay" onclick="closeEditSlotModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="ri-edit-2-line"></i> Chỉnh sửa lịch rảnh</h3>
            <button class="modal-close-btn" onclick="closeEditSlotModal()">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời gian bắt đầu</label>
              <input type="datetime-local" id="edit_slot_start" class="form-input">
            </div>
            <div class="form-group">
              <label><i class="ri-time-line"></i> Thời gian kết thúc</label>
              <input type="datetime-local" id="edit_slot_end" class="form-input">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeEditSlotModal()">Hủy</button>
            <button class="btn btn-success" onclick="submitEditSlot()"><i class="ri-check-line"></i> Lưu</button>
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

// --- Edit Slot Modal Handlers ---
function showEditSlotModal(slotId) {
  const card = document.querySelector(`.slot-card[data-slot-id="${slotId}"]`);
  if (!card) return;
  const tutorId = card.getAttribute('data-tutor-id');
  // find the displayed times inside card
  const startText = card.querySelector('.slot-body .slot-time .time-value')?.innerText || '';
  // To get both start and end we pick the two .time-value elements
  const timeValues = card.querySelectorAll('.slot-body .time-value');
  const startValue = timeValues[0] ? timeValues[0].innerText : '';
  const endValue = timeValues[1] ? timeValues[1].innerText : '';

  // Ideally we should use data attributes with ISO values; try to read attribute 'data-start' and 'data-end' if present
  const dataStart = card.getAttribute('data-start');
  const dataEnd = card.getAttribute('data-end');

  const startIso = dataStart || card.getAttribute('data-start-time') || '';
  const endIso = dataEnd || card.getAttribute('data-end-time') || '';

  // Fallback: if no ISO available, leave empty and user can re-enter
  const modal = document.getElementById('edit-slot-modal');
  if (!modal) return;
  if (startIso) document.getElementById('edit_slot_start').value = isoToLocalInput(startIso);
  else document.getElementById('edit_slot_start').value = '';
  if (endIso) document.getElementById('edit_slot_end').value = isoToLocalInput(endIso);
  else document.getElementById('edit_slot_end').value = '';

  modal.setAttribute('data-edit-slot-id', slotId);
  modal.setAttribute('data-edit-tutor-id', tutorId || '');
  modal.classList.remove('hidden');
}

function closeEditSlotModal() {
  const modal = document.getElementById('edit-slot-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.removeAttribute('data-edit-slot-id');
  modal.removeAttribute('data-edit-tutor-id');
}

async function submitEditSlot() {
  const modal = document.getElementById('edit-slot-modal');
  if (!modal) return;
  const slotId = modal.getAttribute('data-edit-slot-id');
  const tutorId = modal.getAttribute('data-edit-tutor-id');
  if (!slotId || !tutorId) return alert('Không xác định slot hoặc tutor');

  const startLocal = document.getElementById('edit_slot_start').value;
  const endLocal = document.getElementById('edit_slot_end').value;
  if (!startLocal || !endLocal) return alert('Vui lòng nhập thời gian bắt đầu và kết thúc');

  const startIso = localInputToISO(startLocal);
  const endIso = localInputToISO(endLocal);

  try {
    const res = await fetch(`/schedule/${encodeURIComponent(tutorId)}/slot/${encodeURIComponent(slotId)}?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`, {
      method: 'PUT',
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok) {
      alert('Cập nhật thất bại: ' + (json.error || json.message || res.statusText));
      return;
    }
    closeEditSlotModal();
    loadPage('event');
  } catch (err) {
    console.error('Error editing slot:', err);
    alert('Lỗi khi cập nhật lịch rảnh');
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
// ---------- Students ----------
async function loadStudents() {
  try {
    // Fetch current tutor info
    const meRes = await fetch("/auth/me", { credentials: "include" });
    const meJson = await meRes.json();
    const tutorId = meJson.data.user_id;

    // Fetch students
    const dataRes = await fetch(`/api/tutor/students`, { credentials: "include" });
    const dataJson = await dataRes.json();

    let students = [];
    if (dataJson.status === "success" && dataJson.data?.students) {
      students = dataJson.data.students;
    }

    // =============================
    // SEARCH BOX MỚI (ĐÃ FIX ICON)
    // =============================
    let html = `
      <div class="students-header">
        <h2>Danh Sách Học Sinh</h2>
        <p class="students-subtitle">Quản lý và tìm kiếm thông tin học sinh của bạn</p>
      </div>

      <div class="search-section">
        <div class="search-box">
          <i class="ri-search-line search-icon"></i>

          <input 
            type="text" 
            id="student_search_input"
            class="search-input"
            placeholder="Nhập tên hoặc MSSV (ví dụ: N, Nguy, 2021...)"
            onkeyup="filterStudents()"
          />

          <button class="clear-search-btn" id="clear-search-btn" onclick="clearStudentSearch()" style="display:none;">
            <i class="ri-close-circle-line"></i>
          </button>
        </div>

        <div class="search-stats">
          <span>Tổng: <b id="total-student-count">${students.length}</b></span>
          <span>|</span>
          <span>Kết quả: <b id="student-count">${students.length}</b></span>
        </div>
      </div>
    `;

    // =============================
    // STUDENTS LIST
    // =============================
    if (students.length === 0) {
      html += `<div class="card alert alert-info">Hiện chưa có học sinh được phân công.</div>`;
    } else {
      html += `<div class="students-grid" id="students-container">`;

      students.forEach((st, index) => {
        const courses = st.courses ? st.courses.join(", ") : "N/A";

        html += `
          <div class="student-card" 
               data-student-name="${st.name.toLowerCase()}" 
               data-student-id="${st.student_id.toLowerCase()}">

            <div class="student-card-header">
              <div class="student-avatar"><i class="ri-user-3-fill"></i></div>
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
                <span>${st.faculty || "N/A"}</span>
              </div>
              <div class="student-item">
                <i class="ri-mail-line"></i>
                <span>${st.email || "N/A"}</span>
              </div>
            </div>

            <button class="btn btn-info" onclick="showStudentDetail('${st.name}', '${st.student_id}', '${st.email || 'N/A'}', '${st.phone || 'N/A'}', '${st.faculty || 'N/A'}', '${st.department || 'N/A'}', '${courses}')">
              <i class="ri-eye-line"></i> Chi Tiết
            </button>
          </div>
        `;
      });

      html += `</div>`;
    }

    // Render page
    setContent(html);

  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi loadStudents: ${err.message}</div>`);
  }
}


// Filter students by name or ID - Real time search with partial matching
function filterStudents() {
  const searchInput = document.getElementById('student_search_input');
  const clearBtn = document.getElementById('clear-search-btn');
  const searchValue = searchInput.value.toLowerCase().trim();
  const studentCards = document.querySelectorAll('.student-card');
  const studentCountEl = document.getElementById('student-count');
  
  // Show/hide clear button
  if (clearBtn) {
    clearBtn.style.display = searchValue ? 'flex' : 'none';
  }
  
  let visibleCount = 0;
  
  studentCards.forEach(card => {
    const name = card.getAttribute('data-student-name').toLowerCase();
    const id = card.getAttribute('data-student-id').toLowerCase();
    
    // Partial matching for name and ID (không cần nhập đầy đủ)
    const nameMatch = name.includes(searchValue);
    const idMatch = id.includes(searchValue);
    const isEmpty = searchValue === '';
    
    if (isEmpty || nameMatch || idMatch) {
      card.style.display = 'flex';
      card.classList.add('visible');
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.classList.remove('visible');
    }
  });
  
  studentCountEl.textContent = visibleCount;
}

// Clear search input
function clearStudentSearch() {
  const searchInput = document.getElementById('student_search_input');
  const clearBtn = document.getElementById('clear-search-btn');
  searchInput.value = '';
  clearBtn.style.display = 'none';
  filterStudents();
  searchInput.focus();
}

// Show student detail modal with info
function showStudentDetail(name, studentId, email, phone, faculty, department, courses) {
  let modal = document.getElementById('student-detail-modal');
  
  // Create modal if it doesn't exist — use existing CSS class names
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-detail-modal';
    modal.className = 'student-detail-modal hidden';
    document.body.appendChild(modal);
  }

  // Populate modal content using the CSS classes defined in tutor.css
  modal.innerHTML = `
    <div class="detail-modal-content">
      <button class="detail-close-btn" onclick="closeStudentDetail()">
        <i class="ri-close-line"></i>
      </button>

      <div class="detail-header">
        <div class="detail-avatar">
          <i class="ri-user-3-fill"></i>
        </div>
        <h2>${name}</h2>
      </div>

      <div class="detail-info">
        <div class="detail-row">
          <i class="ri-id-card-line"></i>
          <div class="detail-row-text">
            <span class="detail-label">Mã sinh viên</span>
            <span class="detail-value">${studentId}</span>
          </div>
        </div>

        <div class="detail-row">
          <i class="ri-mail-line"></i>
          <div class="detail-row-text">
            <span class="detail-label">Email</span>
            <span class="detail-value">${email}</span>
          </div>
        </div>

        <div class="detail-row">
          <i class="ri-phone-line"></i>
          <div class="detail-row-text">
            <span class="detail-label">Điện thoại</span>
            <span class="detail-value">${phone}</span>
          </div>
        </div>

        <div class="detail-row">
          <i class="ri-building-line"></i>
          <div class="detail-row-text">
            <span class="detail-label">Khoa</span>
            <span class="detail-value">${faculty}</span>
          </div>
        </div>

        <div class="detail-row">
          <i class="ri-organization-chart"></i>
          <div class="detail-row-text">
            <span class="detail-label">Bộ môn</span>
            <span class="detail-value">${department}</span>
          </div>
        </div>

        <div class="detail-row">
          <i class="ri-book-open-line"></i>
          <div class="detail-row-text">
            <span class="detail-label">Môn học</span>
            <span class="detail-value">${courses}</span>
          </div>
        </div>
      </div>

      <div style="padding: 20px; display:flex; justify-content:flex-end; gap:12px;">
        <button class="btn btn-secondary" onclick="closeStudentDetail()">Đóng</button>
      </div>
    </div>
  `;

  // Show modal
  modal.classList.remove('hidden');
}

function closeStudentDetail() {
  const modal = document.getElementById('student-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Close modal when clicking the overlay background
document.addEventListener('click', function(event) {
  const modal = document.getElementById('student-detail-modal');
  if (modal && event.target === modal && !modal.classList.contains('hidden')) {
    closeStudentDetail();
  }
});


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
      <div class="notif-header-section">
        <div class="notif-title-wrapper">
          <h2><i class="ri-notification-3-line"></i> Thông báo</h2>
          <span class="notif-count-badge">${unreadCount}</span>
        </div>
        <p class="notif-subtitle">Bạn có <b>${unreadCount}</b> thông báo chưa đọc</p>
      </div>

      ${unreadCount > 0 ? `
        <button class="btn btn-mark-all" onclick="markAllNotificationsAsRead('${userId}')">
          <i class="ri-check-double-line"></i> Đánh dấu tất cả là đã đọc
        </button>
      ` : ''}

      <div class="notif-list">
    `;

    if (notifications.length === 0) {
      html += `<div class="notif-empty">
        <div class="empty-icon"><i class="ri-inbox-line"></i></div>
        <p class="empty-text">Không có thông báo nào</p>
        <p class="empty-subtext">Bạn đang cập nhật tất cả!</p>
      </div>`;
    } else {
      notifications.forEach((n, index) => {
        // Format timestamp - Add UTC+7 offset for Vietnamese timezone
        const createdDate = new Date(n.created_at);
        const vietnamTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);
        const dateStr = vietnamTime.toLocaleDateString('vi-VN');
        const timeStr = vietnamTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit', hour12: false});
        const formattedTime = `${dateStr} ${timeStr}`;
        
        // Get icon and color based on event type
        let iconClass = 'ri-notification-2-line';
        let accentColor = '#098cbc';
        let eventTypeLabel = '';
        
        if (n.event_type === 'course_request') {
          iconClass = 'ri-user-add-line';
          accentColor = '#098cbc';
          eventTypeLabel = 'Đơn đặt lịch';
        } else if (n.event_type === 'schedule_create' || n.event_type === 'schedule_update' || n.event_type === 'schedule_delete') {
          iconClass = 'ri-calendar-line';
          accentColor = '#2ecc71';
          eventTypeLabel = 'Cập nhật lịch';
        }
        
        // Extract details from related_data
        let details = '';
        let actionButtons = '';
        let statusBadge = '';
        if (n.related_data) {
          if (n.event_type === 'course_request' && n.related_data.student_id) {
            // Booking notification - show course and date
            details = `<div class="notif-details">
              <div class="detail-item">
                <span class="detail-label"><i class="ri-book-open-line"></i> Khóa học:</span>
                <span class="detail-value">${n.related_data.course_name || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"><i class="ri-time-line"></i> Thời gian:</span>
                <span class="detail-value">${n.related_data.date_time || 'N/A'}</span>
              </div>
            </div>`;
            
            // Check if booking title indicates approval/rejection (tutor receives update notifications)
            const hasApprovedInTitle = n.title.includes('chấp nhận') || n.title.includes('được chấp nhận');
            const hasRejectedInTitle = n.title.includes('từ chối') || n.title.includes('bị từ chối');
            
            if (hasApprovedInTitle) {
              statusBadge = `<span class="status-badge status-approved">
                <i class="ri-check-fill"></i> Đã chấp nhận
              </span>`;
            } else if (hasRejectedInTitle) {
              statusBadge = `<span class="status-badge status-rejected">
                <i class="ri-close-fill"></i> Đã từ chối
              </span>`;
            } else {
              // Add approve/reject buttons only for pending bookings (no approval/rejection in title)
              const bookingId = n.related_data.booking_id;
              if (bookingId) {
                actionButtons = `
                  <button class="btn btn-small btn-approve" onclick="approveBooking('${bookingId}')"><i class="ri-check-line"></i> Chấp nhận</button>
                  <button class="btn btn-small btn-reject" onclick="rejectBooking('${bookingId}')"><i class="ri-close-line"></i> Từ chối</button>
                `;
              }
            }
          } else if ((n.event_type === 'schedule_create' || n.event_type === 'schedule_update' || n.event_type === 'schedule_delete') && n.related_data.schedule_info) {
            // Schedule notification
            details = `<div class="notif-details">
              <div class="detail-item">
                <span class="detail-label"><i class="ri-calendar-event-line"></i> Ngày:</span>
                <span class="detail-value">${n.related_data.schedule_info.date || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"><i class="ri-time-line"></i> Giờ:</span>
                <span class="detail-value">${n.related_data.schedule_info.time || 'N/A'}</span>
              </div>
            </div>`;
          }
        }
        
        html += `
          <div class="notif-item ${!n.is_read ? 'notif-unread' : 'notif-read'}">
            <div class="notif-indicator" style="border-left-color: ${accentColor};"></div>
            
            <div class="notif-content">
              <div class="notif-top">
                <div class="notif-icon" style="color: ${accentColor};">
                  <i class="${iconClass}"></i>
                </div>
                <div class="notif-text-main">
                  <h4 class="notif-title">${n.title}</h4>
                  ${eventTypeLabel ? `<span class="notif-type">${eventTypeLabel}</span>` : ''}
                </div>
                <div class="notif-time">${formattedTime}</div>
              </div>

              <p class="notif-message">${n.message}</p>
              ${details}
              ${statusBadge}

              <div class="notif-actions">
                ${actionButtons}
                ${!n.is_read ? `<button class="btn-action btn-mark-read" onclick="markNotificationRead('${n.id}', '${userId}')"><i class="ri-check-line"></i> Đánh dấu đã đọc</button>` : ''}
                <button class="btn-action btn-delete" onclick="deleteNotification('${n.id}', '${userId}')"><i class="ri-delete-bin-line"></i> Xoá</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    setContent(html);
    
    // Update unread count badge
    updateUnreadNotificationCount();

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

async function approveBooking(bookingId) {
  if (!confirm('Bạn có chắc chắn muốn chấp nhận buổi học này?')) return;

  try {
    const res = await fetch(`/api/tutor/bookings/${encodeURIComponent(bookingId)}/approve`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) {
      const data = await res.json();
      alert('Lỗi: ' + (data.message || 'Không thể chấp nhận buổi học'));
      return;
    }

    alert('✅ Đã chấp nhận buổi học');
    loadNotifications(); // Reload to show status instead of buttons
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
}

async function rejectBooking(bookingId) {
  if (!confirm('Bạn có chắc chắn muốn từ chối buổi học này?')) return;

  try {
    const res = await fetch(`/api/tutor/bookings/${encodeURIComponent(bookingId)}/reject`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) {
      const data = await res.json();
      alert('Lỗi: ' + (data.message || 'Không thể từ chối buổi học'));
      return;
    }

    alert('❌ Đã từ chối buổi học');
    loadNotifications(); // Reload to show status instead of buttons
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
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

// Toggle user menu dropdown
function toggleUserMenu() {
  const logoutBox = document.getElementById('logout-box');
  if (logoutBox) {
    const isHidden = logoutBox.style.display === 'none' || logoutBox.style.display === '';
    logoutBox.style.display = isHidden ? 'block' : 'none';
  }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
  const userBox = document.querySelector('.user-box');
  const logoutBox = document.getElementById('logout-box');
  if (logoutBox && userBox && !userBox.contains(event.target) && !logoutBox.contains(event.target)) {
    logoutBox.style.display = 'none';
  }
});

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

// Update unread notification count badge
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
    const unreadCount = data.unread_count || 0;

    const badgeEl = document.getElementById('unread-count');
    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.textContent = unreadCount;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  } catch (err) {
    console.error("Lỗi update unread count:", err);
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
