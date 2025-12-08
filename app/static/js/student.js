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
    case "calendar": loadCalendar(); break;
    case "document": loadDocument(); break;
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
          <button class="btn btn-secondary" onclick="clearSearch()" style="display: none;" id="clear-search-btn">
            <i class="ri-close-line"></i> Xóa Tìm Kiếm
          </button>
        </div>
        <div id="search-results"></div>
      </div>
    `;

    if (!data.data || !data.data.tutors || data.data.tutors.length === 0) {
      html += `<div class="card alert alert-info">Bạn chưa có gia sư nào</div>`;
    } else {
      html += `<h3 style="margin-top: 30px; margin-bottom: 20px;" id="tutors-list-title">Danh Sách Gia Sư</h3>`;
      html += `<div class="tutors-list" id="tutors-list">`;
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
            <button class="btn btn-info" 
                    onclick="viewTutorDetail('${escapeHtml(tutor.tutor_id)}')">
              <i class="ri-eye-line"></i> Xem Chi Tiết
            </button>
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
    const tutorsList = document.getElementById('tutors-list');
    const tutorsListTitle = document.getElementById('tutors-list-title');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (!res.ok) {
      resultsDiv.innerHTML = `<div class="card alert alert-warning">
        Không tìm thấy gia sư cho môn học này
      </div>`;
      // Hide original list
      if (tutorsList) tutorsList.style.display = 'none';
      if (tutorsListTitle) tutorsListTitle.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'inline-block';
      return;
    }

    const data = await res.json();
    
    if (!data.data || !data.data.tutors || data.data.tutors.length === 0) {
      resultsDiv.innerHTML = `<div class="card alert alert-warning">
        Không có gia sư nào dạy môn ${escapeHtml(courseName)}
      </div>`;
      // Hide original list
      if (tutorsList) tutorsList.style.display = 'none';
      if (tutorsListTitle) tutorsListTitle.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'inline-block';
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
                  onclick="window.previousPage='search'; viewTutorDetail('${escapeHtml(tutor.tutor_id)}')">
            <i class="ri-eye-line"></i> Xem Chi Tiết
          </button>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
    
    // Hide original list when search results are shown
    if (tutorsList) tutorsList.style.display = 'none';
    if (tutorsListTitle) tutorsListTitle.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-block';
  } catch (err) {
    console.error(err);
    document.getElementById('search-results').innerHTML = 
      `<div class="card alert alert-danger">Lỗi: ${err.message}</div>`;
  }
}

// Clear search and show original list
function clearSearch() {
  const searchInput = document.getElementById('search_course');
  const resultsDiv = document.getElementById('search-results');
  const tutorsList = document.getElementById('tutors-list');
  const tutorsListTitle = document.getElementById('tutors-list-title');
  const clearBtn = document.getElementById('clear-search-btn');
  
  // Clear search input
  searchInput.value = '';
  
  // Clear search results
  resultsDiv.innerHTML = '';
  
  // Show original list
  if (tutorsList) tutorsList.style.display = 'grid';
  if (tutorsListTitle) tutorsListTitle.style.display = 'block';
  if (clearBtn) clearBtn.style.display = 'none';
  
  // Reset previous page tracking
  window.previousPage = null;
}

// Back button handler for tutor detail view
function goBackFromTutorDetail() {
  // Check if user came from search results or original list
  if (window.previousPage === 'search') {
    // Show search results again
    const searchInput = document.getElementById('search_course');
    const resultsDiv = document.getElementById('search-results');
    const tutorsList = document.getElementById('tutors-list');
    const tutorsListTitle = document.getElementById('tutors-list-title');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (tutorsList) tutorsList.style.display = 'none';
    if (tutorsListTitle) tutorsListTitle.style.display = 'none';
    if (resultsDiv) resultsDiv.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    // Switch back to main content area showing search results
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent.innerHTML.includes('search-results')) {
      // Already in the right state
    }
  } else {
    // Go back to original My Tutors list
    loadMyTutors();
  }
  
  // Clear tracking
  window.previousPage = null;
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
        <button class="btn btn-secondary" onclick="goBackFromTutorDetail()" style="margin-bottom: 10px;">
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

// Helper function for booking - show confirmation modal
async function bookSlot(tutorId, slotId) {
  try {
    // Get current user and tutor details
    const meRes = await fetch('/auth/me', { credentials: 'include' });
    if (!meRes.ok) {
      alert('Bạn chưa đăng nhập');
      return;
    }
    const meJson = await meRes.json();
    const studentId = meJson.data.user_id;

    // Get tutor details to find session
    const tutorRes = await fetch(
      `/api/student/tutors/${encodeURIComponent(tutorId)}`,
      { credentials: 'include' }
    );
    if (!tutorRes.ok) {
      alert('Không tìm thấy thông tin gia sư');
      return;
    }
    const tutorData = await tutorRes.json();
    const tutor = tutorData.data;
    
    // Find the slot in available_slots
    const slot = tutor.available_slots.find(s => s.id == slotId);
    if (!slot) {
      alert('Không tìm thấy lịch học này');
      return;
    }

    // Store booking info globally for confirmation
    window.pendingBooking = {
      session_id: `TS${slot.id}`,
      tutor_id: tutorId,
      course_name: tutor.teaching_courses[0] || 'Unknown',
      tutor_name: tutor.tutor_name,
      date_time: slot.start,
      slot_info: slot
    };

    // Show confirmation modal
    const modalBody = document.getElementById('modal-body');
    const slotDate = new Date(slot.start);
    modalBody.innerHTML = `
      <p><b>Gia sư:</b> ${escapeHtml(tutor.tutor_name)}</p>
      <p><b>Môn học:</b> ${escapeHtml(tutor.teaching_courses[0] || 'N/A')}</p>
      <p><b>Thời gian:</b> ${slotDate.toLocaleString('vi-VN')}</p>
      <p><b>Chuyên ngành:</b> ${escapeHtml(tutor.specialization)}</p>
      <p><b>Đánh giá:</b> ⭐ ${tutor.rating || 0}</p>
      <hr>
      <p style="color: #666; font-size: 14px;">Bạn có chắc chắn muốn đăng ký buổi học này?</p>
    `;

    const modal = document.getElementById('booking-modal');
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Booking error:', err);
    alert('Lỗi chuẩn bị đặt lịch: ' + err.message);
  }
}

// Confirm booking and send request
async function confirmBooking() {
  const booking = window.pendingBooking;
  if (!booking) {
    alert('Không có thông tin đặt lịch');
    return;
  }

  try {
    const bookingRes = await fetch('/api/student/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tutor_id: booking.tutor_id,
        course_name: booking.course_name,
        slot_start: booking.date_time,
        slot_end: booking.slot_info.end
      })
    });

    const bookingJson = await bookingRes.json();

    if (!bookingRes.ok) {
      alert('Lỗi: ' + bookingJson.message);
      return;
    }

    // Close modal and show success message
    closeBookingModal();
    alert('✅ Đặt lịch thành công! Bạn có thể xem chi tiết trong Calendar.');
    console.log('Booking confirmed:', bookingJson.data);
    
    // Reload My Tutors to refresh
    loadMyTutors();
  } catch (err) {
    console.error('Confirmation error:', err);
    alert('Lỗi xác nhận đặt lịch: ' + err.message);
  }
}

// Close booking modal
function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  modal.style.display = 'none';
  window.pendingBooking = null;
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

// Cancel booking function
async function cancelBooking(bookingId) {
  if (!confirm('Bạn có chắc chắn muốn hủy buổi học này?')) {
    return;
  }

  try {
    const res = await fetch(`/api/student/sessions/cancel/${encodeURIComponent(bookingId)}`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) {
      const data = await res.json();
      alert('Lỗi: ' + (data.message || 'Không thể hủy buổi học'));
      return;
    }

    alert('✅ Đã hủy buổi học');
    loadCalendar(); // Reload calendar
  } catch (err) {
    console.error(err);
    alert('Lỗi: ' + err.message);
  }
}

// ---------- CALENDAR ----------
async function loadCalendar() {
  try {
    const res = await fetch('/api/student/sessions/my-bookings', {
      credentials: 'include'
    });

    if (!res.ok) {
      setContent(`<div class="card alert alert-danger">Lỗi lấy danh sách buổi học (mã ${res.status})</div>`);
      return;
    }

    const data = await res.json();
    let html = `
      <h2><i class="ri-calendar-check-line"></i> Lịch Học Của Tôi</h2>
    `;

    if (!data.data || !data.data.bookings || data.data.bookings.length === 0) {
      html += `<div class="card alert alert-info">
        <i class="ri-information-line"></i> Bạn chưa đăng ký buổi học nào
      </div>`;
    } else {
      html += `<div class="bookings-list">`;
      
      // Sort bookings by date and filter out cancelled/rejected
      const bookings = data.data.bookings
        .filter(b => b.status !== 'cancelled' && b.status !== 'rejected')
        .sort((a, b) => 
          new Date(a.date_time) - new Date(b.date_time)
        );
      
      if (bookings.length === 0) {
        html += `<div class="card alert alert-info">
          <i class="ri-information-line"></i> Bạn chưa có buổi học nào (chỉ hiển thị confirmed/pending)
        </div>`;
      } else {
        bookings.forEach(booking => {
          const bookingDate = new Date(booking.date_time);
          const status = booking.status === 'confirmed' ? '✅ Xác nhận' : '⏳ ' + booking.status;
          const isUpcoming = bookingDate > new Date();
          const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
          
          html += `
            <div class="booking-card card ${isUpcoming ? 'upcoming' : 'past'}">
              <div class="booking-info">
                <div>
                  <h3><i class="ri-user-3-fill"></i> ${escapeHtml(booking.tutor_name)}</h3>
                  <p><b>Môn học:</b> ${escapeHtml(booking.course_name)}</p>
                  <p><b>Thời gian:</b> <i class="ri-calendar-line"></i> ${bookingDate.toLocaleString('vi-VN')}</p>
                  <p><b>Mã đặt:</b> ${booking.booking_id}</p>
                  <p><b>Trạng thái:</b> ${status}</p>
                  ${isUpcoming ? `<p style="color: #ff6b6b; font-weight: bold;"><i class="ri-alarm-line"></i> Sắp tới</p>` : ''}
                </div>
                <div style="margin-top: 10px;">
                  ${canCancel ? `<button class="btn btn-small btn-danger" 
                          onclick="cancelBooking('${booking.booking_id}')">
                    <i class="ri-close-line"></i> Hủy
                  </button>` : ''}
                </div>
              </div>
            </div>
          `;
        });
      }
      html += `</div>`;
    }

    setContent(html);
  } catch (err) {
    console.error(err);
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
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
    const unreadCount = data.data ? data.data.filter(n => !n.is_read).length : 0;

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

    if (!data.data || data.data.length === 0) {
      html += `<div class="notif-empty">
        <div class="empty-icon"><i class="ri-inbox-line"></i></div>
        <p class="empty-text">Không có thông báo nào</p>
        <p class="empty-subtext">Bạn đang cập nhật tất cả!</p>
      </div>`;
    } else {
      data.data.forEach(notif => {
        // Format timestamp - Add UTC+7 offset for Vietnamese timezone
        const createdDate = new Date(notif.created_at);
        const vietnamTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);
        const dateStr = vietnamTime.toLocaleDateString('vi-VN');
        const timeStr = vietnamTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit', hour12: false});
        const formattedTime = `${dateStr} ${timeStr}`;
        
        // Get icon and color based on event type
        let iconClass = 'ri-notification-2-line';
        let accentColor = '#667eea';
        let eventTypeLabel = '';
        
        if (notif.event_type === 'course_request') {
          iconClass = 'ri-user-add-line';
          accentColor = '#667eea';
          eventTypeLabel = 'Đơn đặt lịch';
        } else if (notif.event_type === 'schedule_create' || notif.event_type === 'schedule_update' || notif.event_type === 'schedule_delete') {
          iconClass = 'ri-calendar-line';
          accentColor = '#2ecc71';
          eventTypeLabel = 'Cập nhật lịch';
        }
        
        // Extract details from related_data
        let details = '';
        let statusBadge = '';
        if (notif.related_data) {
          if (notif.event_type === 'course_request' && notif.related_data.student_id) {
            // Booking notification - show course, tutor name, date with approval status
            const tutorName = notif.related_data.tutor_name || 'N/A';
            const courseName = notif.related_data.course_name || 'N/A';
            const dateTime = notif.related_data.date_time || 'N/A';
            
            details = `<div class="notif-details">
              <div class="detail-item">
                <span class="detail-label"><i class="ri-user-line"></i> Giảng viên:</span>
                <span class="detail-value">${tutorName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"><i class="ri-book-open-line"></i> Khóa học:</span>
                <span class="detail-value">${courseName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"><i class="ri-time-line"></i> Thời gian:</span>
                <span class="detail-value">${dateTime}</span>
              </div>
            </div>`;
            
            // Check if booking has approval/rejection status
            const hasApprovedInTitle = notif.title.includes('chấp nhận') || notif.title.includes('được chấp nhận');
            const hasRejectedInTitle = notif.title.includes('từ chối') || notif.title.includes('bị từ chối');
            
            if (hasApprovedInTitle) {
              statusBadge = `<span class="status-badge status-approved">
                <i class="ri-check-fill"></i> Đã chấp nhận
              </span>`;
            } else if (hasRejectedInTitle) {
              statusBadge = `<span class="status-badge status-rejected">
                <i class="ri-close-fill"></i> Đã từ chối
              </span>`;
            }
          } else if ((notif.event_type === 'schedule_create' || notif.event_type === 'schedule_update' || notif.event_type === 'schedule_delete') && notif.related_data.schedule_info) {
            // Schedule notification
            details = `<div class="notif-details">
              <div class="detail-item">
                <span class="detail-label"><i class="ri-calendar-event-line"></i> Ngày:</span>
                <span class="detail-value">${notif.related_data.schedule_info.date || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"><i class="ri-time-line"></i> Giờ:</span>
                <span class="detail-value">${notif.related_data.schedule_info.time || 'N/A'}</span>
              </div>
            </div>`;
          }
        }
        
        html += `
          <div class="notif-item ${!notif.is_read ? 'notif-unread' : 'notif-read'}">
            <div class="notif-indicator" style="border-left-color: ${accentColor};"></div>
            
            <div class="notif-content">
              <div class="notif-top">
                <div class="notif-icon" style="color: ${accentColor};">
                  <i class="${iconClass}"></i>
                </div>
                <div class="notif-text-main">
                  <h4 class="notif-title">${escapeHtml(notif.title)}</h4>
                  ${eventTypeLabel ? `<span class="notif-type">${eventTypeLabel}</span>` : ''}
                </div>
                <div class="notif-time">${formattedTime}</div>
              </div>

              <p class="notif-message">${escapeHtml(notif.message)}</p>
              ${details}
              ${statusBadge}

              <div class="notif-actions">
                ${!notif.is_read ? `<button class="btn-action btn-mark-read" onclick="markNotificationAsRead('${notif.id}')"><i class="ri-check-line"></i> Đánh dấu đã đọc</button>` : ''}
                <button class="btn-action btn-delete" onclick="deleteNotification('${notif.id}')"><i class="ri-delete-bin-line"></i> Xoá</button>
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
    setContent(`<div class="card alert alert-danger">Lỗi: ${err.message}</div>`);
  }
}

// Mark notification as read
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

// Delete notification
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

// Mark all notifications as read
async function markAllNotificationsAsRead(userId) {
  await fetch(`/notification/user/${userId}/read-all`, {
    method: "PUT",
    credentials: "include"
  });

  loadNotifications();
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
// Helper function to escape HTML
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


