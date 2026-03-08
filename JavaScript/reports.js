let spendingChart,
  categoryChart,
  habitChart,
  taskChart,
  incomeExpenseChart;

document.addEventListener("DOMContentLoaded", () => {
  populateMonthSelector();

  const now = new Date();
  loadReports(now.getMonth(), now.getFullYear());

  document
    .getElementById("monthSelector")
    .addEventListener("change", (e) => {
      const [year, month] = e.target.value.split("-");
      loadReports(Number(month), Number(year));
    });
});

/* ================================
   MONTH SELECTOR
================================ */
function populateMonthSelector() {
  const selector = document.getElementById("monthSelector");
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), i, 1);
    const option = document.createElement("option");

    option.value = `${date.getFullYear()}-${date.getMonth()}`;
    option.textContent = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (i === now.getMonth()) option.selected = true;

    selector.appendChild(option);
  }
}

/* ================================
   LOAD REPORTS
================================ */
function loadReports(month, year) {
  const expenses = getMonthlyExpenses(month, year);
  const income = Number(localStorage.getItem("econome_income")) || 0;
  const habits = getMonthlyHabitStats(month, year);
  const tasks = getMonthlyTaskStats(month, year);

const prevDate = new Date(year, month - 1, 1);
const prevMonth = prevDate.getMonth();
const prevYear = prevDate.getFullYear();

const prevExpenses = getMonthlyExpenses(prevMonth, prevYear);
const prevTasks = getMonthlyTaskStats(prevMonth, prevYear);


  updateKPIs(  expenses,
  income,
  habits,
  tasks,
  prevExpenses,
  prevTasks);
  renderCharts(expenses, income, habits, tasks, month, year);
  renderSmartInsights(expenses, income, habits, tasks);
}

/* ================================
   DATA HELPERS
================================ */
function getMonthlyExpenses(month, year) {
  const all = JSON.parse(localStorage.getItem("econome_expenses")) || [];

  return all.filter((exp) => {
    const d = new Date(exp.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

function getMonthlyHabitStats(month, year) {
  const habits = JSON.parse(localStorage.getItem("econome_habits")) || [];
  let completedDays = new Set();

  habits.forEach((h) => {
    if (!h.history) return;

    Object.keys(h.history).forEach((date) => {
      const d = new Date(date);
      if (
        d.getMonth() === month &&
        d.getFullYear() === year &&
        h.history[date] === "done"
      ) {
        completedDays.add(date);
      }
    });
  });

  return { completedDays: completedDays.size };
}

function getMonthlyTaskStats(month, year) {
  let total = 0;
  let completed = 0;

  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break;

    const key = `econome_today_${date.toISOString().split("T")[0]}`;
    const data = JSON.parse(localStorage.getItem(key)) || {};
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];

    total += tasks.length;
    completed += tasks.filter((t) => t.done).length;
  }

  return { total, completed };
}

/* ================================
   KPI UPDATE
================================ */
function updateKPIs(
  expenses,
  income,
  habits,
  tasks,
  prevExpenses,
  prevTasks
) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const prevSpent = prevExpenses.reduce((s, e) => s + e.amount, 0);

  const savings = income - totalSpent;

  /* =========================
     SPENDING CHANGE
  ========================== */

  let spendingChange = null;

  if (prevSpent > 0) {
    spendingChange = (
      ((totalSpent - prevSpent) / prevSpent) *
      100
    ).toFixed(0);
  }

  /* =========================
     PRODUCTIVITY
  ========================== */

  const productivity =
    tasks.total > 0
      ? ((tasks.completed / tasks.total) * 100).toFixed(0)
      : 0;

  const prevProductivity =
    prevTasks.total > 0
      ? ((prevTasks.completed / prevTasks.total) * 100).toFixed(0)
      : 0;

  let productivityChange = null;

  if (prevTasks.total > 0) {
    productivityChange = (
      ((productivity - prevProductivity) / prevProductivity) *
      100
    ).toFixed(0);
  }

  /* =========================
     INCOME KPI
  ========================== */

  document.getElementById("kpiIncome").textContent = `₹${income}`;

  /* =========================
     EXPENSE KPI WITH TREND
  ========================== */

  const expenseEl = document.getElementById("kpiExpenses");

  if (spendingChange !== null) {
    const trendSymbol = spendingChange >= 0 ? "▲" : "▼";
    const trendColor = spendingChange >= 0 ? "#ef4444" : "#3DDC97";

    expenseEl.innerHTML = `
      ₹${totalSpent}
      <span style="color:${trendColor}; font-size:0.8rem;">
        ${trendSymbol} ${Math.abs(spendingChange)}%
      </span>
    `;
  } else {
    expenseEl.innerHTML = `
      ₹${totalSpent}
      <span style="color:#9CA3AF; font-size:0.8rem;">
        — No previous data
      </span>
    `;
  }

  /* =========================
     SAVINGS KPI
  ========================== */

  const savingsEl = document.getElementById("kpiSavings");
  savingsEl.textContent = `₹${savings}`;
  savingsEl.style.color = savings < 0 ? "#ef4444" : "#3DDC97";

  /* =========================
     PRODUCTIVITY KPI WITH TREND
  ========================== */

  const productivityEl = document.getElementById("kpiProductivity");

  if (productivityChange !== null) {
    const prodSymbol = productivityChange >= 0 ? "▲" : "▼";
    const prodColor = productivityChange >= 0 ? "#3DDC97" : "#ef4444";

    productivityEl.innerHTML = `
      ${productivity}%
      <span style="color:${prodColor}; font-size:0.8rem;">
        ${prodSymbol} ${Math.abs(productivityChange)}%
      </span>
    `;
  } else {
    productivityEl.innerHTML = `
      ${productivity}%
      <span style="color:#9CA3AF; font-size:0.8rem;">
        — No previous data
      </span>
    `;
  }
}


/* ================================
   CHARTS
================================ */
function renderCharts(expenses, income, habits, tasks, month, year) {
  renderSpendingChart(expenses);
  renderCategoryChart(expenses);
  renderIncomeExpenseChart(expenses, income);
  renderHabitChart(month, year);
  renderTaskChart(tasks);
}

function renderSpendingChart(expenses) {
  if (spendingChart) spendingChart.destroy();

  const dailyTotals = {};

  expenses.forEach((exp) => {
    const day = new Date(exp.date).getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + exp.amount;
  });

  const labels = Object.keys(dailyTotals).sort((a, b) => a - b);
  const data = labels.map((d) => dailyTotals[d]);

  spendingChart = new Chart(
    document.getElementById("spendingChart"),
    {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Spending",
            data,
            borderColor: "#3DDC97",
            backgroundColor: "rgba(61,220,151,0.15)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: "easeOutQuart"
  },
  plugins: {
    legend: {
      labels: {
        color: "#9CA3AF",
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: "#121717",
      borderColor: "#3DDC97",
      borderWidth: 1,
      titleColor: "#EDEDED",
      bodyColor: "#9CA3AF"
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#9CA3AF" }
    },
    y: {
      grid: { display: false },
      ticks: { color: "#9CA3AF" }
    }
  }
}

    }
  );
}

function renderCategoryChart(expenses) {
  if (categoryChart) categoryChart.destroy();

  const totals = {};
  expenses.forEach((exp) => {
    totals[exp.category] =
      (totals[exp.category] || 0) + exp.amount;
  });

  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type: "bar",
      data: {
        labels: Object.keys(totals),
        datasets: [
          {
            data: Object.values(totals),
            backgroundColor: "#3DDC97",
          },
        ],
      },
     options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: "easeOutQuart"
  },
  plugins: {
    legend: {
      labels: {
        color: "#9CA3AF",
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: "#121717",
      borderColor: "#3DDC97",
      borderWidth: 1,
      titleColor: "#EDEDED",
      bodyColor: "#9CA3AF"
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#9CA3AF" }
    },
    y: {
      grid: { display: false },
      ticks: { color: "#9CA3AF" }
    }
  }
}

    }
  );
}

function renderIncomeExpenseChart(expenses, income) {
  if (incomeExpenseChart) incomeExpenseChart.destroy();

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  incomeExpenseChart = new Chart(
    document.getElementById("incomeExpenseChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [
          {
            data: [income, totalSpent],
            backgroundColor: ["#3DDC97", "#1F2937"],
          },
        ],
      },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: "easeOutQuart"
  },
  cutout: "72%",
  radius: "82%",
layout: {
  padding: 20
},
  
  plugins: {
    legend: {
      labels: {
        color: "#9CA3AF",
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: "#121717",
      borderColor: "#3DDC97",
      borderWidth: 1,
      titleColor: "#EDEDED",
      bodyColor: "#9CA3AF"
    }
  },
}

    }
  );
}

function renderHabitChart(month, year) {
  if (habitChart) habitChart.destroy();

  const habits = JSON.parse(localStorage.getItem("econome_habits")) || [];

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  habits.forEach(habit => {
    if (!habit.history) return;

    Object.keys(habit.history).forEach(dateStr => {
      const date = new Date(dateStr);

      if (
        date.getMonth() === month &&
        date.getFullYear() === year &&
        habit.history[dateStr] === "done"
      ) {
        const dayIndex = date.getDay(); // 0=Sun
        weekdayTotals[dayIndex]++;
      }
    });
  });

  habitChart = new Chart(
    document.getElementById("habitChart"),
    {
      type: "bar",
      data: {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Completed Habits",
            data: weekdayTotals,
            backgroundColor: "#3DDC97"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#9CA3AF" }
          },
          y: {
            grid: { display: false },
            ticks: { color: "#9CA3AF" }
          }
        }
      }
    }
  );
}


function renderTaskChart(tasks) {
  if (taskChart) taskChart.destroy();

  taskChart = new Chart(
    document.getElementById("taskChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Completed", "Pending"],
        datasets: [
          {
            data: [tasks.completed, tasks.total - tasks.completed],
            backgroundColor: ["#3DDC97", "#1F2937"],
          },
        ],
      },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: "easeOutQuart"
  },
  cutout: "72%",
  radius: "82%",
layout: {
  padding: 20
},
  plugins: {
    legend: {
      labels: {
        color: "#9CA3AF",
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: "#121717",
      borderColor: "#3DDC97",
      borderWidth: 1,
      titleColor: "#EDEDED",
      bodyColor: "#9CA3AF"
    }
  },
}

    }
  );
}

/* ================================
   SMART INSIGHTS
================================ */
function renderSmartInsights(expenses, income, habits, tasks) {
  const container = document.getElementById("smartInsightsList");
  container.innerHTML = "";

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const savings = income - totalSpent;

  /* =========================
     1️⃣ Spending Behavior
  ========================== */

  if (expenses.length > 0) {
    const categoryTotals = {};

    expenses.forEach(e => {
      categoryTotals[e.category] =
        (categoryTotals[e.category] || 0) + e.amount;
    });

    const highestCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    container.innerHTML += `
      <li>📊 Most spending was in <strong>${highestCategory}</strong>.</li>
    `;
  }

  /* =========================
     2️⃣ Savings Health
  ========================== */

  if (income > 0) {
    const savingsRate = ((savings / income) * 100).toFixed(0);

    if (savingsRate >= 30) {
      container.innerHTML += `
        <li>🟢 Excellent savings rate (${savingsRate}%). Strong financial discipline.</li>
      `;
    } else if (savingsRate >= 10) {
      container.innerHTML += `
        <li>🟡 Moderate savings rate (${savingsRate}%). Room for optimization.</li>
      `;
    } else {
      container.innerHTML += `
        <li>🔴 Low savings rate (${savingsRate}%). Consider reducing discretionary spending.</li>
      `;
    }
  }

  /* =========================
     3️⃣ Productivity Insight
  ========================== */

  if (tasks.total > 0) {
    const productivity = (
      (tasks.completed / tasks.total) *
      100
    ).toFixed(0);

    if (productivity >= 75) {
      container.innerHTML += `
        <li>🚀 High productivity this month (${productivity}%). Keep the momentum.</li>
      `;
    } else if (productivity >= 50) {
      container.innerHTML += `
        <li>⚡ Moderate productivity (${productivity}%). Small improvements can boost results.</li>
      `;
    } else {
      container.innerHTML += `
        <li>⚠️ Low task completion (${productivity}%). Focus on consistency.</li>
      `;
    }
  }

  /* =========================
     4️⃣ Habit Consistency
  ========================== */

  if (habits.completedDays >= 15) {
    container.innerHTML += `
      <li>🔥 Strong habit streak this month. Discipline is improving.</li>
    `;
  } else if (habits.completedDays > 0) {
    container.innerHTML += `
      <li>📅 ${habits.completedDays} productive habit days recorded.</li>
    `;
  }

  /* =========================
     5️⃣ Overspending Warning
  ========================== */

  if (income > 0 && totalSpent > income) {
    container.innerHTML += `
      <li>🚨 You exceeded your income this month. Immediate adjustment recommended.</li>
    `;
  }

  /* =========================
     Fallback
  ========================== */

  if (!container.innerHTML) {
    container.innerHTML =
      "<li>Start tracking to unlock intelligent insights 📊</li>";
  }
}

//  data exports 
document.addEventListener("DOMContentLoaded", () => {

  const pdfBtn = document.getElementById("exportPDFBtn");
  if (!pdfBtn) return;

  pdfBtn.addEventListener("click", () => {

    const { jsPDF } = window.jspdf;

    const selector = document.getElementById("monthSelector");
    const [year, month] = selector.value.split("-");

    const expenses = getMonthlyExpenses(Number(month), Number(year));
    const income = Number(localStorage.getItem("econome_income")) || 0;

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const savings = income - totalSpent;

    const doc = new jsPDF();
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    /* =========================
       WATERMARK
    ========================== */

    doc.setTextColor(230);
    doc.setFontSize(60);
    doc.text("EconoME", 40, 160, { angle: 45 });

    doc.setTextColor(0);

    /* =========================
       HEADER
    ========================== */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("EconoME", 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Monthly Financial Report", 20, 28);

    doc.setTextColor(100);
    doc.text(`Month: ${monthName}`, 20, 36);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);

    doc.setDrawColor(180);
    doc.line(20, 48, 190, 48);

    doc.setTextColor(0);

    /* =========================
       SUMMARY SECTION
    ========================== */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Summary", 20, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text("Income:", 20, 72);
    doc.text(`Rs ${income}`, 150, 72);

    doc.text("Total Expenses:", 20, 82);
    doc.text(`Rs ${totalSpent}`, 150, 82);

    doc.text("Net Savings:", 20, 92);

    if (savings >= 0) {
      doc.setTextColor(0, 150, 0);
    } else {
      doc.setTextColor(200, 0, 0);
    }

    doc.text(`Rs ${savings}`, 150, 92);
    doc.setTextColor(0);

    doc.line(20, 100, 190, 100);

    /* =========================
       CHART IMAGE
    ========================== */

    if (spendingChart) {
      const chartImage = spendingChart.toBase64Image();
      doc.setFont("helvetica", "bold");
      doc.text("Spending Trend", 20, 112);

      doc.addImage(chartImage, "PNG", 20, 120, 170, 70);
    }

    let y = 200;

    /* =========================
       EXPENSE TABLE
    ========================== */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Expense Details", 20, y);

    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Date", 20, y);
    doc.text("Category", 80, y);
    doc.text("Amount", 150, y);

    doc.setFont("helvetica", "normal");

    y += 6;
    doc.line(20, y, 190, y);
    y += 8;

    expenses.forEach(exp => {
      doc.text(exp.date, 20, y);
      doc.text(exp.category, 80, y);
      doc.text(`Rs ${exp.amount}`, 150, y);

      y += 8;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    /* =========================
       FOOTER PAGE NUMBER
    ========================== */

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        290,
        { align: "center" }
      );
    }

    doc.save(`EconoME_Report_${monthName}.pdf`);

  });

});

