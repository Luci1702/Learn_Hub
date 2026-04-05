const ROUTES = {
    dashboard: "../HTML/home.html",
    categories: "../HTML/categories.html",
    courses: "../HTML/courses.html",
    lessons: "../HTML/lessons.html",
    quiz: "../HTML/quiz.html",
    profile: "../HTML/userProfile.html",
    login: "../HTML/login.html"
};

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

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

window.addEventListener("DOMContentLoaded", () => {
    initTheme();

    const user = requireAuth();
    if (!user) {
        return;
    }

    setupHeader(user);
    setupBackToTop();
    setupRevealAnimation();
    setupSmoothScroll();

    const page = document.body.dataset.page || "dashboard";

    if (page === "dashboard") {
        renderDashboardStats();
        renderDashboardCategories();
    }

    if (page === "categories") {
        loadCategoriesPage();
    }

    if (page === "courses") {
        setupCourseSearch();
        loadCoursesPage();
        handleSubscribeRedirect();
        setupDecisionModal();
    }

    if (page === "lessons") {
        loadLessonsPage();
    }

    if (page === "quiz") {
        loadQuizPage();
    }
});

function requireAuth() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentUserId = localStorage.getItem("currentUserId");

    if (!isLoggedIn || !currentUserId) {
        window.location.replace(ROUTES.login);
        return null;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((item) => item.id === currentUserId);

    if (!user) {
        logoutUser();
        return null;
    }

    return user;
}

function setupHeader(user) {
    const userBtn = document.getElementById("userBtn");
    const dropdown = document.querySelector(".dropdown");
    const welcomeName = document.getElementById("welcomeName");

    if (userBtn) {
        userBtn.textContent = user.name;
        userBtn.setAttribute("data-initials", getInitials(user.name));
        userBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdown?.classList.toggle("show");
        });
    }

    if (welcomeName) {
        welcomeName.textContent = user.name;
    }

    if (dropdown) {
        document.addEventListener("click", () => dropdown.classList.remove("show"));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                dropdown.classList.remove("show");
            }
        });
    }
}

function getInitials(name) {
    if (!name) return "U";
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase())
        .slice(0, 2)
        .join("");
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const targetId = anchor.getAttribute("href").slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function setupBackToTop() {
    const backToTop = document.getElementById("backToTop");
    if (!backToTop) return;

    const toggleBackToTop = () => {
        backToTop.classList.toggle("show", window.scrollY > 280);
    };

    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop);
    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function setupRevealAnimation() {
    const revealItems = document.querySelectorAll(".reveal");
    if (!revealItems.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
}

function renderDashboardStats() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const currentUserId = localStorage.getItem("currentUserId");
    const enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const userEnrollments = enrollments.filter((item) => item.userId === currentUserId);

    setText("statCategories", categories.length);
    setText("statCourses", courses.length);
    setText("statLessons", contents.length);
    setText("statEnrolled", userEnrollments.length);
}

function renderDashboardCategories() {
    const container = document.getElementById("dashboardCourseContainer");
    const emptyState = document.getElementById("dashboardCourseEmpty");
    if (!container) return;

    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    container.innerHTML = "";
    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    if (!categories.length) {
        if (emptyState) {
            emptyState.classList.remove("hidden");
        }
        return;
    }

    categories.forEach((category, index) => {
        const card = document.createElement("div");
        card.className = "card category-card reveal";
        card.style.animationDelay = `${index * 80}ms`;

        const imageUrl = category.imageUrl || "";
        const thumbnailMarkup = imageUrl
            ? `<div class="course-thumb"><img src="${imageUrl}" alt="${category.name} image"></div>`
            : `<div class="course-thumb placeholder">Category Preview</div>`;

        card.innerHTML = `
            ${thumbnailMarkup}
            <h4>${category.name}</h4>
            <p>Browse courses in this category.</p>
            <div class="course-footer">
                <button class="btn">View Courses</button>
            </div>
        `;

        const goToCategory = () => {
            localStorage.setItem("selectedCategoryId", category.id);
            window.location.href = ROUTES.courses;
        };

        card.addEventListener("click", goToCategory);
        const actionBtn = card.querySelector("button");
        actionBtn?.addEventListener("click", (event) => {
            event.stopPropagation();
            goToCategory();
        });

        container.appendChild(card);
    });

    setupRevealAnimation();
}

function getCourseThumbnail(courseId) {
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const courseContents = contents.filter((item) => item.courseId === courseId);
    if (!courseContents.length) return "";

    for (const lesson of courseContents) {
        if (!lesson.youtubeUrl) continue;
        const videoId = extractYouTubeId(lesson.youtubeUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }

    return "";
}

function setupPreviewModal() {
    const modal = document.getElementById("previewModal");
    if (!modal) return;

    modal.querySelectorAll("[data-modal-close]").forEach((item) => {
        item.addEventListener("click", closePreviewModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePreviewModal();
        }
    });

    const enrollBtn = document.getElementById("previewEnrollBtn");
    if (enrollBtn && !enrollBtn.dataset.bound) {
        enrollBtn.dataset.bound = "true";
        enrollBtn.addEventListener("click", () => {
            const categoryId = enrollBtn.dataset.categoryId;
            if (categoryId) {
                localStorage.setItem("selectedCategoryId", categoryId);
            }
            closePreviewModal();
            window.location.href = ROUTES.courses;
        });
    }
}

function openPreviewModal(course, category) {
    const modal = document.getElementById("previewModal");
    if (!modal) return;

    const title = document.getElementById("previewModalTitle");
    const desc = document.getElementById("previewModalDesc");
    const categoryEl = document.getElementById("previewModalCategory");
    const badge = document.getElementById("previewModalBadge");
    const enrollBtn = document.getElementById("previewEnrollBtn");
    const thumb = document.getElementById("previewModalThumb");

    if (title) title.textContent = course.name || "Course Preview";
    if (desc) desc.textContent = course.description || "No description available.";
    if (categoryEl) categoryEl.textContent = category ? category.name : "Category";
    if (badge) {
        badge.classList.toggle("hidden", !course.isPremium);
    }
    if (enrollBtn) {
        enrollBtn.dataset.categoryId = category ? category.id : "";
        enrollBtn.textContent = course.isPremium ? "Go to Subscribe" : "Go to Enroll";
    }

    if (thumb) {
        const thumbUrl = getCourseThumbnail(course.id);
        if (thumbUrl) {
            thumb.innerHTML = `<img src="${thumbUrl}" alt="${course.name} preview">`;
        } else {
            thumb.textContent = "Preview coming soon";
        }
    }

    modal.classList.add("show");
    document.body.classList.add("modal-open");
}

function closePreviewModal() {
    const modal = document.getElementById("previewModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function loadCategoriesPage() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const container = document.getElementById("categoryContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!categories.length) {
        container.innerHTML = "<p class='empty-state'>No categories available.</p>";
        return;
    }

    categories.forEach((category, index) => {
        const card = document.createElement("div");
        card.className = "card category-card reveal";
        card.style.animationDelay = `${index * 80}ms`;

        const imageUrl = category.imageUrl || "";
        const thumbnailMarkup = imageUrl
            ? `<div class="course-thumb"><img src="${imageUrl}" alt="${category.name} image"></div>`
            : `<div class="course-thumb placeholder">Category Preview</div>`;

        card.innerHTML = `
            ${thumbnailMarkup}
            <h4>${category.name}</h4>
            <p>Explore courses in this category.</p>
            <div class="course-footer">
                <button class="btn">View Courses</button>
            </div>
        `;

        const goToCategory = () => {
            localStorage.setItem("selectedCategoryId", category.id);
            window.location.href = ROUTES.courses;
        };

        card.addEventListener("click", goToCategory);
        const actionBtn = card.querySelector("button");
        actionBtn?.addEventListener("click", (event) => {
            event.stopPropagation();
            goToCategory();
        });

        container.appendChild(card);
    });

    setupRevealAnimation();
}

function loadCoursesPage() {
    const selectedCategoryId = getSelectedCategoryId();
    const title = document.getElementById("categoryTitle");
    const courseContainer = document.getElementById("courseContainer");
    const emptyState = document.getElementById("courseEmpty");

    if (!courseContainer) return;

    courseContainer.innerHTML = "";
    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const category = categories.find((item) => item.id === selectedCategoryId);
    if (title) {
        title.textContent = category ? category.name : "Selected Category";
    }

    if (!selectedCategoryId) {
        showCourseEmptyState("Choose a category first.");
        return;
    }

    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const filteredCourses = courses.filter((item) => item.categoryId === selectedCategoryId);

    if (!filteredCourses.length) {
        showCourseEmptyState("No courses found in this category.");
        return;
    }

    filteredCourses.forEach((course) => {
        const card = document.createElement("div");
        card.className = "card reveal";
        card.dataset.courseName = (course.name || "").toLowerCase();
        card.dataset.courseId = course.id;

        const isEnrolled = isEnrolledInCourse(course.id);
        const hasPremium = hasPremiumAccess(course.id);
        const canAccess = canAccessCourse(course.id);

        let buttonLabel = "Enroll in Course";
        let buttonClass = "btn";
        let buttonAction = () => enrollInCourse(course.id, course.name);

        if (isEnrolled && course.isPremium && !hasPremium) {
            buttonLabel = "Subscribe to Access";
            buttonClass = "btn warning-btn";
            buttonAction = () => subscribeToCourse(course.id, course.name);
        } else if (canAccess) {
            buttonLabel = "View Lessons";
            buttonClass = "btn success-btn";
            buttonAction = () => {
                localStorage.setItem("selectedCourseId", course.id);
                window.location.href = ROUTES.lessons;
            };
        } else if (isEnrolled && !canAccess) {
            buttonLabel = "Access Denied";
            buttonClass = "btn";
            buttonAction = null;
        }

        const badges = [
            course.isPremium ? "<span class='status-tag premium'>Premium</span>" : "",
            isEnrolled ? "<span class='status-tag enrolled'>Enrolled</span>" : "",
            hasPremium && course.isPremium ? "<span class='status-tag subscribed'>Subscribed</span>" : ""
        ].join("");

        card.innerHTML = `
            <h4>${course.name}</h4>
            <div class="status-row">${badges}</div>
            <p>${course.description || "No description available."}</p>
            <div class="course-footer">
                <button class="${buttonClass}" ${buttonAction ? "" : "disabled"}>${buttonLabel}</button>
                <small>${getCourseAccessInfo(course, isEnrolled, hasPremium)}</small>
            </div>
        `;

        const actionBtn = card.querySelector("button");
        if (actionBtn && buttonAction) {
            actionBtn.addEventListener("click", buttonAction);
        }

        courseContainer.appendChild(card);
    });

    applyCourseFilter();
    setupRevealAnimation();
}

function getSelectedCategoryId() {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("categoryId");
    if (idFromQuery) {
        localStorage.setItem("selectedCategoryId", idFromQuery);
        return idFromQuery;
    }
    return localStorage.getItem("selectedCategoryId");
}

function showCourseEmptyState(message) {
    const emptyState = document.getElementById("courseEmpty");
    if (!emptyState) return;
    emptyState.textContent = message;
    emptyState.classList.remove("hidden");
}

function handleSubscribeRedirect() {
    const subscribeToCourseId = localStorage.getItem("subscribeToCourseId");
    if (!subscribeToCourseId) return;

    localStorage.removeItem("subscribeToCourseId");
    const courseCard = document.querySelector(`[data-course-id="${subscribeToCourseId}"]`);
    if (!courseCard) return;

    courseCard.classList.add("highlight-card");
    setTimeout(() => {
        courseCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
}

function setupCourseSearch() {
    const searchInput = document.getElementById("courseSearch");
    const clearBtn = document.getElementById("clearSearch");
    if (!searchInput || !clearBtn || searchInput.dataset.bound) return;

    searchInput.dataset.bound = "true";
    searchInput.addEventListener("input", applyCourseFilter);
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        applyCourseFilter();
        searchInput.focus();
    });
}

function applyCourseFilter() {
    const searchInput = document.getElementById("courseSearch");
    const emptyState = document.getElementById("courseEmpty");
    const cards = document.querySelectorAll("#courseContainer .card");
    if (!searchInput || !cards.length) return;

    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
        const name = card.dataset.courseName || "";
        const matches = !query || name.includes(query);
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount += 1;
    });

    if (emptyState) {
        if (visibleCount === 0) {
            emptyState.textContent = "No courses match your search.";
            emptyState.classList.remove("hidden");
        } else {
            emptyState.classList.add("hidden");
        }
    }
}

function loadLessonsPage() {
    const courseId = getSelectedCourseId();
    const course = getCourseById(courseId);
    const container = document.getElementById("contentContainer");
    const courseName = document.getElementById("lessonCourseTitle");

    if (!container) return;
    container.innerHTML = "";

    if (courseName) {
        courseName.textContent = course ? course.name : "Selected Course";
    }

    if (!courseId || !course) {
        container.innerHTML = "<p class='empty-state'>Choose a course first.</p>";
        return;
    }

    if (!canAccessCourse(courseId)) {
        if (!isEnrolledInCourse(courseId)) {
            container.innerHTML = "<p class='empty-state'>Enroll in this course first.</p>";
        } else if (course.isPremium && !hasPremiumAccess(courseId)) {
            container.innerHTML = "<p class='empty-state'>This premium course requires subscription.</p>";
        } else {
            container.innerHTML = "<p class='empty-state'>Access denied.</p>";
        }
        return;
    }

    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const lessons = contents.filter((item) => item.courseId === courseId);

    if (!lessons.length) {
        container.innerHTML = "<p class='empty-state'>No lessons available.</p>";
        return;
    }

    lessons.forEach((lesson, index) => {
        const card = document.createElement("div");
        card.className = "card reveal";
        card.innerHTML = `
            <div class="lesson-head">
                <h4>${lesson.title}</h4>
                <span>Lesson ${index + 1}</span>
            </div>
            <iframe
                src="https://www.youtube.com/embed/${extractYouTubeId(lesson.youtubeUrl)}"
                title="${lesson.title}"
                allowfullscreen
            ></iframe>
            <button class="btn">Take Quiz</button>
        `;

        const action = card.querySelector("button");
        action?.addEventListener("click", () => {
            localStorage.setItem("selectedContentId", lesson.id);
            window.location.href = ROUTES.quiz;
        });

        container.appendChild(card);
    });

    setupRevealAnimation();
}

function getSelectedCourseId() {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("courseId");
    if (idFromQuery) {
        localStorage.setItem("selectedCourseId", idFromQuery);
        return idFromQuery;
    }
    return localStorage.getItem("selectedCourseId");
}

function loadQuizPage() {
    const contentId = getSelectedContentId();
    const mcqContainer = document.getElementById("mcqContainer");
    const lessonTitle = document.getElementById("quizLessonTitle");
    if (!mcqContainer) return;

    mcqContainer.innerHTML = "";

    if (!contentId) {
        mcqContainer.innerHTML = "<p class='empty-state'>Choose a lesson first.</p>";
        return;
    }

    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const content = contents.find((item) => item.id === contentId);

    if (!content) {
        mcqContainer.innerHTML = "<p class='empty-state'>Lesson not found.</p>";
        return;
    }

    if (lessonTitle) {
        lessonTitle.textContent = content.title;
    }

    if (!canAccessCourse(content.courseId)) {
        mcqContainer.innerHTML = "<p class='empty-state'>You do not have access to this quiz.</p>";
        return;
    }

    const mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    const questions = mcqs.filter((item) => item.contentId === contentId);

    if (!questions.length) {
        mcqContainer.innerHTML = "<p class='empty-state'>No quiz available for this lesson.</p>";
        return;
    }

    questions.forEach((question, index) => {
        const card = document.createElement("div");
        card.className = "card reveal";
        card.innerHTML = `
            <p><strong>Q${index + 1}. ${question.question}</strong></p>
            ${question.options
                .map(
                    (option, optionIndex) => `
                <label class="option-row">
                    <input type="radio" name="mcq-${index}" value="${optionIndex}">
                    <span>${option}</span>
                </label>
            `
                )
                .join("")}
        `;
        mcqContainer.appendChild(card);
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn submit-btn";
    submitBtn.textContent = "Submit Answers";
    submitBtn.addEventListener("click", () => submitMCQs(contentId));
    mcqContainer.appendChild(submitBtn);

    setupRevealAnimation();
}

function getSelectedContentId() {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("contentId");
    if (idFromQuery) {
        localStorage.setItem("selectedContentId", idFromQuery);
        return idFromQuery;
    }
    return localStorage.getItem("selectedContentId");
}

function hasPremiumAccess(courseId) {
    const purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    const currentUserId = localStorage.getItem("currentUserId");
    return purchases.some((item) => item.userId === currentUserId && item.courseId === courseId);
}

function isEnrolledInCourse(courseId) {
    const enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const currentUserId = localStorage.getItem("currentUserId");
    return enrollments.some((item) => item.userId === currentUserId && item.courseId === courseId);
}

function canAccessCourse(courseId) {
    const course = getCourseById(courseId);
    if (!course) return false;

    const enrolled = isEnrolledInCourse(courseId);
    if (!enrolled) return false;
    if (course.isPremium) return hasPremiumAccess(courseId);
    return true;
}

function getCourseById(courseId) {
    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    return courses.find((item) => item.id === courseId);
}

function getCourseAccessInfo(course, enrolled, hasPremium) {
    if (!enrolled) return "Enroll to access this course";
    if (course.isPremium && !hasPremium) return "Premium subscription required";
    if (canAccessCourse(course.id)) return "Full access granted";
    return "Access restricted";
}

function enrollInCourse(courseId, courseName) {
    const currentUserId = localStorage.getItem("currentUserId");
    const course = getCourseById(courseId);
    if (!course) return;

    const message = course.isPremium
        ? "This is a premium course. Enrollment is required before subscription. Proceed?"
        : "Proceed with enrollment?";

    if (isCoursesPage()) {
        openDecisionModal({
            title: `Enroll in ${courseName}`,
            message,
            confirmLabel: "Enroll Now",
            cancelLabel: "Not Now",
            onConfirm: () => {
                const enrolled = doEnroll(courseId, courseName, currentUserId, course);
                if (enrolled && course.isPremium) {
                    openDecisionModal({
                        title: "Subscribe to Unlock",
                        message: "Subscribe now for full access to this premium course?",
                        confirmLabel: "Subscribe",
                        cancelLabel: "Later",
                        onConfirm: () => subscribeToCourse(courseId, courseName)
                    });
                }
            }
        });
        return;
    }

    if (!confirm(`Enroll in course:\n\n${courseName}\n\nProceed with enrollment?`)) return;

    const enrolled = doEnroll(courseId, courseName, currentUserId, course);
    if (!enrolled) return;

    if (!course.isPremium) {
        localStorage.setItem("selectedCourseId", courseId);
        window.location.href = ROUTES.lessons;
        return;
    }

    const wantsSubscribe = confirm(
        `"${courseName}" is premium. Do you want to subscribe now for full access?`
    );
    if (wantsSubscribe) {
        subscribeToCourse(courseId, courseName);
    } else {
        loadCoursesPage();
    }
}

function subscribeToCourse(courseId, courseName) {
    const currentUserId = localStorage.getItem("currentUserId");

    if (!isEnrolledInCourse(courseId)) {
        if (isCoursesPage()) {
            openDecisionModal({
                title: "Enroll Required",
                message: `You need to enroll in "${courseName}" first.`,
                confirmLabel: "Enroll Now",
                cancelLabel: "Cancel",
                onConfirm: () => enrollInCourse(courseId, courseName)
            });
            return;
        }

        const enrollFirst = confirm(
            `You need to enroll in "${courseName}" first. Enroll and continue?`
        );
        if (enrollFirst) {
            enrollInCourse(courseId, courseName);
        }
        return;
    }

    if (isCoursesPage()) {
        openDecisionModal({
            title: `Subscribe to ${courseName}`,
            message: "Subscribe for full access to premium content?",
            confirmLabel: "Subscribe",
            cancelLabel: "Not Now",
            onConfirm: () => doSubscribe(courseId, courseName, currentUserId)
        });
        return;
    }

    const confirmed = confirm(
        `Premium subscription:\n\n${courseName}\n\nSubscribe for full access?`
    );
    if (!confirmed) return;

    const purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    const alreadySubscribed = purchases.some(
        (item) => item.userId === currentUserId && item.courseId === courseId
    );

    if (alreadySubscribed) {
        showToast("You are already subscribed to this course.", "warning");
        return;
    }

    purchases.push({
        userId: currentUserId,
        courseId,
        courseName,
        subscribedAt: new Date().toISOString()
    });
    localStorage.setItem("premiumPurchases", JSON.stringify(purchases));

    showToast(`Successfully subscribed to "${courseName}".`, "success");
    localStorage.setItem("selectedCourseId", courseId);
    window.location.href = ROUTES.lessons;
}

function doEnroll(courseId, courseName, currentUserId, course) {
    const enrollments = JSON.parse(localStorage.getItem("courseEnrollments")) || [];
    const alreadyEnrolled = enrollments.some(
        (item) => item.userId === currentUserId && item.courseId === courseId
    );

    if (alreadyEnrolled) {
        showNotice("You are already enrolled in this course.", "warning");
        return false;
    }

    enrollments.push({
        userId: currentUserId,
        courseId,
        courseName,
        enrolledAt: new Date().toISOString(),
        isPremium: !!course.isPremium,
        progress: 0
    });
    localStorage.setItem("courseEnrollments", JSON.stringify(enrollments));

    showNotice(`Enrolled in "${courseName}".`, "success");
    if (isCoursesPage()) {
        loadCoursesPage();
    }
    return true;
}

function doSubscribe(courseId, courseName, currentUserId) {
    const purchases = JSON.parse(localStorage.getItem("premiumPurchases")) || [];
    const alreadySubscribed = purchases.some(
        (item) => item.userId === currentUserId && item.courseId === courseId
    );

    if (alreadySubscribed) {
        showNotice("You are already subscribed to this course.", "warning");
        return false;
    }

    purchases.push({
        userId: currentUserId,
        courseId,
        courseName,
        subscribedAt: new Date().toISOString()
    });
    localStorage.setItem("premiumPurchases", JSON.stringify(purchases));

    showNotice(`Subscribed to "${courseName}".`, "success");
    localStorage.setItem("selectedCourseId", courseId);
    window.location.href = ROUTES.lessons;
    return true;
}

function setupDecisionModal() {
    const modal = document.getElementById("decisionModal");
    if (!modal) return;

    modal.querySelectorAll("[data-decision-close]").forEach((item) => {
        item.addEventListener("click", closeDecisionModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDecisionModal();
        }
    });
}

function openDecisionModal({ title, message, confirmLabel, cancelLabel, onConfirm }) {
    const modal = document.getElementById("decisionModal");
    if (!modal) return;

    const titleEl = document.getElementById("decisionTitle");
    const messageEl = document.getElementById("decisionMessage");
    const confirmBtn = document.getElementById("decisionConfirmBtn");
    const cancelBtn = document.getElementById("decisionCancelBtn");

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmLabel || "Confirm";
    if (cancelBtn) cancelBtn.textContent = cancelLabel || "Cancel";

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            closeDecisionModal();
            onConfirm?.();
        };
    }

    modal.classList.add("show");
    document.body.classList.add("modal-open");
}

function closeDecisionModal() {
    const modal = document.getElementById("decisionModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

function showNotice(message, type) {
    const notice = document.getElementById("courseNotice");
    if (!notice) return;

    notice.textContent = message;
    notice.classList.remove("hidden");
    notice.classList.toggle("warning", type === "warning");

    clearTimeout(notice.dataset.timeout);
    const timeout = setTimeout(() => notice.classList.add("hidden"), 4000);
    notice.dataset.timeout = timeout;
}

function isCoursesPage() {
    return document.body.dataset.page === "courses";
}

function submitMCQs(contentId) {
    const mcqs = JSON.parse(localStorage.getItem("mcqs")) || [];
    const filtered = mcqs.filter((item) => item.contentId === contentId);
    const currentUserId = localStorage.getItem("currentUserId");
    const contents = JSON.parse(localStorage.getItem("contents")) || [];
    const content = contents.find((item) => item.id === contentId);

    if (!filtered.length) {
        showToast("No quiz available.", "warning");
        return;
    }

    let score = 0;
    const userAnswers = [];

    filtered.forEach((question, index) => {
        const selected = document.querySelector(`input[name="mcq-${index}"]:checked`);
        const selectedIndex = selected ? Number(selected.value) : -1;
        const isCorrect = selected && selectedIndex === question.correctIndex;

        if (isCorrect) {
            score += 1;
        }

        userAnswers.push({
            questionIndex: index,
            selected: selectedIndex,
            correct: question.correctIndex,
            isCorrect
        });
    });

    const attempts = JSON.parse(localStorage.getItem("quizAttempts")) || [];
    const existingIndex = attempts.findIndex(
        (item) => item.userId === currentUserId && item.contentId === contentId
    );

    const attemptData = {
        userId: currentUserId,
        contentId,
        contentTitle: content ? content.title : `Quiz ${contentId}`,
        score,
        total: filtered.length,
        percentage: Math.round((score / filtered.length) * 100),
        userAnswers,
        completedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
        attempts[existingIndex] = attemptData;
    } else {
        attempts.push(attemptData);
    }

    localStorage.setItem("quizAttempts", JSON.stringify(attempts));

    const resultMessage =
        `Quiz Completed\n\nScore: ${score}/${filtered.length}\n` +
        `Percentage: ${attemptData.percentage}%\n\nProgress saved to your profile.`;
    showToast(resultMessage, "success", 6000);

    const mcqContainer = document.getElementById("mcqContainer");
    if (mcqContainer) {
        mcqContainer.querySelectorAll("input[type='radio']")
            .forEach((input) => {
                input.checked = false;
            });
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

function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("subscribeToCourseId");
    localStorage.removeItem("selectedCategoryId");
    localStorage.removeItem("selectedCourseId");
    localStorage.removeItem("selectedContentId");
    window.location.replace(ROUTES.login);
}
