const toast = document.getElementById("toast");

export function showToast(message, success = false) {
  toast.textContent = message;
  toast.style.backgroundColor = success ? "#4CAF50" : "#f44336";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

export function logoutUser() {
  localStorage.removeItem("user");
  showToast("Logged out successfully", true);

  // Update UI elements if they exist
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const profileInfo = document.getElementById("profileInfo");

  if (logoutBtn) logoutBtn.hidden = true;
  if (profileInfo) profileInfo.style.display = "none";
  if (loginLink) loginLink.style.display = "inline";
  if (registerLink) registerLink.style.display = "inline";

  // Redirect after short delay so user sees the toast
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
}


export function setupUserUI() {
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const profileInfo = document.getElementById("profileInfo");

  let user = null;

  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      user = Array.isArray(parsed) ? parsed[0] : parsed;
    }
  } catch (e) {
    user = null;
  }

  if (!user) {
    if (logoutBtn) logoutBtn.hidden = true;
    if (profileInfo) profileInfo.style.display = "none";
    if (loginLink) loginLink.style.display = "inline";
    if (registerLink) registerLink.style.display = "inline";
    window.location.href = "/login";
  } else {
    if (logoutBtn) {
      logoutBtn.hidden = false;
      logoutBtn.addEventListener("click", logoutUser);
    }
    if (profileInfo && user.username) {
      profileInfo.textContent = `👤 ${user.username}`;
      profileInfo.style.display = "inline";
    }
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
  }
}
