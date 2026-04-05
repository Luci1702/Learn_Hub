function loginUser() {
    const email = document.getElementById("uEmail").value.trim();
    const password = document.getElementById("uPassword1").value.trim();

    if (!email || !password) {
        showToast("Please fill all fields", "warning");
        return;
    }

    // Admin credentials shortcut (no separate admin login page needed)
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "admin123";

    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem("learnhub_admin_logged_in", "true");
        localStorage.setItem("learnhub_admin_session_time", Date.now());
        localStorage.setItem("learnhub_admin_username", ADMIN_USERNAME);
        window.location.replace("../../admin/HTML/admindashboard.html");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        showToast("Invalid email or password", "error");
        return;
    }

    // Session info
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUserId", user.id);

    showToast(`Welcome ${user.name}`, "success");
    window.location.replace("home.html");
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

function showToast(message, type = "info", duration = 3500) {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

function initTheme() {
    document.body.dataset.theme = "light";
}

document.addEventListener("DOMContentLoaded", initTheme);
