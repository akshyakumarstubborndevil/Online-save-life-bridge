
/* ==========================================================================
   Online Save Life Bridge - Authentication
   Login | Register | Logout | Session Management
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // DOM ELEMENTS
  const authScreen = document.getElementById("authScreen");

  const loginTab = document.getElementById("showLogin");
  const registerTab = document.getElementById("showRegister");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");

  const logoutButton = document.getElementById("btnLogout");

  // --------------------------------------------------
  // SHOW LOGIN / REGISTER PAGE
  // --------------------------------------------------

  function showLogin() {
    loginTab?.classList.add("active");
    registerTab?.classList.remove("active");

    loginForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");

    clearMessages();
  }

  function showRegister() {
    registerTab?.classList.add("active");
    loginTab?.classList.remove("active");

    registerForm?.classList.remove("hidden");
    loginForm?.classList.add("hidden");

    clearMessages();
  }

  loginTab?.addEventListener("click", showLogin);
  registerTab?.addEventListener("click", showRegister);

  // --------------------------------------------------
  // MESSAGE HANDLING
  // --------------------------------------------------

  function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = "auth-message " + type;
  }

  function clearMessages() {
    if (loginMessage) {
      loginMessage.textContent = "";
      loginMessage.className = "auth-message";
    }

    if (registerMessage) {
      registerMessage.textContent = "";
      registerMessage.className = "auth-message";
    }
  }

  // --------------------------------------------------
  // API REQUEST HELPER
  // --------------------------------------------------

  async function apiRequest(url, data = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error ||
        "Something went wrong. Please try again."
      );
    }

    return result;
  }

  // --------------------------------------------------
  // AUTHENTICATION SUCCESS
  // --------------------------------------------------

  function authenticationSuccess(user) {
    window.currentUser = user;

    document.body.classList.remove("auth-locked");

    if (authScreen) {
      authScreen.classList.add("hidden");
    }

    if (logoutButton) {
      logoutButton.classList.remove("hidden");
    }

    // Notify app.js that the user is authenticated
    window.dispatchEvent(
      new CustomEvent("savelife:authenticated", {
        detail: { user: user }
      })
    );
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessages();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    if (!email || !password) {
      showMessage(loginMessage, "Please enter email and password.");
      return;
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
      }

      const result = await apiRequest("/api/login", {
        email,
        password
      });

      if (!result.user) {
        throw new Error("Login response did not contain user details.");
      }

      showMessage(loginMessage, "Login successful!", "success");

      authenticationSuccess(result.user);

    } catch (error) {
      showMessage(
        loginMessage,
        error.message || "Login failed. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
      }
    }
  });

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessages();

    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const role = document.getElementById("registerRole")?.value;

    if (!name || !email || !password || !role) {
      showMessage(registerMessage, "Please fill all the fields.");
      return;
    }

    if (password.length < 6) {
      showMessage(
        registerMessage,
        "Password must contain at least 6 characters."
      );
      return;
    }

    const submitButton = registerForm.querySelector(
      'button[type="submit"]'
    );

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
      }

      const result = await apiRequest("/api/register", {
        name,
        email,
        password,
        role
      });

      if (!result.user) {
        throw new Error("Registration response did not contain user details.");
      }

      showMessage(
        registerMessage,
        "Account created successfully!",
        "success"
      );

      authenticationSuccess(result.user);

    } catch (error) {
      showMessage(
        registerMessage,
        error.message || "Registration failed. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
      }
    }
  });

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  logoutButton?.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      window.currentUser = null;
      window.location.reload();

    } catch (error) {
      alert(error.message || "Unable to logout. Please try again.");
    }
  });

  // --------------------------------------------------
  // CHECK EXISTING LOGIN SESSION
  // --------------------------------------------------

  async function checkExistingSession() {
    document.body.classList.add("auth-locked");

    if (authScreen) {
      authScreen.classList.remove("hidden");
    }

    try {
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("No active session.");
      }

      const result = await response.json();

      if (result.user) {
        authenticationSuccess(result.user);
      } else {
        window.currentUser = null;
        showLogin();
      }

    } catch (error) {
      window.currentUser = null;
      showLogin();
    }
  }

  // --------------------------------------------------
  // INITIALIZE AUTHENTICATION
  // --------------------------------------------------

  if (logoutButton) {
    logoutButton.classList.add("hidden");
  }

  checkExistingSession();

});
