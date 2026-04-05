
const ADMIN_SESSION_KEY = "learnhub_admin_logged_in";
function initTheme() {
    document.body.dataset.theme = "light";
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

document.addEventListener("DOMContentLoaded", () => {
    initTheme();

    if (!checkAdminSession()) return;
    checkSessionTimeout();
    preventBackNavigation();

    const page = document.body.dataset.page || "overview";

    if (page === "overview") {
        loadOverviewStats();
    }

    if (page === "categories") {
        loadCategories();
        loadCategoryDropdown();
    }

    if (page === "courses") {
        loadCategories();
        loadCategoryDropdown();
        loadCourses();
        loadCourseDropdown();
    }

    if (page === "content") {
        loadCourses();
        loadCourseDropdown();
        loadContents();
    }

    if (page === "mcq") {
        loadContents();
        loadContentDropdownForMCQ();
    }

    if (page === "premium") {
        loadPremiumPurchases();
    }

    if (page === "users") {
        loadStudents();
        bindUserSearch();
    }

    if (page === "feedback") {
        loadFeedbacks();
    }

    setInterval(checkSessionTimeout, 5 * 60 * 1000);
    bindLogoutShortcut();
});

function checkAdminSession() {
    const isLoggedIn = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!isLoggedIn || isLoggedIn !== "true") {
        window.location.href = "../../user/HTML/login.html";
        return false;
    }
    return true;
}

function logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem("learnhub_admin_session_time");
    localStorage.removeItem("learnhub_admin_username");
    window.location.href = "../../user/HTML/login.html";
}

function checkSessionTimeout() {
    const sessionTime = localStorage.getItem("learnhub_admin_session_time");
    if (!sessionTime) return;
    const sessionDuration = Date.now() - parseInt(sessionTime, 10);
    if (sessionDuration > 24 * 60 * 60 * 1000) {
        logoutAdmin();
    }
}

function preventBackNavigation() {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
        if (!localStorage.getItem(ADMIN_SESSION_KEY)) {
            window.history.pushState(null, null, window.location.href);
        }
    };
}

function bindLogoutShortcut() {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.altKey && e.key === "l") {
            e.preventDefault();
            logoutAdmin();
        }
    });
}

// ================= FEEDBACKS =================
function loadFeedbacks() {
    const tbody = document.getElementById("feedbackTableBody");
    if (!tbody) return;

    const feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
    tbody.innerHTML = "";

    if (feedbacks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No feedback submitted yet.</td></tr>`;
        return;
    }

    feedbacks.forEach((item) => {
        const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : "-";
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${item.userName || "-"}</td>
                <td>${item.courseName || "-"}</td>
                <td>${item.contentTitle || "-"}</td>
                <td class="feedback-message">${item.message || "-"}</td>
            </tr>
        `;
    });
}

// ================= USERS =================
function loadStudents() {
    const tbody = document.getElementById("studentTableBody");
    const totalStudents = document.getElementById("totalStudents");
    if (!tbody) return;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No users found</td></tr>`;
        totalStudents.textContent = 0;
        return;
    }

    users.forEach((u, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td><input disabled value="${u.name}" id="name-${u.id}"></td>
                <td><input disabled value="${u.email}" id="email-${u.id}"></td>
                <td><input disabled type="password" value="${u.password}" id="password-${u.id}"></td>
                <td>
                    <button onclick="enableEdit('${u.id}')">Manage</button>
                    <button onclick="saveUser('${u.id}')" id="save-${u.id}" style="display:none">Save</button>
                    <button onclick="deleteUser('${u.id}')" style="background:#e74c3c">Delete</button>
                </td>
                <td>
                    <button onclick="viewUserCourses('${u.id}', '${u.name}')" style="background:#3498db">
                        Manage Courses
                    </button>
                </td>
            </tr>`;
    });

    if (totalStudents) {
        totalStudents.textContent = users.length;
    }
}

function bindUserSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    searchInput.addEventListener("keyup", (e) => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll("#studentTableBody tr")
            .forEach(r => r.style.display = r.textContent.toLowerCase().includes(v) ? "" : "none");
    });
}

function enableEdit(id) {
    ["name", "email", "password"].forEach(f => {
        document.getElementById(`${f}-${id}`).disabled = false;
    });
    document.getElementById(`save-${id}`).style.display = "inline-block";
}

function saveUser(id) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const i = users.findIndex(u => u.id === id);
    if (i === -1) return;

    users[i].name = document.getElementById(`name-${id}`).value;
    users[i].email = document.getElementById(`email-${id}`).value;
    users[i].password = document.getElementById(`password-${id}`).value;

    localStorage.setItem("users", JSON.stringify(users));
    loadStudents();
}

function deleteUser(id) {
    if (!confirm("Delete user?\n\nThis will also remove all their enrollments and quiz attempts.")) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];
    users = users.filter(u => u.id !== id);
    localStorage.setItem("users", JSON.stringify(users));

    let enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    enrollments = enrollments.filter(e => e.userId !== id);
    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));

    let attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
    attempts = attempts.filter(a => a.userId !== id);
    localStorage.setItem("quizAttempts", JSON.stringify(attempts));

    let purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    purchases = purchases.filter(p => p.userId !== id);
    localStorage.setItem("premiumPurchases", JSON.stringify(purchases));

    loadStudents();
}
// ================= USER COURSES MANAGEMENT =================
function viewUserCourses(userId, userName) {
    const modal = document.createElement("div");
    modal.id = "userCoursesModal";
    modal.className = "user-courses-modal";

    modal.innerHTML = `
        <div class="user-courses-content">
            <div class="modal-header">
                <h2>${userName}'s Courses</h2>
                <button onclick="closeUserCoursesModal()" class="btn danger">Close</button>
            </div>
            <div class="modal-grid">
                <div>
                    <h3>Current Enrollments</h3>
                    <div id="userEnrollmentsList"></div>
                </div>
                <div>
                    <h3>Enroll in New Course</h3>
                    <div class="form-grid">
                        <select id="newCourseSelect">
                            <option value="">Select Course to Enroll</option>
                        </select>
                        <button onclick="enrollUserInCourse('${userId}')" class="btn primary">Enroll User</button>
                    </div>
                </div>
                <div>
                    <h3>User Quiz Progress</h3>
                    <div id="userQuizProgress"></div>
                </div>
                <div>
                    <h3>Premium Subscriptions</h3>
                    <div id="userPremiumSubscriptions"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    loadUserCoursesData(userId);
}

function loadUserCoursesData(userId) {
    const enrollmentsList = document.getElementById("userEnrollmentsList");
    const quizProgress = document.getElementById("userQuizProgress");
    const premiumSubscriptions = document.getElementById("userPremiumSubscriptions");
    const newCourseSelect = document.getElementById("newCourseSelect");

    if (!enrollmentsList || !quizProgress || !premiumSubscriptions || !newCourseSelect) return;

    const enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const userEnrollments = enrollments.filter(e => e.userId === userId);
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
    const userAttempts = attempts.filter(a => a.userId === userId);
    const premiumPurchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    const userPurchases = premiumPurchases.filter(p => p.userId === userId);

    if (userEnrollments.length === 0) {
        enrollmentsList.innerHTML = '<p class="muted">User is not enrolled in any courses.</p>';
    } else {
        let enrollmentsHTML = '<div class="card-row">';
        userEnrollments.forEach(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            if (!course) return;

            const courseContents = contents.filter(c => c.courseId === course.id);
            const courseContentIds = courseContents.map(c => c.id);
            const courseAttempts = userAttempts.filter(a => courseContentIds.includes(a.contentId));
            const uniqueCompleted = [...new Set(courseAttempts.map(a => a.contentId))];
            const progress = courseContentIds.length > 0
                ? Math.round((uniqueCompleted.length / courseContentIds.length) * 100)
                : 0;

            const hasPremium = userPurchases.some(p => p.courseId === course.id);

            enrollmentsHTML += `
                <div class="course-enrollment-card">
                    <div class="card-header">
                        <h4>${course.name}</h4>
                        <button onclick="unenrollUserFromCourse('${userId}', '${course.id}', '${course.name}')" class="btn danger small">Remove</button>
                    </div>
                    <p class="muted">${course.isPremium ? 'Premium' : 'Free'}</p>
                    <div class="muted">Progress: ${progress}%</div>
                    <div class="muted">${hasPremium && course.isPremium ? 'Subscribed' : course.isPremium ? 'Not Subscribed' : ''}</div>
                </div>
            `;
        });
        enrollmentsHTML += "</div>";
        enrollmentsList.innerHTML = enrollmentsHTML;
    }

    if (userAttempts.length === 0) {
        quizProgress.innerHTML = '<p class="muted">No quiz attempts yet.</p>';
    } else {
        let progressHTML = '<div class="stack">';
        userAttempts.forEach(attempt => {
            const content = contents.find(c => c.id === attempt.contentId);
            const course = courses.find(c => {
                const courseContents = contents.filter(cc => cc.courseId === c.id);
                return courseContents.some(cc => cc.id === attempt.contentId);
            });
            const scoreClass = attempt.percentage >= 70 ? "good" : attempt.percentage >= 50 ? "warn" : "bad";

            progressHTML += `
                <div class="quiz-progress-item ${scoreClass}">
                    <div class="row">
                        <strong>${content ? content.title : "Quiz"}</strong>
                        <span>${attempt.percentage}%</span>
                    </div>
                    <div class="muted">${course ? course.name : ""} | Score: ${attempt.score}/${attempt.total}</div>
                    <div class="muted">${new Date(attempt.completedAt).toLocaleDateString()}</div>
                </div>
            `;
        });
        progressHTML += "</div>";
        quizProgress.innerHTML = progressHTML;
    }

    if (userPurchases.length === 0) {
        premiumSubscriptions.innerHTML = '<p class="muted">No premium subscriptions.</p>';
    } else {
        let subscriptionsHTML = '<div class="card-row">';
        userPurchases.forEach(purchase => {
            const course = courses.find(c => c.id === purchase.courseId);
            if (!course) return;

            subscriptionsHTML += `
                <div class="subscription-card">
                    <h4>${course.name}</h4>
                    <div class="muted">Subscribed: ${new Date(purchase.subscribedAt || purchase.purchasedAt).toLocaleDateString()}</div>
                </div>
            `;
        });
        subscriptionsHTML += "</div>";
        premiumSubscriptions.innerHTML = subscriptionsHTML;
    }

    newCourseSelect.innerHTML = '<option value="">Select Course to Enroll</option>';
    const userCourseIds = userEnrollments.map(e => e.courseId);
    const availableCourses = courses.filter(course => !userCourseIds.includes(course.id));

    if (availableCourses.length === 0) {
        newCourseSelect.innerHTML += '<option value="" disabled>All courses already enrolled</option>';
    } else {
        availableCourses.forEach(course => {
            newCourseSelect.innerHTML += `<option value="${course.id}">${course.name} ${course.isPremium ? "*" : ""}</option>`;
        });
    }
}

function enrollUserInCourse(userId) {
    const courseSelect = document.getElementById("newCourseSelect");
    const courseId = courseSelect.value;
    if (!courseId) {
        showToast("Please select a course first.", "warning");
        return;
    }

    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        showToast("Course not found.", "error");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.id === userId);
    if (!user) {
        showToast("User not found.", "error");
        return;
    }

    let enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const alreadyEnrolled = enrollments.some(e => e.userId === userId && e.courseId === courseId);

    if (alreadyEnrolled) {
        showToast("User is already enrolled in this course.", "warning");
        return;
    }

    enrollments.push({
        userId: userId,
        courseId: courseId,
        courseName: course.name,
        enrolledAt: new Date().toISOString(),
        isPremium: course.isPremium || false,
        progress: 0,
        enrolledByAdmin: true
    });

    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));
    loadUserCoursesData(userId);
    showToast(`Successfully enrolled ${user.name} in "${course.name}".`, "success");
}

function unenrollUserFromCourse(userId, courseId, courseName) {
    if (!confirm(`Remove ${courseName} from user's enrolled courses?\n\nThis will also delete their quiz attempts for this course.`)) {
        return;
    }

    let enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    enrollments = enrollments.filter(e => !(e.userId === userId && e.courseId === courseId));
    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));

    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courseContents = contents.filter(c => c.courseId === courseId);
    const courseContentIds = courseContents.map(c => c.id);

    let attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
    attempts = attempts.filter(a => !(a.userId === userId && courseContentIds.includes(a.contentId)));
    localStorage.setItem("quizAttempts", JSON.stringify(attempts));

    loadUserCoursesData(userId);
    showToast(`Successfully removed "${courseName}" from user's courses.`, "success");
}

function closeUserCoursesModal() {
    const modal = document.getElementById("userCoursesModal");
    if (modal) {
        modal.remove();
    }
}
// ================= CATEGORIES =================
function addCategory() {
    const input = document.getElementById("categoryName");
    const imageInput = document.getElementById("categoryImageUrl");
    if (!input) return;
    const name = input.value.trim();
    const imageUrl = imageInput ? imageInput.value.trim() : "";
    if (!name) {
        showToast("Category required", "warning");
        return;
    }

    let categories = JSON.parse(localStorage.getItem("categories")) || [];
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast("Category exists", "warning");
        return;
    }

    categories.push({
        id: "cat_" + Date.now(),
        name,
        imageUrl,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("categories", JSON.stringify(categories));
    input.value = "";
    if (imageInput) imageInput.value = "";
    loadCategories();
    loadCategoryDropdown();
}

function loadCategories() {
    const list = document.getElementById("categoryList");
    if (!list) return;
    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    list.innerHTML = "";

    if (categories.length === 0) {
        list.innerHTML = "<li>No categories</li>";
        return;
    }

    categories.forEach(cat => {
        list.innerHTML += `
            <li>
                ${cat.imageUrl ? `<img class="category-thumb" src="${cat.imageUrl}" alt="${cat.name} image">` : `<div class="category-thumb placeholder">No image</div>`}
                <input 
                    type="text" 
                    id="cat-${cat.id}" 
                    value="${cat.name}" 
                    disabled
                >
                <input
                    type="text"
                    id="cat-image-${cat.id}"
                    value="${cat.imageUrl || ""}"
                    placeholder="Image URL"
                    disabled
                >
                <button onclick="enableCategoryEdit('${cat.id}')">Edit</button>
                <button onclick="saveCategory('${cat.id}')" id="save-${cat.id}" style="display:none">
                    Save
                </button>
                <button onclick="deleteCategory('${cat.id}')" style="background:#e74c3c">
                    Delete
                </button>
            </li>
        `;
    });
}

function enableCategoryEdit(id) {
    const input = document.getElementById(`cat-${id}`);
    const imageInput = document.getElementById(`cat-image-${id}`);
    const saveBtn = document.getElementById(`save-${id}`);
    if (input) input.disabled = false;
    if (imageInput) imageInput.disabled = false;
    if (saveBtn) saveBtn.style.display = "inline-block";
}

function saveCategory(id) {
    let categories = JSON.parse(localStorage.getItem("categories")) || [];
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;

    const updatedName = document.getElementById(`cat-${id}`).value.trim();
    const updatedImageUrl = document.getElementById(`cat-image-${id}`).value.trim();
    if (!updatedName) {
        showToast("Category name cannot be empty", "warning");
        return;
    }

    categories[index].name = updatedName;
    categories[index].imageUrl = updatedImageUrl;
    localStorage.setItem("categories", JSON.stringify(categories));

    loadCategories();
    loadCategoryDropdown();
}

function deleteCategory(id) {
    if (!confirm("Delete this category?\n\nThis will also delete all courses, contents, and MCQs under this category.")) return;

    let categories = JSON.parse(localStorage.getItem("categories")) || [];
    let courses = JSON.parse(localStorage.getItem("courses")) || [];
    let contents = JSON.parse(localStorage.getItem("contents")) || [];
    let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    let enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    let purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];

    const categoryCourses = courses.filter(c => c.categoryId === id);
    const categoryCourseIds = categoryCourses.map(c => c.id);
    const categoryContents = contents.filter(c => categoryCourseIds.includes(c.courseId));
    const categoryContentIds = categoryContents.map(c => c.id);

    categories = categories.filter(c => c.id !== id);
    courses = courses.filter(c => c.categoryId !== id);
    contents = contents.filter(c => !categoryCourseIds.includes(c.courseId));
    mcqs = mcqs.filter(m => !categoryContentIds.includes(m.contentId));
    enrollments = enrollments.filter(e => !categoryCourseIds.includes(e.courseId));
    purchases = purchases.filter(p => !categoryCourseIds.includes(p.courseId));

    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem("contents", JSON.stringify(contents));
    localStorage.setItem("mcqs", JSON.stringify(mcqs));
    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));
    localStorage.setItem("premiumPurchases", JSON.stringify(purchases));

    loadCategories();
    loadCategoryDropdown();
    loadCourses();
    loadCourseDropdown();
    loadContents();
    loadContentDropdownForMCQ();
    loadPremiumPurchases();
}

function loadCategoryDropdown() {
    const select = document.getElementById("courseCategory");
    if (!select) return;
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    select.innerHTML = `<option value="">Select Category</option>`;
    categories.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

// ================= COURSES =================
function addCourse() {
    const categoryId = document.getElementById("courseCategory").value;
    const name = document.getElementById("courseName").value.trim();
    const desc = document.getElementById("courseDescription").value.trim();
    const isPremium = document.getElementById("isPremiumCourse").checked;

    if (!categoryId || !name) {
        showToast("Category and course name required", "warning");
        return;
    }

    let courses = JSON.parse(localStorage.getItem("courses")) || [];

    courses.push({
        id: "course_" + Date.now(),
        name,
        description: desc,
        categoryId,
        isPremium,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("courses", JSON.stringify(courses));

    document.getElementById("courseName").value = "";
    document.getElementById("courseDescription").value = "";
    document.getElementById("isPremiumCourse").checked = false;

    loadCourses();
    loadCourseDropdown();
}

function loadCourses() {
    const list = document.getElementById("courseList");
    if (!list) return;
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    list.innerHTML = "";

    if (courses.length === 0) {
        list.innerHTML = "<li>No courses</li>";
        return;
    }

    courses.forEach(course => {
        const cat = categories.find(c => c.id === course.categoryId);

        list.innerHTML += `
            <li>
                <input type="text" id="course-name-${course.id}" value="${course.name}" disabled>
                <span>(${cat ? cat.name : "Unknown"})</span>
                ${course.isPremium ? "*" : ""}

                <textarea id="course-desc-${course.id}" disabled>${course.description || ""}</textarea>

                <label class="checkbox-row">
                    <input type="checkbox" id="course-premium-${course.id}" ${course.isPremium ? "checked" : ""} disabled>
                    Premium
                </label>

                <button onclick="enableCourseEdit('${course.id}')">Edit</button>
                <button onclick="saveCourse('${course.id}')" id="save-course-${course.id}" style="display:none">
                    Save
                </button>
                <button onclick="deleteCourse('${course.id}')" style="background:#e74c3c">
                    Delete
                </button>
            </li>
        `;
    });
}

function enableCourseEdit(id) {
    document.getElementById(`course-name-${id}`).disabled = false;
    document.getElementById(`course-desc-${id}`).disabled = false;
    document.getElementById(`course-premium-${id}`).disabled = false;
    document.getElementById(`save-course-${id}`).style.display = "inline-block";
}

function saveCourse(id) {
    let courses = JSON.parse(localStorage.getItem("courses")) || [];
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return;

    courses[index].name =
        document.getElementById(`course-name-${id}`).value.trim();

    courses[index].description =
        document.getElementById(`course-desc-${id}`).value.trim();

    courses[index].isPremium =
        document.getElementById(`course-premium-${id}`).checked;

    if (!courses[index].name) {
        showToast("Course name required", "warning");
        return;
    }

    localStorage.setItem("courses", JSON.stringify(courses));

    loadCourses();
    loadCourseDropdown();
    loadContents();
}

function deleteCourse(id) {
    if (!confirm("Delete this course?\n\nThis will also delete all contents, MCQs, enrollments, and premium purchases for this course.")) return;

    let courses = JSON.parse(localStorage.getItem("courses")) || [];
    let contents = JSON.parse(localStorage.getItem("contents")) || [];
    let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    let enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    let purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];

    const courseContents = contents.filter(c => c.courseId === id);
    const courseContentIds = courseContents.map(c => c.id);

    courses = courses.filter(c => c.id !== id);
    contents = contents.filter(c => c.courseId !== id);
    mcqs = mcqs.filter(m => !courseContentIds.includes(m.contentId));
    enrollments = enrollments.filter(e => e.courseId !== id);
    purchases = purchases.filter(p => p.courseId !== id);

    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem("contents", JSON.stringify(contents));
    localStorage.setItem("mcqs", JSON.stringify(mcqs));
    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));
    localStorage.setItem("premiumPurchases", JSON.stringify(purchases));

    loadCourses();
    loadCourseDropdown();
    loadContents();
    loadContentDropdownForMCQ();
    loadPremiumPurchases();
}

function loadCourseDropdown() {
    const select = document.getElementById("contentCourse");
    if (!select) return;
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    select.innerHTML = `<option value="">Select Course</option>`;
    courses.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}
// ================= CONTENT =================
function addContent() {
    const courseId = document.getElementById("contentCourse").value;
    const title = document.getElementById("videoTitle").value.trim();
    const url = document.getElementById("youtubeUrl").value.trim();

    if (!courseId || !title || !url) {
        showToast("All content fields are required", "warning");
        return;
    }

    let contents = JSON.parse(localStorage.getItem("contents")) || [];

    contents.push({
        id: "content_" + Date.now(),
        courseId,
        title,
        youtubeUrl: url,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("contents", JSON.stringify(contents));

    document.getElementById("videoTitle").value = "";
    document.getElementById("youtubeUrl").value = "";

    loadContents();
}

function loadContents() {
    const list = document.getElementById("contentList");
    if (!list) return;
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];

    list.innerHTML = "";

    if (contents.length === 0) {
        list.innerHTML = "<li>No content added</li>";
        return;
    }

    contents.forEach(content => {
        const course = courses.find(c => c.id === content.courseId);

        list.innerHTML += `
            <li>
                <input 
                    type="text" 
                    id="content-title-${content.id}" 
                    value="${content.title}" 
                    disabled
                >
                <input 
                    type="text" 
                    id="content-url-${content.id}" 
                    value="${content.youtubeUrl}" 
                    disabled
                >
                <small>
                    Course: <strong>${course ? course.name : "Unknown"}</strong>
                </small>
                <button onclick="openContentPreview('${content.id}')">Preview</button>
                <button onclick="enableContentEdit('${content.id}')">Edit</button>
                <button onclick="saveContent('${content.id}')" id="save-content-${content.id}" style="display:none">
                    Save
                </button>
                <button onclick="deleteContent('${content.id}')" style="background:#e74c3c">
                    Delete
                </button>
            </li>
        `;
    });
}

function openContentPreview(contentId) {
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const content = contents.find(c => c.id === contentId);

    if (!content) {
        showToast("Content not found.", "error");
        return;
    }

    const course = courses.find(c => c.id === content.courseId);
    const videoId = extractYouTubeId(content.youtubeUrl);

    const modal = document.createElement("div");
    modal.id = "contentPreviewModal";
    modal.className = "content-preview-modal";

    modal.innerHTML = `
        <div class="content-preview-content">
            <div class="modal-header">
                <div>
                    <h2>${content.title}</h2>
                    <p>${course ? course.name : "Unknown course"}</p>
                </div>
                <button class="btn danger" onclick="closeContentPreview()">Close</button>
            </div>
            ${videoId ? `
                <div class="content-preview-video">
                    <iframe
                        src="https://www.youtube.com/embed/${videoId}"
                        title="${content.title}"
                        allowfullscreen
                    ></iframe>
                </div>
            ` : `
                <div class="content-preview-placeholder">
                    Invalid YouTube URL
                </div>
            `}
            <div class="content-preview-meta">
                <div><strong>Video Title:</strong> ${content.title}</div>
                <div><strong>URL:</strong> ${content.youtubeUrl}</div>
                <div><strong>Course:</strong> ${course ? course.name : "Unknown"}</div>
            </div>
        </div>
    `;

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeContentPreview();
        }
    });

    document.body.appendChild(modal);
}

function closeContentPreview() {
    const modal = document.getElementById("contentPreviewModal");
    if (modal) {
        modal.remove();
    }
}

function extractYouTubeId(url) {
    if (!url) return "";
    const patterns = [
        /youtube\.com\/watch\?v=([^&?/]+)/,
        /youtube\.com\/watch\?.+&v=([^&?/]+)/,
        /youtu\.be\/([^&?/]+)/,
        /youtube\.com\/embed\/([^&?/]+)/,
        /youtube\.com\/shorts\/([^&?/]+)/,
        /youtube\.com\/live\/([^&?/]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return "";
}

function enableContentEdit(id) {
    document.getElementById(`content-title-${id}`).disabled = false;
    document.getElementById(`content-url-${id}`).disabled = false;
    document.getElementById(`save-content-${id}`).style.display = "inline-block";
}

function saveContent(id) {
    let contents = JSON.parse(localStorage.getItem("contents")) || [];
    const index = contents.findIndex(c => c.id === id);
    if (index === -1) return;

    const title = document.getElementById(`content-title-${id}`).value.trim();
    const url = document.getElementById(`content-url-${id}`).value.trim();

    if (!title || !url) {
        showToast("Title and URL are required", "warning");
        return;
    }

    contents[index].title = title;
    contents[index].youtubeUrl = url;

    localStorage.setItem("contents", JSON.stringify(contents));

    loadContents();
    loadContentDropdownForMCQ();
}

function deleteContent(id) {
    if (!confirm("Delete this content?\n\nThis will also delete all MCQs for this content.")) return;

    let contents = JSON.parse(localStorage.getItem("contents")) || [];
    let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];

    contents = contents.filter(c => c.id !== id);
    mcqs = mcqs.filter(m => m.contentId !== id);

    localStorage.setItem("contents", JSON.stringify(contents));
    localStorage.setItem("mcqs", JSON.stringify(mcqs));

    loadContents();
    loadContentDropdownForMCQ();
}

function loadContentDropdownForMCQ() {
    const select = document.getElementById("mcqContentSelect");
    if (!select) return;

    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    select.innerHTML = `<option value="">Select Course & Chapter</option>`;

    contents.forEach(c => {
        const course = courses.find(courseItem => courseItem.id === c.courseId);
        const courseName = course ? course.name : "Unknown Course";
        select.innerHTML += `<option value="${c.id}">${courseName} - ${c.title}</option>`;
    });
}

function loadExistingMCQs(contentId) {
    const mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    const container = document.getElementById("mcqContainer");
    const editBtn = document.getElementById("mcqEditBtn");
    const saveBtn = document.querySelector("button[onclick='saveMCQs()']");
    const updateBtn = document.querySelector("button[onclick='updateMCQs()']");
    if (!container) return;

    const existing = mcqs.filter(m => m.contentId === contentId);
    if (existing.length === 0) return;

    container.innerHTML = "";

    existing.forEach((q, index) => {
        container.innerHTML += `
            <div class="mcq-question">
                <h4>Question ${index + 1}</h4>
                <input type="text" id="q${index + 1}" value="${q.question}" disabled>
                <input type="text" id="q${index + 1}a" value="${q.options[0]}" disabled>
                <input type="text" id="q${index + 1}b" value="${q.options[1]}" disabled>
                <input type="text" id="q${index + 1}c" value="${q.options[2]}" disabled>
                <input type="text" id="q${index + 1}d" value="${q.options[3]}" disabled>
                <select id="q${index + 1}correct" disabled>
                    <option value="0" ${q.correctIndex === 0 ? "selected" : ""}>Correct: A</option>
                    <option value="1" ${q.correctIndex === 1 ? "selected" : ""}>Correct: B</option>
                    <option value="2" ${q.correctIndex === 2 ? "selected" : ""}>Correct: C</option>
                    <option value="3" ${q.correctIndex === 3 ? "selected" : ""}>Correct: D</option>
                </select>
            </div>
        `;
    });

    if (editBtn) editBtn.disabled = false;
    if (saveBtn) saveBtn.disabled = true;
    if (updateBtn) updateBtn.disabled = true;
}

document.addEventListener("change", function (e) {
    if (e.target.id !== "mcqContentSelect") return;

    const contentId = e.target.value;
    const container = document.getElementById("mcqContainer");
    const editBtn = document.getElementById("mcqEditBtn");
    const saveBtn = document.querySelector("button[onclick='saveMCQs()']");
    const updateBtn = document.querySelector("button[onclick='updateMCQs()']");
    if (!container) return;
    container.innerHTML = "";

    if (!contentId) return;

    const mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    const exists = mcqs.some(m => m.contentId === contentId);

    if (exists) {
        loadExistingMCQs(contentId);
    } else {
        for (let i = 1; i <= 5; i++) {
            container.innerHTML += `
                <div class="mcq-question">
                    <h4>Question ${i}</h4>
                    <input type="text" id="q${i}" placeholder="Question">
                    <input type="text" id="q${i}a" placeholder="Option A">
                    <input type="text" id="q${i}b" placeholder="Option B">
                    <input type="text" id="q${i}c" placeholder="Option C">
                    <input type="text" id="q${i}d" placeholder="Option D">
                    <select id="q${i}correct">
                        <option value="0">Correct: A</option>
                        <option value="1">Correct: B</option>
                        <option value="2">Correct: C</option>
                        <option value="3">Correct: D</option>
                    </select>
                </div>
            `;
        }

        if (editBtn) editBtn.disabled = true;
        if (saveBtn) saveBtn.disabled = false;
        if (updateBtn) updateBtn.disabled = true;
    }
});

function enableMcqEdit() {
    const inputs = document.querySelectorAll("#mcqContainer input, #mcqContainer select");
    inputs.forEach(input => input.disabled = false);

    const saveBtn = document.querySelector("button[onclick='saveMCQs()']");
    const updateBtn = document.querySelector("button[onclick='updateMCQs()']");
    if (saveBtn) saveBtn.disabled = true;
    if (updateBtn) updateBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById("mcqEditBtn");
    if (editBtn && !editBtn.dataset.bound) {
        editBtn.dataset.bound = "true";
        editBtn.disabled = true;
        editBtn.addEventListener("click", enableMcqEdit);
    }
});

function saveMCQs() {
    const contentId = document.getElementById("mcqContentSelect").value;
    if (!contentId) {
        showToast("Please select a chapter", "warning");
        return;
    }

    let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];

    for (let i = 1; i <= 5; i++) {
        const question = document.getElementById(`q${i}`).value.trim();
        const options = [
            document.getElementById(`q${i}a`).value.trim(),
            document.getElementById(`q${i}b`).value.trim(),
            document.getElementById(`q${i}c`).value.trim(),
            document.getElementById(`q${i}d`).value.trim()
        ];
        const correctIndex = Number(
            document.getElementById(`q${i}correct`).value
        );

        if (!question || options.some(o => !o)) {
            showToast(`Please fill all fields for Question ${i}`, "warning");
            return;
        }

        mcqs.push({
            id: "mcq_" + Date.now() + "_" + i,
            contentId,
            question,
            options,
            correctIndex
        });
    }

    localStorage.setItem("mcqs", JSON.stringify(mcqs));

    showToast("MCQs saved successfully", "success");
    loadExistingMCQs(contentId);
}

function updateMCQs() {
    const contentId = document.getElementById("mcqContentSelect").value;
    if (!contentId) {
        showToast("Select a chapter first", "warning");
        return;
    }

    let mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    mcqs = mcqs.filter(m => m.contentId !== contentId);

    for (let i = 1; i <= 5; i++) {
        const question = document.getElementById(`q${i}`).value.trim();
        const options = [
            document.getElementById(`q${i}a`).value.trim(),
            document.getElementById(`q${i}b`).value.trim(),
            document.getElementById(`q${i}c`).value.trim(),
            document.getElementById(`q${i}d`).value.trim()
        ];
        const correctIndex = Number(
            document.getElementById(`q${i}correct`).value
        );

        if (!question || options.some(o => !o)) {
            showToast(`Please fill all fields for Question ${i}`, "warning");
            return;
        }

        mcqs.push({
            id: "mcq_" + Date.now() + "_" + i,
            contentId,
            question,
            options,
            correctIndex
        });
    }

    localStorage.setItem("mcqs", JSON.stringify(mcqs));
    showToast("MCQs updated successfully", "success");
    loadExistingMCQs(contentId);
}

// ================= PREMIUM PURCHASES =================
function loadPremiumPurchases() {
    const tbody = document.getElementById("premiumPurchaseBody");
    if (!tbody) return;

    const purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];

    tbody.innerHTML = "";

    if (purchases.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center">
                    No premium purchases found
                </td>
            </tr>`;
        return;
    }

    purchases.forEach((p, index) => {
        const user = users.find(u => u.id === p.userId);
        const course = courses.find(c => c.id === p.courseId);

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${user ? user.name : "User Deleted"}</td>
                <td>${user ? user.email : "-"}</td>
                <td>${course ? course.name : "Course Removed"}</td>
                <td>${new Date(p.purchasedAt || p.subscribedAt).toLocaleString()}</td>
            </tr>
        `;
    });
}

// ================= OVERVIEW =================
function loadOverviewStats() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];

    setText("totalStudents", users.length);
    setText("totalCategories", categories.length);
    setText("totalCourses", courses.length);
    setText("totalPremium", purchases.length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

window.logoutAdmin = logoutAdmin;
