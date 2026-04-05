let registerData = {
    userName: '',
    userEmail: '',
    userPassword: '',
};

function onchangeInput(e) {
    const { name, value } = e.target;
    registerData = { ...registerData, [name]: value };
}

function registerUser(e) {
    e.preventDefault();

    if (!registerData.userName || !registerData.userEmail || !registerData.userPassword) {
        showToast("Please fill all fields", "warning");
        return;
    }

    if (!validatePasswords()) return;

    // Get users DB
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Prevent duplicate email
    if (users.some(u => u.email === registerData.userEmail)) {
        showToast("User already exists with this email", "error");
        return;
    }

    // Create user
    const newUser = {
        id: "u_" + Date.now(),
        name: registerData.userName,
        email: registerData.userEmail,
        password: registerData.userPassword,
        role: "student"
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    showToast("Registration successful", "success");
    window.location.href = "login.html";
}

function validatePasswords() {
    const pwd1 = document.getElementById("uPassword1").value;
    const pwd2 = document.getElementById("uPassword2").value;

    if (!pwd1 || !pwd2) {
        showToast("Fill both password fields", "warning");
        return false;
    }

    if (pwd1 !== pwd2) {
        showToast("Passwords do not match", "error");
        return false;
    }
    return true;
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
