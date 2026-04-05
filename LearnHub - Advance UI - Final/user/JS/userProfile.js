window.onload = function () {
    initTheme();

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentUserId = localStorage.getItem("currentUserId");

    if (!isLoggedIn || !currentUserId) {
        window.location.replace("../HTML/login.html");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.id === currentUserId);

    if (!user) return;

    profileName.value = user.name;
    profileEmail.value = user.email;
    profilePassword.value = user.password;

    loadUserProgress();
    
    // Check if user came here to subscribe to a course
    const subscribeToCourseId = localStorage.getItem('subscribeToCourseId');
    if (subscribeToCourseId) {
        localStorage.removeItem('subscribeToCourseId');
        // Show message about subscription
        setTimeout(() => {
            const courses = JSON.parse(localStorage.getItem("courses")) || [];
            const course = courses.find(c => c.id === subscribeToCourseId);
            if (course) {
                showToast(
                    `You need to subscribe to "${course.name}" to access its premium content.\n\nGo to the home page and click "Subscribe to Access".`,
                    "warning",
                    6000
                );
            }
        }, 500);
    }
};

function initTheme() {
    document.body.dataset.theme = "light";
}

function enableEdit() {
    ["profileName","profileEmail","profilePassword"]
        .forEach(id => document.getElementById(id).disabled = false);

    editBtn.style.display = "none";
    saveBtn.style.display = "block";
}

function togglePassword() {
    const passwordInput = document.getElementById("profilePassword");
    const toggleBtn = document.getElementById("togglePassword");
    if (!passwordInput || !toggleBtn) return;

    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
}

function saveProfile() {
    const name = profileName.value.trim();
    const email = profileEmail.value.trim();
    const password = profilePassword.value.trim();

    if (!name || !email || !password) {
        showToast("All fields required", "warning");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const currentUserId = localStorage.getItem("currentUserId");

    const index = users.findIndex(u => u.id === currentUserId);
    if (index === -1) return;

    users[index].name = name;
    users[index].email = email;
    users[index].password = password;

    localStorage.setItem("users", JSON.stringify(users));

    showToast("Profile updated", "success");

    ["profileName","profileEmail","profilePassword"]
        .forEach(id => document.getElementById(id).disabled = true);

    editBtn.style.display = "block";
    saveBtn.style.display = "none";
}

function getToastContainer() {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = "info", duration = 4000) {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = String(message).replace(/\n/g, "<br>");
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// ================= LOAD USER PROGRESS =================
function loadUserProgress() {
    const currentUserId = localStorage.getItem("currentUserId");
    
    // Load user data
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.id === currentUserId);
    
    if (!user) return;

    // Load enrolled courses
    const enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const userEnrollments = enrollments.filter(e => e.userId === currentUserId);
    
    // Load all courses
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    
    // Load quiz attempts
    const attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
    const userAttempts = attempts.filter(a => a.userId === currentUserId);
    
    // Update profile fields
    profileName.value = user.name;
    profileEmail.value = user.email;
    profilePassword.value = user.password;
    
    // Display enrolled courses
    displayEnrolledCourses(userEnrollments, courses, userAttempts);
    
    // Display overall progress
    displayOverallProgress(userEnrollments, courses, userAttempts);
    renderQuickStats(userEnrollments, courses, userAttempts);
}

// ================= DISPLAY ENROLLED COURSES =================
function displayEnrolledCourses(enrollments, courses, attempts) {
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;
    
    const existingEnrolled = document.getElementById('enrolledCourses');
    if (existingEnrolled) {
        existingEnrolled.remove();
    }
    
    const enrolledSection = document.createElement('div');
    enrolledSection.id = 'enrolledCourses';
    enrolledSection.className = 'profile-section';
    
    if (enrollments.length === 0) {
        enrolledSection.innerHTML = `
            <h2>📚 My Courses</h2>
            <p style="color:#666; margin: 10px 0;">You haven't enrolled in any courses yet.</p>
            <a href="../HTML/home.html" class="browse-courses-btn">
                Browse Available Courses →
            </a>
        `;
    } else {
        let enrolledHTML = '<h2>📚 My Courses</h2>';
        
        enrollments.forEach(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            if (!course) return;
            
            // Get subscription status
            const premiumPurchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
            const currentUserId = localStorage.getItem("currentUserId");
            const isSubscribed = course.isPremium && premiumPurchases.some(
                p => p.userId === currentUserId && p.courseId === course.id
            );
            
            // Calculate course progress
            const courseContents = JSON.parse(localStorage.getItem("contents")) || [];
            const courseContentIds = courseContents
                .filter(c => c.courseId === course.id)
                .map(c => c.id);
            
            const courseAttempts = attempts.filter(a => 
                courseContentIds.includes(a.contentId)
            );
            const uniqueCompleted = [...new Set(courseAttempts.map(a => a.contentId))];
            const courseProgress = courseContentIds.length > 0 
                ? Math.round((uniqueCompleted.length / courseContentIds.length) * 100)
                : 0;
            
            // Determine access status
            let accessStatus = '';
            let accessClass = '';
            
            if (!course.isPremium) {
                accessStatus = '✅ Free Access';
                accessClass = 'access-free';
            } else if (isSubscribed) {
                accessStatus = '✅ Premium Access';
                accessClass = 'access-premium';
            } else {
                accessStatus = '🔒 Subscribe Required';
                accessClass = 'access-locked';
            }
            
            enrolledHTML += `
                <div class="course-card ${accessClass}">
                    <div class="course-header">
                        <h3 style="margin: 0; color: #2c3e50;">
                            ${course.name}
                            ${course.isPremium ? '<span class="premium-badge">⭐ Premium</span>' : ''}
                        </h3>
                        <div class="course-status">
                            <span class="access-status ${accessClass}">${accessStatus}</span>
                            <span class="enrollment-date">
                                Enrolled: ${new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    
                    <p class="course-description">
                        ${course.description || 'No description available'}
                    </p>
                    
                    <div class="course-progress">
                        <div class="progress-header">
                            <span>Progress</span>
                            <span class="progress-percentage">${courseProgress}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${courseProgress}%;"></div>
                        </div>
                        <div class="progress-footer">
                            <span>${uniqueCompleted.length} of ${courseContentIds.length} lessons completed</span>
                            <div class="course-actions">
                                ${course.isPremium && !isSubscribed ? 
                                    `<button class="subscribe-btn" onclick="goToSubscribe('${course.id}')">Subscribe Now</button>` : 
                                    `<a href="../HTML/home.html" class="continue-link">Continue Learning →</a>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        enrolledSection.innerHTML = enrolledHTML;
    }
    
    // Insert enrolled courses section
    const firstSection = document.querySelector('.profile-section');
    if (firstSection) {
        profileContainer.insertBefore(enrolledSection, firstSection.nextSibling);
    } else {
        profileContainer.appendChild(enrolledSection);
    }
}

// ================= GO TO SUBSCRIBE =================
function goToSubscribe(courseId) {
    // Store the course ID to subscribe to
    localStorage.setItem('subscribeToCourseId', courseId);
    
    // Redirect to home page
    window.location.href = '../HTML/home.html';
}

// ================= DISPLAY OVERALL PROGRESS =================
function displayOverallProgress(enrollments, courses, attempts) {
    // Calculate overall progress across all enrolled courses
    let totalLessons = 0;
    let completedLessons = 0;
    
    enrollments.forEach(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (!course) return;
        
        const courseContents = JSON.parse(localStorage.getItem("contents")) || [];
        const courseContentIds = courseContents
            .filter(c => c.courseId === course.id)
            .map(c => c.id);
        
        const courseAttempts = attempts.filter(a => 
            courseContentIds.includes(a.contentId)
        );
        const uniqueCompleted = [...new Set(courseAttempts.map(a => a.contentId))];
        
        totalLessons += courseContentIds.length;
        completedLessons += uniqueCompleted.length;
    });
    
    const overallPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    
    // Ensure progress text element exists
    const progressTextElement = document.getElementById("progressText");
    if (progressTextElement) {
        progressTextElement.textContent =
            enrollments.length === 0
                ? "Enroll in courses to track progress"
                : attempts.length === 0
                    ? "Start learning to see your progress"
                    : `${completedLessons} / ${totalLessons} lessons completed (${overallPercentage}%)`;
    }
    
    // Update progress bar
    const progressBarElement = document.getElementById("progressBar");
    if (progressBarElement) {
        progressBarElement.style.width = `${overallPercentage}%`;
    }
    
    // Show detailed progress if there are attempts
    if (attempts.length > 0) {
        displayDetailedProgress(attempts);
    }
}

// ================= RENDER QUICK STATS =================
function renderQuickStats(enrollments, courses, attempts) {
    const quickStats = document.getElementById("quickStats");
    if (!quickStats) return;

    let totalLessons = 0;
    let completedLessons = 0;

    enrollments.forEach(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (!course) return;

        const courseContents = JSON.parse(localStorage.getItem("contents")) || [];
        const courseContentIds = courseContents
            .filter(c => c.courseId === course.id)
            .map(c => c.id);

        const courseAttempts = attempts.filter(a =>
            courseContentIds.includes(a.contentId)
        );
        const uniqueCompleted = [...new Set(courseAttempts.map(a => a.contentId))];

        totalLessons += courseContentIds.length;
        completedLessons += uniqueCompleted.length;
    });

    const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
        : 0;

    quickStats.innerHTML = `
        <div class="stat-card">
            <h4>Enrolled</h4>
            <span>${enrollments.length}</span>
        </div>
        <div class="stat-card">
            <h4>Lessons Done</h4>
            <span>${completedLessons}/${totalLessons}</span>
        </div>
        <div class="stat-card">
            <h4>Avg Quiz</h4>
            <span>${averageScore}%</span>
        </div>
    `;
}

// ================= DISPLAY DETAILED PROGRESS =================
function displayDetailedProgress(attempts) {
    // Find the progress section
    const progressSections = document.querySelectorAll('.profile-section');
    const lastProgressSection = progressSections[progressSections.length - 1];
    
    if (!lastProgressSection) return;
    
    // Remove existing detailed progress if any
    const existingDetails = document.getElementById('detailedProgress');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    
    const detailsDiv = document.createElement('div');
    detailsDiv.id = 'detailedProgress';
    detailsDiv.className = 'detailed-progress';
    
    let detailsHTML = '<h3 style="margin-bottom:10px; color: #2c3e50;">📊 Recent Quiz Performance</h3>';
    
    // Get latest attempts (limit to 5 most recent)
    const recentAttempts = attempts
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);
    
    if (recentAttempts.length === 0) {
        detailsHTML += '<p style="color:#666;">No quiz attempts yet.</p>';
    } else {
        recentAttempts.forEach(attempt => {
            const content = contents.find(c => c.id === attempt.contentId);
            const course = courses.find(c => {
                const courseContents = JSON.parse(localStorage.getItem("contents")) || [];
                return courseContents.some(cc => cc.id === attempt.contentId && cc.courseId === c.id);
            });
            
            detailsHTML += `
                <div class="quiz-attempt">
                    <div class="quiz-header">
                        <strong>${content ? content.title : 'Quiz'}</strong>
                        <span class="quiz-score ${attempt.percentage >= 70 ? 'high-score' : attempt.percentage >= 50 ? 'medium-score' : 'low-score'}">
                            ${attempt.percentage}%
                        </span>
                    </div>
                    ${course ? `<div class="quiz-course">${course.name}</div>` : ''}
                    <div class="quiz-details">
                        Score: ${attempt.score}/${attempt.total} | 
                        Date: ${new Date(attempt.completedAt).toLocaleDateString()}
                    </div>
                </div>
            `;
        });
    }
    
    detailsDiv.innerHTML = detailsHTML;
    lastProgressSection.appendChild(detailsDiv);
}
