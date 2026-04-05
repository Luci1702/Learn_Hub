(() => {
    const loginKey = "isLoggedIn";
    const userId = localStorage.getItem("currentUserId");
    const isLoggedIn = localStorage.getItem(loginKey) === "true";

    if (!isLoggedIn || !userId) {
        window.location.replace("../HTML/login.html");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((u) => u.id === userId);
    if (!user) {
        window.location.replace("../HTML/login.html");
        return;
    }

    const usernameEl = document.getElementById("feedbackUserName");
    if (usernameEl) {
        usernameEl.textContent = user.name;
    }

    const courseSelect = document.getElementById("feedbackCourse");
    const contentSelect = document.getElementById("feedbackContent");
    const messageInput = document.getElementById("feedbackMessage");
    const form = document.getElementById("feedbackForm");

    const courses = JSON.parse(localStorage.getItem("courses")) || [];
    const contents = JSON.parse(localStorage.getItem("contents")) || [];

    function renderCourses() {
        if (!courseSelect) return;
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        courses.forEach((course) => {
            const option = document.createElement("option");
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    }

    function renderContents(courseId) {
        if (!contentSelect) return;
        contentSelect.innerHTML = '<option value="">Select Content</option>';
        const filtered = contents.filter((item) => item.courseId === courseId);
        if (!filtered.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No content available";
            option.disabled = true;
            contentSelect.appendChild(option);
            return;
        }
        filtered.forEach((content) => {
            const option = document.createElement("option");
            option.value = content.id;
            option.textContent = content.title;
            contentSelect.appendChild(option);
        });
    }

    function showNotice(message, type = "success") {
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("show"));

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }

    function saveFeedback(entry) {
        const feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
        feedbacks.unshift(entry);
        localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
    }

    renderCourses();
    renderContents("");

    if (courseSelect) {
        courseSelect.addEventListener("change", (event) => {
            renderContents(event.target.value);
        });
    }

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const courseId = courseSelect ? courseSelect.value : "";
            const contentId = contentSelect ? contentSelect.value : "";
            const message = messageInput ? messageInput.value.trim() : "";

            if (!courseId || !contentId || !message) {
                showNotice("Please complete all fields.", "warning");
                return;
            }

            const course = courses.find((c) => c.id === courseId);
            const content = contents.find((c) => c.id === contentId);

            const entry = {
                id: `feedback_${Date.now()}`,
                userId: user.id,
                userName: user.name,
                courseId,
                courseName: course ? course.name : "Unknown",
                contentId,
                contentTitle: content ? content.title : "Unknown",
                message,
                createdAt: new Date().toISOString()
            };

            saveFeedback(entry);
            form.reset();
            renderContents("");
            showNotice("Feedback submitted successfully.", "success");
        });
    }
})();
