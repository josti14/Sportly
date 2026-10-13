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
    resultsCount.innerText = `Showing ${coursesToRender.length} course(s)`;

    if (coursesToRender.length === 0) {
      courseGrid.innerHTML = '<p>No courses match your selected filters.</p>';
      return;
    }

    coursesToRender.forEach(course => {
      const isEnrolled = savedRegistrations.some(r => r.courseId === course.id);
      const isFull = course.enrolledCount >= course.maxCapacity;

      const card = document.createElement('div');
      card.className = 'course-card';

      // Fallback placeholder image if assets image isn't available
      const imageSrc = course.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';

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

    // Attach Click Events to "View Details" Buttons
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const selectedCourse = allCourses.find(c => c.id === id);
        if (selectedCourse) openModal(selectedCourse);
      });
    });
  }

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  
  // Filtering Logic (Categories + Levels + Search Query)
  function applyFilters() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const selectedCategories = Array.from(categoryFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const selectedLevels = Array.from(levelFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const filtered = allCourses.filter(course => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.category);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level);
      
      const matchesSearch = 
        course.title.toLowerCase().includes(searchQuery) ||
        course.instructor.toLowerCase().includes(searchQuery) ||
        course.location.toLowerCase().includes(searchQuery);

      return matchesCategory && matchesLevel && matchesSearch;
    });

    renderCourses(filtered);
  }

  // Event Listeners for Live Search and Reset
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  btnResetFilters.addEventListener('click', () => {
    categoryFilters.forEach(cb => cb.checked = false);
    levelFilters.forEach(cb => cb.checked = false);
    if (searchInput) searchInput.value = '';
    renderCourses(allCourses);
  });

  // Modal Functionality
  function openModal(course) {
    const isEnrolled = savedRegistrations.some(r => r.courseId === course.id);
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
        <div style="background: #DEF7EC; color: #03543F; padding: 1rem; border-radius: 8px; text-align: center; font-weight: 600;">
          You are enrolled in this course! ✓
        </div>
      ` : isFull ? `
        <div style="background: #FDE8E8; color: #9B1C1C; padding: 1rem; border-radius: 8px; text-align: center; font-weight: 600;">
          Course is Full
        </div>
      ` : `
        <form id="enrollment-form">
          <h3>Ready to join the team?</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Enter your student details to secure your spot.</p>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="student-name" required placeholder="e.g. Jakub Joštiak">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="student-email" required placeholder="student@fontys.nl">
          </div>
          <div class="form-group">
            <label>Student ID</label>
            <input type="text" id="student-id" required placeholder="481234">
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 0.5rem">Confirm Registration →</button>
        </form>
      `}
    `;

    modal.classList.remove('hidden');

    const form = document.getElementById('enrollment-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentName = document.getElementById('student-name').value;
        const studentEmail = document.getElementById('student-email').value;
        
        handleEnrollment(course, studentName, studentEmail);
      });
    }
  }

  function handleEnrollment(course, name, email) {
    course.enrolledCount++;
    const registration = {
      registrationId: 'reg-' + Date.now(),
      courseId: course.id,
      courseTitle: course.title,
      userName: name,
      userEmail: email,
      registeredAt: new Date().toISOString()
    };

    savedRegistrations.push(registration);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    updateEnrollmentBadge();
    openModal(course); // Refresh modal view
    applyFilters(); // Refresh card grid view
  }
  function handleUnenrollment(registrationId, courseId) {
    // 1. Remove from local storage array
    savedRegistrations = savedRegistrations.filter(r => r.registrationId !== registrationId);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    // 2. Decrement enrolled count on target course object
    const targetCourse = allCourses.find(c => c.id === courseId);
    if (targetCourse && targetCourse.enrolledCount > 0) {
      targetCourse.enrolledCount--;
    }

    // 3. Update UI states
    updateEnrollmentBadge();
    renderDrawerItems();
    applyFilters();
  }

  modalClose.addEventListener('click', () => modal.classList.add('hidden'));

  // Drawer Functionality
  btnMyCourses.addEventListener('click', () => {
    renderDrawerItems();
    drawer.classList.remove('hidden');
  });
  drawerClose.addEventListener('click', () => drawer.classList.add('hidden'));
  // Enhanced Drawer Functionality with Unenroll Feature
  function renderDrawerItems() {
    drawerList.innerHTML = '';

    if (savedRegistrations.length === 0) {
      drawerList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">You have not enrolled in any courses yet.</p>';
      return;
    }

    savedRegistrations.forEach(reg => {
      const item = document.createElement('div');
      item.className = 'drawer-item';
      
      const formattedDate = new Date(reg.registeredAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <h4 style="font-size: 1rem; color: var(--text-charcoal); margin: 0;">${reg.courseTitle}</h4>
          <span style="font-size: 0.75rem; background: #E0E7FF; color: var(--primary-blue); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">Enrolled</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Student:</strong> ${reg.userName}</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;"><strong>Email:</strong> ${reg.userEmail}</p>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">Enrolled on: ${formattedDate}</p>
        
        <button class="btn-text btn-unenroll" data-reg-id="${reg.registrationId}" data-course-id="${reg.courseId}" style="color: #DC2626; margin-top: 0.8rem; font-weight: 600;">
          ✕ Unenroll from Course
        </button>
      `;
      drawerList.appendChild(item);
    });

    // Attach Click Events for Unenroll Buttons
    document.querySelectorAll('.btn-unenroll').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const regId = e.target.getAttribute('data-reg-id');
        const courseId = e.target.getAttribute('data-course-id');
        handleUnenrollment(regId, courseId);
      });
    });
  }

  function updateEnrollmentBadge() {
    courseCountBadge.innerText = savedRegistrations.length;
  }
});