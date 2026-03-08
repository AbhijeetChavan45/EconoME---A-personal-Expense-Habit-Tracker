let editingExpenseId = null;

//  firebase auth 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpEEdCpeKOcVvNjyjzw_lUS7C2EOKqWxM",
  authDomain: "econome-671d3.firebaseapp.com",
  projectId: "econome-671d3",
  storageBucket: "econome-671d3.appspot.com",
  messagingSenderId: "1024825049255",
  appId: "1:1024825049255:web:7c8c0f8c7f8c7f8c7f8c7f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//  Check user
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../HTML/login.html";
  } else {
    console.log("User logged in:", user.email);
    showGreeting(user);
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../HTML/login.html";
});

// greetingfunction

function showGreeting(user) {
  const name = user.displayName || "User";

  const hour = new Date().getHours();
  let greeting = "";

  if (hour < 12) {
    greeting = "Good Morning ☀️";
  } else if (hour < 18) {
    greeting = "Good Afternoon 🌤";
  } else {
    greeting = "Good Evening 🌙";
  }

  const greetText = document.getElementById("greetingText");

  if (greetText) {
    greetText.textContent = `${greeting}, ${name}`;
  }
}



function getIncome() {
  return Number(localStorage.getItem("econome_income")) || 0;
}

function saveIncome(amount) {
  localStorage.setItem("econome_income", amount);
}
//monthly salary reset 
function checkMonthReset() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const savedMonth = localStorage.getItem("econome_month");
  const savedYear = localStorage.getItem("econome_year");

  if (savedMonth === null) {
    localStorage.setItem("econome_month", currentMonth);
    localStorage.setItem("econome_year", currentYear);
  } else if (
    Number(savedMonth) !== currentMonth ||
    Number(savedYear) !== currentYear
  ) {
    // NEW MONTH 🔥
    localStorage.setItem("econome_month", currentMonth);
    localStorage.setItem("econome_year", currentYear);

    localStorage.setItem("econome_expenses", JSON.stringify([]));

    console.log("New month → expenses reset");
  }
}



// habit function
function getHabits() {
  return JSON.parse(localStorage.getItem("econome_habits")) || [];
}

function saveHabits(habits) {
  localStorage.setItem("econome_habits", JSON.stringify(habits));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// LOCALSTORAGE HELPERS
function getExpenses() {
  return JSON.parse(localStorage.getItem("econome_expenses")) || [];
}

function saveExpenses(expenses) {
  localStorage.setItem("econome_expenses", JSON.stringify(expenses));
}

// BUTTON CLICKS
const addExpenseBtn = document.querySelector(".primary");

// ADD EXPENSE DRAWER LOGIC
const drawer = document.querySelector(".expense-drawer");
const overlay = document.querySelector(".overlay");
const closeDrawerBtn = document.querySelector(".close-drawer");

// open drawer
// addExpenseBtn.addEventListener("click", () => {
//   drawer.classList.add("show");
//   drawer.classList.remove("hidden");
//   overlay.classList.remove("hidden");
// });

// close drawer
function closeDrawer() {
  drawer.classList.remove("show");
  overlay.classList.add("hidden");
  editingExpenseId = null;
}

closeDrawerBtn.addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

// CATEGORY PILL TOGGLE
const pills = document.querySelectorAll(".category-pills button");

pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
  });
});

const expenseForm = document.querySelector(".expense-form");

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = Number(
    expenseForm.querySelector('input[type="number"]').value,
  );
  const date = expenseForm.querySelector('input[type="date"]').value;
  const note = expenseForm.querySelector('input[type="text"]').value;
  const category = document.querySelector(
    ".category-pills .active",
  ).textContent;

  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }

  let expenses = getExpenses();

  if (editingExpenseId) {
    // EDIT MODE
    expenses = expenses.map((exp) =>
      exp.id === editingExpenseId
        ? { ...exp, amount, date, note, category }
        : exp,
    );
  } else {
    // ADD MODE
    expenses.push({
      id: Date.now().toString(),
      amount,
      category,
      date,
      note,
    });
  }

  saveExpenses(expenses);

  editingExpenseId = null;
  expenseForm.reset();
  pills.forEach((p) => p.classList.remove("active"));
  pills[0].classList.add("active");

  closeDrawer();
  updateDashboard();
});

function updateDashboard() {
  const expenses = getExpenses();

  const monthlyEl = document.getElementById("monthly");
  const incomeAmountEl = document.getElementById("incomeAmount");

  const savingsEl = document.getElementById("savings");
  const expenseList = document.getElementById("expenseItems");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalSpent = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const income = getIncome();
  const budget = Number(localStorage.getItem("econome_budget")) || 0;
const savingsGoal = Number(localStorage.getItem("econome_savingsGoal")) || 0;
  const savings = income - totalSpent;

  const budgetFill = document.getElementById("budgetFill");
  const budgetPercent = document.getElementById("budgetPercent");

  let percent = 0;

  if (income > 0) {
    percent = Math.min((totalSpent / income) * 100, 100);
  }

  budgetFill.style.width = percent + "%";
  budgetPercent.textContent = `${percent.toFixed(0)}% of income used`;

  monthlyEl.textContent = `₹${totalSpent}`;
  incomeAmountEl.textContent = `₹${income}`;
  savingsEl.textContent = `₹${savings}`;

  // inside card colors

  if (percent >= 90) {
  budgetFill.style.background = "#ef4444"; // red
} else if (percent >= 70) {
  budgetFill.style.background = "#f59e0b"; // orange
} else {
  budgetFill.style.background = "var(--accent)";
}
// savings color

  if (savings < 0) {
    savingsEl.classList.remove("positive");
    savingsEl.style.color = "#ef4444";
  } else {
    savingsEl.classList.add("positive");
  }

  // ----- EXPENSE LIST -----
  expenseList.innerHTML = "";

  if (expenses.length === 0) {
    expenseList.innerHTML = `<li class="expense-item empty">
    <div class="expense-left">
      <span class="expense-category">No expenses yet</span>
      <span class="expense-note">Start tracking your money 💸</span>
    </div>
  </li>`;
    return;
  }

  // show latest 5 expenses
  expenses
    .slice(-5)
    .reverse()
    .forEach((exp) => {
      const li = document.createElement("li");
      li.className = "expense-item";

      li.innerHTML = `
  <div class="expense-left">
    <span class="expense-category badge">${exp.category}</span>
    <span class="expense-note">${exp.note || exp.date}</span>
  </div>
  <div class="expense-right">
    <span class="expense-amount">₹${exp.amount}</span>
  </div>
`;

      expenseList.appendChild(li);
    });

    // streaks
 const streak = calculateUserStreak();
const rank = getRank(streak);

document.getElementById("streakNumber").textContent = streak;
document.getElementById("streakRank").textContent = rank;

  // renderCategorySummary(expenses);
  renderCategoryBreakdown(expenses);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-expense")) {
    const id = e.target.dataset.id;

    let expenses = getExpenses();
    expenses = expenses.filter((exp) => exp.id !== id);

    saveExpenses(expenses);
    updateDashboard();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-expense")) {
    const id = e.target.dataset.id;
    const expenses = getExpenses();
    const expense = expenses.find((exp) => exp.id === id);

    if (!expense) return;

    editingExpenseId = id;

    // fill form
    expenseForm.querySelector('input[type="number"]').value = expense.amount;
    expenseForm.querySelector('input[type="date"]').value = expense.date;
    expenseForm.querySelector('input[type="text"]').value = expense.note;

    // set active category
    pills.forEach((pill) => {
      pill.classList.toggle("active", pill.textContent === expense.category);
    });

    drawer.classList.add("show");
    drawer.classList.remove("hidden");
    overlay.classList.remove("hidden");
  }
});



const background = document.querySelector(".bg");
const incomeModal = document.querySelector(".income-modal");
const incomeInput = document.getElementById("incomeInput");
const incomeAmountEl = document.getElementById("incomeAmount");
const editIncomeBtn = document.querySelector(".edit-income");
const saveIncomeBtn = document.querySelector(".save-income");
const cancelIncomebtn = document.querySelector(".cancel");

// open modal
editIncomeBtn.addEventListener("click", () => {
  incomeInput.value = getIncome() || "";
  incomeModal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  background.style.display = "flex";
});

saveIncomeBtn.addEventListener("click", () => {
  background.style.display = "none";
});
cancelIncomebtn.addEventListener("click", () => {
  background.style.display = "none";
  incomeModal.classList.add("hidden");
  overlay.classList.add("hidden");
});

// save income
saveIncomeBtn.addEventListener("click", () => {
  const amount = Number(incomeInput.value);

  if (!amount || amount <= 0) {
    alert("Enter valid income");
    return;
  }

  saveIncome(amount);
  incomeModal.classList.add("hidden");
  overlay.classList.add("hidden");

  updateDashboard();
});

// close on overlay
overlay.addEventListener("click", () => {
  incomeModal.classList.add("hidden");
});

function renderCategoryBreakdown(expenses) {
  const container = document.getElementById("categoryBars");
  if (!container) return;

  container.innerHTML = "";

  if (expenses.length === 0) {
    container.innerHTML = `<span class="expense-note">No category data yet</span>`;
    return;
  }

  const totals = {};
  expenses.forEach((exp) => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });

  const max = Math.max(...Object.values(totals));

  Object.entries(totals).forEach(([category, amount]) => {
    const percent = (amount / max) * 100;

    const div = document.createElement("div");
    div.className = "category-bar";

    div.innerHTML = `
      <label>${category} • ₹${amount}</label>
      <div class="bar-track">
        <div class="bar-fill"></div>
      </div>
    `;

    container.appendChild(div);

    // animate
    requestAnimationFrame(() => {
      div.querySelector(".bar-fill").style.width = percent + "%";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkMonthReset();
  updateDashboard();
  renderTodayHabitsPreview();
  renderDashboardTodayTasks(); 
  const taskList = document.getElementById("dashboardTodayTasks");
if (taskList) {
  taskList.addEventListener("click", () => {
    window.location.href = "today.html";
  });
}
});
const openTodayBtn = document.querySelector(".open-today-btn");

if (openTodayBtn) {
  openTodayBtn.addEventListener("click", () => {
    window.location.href = "today.html";
  });
}
// render habits
function renderTodayHabitsPreview() {
  const habits = JSON.parse(localStorage.getItem("econome_habits")) || [];
  const today = new Date().toISOString().split("T")[0];

  const list = document.querySelector(".habit-list");
  if (!list) return;

  list.innerHTML = "";

  const pendingDaily = habits.filter(
    h => h.frequency === "daily" && !h.history?.[today]
  );

  if (pendingDaily.length === 0) {
    list.innerHTML = `
      <li class="habit-item done">
        All habits completed 
      </li>
    `;
    return;
  }
  list.addEventListener("click", () => {
  window.location.href = "today.html";
});

  pendingDaily.slice(0, 3).forEach(habit => {
    const li = document.createElement("li");
    li.className = "habit-item";
    li.textContent = habit.name;
    list.appendChild(li);
  });
}

//  streak logic 
function calculateUserStreak() {
  const habits = JSON.parse(localStorage.getItem("econome_habits")) || [];

  let streak = 0;
  let day = new Date();

  while (true) {
    const key = day.toISOString().split("T")[0];

    const didComplete = habits.some(
      h => h.history?.[key] === "done"
    );

    if (didComplete) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
function getRank(streak) {
  if (streak >= 60) return "💎 Diamond";
  if (streak >= 30) return "🥇 Gold";
  if (streak >= 15) return "🥈 Silver";
  if (streak >= 7) return "🥉 Bronze";
  return "Starter";
}

//  render tasks 
function renderDashboardTodayTasks() {
  const todayKey = `econome_today_${new Date().toISOString().split("T")[0]}`;
  const todayData = JSON.parse(localStorage.getItem(todayKey)) || {};

  const list = document.getElementById("dashboardTodayTasks");
  if (!list) return;

  list.innerHTML = "";

  const tasks = Array.isArray(todayData.tasks) ? todayData.tasks : [];

  // Filter only incomplete tasks
  const pendingTasks = tasks.filter(task => !task.done);

  if (tasks.length === 0) {
    list.innerHTML = `
      <li class="habit-item">
        No tasks added today
      </li>
    `;
    return;
  }

  if (pendingTasks.length === 0) {
    list.innerHTML = `
      <li class="habit-item done">
        All tasks completed 
    `;
    return;
  }

  // Redirect when clicking panel
  list.addEventListener("click", () => {
    window.location.href = "today.html";
  });

  pendingTasks.slice(0, 4).forEach(task => {
    const li = document.createElement("li");
    li.className = "habit-item";
    li.textContent = task.text;
    list.appendChild(li);
  });
}


// sidebar toggle on mobile
// SIDEBAR TOGGLE
const menuToggle = document.getElementById("menuToggle");
const Sidebar = document.querySelector(".sidebar");
const overlaySidebar = document.querySelector(".sidebar-overlay");
const menuLinks = document.querySelectorAll(".menu a");

if (menuToggle && Sidebar) {
  menuToggle.addEventListener("click", () => {
    Sidebar.classList.toggle("open");

    if (overlaySidebar) {
      overlaySidebar.classList.toggle("show");
    }
  });
}

// CLOSE WHEN CLICK OVERLAY
if (overlaySidebar) {
  overlaySidebar.addEventListener("click", () => {
    Sidebar.classList.remove("open");
    overlaySidebar.classList.remove("show");
  });
}

// CLOSE WHEN CLICK MENU ITEM
menuLinks.forEach(link => {
  link.addEventListener("click", () => {
    if (window.innerWidth < 900) {
      Sidebar.classList.remove("open");

      if (overlaySidebar) {
        overlaySidebar.classList.remove("show");
      }
    }
  });
});



