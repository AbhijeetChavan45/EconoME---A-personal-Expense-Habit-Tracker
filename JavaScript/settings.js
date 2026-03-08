// LOAD DATA
window.onload = function () {
  document.getElementById("incomeInputSetting").value =
    localStorage.getItem("econome_income") || "";

  document.getElementById("budgetInput").value =
    localStorage.getItem("econome_budget") || "";

  document.getElementById("savingsGoalInput").value =
    localStorage.getItem("econome_savingsGoal") || "";
};
// toast function
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


// SAVE PROFILE (income + budget)
function saveProfileSettings() {
  const income = Number(document.getElementById("incomeInputSetting").value);
  const budget = Number(document.getElementById("budgetInput").value);

  if (income <= 0) {
    showToast("Enter valid income");
    return;
  }

  localStorage.setItem("econome_income", income);
  localStorage.setItem("econome_budget", budget);

  showToast("Profile saved ✅");
}


// SAVE SAVINGS GOAL
function saveSavingsGoal() {
  const goal = Number(document.getElementById("savingsGoalInput").value);

  localStorage.setItem("econome_savingsGoal", goal);

  showToast("Savings goal saved 🎯");
}


// EXPORT DATA
function exportData() {
  const data = {
    income: localStorage.getItem("econome_income"),
    budget: localStorage.getItem("econome_budget"),
    savingsGoal: localStorage.getItem("econome_savingsGoal"),
    expenses: JSON.parse(localStorage.getItem("econome_expenses") || "[]"),
    habits: JSON.parse(localStorage.getItem("econome_habits") || "[]"),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "econome-data.json";
  a.click();
}

// RESET ONLY EXPENSES
function resetExpenses() {
  localStorage.setItem("econome_expenses", JSON.stringify([]));
  showToast("Expenses reset ✅");
}


// CLEAR ALL
function clearAllData() {
  if (confirm("Delete all data?")) {
    localStorage.clear();
    showToast("All data cleared");

    setTimeout(() => location.reload(), 1000);
  }
}

