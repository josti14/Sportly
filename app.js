document.addEventListener('DOMContentLoaded', () => {
  let allCourses = [];
  let savedRegistrations = JSON.parse(localStorage.getItem('my_courses')) || [];

  // DOM Elements
  const courseGrid = document.getElementById('course-grid');
  const resultsCount = document.getElementById('results-count');
  const courseCountBadge = document.getElementById('course-count-badge');
  const categoryFilters = document.querySelectorAll('.filter-category');
  const levelFilters = document.querySelectorAll('.filter-level');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const searchInput = document.getElementById('search-input');
  const dayFilters = document.querySelectorAll('.filter-day');
  const hideFullFilter = document.getElementById('filter-hide-full');
  
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
  fetch('assets/data/courses.json?v=' + Date.now())
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
      courseGrid.innerHTML = '<p>Error loading courses. Please refresh.</p>';
    });

  // Render Grid Cards
  function renderCourses(coursesToRender) {
    courseGrid.innerHTML = '';
    if (resultsCount) {
      resultsCount.innerText = `Showing ${coursesToRender.length} course(s)`;
    }

    if (coursesToRender.length === 0) {
      courseGrid.innerHTML = '<p>No courses match your selected filters.</p>';
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

    // Attach Click Events to Buttons
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const selectedCourse = allCourses.find(c => String(c.id) === String(id));
        if (selectedCourse) openModal(selectedCourse);
      });
    });
  }

// Multi-Criteria Course Filtering Engine
  function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Query active checkboxes dynamically
    const categoryFilters = document.querySelectorAll('.filter-category');
    const levelFilters = document.querySelectorAll('.filter-level');
    const dayFilters = document.querySelectorAll('.filter-day');
    const hideFullFilter = document.getElementById('filter-hide-full');

    const selectedCategories = Array.from(categoryFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const selectedLevels = Array.from(levelFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const selectedDays = Array.from(dayFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const hideFull = hideFullFilter ? hideFullFilter.checked : false;

    const filtered = allCourses.filter(course => {
      // 1. Category Filter
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.category);

      // 2. Skill Level Filter
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level);

      // 3. Training Days Filter
      const matchesDay = selectedDays.length === 0 || 
        (course.days && selectedDays.some(d => course.days.includes(d))) || 
        selectedDays.some(d => course.schedule.includes(d));

      // 4. Availability Filter
      const matchesAvailability = !hideFull || (course.enrolledCount < course.maxCapacity);

      // 5. Text Search Filter
      const matchesSearch = 
        course.title.toLowerCase().includes(searchQuery) ||
        course.instructor.toLowerCase().includes(searchQuery) ||
        course.location.toLowerCase().includes(searchQuery);

      return matchesCategory && matchesLevel && matchesDay && matchesAvailability && matchesSearch;
    });

    renderCourses(filtered);
  }

  // Attach Event Listeners to Sidebar Elements
  document.querySelectorAll('.filter-category, .filter-level, .filter-day').forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });

  const hideFullCheckbox = document.getElementById('filter-hide-full');
  if (hideFullCheckbox) {
    hideFullCheckbox.addEventListener('change', applyFilters);
  }

  const searchBox = document.getElementById('search-input');
  if (searchBox) {
    searchBox.addEventListener('input', applyFilters);
  }

  // Reset All Filters Button
  const btnReset = document.getElementById('btn-reset-filters');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.querySelectorAll('.filter-category, .filter-level, .filter-day').forEach(cb => cb.checked = false);
      if (hideFullCheckbox) hideFullCheckbox.checked = false;
      if (searchBox) searchBox.value = '';
      renderCourses(allCourses);
    });
  }
// Event Listeners for Filters
  categoryFilters.forEach(cb => cb.addEventListener('change', applyFilters));
  levelFilters.forEach(cb => cb.addEventListener('change', applyFilters));
  dayFilters.forEach(cb => cb.addEventListener('change', applyFilters));
  if (hideFullFilter) hideFullFilter.addEventListener('change', applyFilters);
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      categoryFilters.forEach(cb => cb.checked = false);
      levelFilters.forEach(cb => cb.checked = false);
      dayFilters.forEach(cb => cb.checked = false);
      if (hideFullFilter) hideFullFilter.checked = false;
      if (searchInput) searchInput.value = '';
      renderCourses(allCourses);
    });
  }

  // Modal Functionality
  function openModal(course) {
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
        <button type="submit" class="btn btn-primary">Confirm Booking</button>
      </form>
      `}
    `;

    modal.classList.remove('hidden');

// Input Validation Rules (Open to All Users)
        if (!studentName || !studentEmail) {
          showToast('Please fill in your name and email address.', 'danger');
          return;
        }

        // Standard email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentEmail)) {
          showToast('Please enter a valid email address.', 'danger');
          return;
        }

        handleEnrollment(course, studentName, studentEmail);
        showToast(`Successfully enrolled in ${course.title}! 🎉`, 'success');
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
      userName: name || 'Student',
      userEmail: email || '',
      registeredAt: new Date().toISOString()
    };

    savedRegistrations.push(registration);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    updateEnrollmentBadge();
    applyFilters();
    openModal(course);
  }

  // Render My Courses Drawer
  function renderDrawerItems() {
    drawerList.innerHTML = '';

    if (!savedRegistrations || savedRegistrations.length === 0) {
      drawerList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">You have not enrolled in any courses yet.</p>';
      return;
    }

    savedRegistrations.forEach(reg => {
      const item = document.createElement('div');
      item.className = 'drawer-item';

      const formattedDate = reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'Active';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <h4 style="font-size: 1rem; color: var(--text-charcoal); margin: 0;">${reg.courseTitle}</h4>
          <span style="font-size: 0.75rem; background: #E0E7FF; color: var(--primary-blue); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">Enrolled</span>
        </div>
        ${reg.userName ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Student:</strong> ${reg.userName}</p>` : ''}
        ${reg.userEmail ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Email:</strong> ${reg.userEmail}</p>` : ''}
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">Enrolled on: ${formattedDate}</p>
        
        <button type="button" class="btn-unenroll-drawer" data-course-id="${reg.courseId}" style="background: none; border: none; color: #DC2626; margin-top: 0.8rem; font-weight: 600; cursor: pointer; padding: 0;">
          ✕ Unenroll from Course
        </button>
      `;
      drawerList.appendChild(item);
    });

    document.querySelectorAll('.btn-unenroll-drawer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const courseId = btn.getAttribute('data-course-id');
        if (courseId) handleUnenrollment(courseId);
      });
    });
  }

  // Handle Unenrollment
  function handleUnenrollment(courseId) {
    const targetId = String(courseId);

    // 1. Remove from savedRegistrations array
    savedRegistrations = savedRegistrations.filter(r => String(r.courseId) !== targetId);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    // 2. Decrement local course count safely
    const targetCourse1 = allCourses.find(c => String(c.id) === targetId);
    if (targetCourse && targetCourse.enrolledCount > 0) {
      targetCourse.enrolledCount--;
    }

    // 3. Immediately re-render all UI elements
    updateEnrollmentBadge();
    renderDrawerItems();
    applyFilters();

    // 4. Close modal if open
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
    const targetCourse = allCourses.find(c => String(c.id) === targetId);
  if (targetCourse) {
    showToast(`Unenrolled from ${targetCourse.title}.`, 'danger');
  }
  }

  function updateEnrollmentBadge() {
    if (courseCountBadge) {
      courseCountBadge.innerText = savedRegistrations.length;
    }
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (btnMyCourses) {
    btnMyCourses.addEventListener('click', () => {
      renderDrawerItems();
      drawer.classList.remove('hidden');
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', () => drawer.classList.add('hidden'));
  }
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

  // Inside your modal form submit handler:
  const form = document.getElementById('enrollment-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentName = document.getElementById('student-name').value.trim();
      const studentEmail = document.getElementById('student-email').value.trim();

      // Input Validation Rules (Open to All Users)
      if (!studentName || !studentEmail) {
        showToast('Please fill in your name and email address.', 'danger');
        return;
      }

      // Standard email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail)) {
        showToast('Please enter a valid email address.', 'danger');
        return;
      }

      handleEnrollment(course, studentName, studentEmail);
      showToast(`Successfully enrolled in ${course.title}! 🎉`, 'success');
    });
  }

});