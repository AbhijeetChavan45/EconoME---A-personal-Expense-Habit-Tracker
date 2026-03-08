// habits logic 
const HABIT_KEY = "econome_habits";
const todayDate = new Date().toISOString().split("T")[0];

function loadHabits() {
  return JSON.parse(localStorage.getItem(HABIT_KEY)) || [];
}

function saveHabits(habits) {
  localStorage.setItem(HABIT_KEY, JSON.stringify(habits));
}

const todayKey = `econome_today_${new Date().toISOString().split("T")[0]}`;

let data = JSON.parse(localStorage.getItem(todayKey)) || {};

data = {
  focus: data.focus || "",
  tasks: Array.isArray(data.tasks) ? data.tasks : [],
  habitList: Array.isArray(data.habitList) ? data.habitList : [], // ✅ EMPTY BY DEFAULT
  habits:
    typeof data.habits === "object" && data.habits !== null ? data.habits : {},
  mood: data.mood || "",
  reflection: data.reflection || "",
};

const save = () => localStorage.setItem(todayKey, JSON.stringify(data));

/* DATE & TIME */
function updateDateTime() {
  document.getElementById("liveDateTime").textContent =
    new Date().toLocaleString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
}
updateDateTime();
setInterval(updateDateTime, 60000);

/* MAIN FOCUS */
const focusInput = document.getElementById("mainFocus");
focusInput.value = data.focus;
focusInput.oninput = (e) => {
  data.focus = e.target.value;
  save();
};

/* TASKS */
const taskList = document.getElementById("taskList");
const emptyTasks = document.getElementById("emptyTasks");
const taskCount = document.getElementById("taskCount");

function renderTasks() {
  taskList.innerHTML = "";
  emptyTasks.style.display = data.tasks.length ? "none" : "block";
  taskCount.textContent = `${data.tasks.filter(t => t.done).length} / ${data.tasks.length}`;

 data.tasks.forEach((t, index) => {
  const row = document.createElement("div");
  row.className = `today-task-row ${t.done ? "completed" : ""}`;

  row.innerHTML = `
    <div class="task-left">
      <span class="task-name">${t.text}</span>
    </div>

    <div class="today-task-actions">
      ${
        t.done
          ? `<span class="done-label">Done</span>`
          : ``
      }
      <button class="delete-btn">Delete</button>
    </div>
  `;

  // Click row to mark done
  row.onclick = () => {
    if (!t.done) {
      t.done = true;
      save();
      renderTasks();
      updateProgress();
    }
  };

  // Delete
  row.querySelector(".delete-btn").onclick = (e) => {
    e.stopPropagation();
    data.tasks.splice(index, 1);
    save();
    renderTasks();
    updateProgress();
  };

  taskList.appendChild(row);
});


}

document.getElementById("addTaskBtn").onclick = () => {
  const input = document.getElementById("taskInput");
  if (!input.value.trim() || data.tasks.length >= 5) return;
  data.tasks.push({ text: input.value.trim(), done: false });
  input.value = "";
  save();
  renderTasks();
  updateProgress();
};

renderTasks();

/* MOOD */
document.querySelectorAll(".mood button").forEach((btn) => {
  if (btn.dataset.mood === data.mood) btn.classList.add("active");

  btn.onclick = () => {
    document
      .querySelectorAll(".mood button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    data.mood = btn.dataset.mood;
    save();
    updateProgress();
  };
});

/* REFLECTION */
const reflection = document.getElementById("reflection");
reflection.value = data.reflection;
reflection.oninput = (e) => {
  data.reflection = e.target.value;
  save();
};

/* PROGRESS & SCORE */
function updateProgress() {
  const taskScore = data.tasks.length
    ? data.tasks.filter((t) => t.done).length / data.tasks.length
    : 0;

  // ✅ GET REAL HABITS
  const habits = loadHabits();
  const todayDate = new Date().toISOString().split("T")[0];
  const dailyHabits = habits.filter(h => h.frequency === "daily");

  const completedHabits = dailyHabits.filter(
    h => h.history?.[todayDate] === "done"
  ).length;

  const habitScore = dailyHabits.length
    ? completedHabits / dailyHabits.length
    : 0;

  const moodScore = data.mood === "good" ? 1 : data.mood === "ok" ? 0.5 : 0;

  const total = Math.round(
    (taskScore * 0.5 + habitScore * 0.3 + moodScore * 0.2) * 100
  );

  document.getElementById("progressFill").style.width = total + "%";
  document.getElementById("progressPercent").textContent = total + "%";

  document.getElementById("progressMeta").textContent =
    `${data.tasks.filter((t) => t.done).length} tasks · ${completedHabits} habits`;

  document.getElementById("dayScore").textContent = `${total} / 100`;

  document.getElementById("scoreText").textContent =
    total >= 80
      ? "Strong consistency today."
      : total >= 50
      ? "Decent effort. Improve tomorrow."
      : "New day, fresh start tomorrow.";
}

updateProgress();

function renderDailyHabits() {
  const container = document.getElementById("habitList");
  container.innerHTML = "";

  const habits = loadHabits();
  const dailyHabits = habits.filter(h => h.frequency === "daily");

  if (dailyHabits.length === 0) {
    container.innerHTML = `<p class="subtext">No daily habits yet</p>`;
    return;
  }

  dailyHabits.forEach(habit => {
    const isDone = habit.history?.[todayDate] === "done";

    const row = document.createElement("div");
    row.className = `today-habit-row ${isDone ? "completed" : ""}`;

    row.innerHTML = `
      <div class="today-habit-left">
        <span class="habit-name">${habit.name}</span>
      </div>

      <div class="today-habit-actions">
        ${isDone ? `<span class="done-label">Done</span>` : ``}
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // ✅ CLICK ROW TO MARK DONE
    row.onclick = () => {
      if (!isDone) {
        habit.history = habit.history || {};
        habit.history[todayDate] = "done";
        saveHabits(habits);
        renderDailyHabits();
        updateProgress();
      }
    };

    // ✅ DELETE BUTTON
    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const updated = habits.filter(h => h.id !== habit.id);
      saveHabits(updated);
      renderDailyHabits();
      updateProgress();
    };

    container.appendChild(row);
  });
}



//  add habit logic 
const habitInput = document.getElementById("habitInput");
const addHabitBtn = document.getElementById("addHabitBtn");

addHabitBtn.onclick = () => {
  const value = habitInput.value.trim();
  if (!value) return;

  const habits = loadHabits();

  // Prevent duplicate daily habit
  const alreadyExists = habits.some(
    h => h.name.toLowerCase() === value.toLowerCase()
  );

  if (alreadyExists) {
    alert("Habit already exists");
    return;
  }

  habits.push({
    id: Date.now(),
    name: value,
    category: "General",
    frequency: "daily",   // 🔥 forced daily
    priority: "medium",
    createdAt: todayDate,
    history: {}
  });

  saveHabits(habits);
  habitInput.value = "";

  renderDailyHabits();
};
habitInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addHabitBtn.click();
  }
});

setTimeout(() => {
  document.getElementById("progressFill").style.transition =
    "width 0.8s ease";
}, 100);





renderTasks();
renderDailyHabits();
updateProgress();
