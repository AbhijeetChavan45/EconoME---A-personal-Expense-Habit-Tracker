const STORAGE_KEY = "econome_habits";
let timelineRangeDays = 7; // default
let editingHabitId = null;

/* ---------- QUOTES ---------- */
const QUOTES = [
  "Progress > perfection.",
  "Showing up matters.",
  "A bad day doesn’t erase good habits.",
  "Discipline is gentle consistency.",
  "Rest is part of progress."
];

// date and time helpers 

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


/* ---------- DATE HELPERS ---------- */
const today = getLocalDateKey();


function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}


function getWeekKey() {
  const d = new Date();
  const first = d.getDate() - d.getDay();
  const weekStart = new Date(d.setDate(first));
  return weekStart.toISOString().split("T")[0];
}

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/* ---------- LOAD ---------- */
let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
// Ensure all habits have required structure
habits = habits.map(h => ({
  history: {},
  priority: "medium",
  ...h
}));




function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

/* ---------- RANK ---------- */
function getRank(streak) {
  if (streak >= 60) return "💎 Diamond";
  if (streak >= 30) return "🥇 Gold";
  if (streak >= 15) return "🥈 Silver";
  if (streak >= 7) return "🥉 Bronze";
  return "Starter";
}

/* ---------- SUMMARY ---------- */
function updateSummary() {
  const daily = habits.filter(h => h.frequency === "daily");
  const done = daily.filter(h => h.history?.[today] === "done").length;

  const percent = daily.length ? (done / daily.length) * 100 : 0;
  document.querySelector(".progress-fill").style.width = percent + "%";
  document.getElementById("progress-count").innerText = `${done} / ${daily.length}`;

  const streak = calculateUserStreak();

document.getElementById("rank-text").innerText =
  `🔥 ${streak} Days · ${getRank(streak)}`;

  document.getElementById("daily-quote").innerText =
    QUOTES[new Date().getDate() % QUOTES.length];
}

/* ---------- PERIOD CHECK ---------- */
function getPeriodKey(habit) {
  if (habit.frequency === "daily") return today;
  if (habit.frequency === "weekly") return getWeekKey();
  if (habit.frequency === "monthly") return getMonthKey();
}

/* ---------- RENDER ---------- */
function renderHabits() {
  cleanupExpiredHabits();
  const left = document.querySelector(".habits-left");
  const right = document.querySelector(".habits-right");

  left.querySelectorAll(".habit-card, .empty-state").forEach(e => e.remove());
  right.querySelectorAll(".habit-card, .empty-state").forEach(e => e.remove());

  const focus = habits.filter(
    h => h.frequency === "daily" && !h.history?.[today]
  );

  const commitments = habits.filter(
    h => h.frequency !== "daily"
  );
const allDaily = habits.filter(h => h.frequency === "daily");

if (allDaily.length > 0 && focus.length === 0) {
  // All daily habits are completed
  left.innerHTML += `
    <div class="card empty-state">
      <p>All done for today 🌱</p>
      <small>You showed up. Come back tomorrow.</small>
    </div>
  `;
}

if (habits.length === 0) {
  // No habits at all
  left.innerHTML += `
    <div class="card empty-state">
      <p>No habits yet</p>
      <small>Start by adding your first habit 🌱</small>
      <br /><br />
      <button class="btn primary" id="emptyAddHabit">
        Add Habit
      </button>
    </div>
  `;
}

const emptyBtn = document.getElementById("emptyAddHabit");
if (emptyBtn) {
  emptyBtn.onclick = () => habitModal.classList.add("active");
}
  focus.forEach(h => renderCard(h, left));
  commitments.forEach(h => renderCard(h, right));

  updateSummary();
  
  renderConsistencyTimeline();

}
function cleanupExpiredHabits() {
  habits = habits.filter(habit => {
    if (habit.frequency === "daily") return true;

    // Delete only if time is over
    if (isHabitExpired(habit)) {
      return false;
    }

    return true;
  });

  save();
}
function getDaysLeft(habit) {
  if (!habit.createdAt) return null;

  const start = new Date(habit.createdAt);
  const now = new Date();

  // Normalize time to avoid hour issues
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  let end = new Date(start);

  if (habit.frequency === "weekly") {
    end.setDate(end.getDate() + 7);
  }

  if (habit.frequency === "monthly") {
    end.setMonth(end.getMonth() + 1);
  }

  // Total remaining days excluding today
  const diff = Math.floor(
    (end - now) / (1000 * 60 * 60 * 24)
  );

  // Clamp (never negative)
  return diff > 0 ? diff : 0;
}
function getDayLabel(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function renderConsistencyTimeline() {
  const timeline = document.getElementById("consistencyTimeline");
  const empty = document.getElementById("timelineEmpty");
  const scoreEl = document.getElementById("timelineScore");
  const rangeEl = document.getElementById("timelineRange");

  timeline.innerHTML = "";
  scoreEl.innerText = "";

  const dailyHabits = habits.filter(h => h.frequency === "daily");

  // No daily habits
  if (dailyHabits.length === 0) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  let activeDays = 0;

  const start = new Date();
start.setDate(start.getDate() - (timelineRangeDays - 1));

const end = new Date();

document.getElementById("timelineRange").innerText =
  `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ` +
  `${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;


  for (let i = timelineRangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const key = d.toISOString().split("T")[0];

    let done = 0;
    let total = dailyHabits.length;

    dailyHabits.forEach(h => {
      if (h.history[key] === "done") done++;
    });

    const dayEl = document.createElement("div");
    dayEl.className = "timeline-day";

    const dot = document.createElement("div");
    dot.className = "timeline-dot";
    dot.onclick = () => {
  const detail = document.getElementById("timelineDetail");

  const completedHabits = dailyHabits.filter(
    h => h.history[key] === "done"
  );

  detail.classList.remove("hidden");

  const dateLabel = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  if (completedHabits.length === 0) {
    detail.innerHTML = `
      <strong>${dateLabel}</strong>
      <span>No habits completed</span>
    `;
    return;
  }

  detail.innerHTML = `
    <strong>${dateLabel}</strong>
    <span>${completedHabits.length} of ${dailyHabits.length} daily habits completed</span>
    <ul>
      ${completedHabits.map(h => `<li>${h.name}</li>`).join("")}
    </ul>
  `;
};


    if (done > 0) {
      dot.classList.add("active");
      activeDays++;
      dot.title = `${done} of ${total} daily habits completed`;
    } else {
      dot.title = "No habits completed";
    }

    // 🔥 TODAY HIGHLIGHT
    const todayKey = new Date().toISOString().split("T")[0];
    if (key === todayKey) {
      dot.classList.add("today");
    }

    const label = document.createElement("span");
    label.textContent = d.toLocaleDateString("en-US", { weekday: "short" });

    dayEl.appendChild(dot);
    dayEl.appendChild(label);
    timeline.appendChild(dayEl);
  }

  // ---------- Consistency score ----------
  scoreEl.innerText = `${activeDays} / 7 active days`;
}

document.querySelectorAll(".range-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".range-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    timelineRangeDays = Number(btn.dataset.range);
    renderConsistencyTimeline();
  };
});




/* ---------- CARD ---------- */
function renderCard(habit, container) {
  const isDaily = habit.frequency === "daily";
  const state = habit.history[today];

  // Daily habits disappear when done
  if (isDaily && state === "done") return;

  const card = document.createElement("div");
  card.className = `card habit-card priority-${habit.priority}`;

  // Green completed state (for today only)
  if (state === "done") card.classList.add("completed");

  if (state === "skip") card.classList.add("skipped");

  card.innerHTML = `
    <div class="habit-header">
      <div class="habit-info">
        <h3>${habit.name}</h3>
        <div class="habit-meta">
          <span class="badge">${habit.frequency}</span>
          ${
            habit.frequency !== "daily"
              ? `<span class="subtext">${getDaysLeft(habit)} days left</span>`
              : ``
          }
        </div>
      </div>
    </div>

    <div class="habit-footer">
      <div class="habit-actions">
        ${
          state === "done"
            ? ``
            : `
              <button class="complete-btn">Done</button>
              <button class="skip-btn">Skip</button>
            `
        }
      </div>

      <div class="habit-controls">
        <button class="icon-btn edit-btn" title="Edit">Edit</button>
        <button class="icon-btn delete-btn" title="Delete">Delete</button>
      </div>
    </div>
  `;

  // Action buttons
  const completeBtn = card.querySelector(".complete-btn");
  const skipBtn = card.querySelector(".skip-btn");
  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");

  if (completeBtn) completeBtn.onclick = () => completeHabit(habit);
  if (skipBtn) skipBtn.onclick = () => skipHabit(habit);
  if (editBtn) editBtn.onclick = () => editHabit(habit.id);
  if (deleteBtn) deleteBtn.onclick = () => deleteHabit(habit.id);

  container.appendChild(card);
}


// edit btn in card 
function editHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  editingHabitId = id;

  document.querySelector(".modal-header h2").innerText = "Edit Habit";
  document.querySelector(".btn.primary.full").innerText = "Save Changes";

  habitName.value = habit.name;
  habitCategory.value = habit.category;
  habitFrequency.value = habit.frequency;
  habitPriority.value = habit.priority;

  habitFrequency.disabled = true;

  habitModal.classList.add("active");
}


/* ---------- COMPLETE ---------- */
function completeHabit(habit) {
  habit.history[today] = "done";

  save();
  renderHabits();
}

function didUserCompleteAnyHabit(dateKey) {
  return habits.some(h => h.history?.[dateKey] === "done");
}

function calculateUserStreak() {
  let streak = 0;
  let day = new Date();

  while (true) {
    const key = getLocalDateKey(day);

    if (didUserCompleteAnyHabit(key)) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}



/* ---------- SKIP ---------- */
function skipHabit(habit) {
 habit.history[today] = "skip";
  save();
  renderHabits();
  

}

/* ---------- INIT ---------- */
save();
renderHabits();

const addHabitBtn = document.getElementById("addHabitBtn");
const habitModal = document.getElementById("habitModal");
const closeModalBtn = document.getElementById("closeModal");
const habitForm = document.getElementById("habitForm");

addHabitBtn.onclick = () => habitModal.classList.add("active");
closeModalBtn.onclick = closeModal;

function closeModal() {
  habitModal.classList.remove("active");
  habitForm.reset();

  editingHabitId = null;
  habitFrequency.disabled = false;

  document.querySelector(".modal-header h2").innerText = "Add Habit";
  document.querySelector(".btn.primary.full").innerText = "Add Habit";
}


habitForm.addEventListener("submit", e => {
  e.preventDefault();

  const name = habitName.value.trim();
  if (!name) return;
if (editingHabitId) {
  const habit = habits.find(h => h.id === editingHabitId);
  if (!habit) return;

  habit.name = habitName.value.trim();
  habit.category = habitCategory.value;
  habit.priority = habitPriority.value;

  editingHabitId = null;
  habitFrequency.disabled = false;
} else {
  habits.push({
    id: Date.now(),
    name,
    category: habitCategory.value,
    frequency: habitFrequency.value,
    priority: habitPriority.value,
    streak: 0,
    bestStreak: 0,
    lastDone: null,
    createdAt: today,
    history: {}
  });
}
  save();
  closeModal();
  renderHabits();
});
function getCompletionCount(dateKey) {
  let done = 0;
  let total = 0;

  habits.forEach(h => {
    if (h.frequency === "daily") {
      total++;
      if (h.history[dateKey] === "done") done++;
    }
  });

  return { done, total };
}
function isHabitExpired(habit) {
  if (!habit.createdAt) return false;

  const start = new Date(habit.createdAt);
  const now = new Date();

  if (habit.frequency === "weekly") {
    start.setDate(start.getDate() + 7);
    return now >= start;
  }

  if (habit.frequency === "monthly") {
    start.setMonth(start.getMonth() + 1);
    return now >= start;
  }

  return false;
}
function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const msUntilMidnight = midnight - now;

  setTimeout(() => {
    renderHabits();
    scheduleMidnightRefresh();
  }, msUntilMidnight);
}

scheduleMidnightRefresh();
document.addEventListener("click", e => {
  const detail = document.getElementById("timelineDetail");
  const timeline = document.getElementById("consistencyTimeline");

  if (!detail || detail.classList.contains("hidden")) return;

  if (!timeline.contains(e.target)) {
    detail.classList.add("hidden");
  }
});

// delte modal 
let deletingHabitId = null;

function deleteHabit(id) {
  deletingHabitId = id;
  document.getElementById("deleteModal").classList.add("active");
}

document.getElementById("cancelDelete").onclick = () => {
  deletingHabitId = null;
  document.getElementById("deleteModal").classList.remove("active");
};

document.getElementById("confirmDelete").onclick = () => {
  habits = habits.filter(h => h.id !== deletingHabitId);
  deletingHabitId = null;
  save();
  renderHabits();
  document.getElementById("deleteModal").classList.remove("active");
};
