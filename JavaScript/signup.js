// 🔥 Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔑 Config
const firebaseConfig = {
  apiKey: "AIzaSyCpEEdCpeKOcVvNjyjzw_lUS7C2EOKqWxM",
  authDomain: "econome-671d3.firebaseapp.com",
  projectId: "econome-671d3",
  storageBucket: "econome-671d3.appspot.com",
  messagingSenderId: "1024825049255",
  appId: "1:1024825049255:web:7c8c0f8c7f8c7f8c7f8c7f"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elements
const signupBtn = document.getElementById("signupBtn");
const errorMsg = document.getElementById("errorMsg");

// Signup Logic
signupBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  errorMsg.textContent = "";

  if (!name || !email || !password) {
    errorMsg.textContent = "Please fill all fields";
    return;
  }

  try {
    signupBtn.textContent = "Creating...";
    signupBtn.disabled = true;

    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // 🔥 Save name in Firebase
    await updateProfile(userCred.user, {
      displayName: name
    });

    alert("Account created successfully!");
    window.location.href = "login.html";

  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      errorMsg.textContent = "Email already registered";
    } else if (error.code === "auth/weak-password") {
      errorMsg.textContent = "Password must be at least 6 characters";
    } else {
      errorMsg.textContent = "Signup failed";
    }
  } finally {
    signupBtn.textContent = "Sign Up";
    signupBtn.disabled = false;
  }
});
// Toggle Password
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  togglePassword.textContent = type === "password" ? "👁" : "🙈";
});