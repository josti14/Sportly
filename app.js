document.addEventListener('DOMContentLoaded', () => {
  let allCourses = [];
  let savedRegistrations = JSON.parse(localStorage.getItem('my_courses')) || [];

  // DOM Elements
  const courseGrid = document.getElementById('course-grid');
  const resultsCount = document.getElementById('results-count');
  const courseCountBadge = document.getElementById('course-count-badge');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const searchInput = document.getElementById('search-input');
  
  // Modal Elements
  const modal = document.getElementById('course-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  // Drawer Elements
  const drawer = document.getElementById('drawer-backdrop');
  const btnMyCourses = document.getElementById('btn-my-courses');
  const drawerClose = document.getElementById('drawer-close');
  const drawerList = document.getElementById('drawer-list');

  // Fetch Course Data
  fetch('courses.json')
    .then(res => {
      if (!res.ok) return fetch('assets/data/courses.json'); // Fallback path check
      return res;
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load courses');
      return res.json();
    })
    .then(data => {
      allCourses = data;
      renderCourses(allCourses);
      updateEnrollmentBadge();
    })
    .catch(err => {
      console.error(err);
      if (courseGrid) {
        courseGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #EF4444;">Error loading courses. Please refresh.</p>';
      }
    });

  // Render Grid Cards
  function renderCourses(coursesToRender) {
    if (!courseGrid) return;
    courseGrid.innerHTML = '';

    if (resultsCount) {
      resultsCount.innerText = `Showing ${coursesToRender.length} course(s)`;
    }

    if (coursesToRender.length === 0) {
      courseGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No courses match your selected filters.</p>';
      return;
    }

    coursesToRender.forEach(course => {
      const isEnrolled = savedRegistrations.some(r => String(r.courseId) === String(course.id));
      const imageSrc = course.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';

      const card = document.createElement('div');
      card.className = 'course-card';

      card.innerHTML = `
        <img class="card-img" src="${imageSrc}" alt="${course.title}">
        <div class="card-body">
          <div class="card-tags">
            <span class="category-tag">${course.category}</span>
            <span class="level-badge">${course.level}</span>
          </div>
          <h3>${course.title}</h3>
          <p class="card-meta">👤 ${course.instructor}</p>
          <p class="card-meta">📅 ${course.schedule}</p>
          <p class="card-meta">📍 ${course.location}</p>
          <p class="card-meta"><strong>Capacity: ${course.enrolledCount}/${course.maxCapacity}</strong></p>
        </div>
        <div class="card-footer">
          <button class="btn-primary btn-view-details" data-id="${course.id}">
            ${isEnrolled ? 'Enrolled ✓' : 'View Details'}
          </button>
        </div>
      `;

      courseGrid.appendChild(card);
    });

    // Attach Click Event Handlers
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const selectedCourse = allCourses.find(c => String(c.id) === String(id));
        if (selectedCourse) openModal(selectedCourse);
      });
    });
  }

  // Multi-Criteria Course Filtering Engine
  function applyFilters() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const selectedCategories = Array.from(document.querySelectorAll('.filter-category:checked')).map(cb => cb.value);
    const selectedLevels = Array.from(document.querySelectorAll('.filter-level:checked')).map(cb => cb.value);
    const selectedDays = Array.from(document.querySelectorAll('.filter-day:checked')).map(cb => cb.value);
    const hideFullFilter = document.getElementById('filter-hide-full');
    const hideFull = hideFullFilter ? hideFullFilter.checked : false;

    const filtered = allCourses.filter(course => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.category);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level);
      const matchesDay = selectedDays.length === 0 || 
        (course.days && selectedDays.some(d => course.days.includes(d))) || 
        selectedDays.some(d => course.schedule.includes(d));
      const matchesAvailability = !hideFull || (course.enrolledCount < course.maxCapacity);
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery) ||
        course.instructor.toLowerCase().includes(searchQuery) ||
        course.location.toLowerCase().includes(searchQuery);

      return matchesCategory && matchesLevel && matchesDay && matchesAvailability && matchesSearch;
    });

    renderCourses(filtered);
  }

  // Event Listeners for Filters
  document.querySelectorAll('.filter-category, .filter-level, .filter-day, #filter-hide-full').forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      document.querySelectorAll('.filter-category, .filter-level, .filter-day, #filter-hide-full').forEach(cb => cb.checked = false);
      if (searchInput) searchInput.value = '';
      renderCourses(allCourses);
    });
  }

  // Modal Functionality
  function openModal(course) {
    if (!modal || !modalBody) return;

    const isEnrolled = savedRegistrations.some(r => String(r.courseId) === String(course.id));
    const isFull = course.enrolledCount >= course.maxCapacity;
    const imageSrc = course.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';

    modalBody.innerHTML = `
      <img class="modal-header-img" src="${imageSrc}" alt="${course.title}">
      <span class="category-tag">${course.category}</span>
      <span class="level-badge">${course.level}</span>
      <h2 style="margin-top: 0.5rem">${course.title}</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">${course.description}</p>
      
      <p><strong>Instructor:</strong> ${course.instructor}</p>
      <p><strong>Schedule:</strong> ${course.schedule}</p>
      <p><strong>Location:</strong> ${course.location}</p>
      <p><strong>Enrolled:</strong> ${course.enrolledCount} / ${course.maxCapacity}</p>
      
      <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">

      ${isEnrolled ? `
        <div style="background: #DEF7EC; color: #03543F; padding: 1rem; border-radius: 8px; text-align: center; font-weight: 600; margin-bottom: 1rem;">
          You are enrolled in this course! ✓
        </div>
        <button type="button" id="btn-modal-unenroll" class="btn-primary" style="background-color: #DC2626;">Unenroll from Course</button>
      ` : isFull ? `
        <div style="background: #FDE8E8; color: #9B1C1C; padding: 1rem; border-radius: 8px; text-align: center; font-weight: 600;">
          Course is Full
        </div>
      ` : `
        <form id="registration-form">
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <input type="text" id="reg-name" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <input type="email" id="reg-email" placeholder="john.doe@example.com" required>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 1rem;">Confirm Booking</button>
        </form>
      `}
    `;

    // Dynamic Form Submission Handler
    const regForm = document.getElementById('registration-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentName = document.getElementById('reg-name').value.trim();
        const studentEmail = document.getElementById('reg-email').value.trim();

        if (!studentName || !studentEmail) {
          showToast('Please fill in your name and email address.', 'danger');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentEmail)) {
          showToast('Please enter a valid email address.', 'danger');
          return;
        }

        handleEnrollment(course, studentName, studentEmail);
      });
    }

    // Dynamic Unenrollment Handler
    const unenrollBtn = document.getElementById('btn-modal-unenroll');
    if (unenrollBtn) {
      unenrollBtn.addEventListener('click', () => {
        handleUnenrollment(course.id);
      });
    }

    modal.classList.remove('hidden');
  }

  // Handle Enrollment
  function handleEnrollment(course, name, email) {
    const alreadyEnrolled = savedRegistrations.some(r => String(r.courseId) === String(course.id));
    if (alreadyEnrolled) return;

    course.enrolledCount++;

    const registration = {
      registrationId: 'reg-' + Date.now(),
      courseId: String(course.id),
      courseTitle: course.title,
      userName: name || 'Participant',
      userEmail: email || '',
      registeredAt: new Date().toISOString()
    };

    savedRegistrations.push(registration);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    updateEnrollmentBadge();
    applyFilters();
    openModal(course);
    showToast(`Successfully enrolled in ${course.title}! 🎉`, 'success');
  }

  // Handle Unenrollment
  function handleUnenrollment(courseId) {
    const targetId = String(courseId);

    savedRegistrations = savedRegistrations.filter(r => String(r.courseId) !== targetId);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    const targetCourse = allCourses.find(c => String(c.id) === targetId);
    if (targetCourse && targetCourse.enrolledCount > 0) {
      targetCourse.enrolledCount--;
    }

    updateEnrollmentBadge();
    renderDrawerItems();
    applyFilters();

    if (targetCourse) {
      openModal(targetCourse);
      showToast(`Unenrolled from ${targetCourse.title}.`, 'danger');
    } else if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Render My Courses Drawer
  function renderDrawerItems() {
    if (!drawerList) return;
    drawerList.innerHTML = '';

    if (!savedRegistrations || savedRegistrations.length === 0) {
      drawerList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">You have not enrolled in any courses yet.</p>';
      return;
    }

    savedRegistrations.forEach(reg => {
      const item = document.createElement('div');
      item.className = 'drawer-item';

      const formattedDate = reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      }) : 'Active';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <h4 style="font-size: 1rem; color: var(--text-charcoal); margin: 0;">${reg.courseTitle}</h4>
          <span style="font-size: 0.75rem; background: #E0E7FF; color: var(--primary-blue); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">Enrolled</span>
        </div>
        ${reg.userName ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Name:</strong> ${reg.userName}</p>` : ''}
        ${reg.userEmail ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Email:</strong> ${reg.userEmail}</p>` : ''}
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">Enrolled on: ${formattedDate}</p>
        
        <button type="button" class="btn-unenroll-drawer" data-course-id="${reg.courseId}" style="background: none; border: none; color: #DC2626; margin-top: 0.8rem; font-weight: 600; cursor: pointer; padding: 0;">
          ✕ Unenroll from Course
        </button>
      `;
      drawerList.appendChild(item);
    });

    drawerList.querySelectorAll('.btn-unenroll-drawer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const courseId = btn.getAttribute('data-course-id');
        if (courseId) handleUnenrollment(courseId);
      });
    });
  }

  function updateEnrollmentBadge() {
    if (courseCountBadge) {
      courseCountBadge.innerText = savedRegistrations.length;
    }
  }

  // Modal & Drawer Listeners
  if (modalClose) modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  if (btnMyCourses) {
    btnMyCourses.addEventListener('click', () => {
      renderDrawerItems();
      if (drawer) drawer.classList.remove('hidden');
    });
  }
  if (drawerClose) drawerClose.addEventListener('click', () => drawer.classList.add('hidden'));

  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  if (drawer) drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.classList.add('hidden'); });

  // Keyboard Shortcuts (ESC Key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
      if (drawer && !drawer.classList.contains('hidden')) drawer.classList.add('hidden');
    }
  });

  // Toast Notification System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});