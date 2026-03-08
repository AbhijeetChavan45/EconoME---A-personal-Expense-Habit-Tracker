// 🔥 Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔑 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCpEEdCpeKOcVvNjyjzw_lUS7C2EOKqWxM",
  authDomain: "econome-671d3.firebaseapp.com",
  projectId: "econome-671d3",
  storageBucket: "econome-671d3.appspot.com",
  messagingSenderId: "1024825049255",
  appId: "1:1024825049255:web:7c8c0f8c7f8c7f8c7f8c7f"
};

// 🔥 Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 Elements
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

// 🚀 Login Logic
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  errorMsg.textContent = "";

  // 🧠 Basic validation
  if (!email || !password) {
    errorMsg.textContent = "Please enter email and password";
    return;
  }

  try {
    // 🔄 Loading state
    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;

    await signInWithEmailAndPassword(auth, email, password);

    // ✅ Success → redirect
    window.location.href = "dashboard.html";

  } catch (error) {
    // ❌ Clean error messages
    if (error.code === "auth/invalid-credential") {
      errorMsg.textContent = "Invalid email or password";
    } else if (error.code === "auth/user-not-found") {
      errorMsg.textContent = "User not found";
    } else if (error.code === "auth/wrong-password") {
      errorMsg.textContent = "Wrong password";
    } else {
      errorMsg.textContent = "Login failed. Try again.";
    }
  } finally {
    loginBtn.textContent = "Login";
    loginBtn.disabled = false;
  }
});



//  Toggle Password
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  togglePassword.textContent = type === "password" ? "👁" : "🙈";
});