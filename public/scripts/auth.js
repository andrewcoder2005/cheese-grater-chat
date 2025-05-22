import { showToast } from "./utilies.js";
const form =
  document.getElementById("register-form") ||
  document.getElementById("login-form");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showToast("Form submit prevented, starting login/register...", true);

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const isRegister = form.id === "register-form";
    const endpoint = isRegister ? "/register" : "/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("Response status:", res.status);

      const result = await res.json();
      console.log("Response JSON:", result);
// This respone will work for both login and register
      if (res.ok) {
        showToast(
          isRegister ? "User registered successfully!" : "Login successful!",
          true
        );
// If the user is already registered, and the login status is successful, we will store the user data in localStorage 
        if (!isRegister && result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
          localStorage.setItem("username", result.user.username);
          localStorage.setItem("userId", result.user.id);
          console.log("User data stored in localStorage:", result.user);
        }

        form.reset();

        setTimeout(() => {
          showToast("Redirecting to " + (isRegister ? "/login" : "/"), true);
          window.location.href = isRegister ? "/login" : "/";
        }, 3000);
      } else {
        showToast("Error: " + (result.error || "Unknown error"));
        console.error(result.error);
      }
    } catch (err) {
      showToast(err.message || "Network error");
      console.error(err);
    }
  });
}
