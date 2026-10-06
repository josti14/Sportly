document.addEventListener('DOMContentLoaded', () => {
  const courseGrid = document.getElementById('course-grid');
  const courseCountElement = document.getElementById('course-count');

  let savedRegistrations = JSON.parse(localStorage.getItem('my_courses')) || [];
  updateEnrollmentBadge();

  // Cache-busting parameter added to force fresh fetch
  fetch('assets/data/courses.json?v=' + Date.now())
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load courses.');
      }
      return response.json();
    })
    .then(courses => {
      renderCourses(courses);
    })
    .catch(error => {
      console.error('Error loading courses:', error);
      courseGrid.innerHTML = '<p>Unable to load courses at this time.</p>';
    });

  function renderCourses(courses) {
    courseGrid.innerHTML = '';

    courses.forEach(course => {
      const isEnrolled = savedRegistrations.some(reg => reg.courseId === course.id);
      const isFull = course.enrolledCount >= course.maxCapacity;

      const card = document.createElement('div');
      card.className = 'course-card';

      card.innerHTML = `
        <div class="card-header">
          <span class="category-tag">${course.category}</span>
          <span class="level-badge">${course.level}</span>
        </div>
        <h3>${course.title}</h3>
        <p class="instructor">Instructor: <strong>${course.instructor}</strong></p>
        <p class="schedule">📅 ${course.schedule}</p>
        <p class="location">📍 ${course.location}</p>
        <div class="spots-info">
          <span>Capacity: ${course.enrolledCount}/${course.maxCapacity}</span>
        </div>
        <button 
          class="btn-register" 
          data-id="${course.id}" 
          ${isEnrolled || isFull ? 'disabled' : ''}>
          ${isEnrolled ? 'Enrolled ✓' : isFull ? 'Course Full' : 'Register Now'}
        </button>
      `;

      courseGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-register').forEach(button => {
      button.addEventListener('click', (e) => {
        const courseId = e.target.getAttribute('data-id');
        const selectedCourse = courses.find(c => c.id === courseId);
        if (selectedCourse) {
          handleRegistration(selectedCourse, e.target);
        }
      });
    });
  }

  function handleRegistration(course, buttonElement) {
    course.enrolledCount++;
    
    const newRegistration = {
      courseId: course.id,
      courseTitle: course.title,
      registeredAt: new Date().toISOString()
    };

    savedRegistrations.push(newRegistration);
    localStorage.setItem('my_courses', JSON.stringify(savedRegistrations));

    buttonElement.innerText = 'Enrolled ✓';
    buttonElement.disabled = true;
    updateEnrollmentBadge();
  }

  function updateEnrollmentBadge() {
    if (courseCountElement) {
      courseCountElement.innerText = `Enrolled: ${savedRegistrations.length}`;
    }
  }
});