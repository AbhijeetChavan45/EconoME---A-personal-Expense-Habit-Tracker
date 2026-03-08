// --- CONFIG & STORAGE ---
const STORAGE_KEY = "econome_expenses";
let editingId = null;
let deleteId = null;

const getExpenses = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const saveExpenses = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// --- DOM ELEMENTS ---
const drawer = document.getElementById("expenseDrawer");
const overlay = document.getElementById("modalOverlay");
const expenseForm = document.getElementById("expenseForm");
const deleteModal = document.getElementById("deleteModal");
const list = document.querySelector(".expense-list");
const pills = document.querySelectorAll(".category-pills button");

// --- DRAWER CONTROL ---
function openDrawer(isEdit = false) {
    drawer.classList.remove("hidden");
    overlay.classList.remove("hidden");
    
    // Trigger the slide animation
    requestAnimationFrame(() => {
        drawer.classList.add("show");
    });

    if (!isEdit) {
        editingId = null;
        document.getElementById("drawerTitle").textContent = "Add Expense";
        document.getElementById("saveBtn").textContent = "Save Expense";
        expenseForm.reset();
        resetPills();
    }
}

function closeDrawer() {
    drawer.classList.remove("show");
    overlay.classList.add("hidden");
    deleteModal.classList.add("hidden");
    
    // Wait for slide-out animation to finish
    setTimeout(() => {
        drawer.classList.add("hidden");
    }, 400);
}

function resetPills() {
    pills.forEach(p => p.classList.remove("active"));
    pills[0].classList.add("active"); // Default to Food
}

// --- EVENT LISTENERS ---

// Pill Selection Logic
pills.forEach(pill => {
    pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
    });
});

// Opening Drawer
document.getElementById("addExpenseBtn").addEventListener("click", () => openDrawer(false));
document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

// Save Logic
expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const amount = Number(document.getElementById("expAmount").value);
    const date = document.getElementById("expDate").value;
    const note = document.getElementById("expNote").value;
    const category = document.querySelector(".category-pills .active").textContent;

    let expenses = getExpenses();

    if (editingId) {
        expenses = expenses.map(exp => 
            exp.id === editingId ? { ...exp, amount, category, date, note } : exp
        );
    } else {
        expenses.push({ 
            id: Date.now(), 
            amount, 
            category, 
            date, 
            note 
        });
    }

    saveExpenses(expenses);
    closeDrawer();
    renderExpenses();
});

// --- RENDER & FILTERS ---
function renderExpenses() {
  let allExpenses = getExpenses();

// --- FILTER VALUES ---
const category = document.getElementById("filterCategory").value;
const fromDate = document.getElementById("fromDate").value;
const toDate = document.getElementById("toDate").value;
const sortBy = document.getElementById("sortBy").value;

// --- FILTERING ---
let filtered = allExpenses.filter(exp => {

  const expDate = new Date(exp.date);

  // Category
  if (category !== "all" && exp.category !== category) {
    return false;
  }

  // From date
  if (fromDate && expDate < new Date(fromDate)) {
    return false;
  }

  // To date
  if (toDate && expDate > new Date(toDate)) {
    return false;
  }

  return true;
});
  
// --- SORTING ---
// --- SORTING ---
if (sortBy === "highest") {
  filtered.sort((a, b) => b.amount - a.amount);
}
else if (sortBy === "lowest") {
  filtered.sort((a, b) => a.amount - b.amount);
}
else {
  // latest
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

  // Sort newest first
  allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = "";

  if (allExpenses.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="ri-wallet-3-line"></i>
        <h3>No expenses yet</h3>
        <p>Start tracking where your money goes.</p>
        <button class="topbar-btn" onclick="openDrawer()">Add Expense</button>
      </div>
    `;
    updateMonthlySummary([]);
    return;
  }

  // GROUP BY MONTH
  const grouped = {};

  filtered.forEach(exp => {
    const date = new Date(exp.date);
    const key = date.toLocaleString("en-IN", {
      month: "long",
      year: "numeric"
    });

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  });

  const monthKeys = Object.keys(grouped);

  monthKeys.forEach((month, index) => {
    const monthExpenses = grouped[month];

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const section = document.createElement("div");
    section.className = "month-section";

    const header = document.createElement("div");
    header.className = "month-header";

    header.innerHTML = `
      <div>
        <h3>${month}</h3>
        <span class="subtext">₹${total} • ${monthExpenses.length} transactions</span>
      </div>
      <i class="ri-arrow-down-s-line toggle-icon"></i>
    `;

    const body = document.createElement("div");
    body.className = "month-body";

    // Expand only first 2 months
    if (index > 1) {
      body.classList.add("collapsed");
    }

    // Toggle logic
    header.addEventListener("click", () => {
      body.classList.toggle("collapsed");
      header.querySelector(".toggle-icon").classList.toggle("rotate");
    });

    monthExpenses.forEach(exp => {
      const item = document.createElement("div");
      item.className = "expense-item";

      item.innerHTML = `
        <div class="expense-info">
          <h4>${exp.category}</h4>
          <p>${exp.note || "No note"} • ${formatDate(exp.date)}</p>
        </div>
        <div class="expense-actions">
          <span class="amount">₹${exp.amount}</span>
          <button class="edit-expense" data-id="${exp.id}">Edit</button>
          <button class="delete-expense" data-id="${exp.id}">Delete</button>
        </div>
      `;

      body.appendChild(item);
    });

    section.appendChild(header);
    section.appendChild(body);
    list.appendChild(section);
  });

  updateMonthlySummary(allExpenses);
}

document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("filterCategory").value = "all";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    document.getElementById("sortBy").value = "latest";

    renderExpenses();
});

function updateMonthlySummary(allExpenses) {

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- Filter current month expenses ---
  const currentMonthExpenses = allExpenses.filter(e => {
    const d = new Date(e.date);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  // --- Calculate total ---
  const total = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // --- Get income ---
  const income = Number(localStorage.getItem("econome_income")) || 0;

  const remaining = income - total;

  // --- Update basic text ---
  document.getElementById("monthTotal").textContent = `₹${total}`;
  document.getElementById("expenseCount").textContent =
    `${currentMonthExpenses.length} ${
      currentMonthExpenses.length === 1 ? "transaction" : "transactions"
    }`;

  document.getElementById("incomeText").textContent = `₹${income}`;
  document.getElementById("remainingText").textContent =
    `₹${remaining >= 0 ? remaining : 0}`;

  // --- Progress Percentage ---
  let percent = 0;

  if (income > 0) {
    percent = Math.min((total / income) * 100, 100);
  }

  const fillBar = document.getElementById("budgetFillBar");
  const percentText = document.getElementById("budgetPercentText");

  fillBar.style.width = percent + "%";

  if (income > 0) {
    percentText.textContent = `${percent.toFixed(0)}% of income used`;
  } else {
    percentText.textContent = "Set income in dashboard";
  }

  // --- Color Logic ---
  if (percent >= 100) {
    fillBar.style.background = "#ef4444"; // red (overspent)
  } else if (percent >= 75) {
    fillBar.style.background = "#f59e0b"; // orange (warning)
  } else {
    fillBar.style.background = "var(--accent)";
  }

  // --- Top Category Calculation ---
  const categoryTotals = {};

  currentMonthExpenses.forEach(e => {
    categoryTotals[e.category] =
      (categoryTotals[e.category] || 0) + e.amount;
  });

  const topCategoryEl = document.getElementById("topCategoryText");

  if (currentMonthExpenses.length === 0) {
    topCategoryEl.textContent = "No expenses yet";
    return;
  }

  const sorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const [topCategory, topAmount] = sorted[0];

  const percentOfTotal = ((topAmount / total) * 100).toFixed(0);

  topCategoryEl.innerHTML = `
  ${topCategory}
  <div class="subtext">₹${topAmount} (${percentOfTotal}% of spending)</div>

`;
const remainingEl = document.getElementById("remainingText");

if (remaining < 0) {
  remainingEl.style.color = "#ef4444";
} else {
  remainingEl.style.color = "var(--accent)";
}

}




function updateSummary(expenses) {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById("monthTotal").textContent = `₹${total}`;
    document.getElementById("expenseCount").textContent = `${expenses.length} expenses`;
}

// --- DELEGATION (Edit/Delete) ---
list.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);
    if (e.target.classList.contains("delete-expense")) {
    deleteId = id;
    overlay.classList.remove("hidden");
    deleteModal.classList.remove("hidden");
}
    
    if (e.target.classList.contains("edit-expense")) {
        const exp = getExpenses().find(e => e.id === id);
        if (!exp) return;

        editingId = id;
        document.getElementById("drawerTitle").textContent = "Edit Expense";
        document.getElementById("saveBtn").textContent = "Update Expense";
        
        document.getElementById("expAmount").value = exp.amount;
        document.getElementById("expDate").value = exp.date;
        document.getElementById("expNote").value = exp.note;
        
        // Set correct pill active
        pills.forEach(p => {
            p.classList.toggle("active", p.textContent === exp.category);
        });

        openDrawer(true);
    }
});

// Delete Modal logic 
document.getElementById("confirmDelete").addEventListener("click", () => {
    let expenses = getExpenses().filter(e => e.id !== deleteId);
    saveExpenses(expenses);
    deleteModal.classList.add("hidden");
    overlay.classList.add("hidden");
    renderExpenses();
});

document.getElementById("cancelDelete").addEventListener("click", () => {
    deleteModal.classList.add("hidden");
    overlay.classList.add("hidden");
});


// --- INIT ---
document.addEventListener("DOMContentLoaded", renderExpenses);
// Re-render when filter values change
["filterCategory", "fromDate", "toDate", "sortBy"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderExpenses);
});


// Date Formatizer 
function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();

    const diff = Math.floor(
        (today.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";

    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });
}

