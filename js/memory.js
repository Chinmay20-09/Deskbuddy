// ── MEMORY ──────────────────────────────────────────────────
function addMemory(text) {
  if (!S.settings.memory) return;
  if (S.memories.includes(text)) return;
  S.memories.unshift({ text, time: new Date() });
  if (S.memories.length > 10) S.memories.pop();
  renderMemories();
  saveData();
}

function renderMemories() {
  const el = document.getElementById('memory-list');
  if (!el) return;
  if (!S.memories.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0">Buddy will remember milestones from your sessions.</div>';
    return;
  }
  el.innerHTML = S.memories.map(m =>
    `<div class="memory-item"><span class="memory-icon">${m.text.slice(0,2)}</span><span>${m.text.slice(2)}<br><span style="font-size:11px;color:var(--text3)">${formatTime(m.time)}</span></span></div>`
  ).join('');
}

function clearMemories() {
  S.memories = [];
  renderMemories();
  showNotif('🗑', 'Memories cleared.');
  saveData();

}

// ── ACHIEVEMENTS ─────────────────────────────────────────────

function awardAchievement(id) {
  if (S.achievements.includes(id)) return;
  S.achievements.push(id);
  const def = ACHIEVEMENT_DEFS[id];
  if (def) showNotif(def.icon, 'Achievement unlocked: ' + def.label);
  renderAchievements();
  saveData();
}
function renderAchievements() {
  const el = document.getElementById('achievements-list');
  if (!el) return;
  if (!S.achievements.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px">Complete focus sessions to earn achievements</div>';
    return;
  }
  el.innerHTML = S.achievements.map(id => {
    const d = ACHIEVEMENT_DEFS[id] || { icon: '🏅', label: id };
    return `<div style="background:var(--surface2);border-radius:10px;padding:12px 16px;display:flex;gap:10px;align-items:center;font-size:13px;">
      <span style="font-size:22px">${d.icon}</span><span>${d.label}</span>
    </div>`;
  }).join('');
}
//save data
function saveData() {
  try {
    localStorage.setItem("deskbuddy_memories", JSON.stringify(S.memories));
    localStorage.setItem("deskbuddy_achievements", JSON.stringify(S.achievements));
    localStorage.setItem("deskbuddy_settings", JSON.stringify(S.settings));
    localStorage.setItem("deskbuddy_tasks", JSON.stringify(tasks));
    localStorage.setItem("deskbuddy_timer", JSON.stringify({
      active: S.pomodoroActive,
      seconds: S.pomodoroSeconds,
      total: S.pomodoroTotal,
      session: S.sessionSeconds
    }));
    if (window.DAILY_SUMMARIES) localStorage.setItem('deskbuddy_summaries', JSON.stringify(window.DAILY_SUMMARIES));
  } catch (e) {
    console.warn('saveData failed', e);
  }
}
function loadData() {
  const savedMemories = localStorage.getItem("deskbuddy_memories");
  const savedAchievements = localStorage.getItem("deskbuddy_achievements");
  const savedSettings = localStorage.getItem("deskbuddy_settings");
  const savedTasks = localStorage.getItem("deskbuddy_tasks");
  const savedTimer = localStorage.getItem("deskbuddy_timer");
  const savedSummaries = localStorage.getItem('deskbuddy_summaries');

  if (savedMemories) S.memories = JSON.parse(savedMemories);
  if (savedAchievements) S.achievements = JSON.parse(savedAchievements);
  if (savedSettings) S.settings = JSON.parse(savedSettings);
  if (savedTasks) tasks = JSON.parse(savedTasks);
  if (savedTimer) {
    const t = JSON.parse(savedTimer);
    S.pomodoroActive = t.active;
    S.pomodoroSeconds = t.seconds;
    S.pomodoroTotal = t.total;
    S.sessionSeconds = t.session || 0;
  }
  if (savedSummaries) {
    try { window.DAILY_SUMMARIES = JSON.parse(savedSummaries); } catch(e) { window.DAILY_SUMMARIES = {}; }
  } else {
    window.DAILY_SUMMARIES = {};
  }
}
// Task Management
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const tasksList = document.getElementById("tasks-list");

let tasks = JSON.parse(
  localStorage.getItem("deskbuddy_tasks")
) || [];

// Render Tasks
function renderTasks() {
  tasksList.innerHTML = "";

  // Empty State
  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="task-card">
        <div>
          <div class="task-title">
            Your focus space is clean. Add your first task.
          </div>
        </div>
      </div>
    `;
    updateTaskCounter();
    return;
  }

  // Render Tasks
  tasks.forEach((task, index) => {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
        <div class="task-title ${task.completed ? "completed" : ""}">${task.title}</div>
      </div>
      <button class="delete-btn">Delete</button>
    `;

    // Complete Task
    const checkbox = taskCard.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => {
      tasks[index].completed = checkbox.checked;
      if (checkbox.checked) {
        taskCard.classList.add('task-complete-anim');
        setTimeout(() => {
          saveTasks();
          addMemory('✅ Completed task: ' + tasks[index].title);
          renderTasks();
        }, 480);
      } else {
        saveTasks();
        renderTasks();
      }
    });

    // Delete Task
    const deleteBtn = taskCard.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    tasksList.appendChild(taskCard);
  });
  updateTaskCounter();
}

// Add Task
addTaskBtn.addEventListener("click", () => {

  const title = taskInput.value.trim();

  if (!title) return;

  tasks.push({
    title,
    completed: false
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
});
taskInput.addEventListener("keydown", (e) => {

  if (e.key === "Enter") {

    addTaskBtn.click();

  }

});
// Save Tasks
function saveTasks() {

  localStorage.setItem(
    "deskbuddy_tasks",
    JSON.stringify(tasks)
  );
}

// Initial Render
renderTasks();

//Timer
function saveTimer() {

  localStorage.setItem(
    "deskbuddy_timer",

    JSON.stringify({

      active: S.pomodoroActive,

      seconds: S.pomodoroSeconds,

      total: S.pomodoroTotal,

      session: S.sessionSeconds

    })
  );
}

function loadTimer() {

  const savedTimer =
    localStorage.getItem("deskbuddy_timer");

  if (savedTimer) {

    const t = JSON.parse(savedTimer);

    S.pomodoroActive = t.active;

    S.pomodoroSeconds = t.seconds;

    S.pomodoroTotal = t.total;

    S.sessionSeconds = t.session || 0;

    updatePomodoroUI();
  }
}

function renderTimer() {
  const el = document.getElementById("pomodoro-timer");
  if (!el) return;
  const min = Math.floor(S.pomodoroSeconds / 60);
  const sec = S.pomodoroSeconds % 60;
  el.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  saveTimer();
} 
renderTimer();

// Daily summaries helper
function saveDailySummary(minutes, sessions) {
  const d = new Date();
  const key = d.toISOString().slice(0,10);
  window.DAILY_SUMMARIES = window.DAILY_SUMMARIES || {};
  const cur = window.DAILY_SUMMARIES[key] || { date: key, focusMinutes: 0, tasksCompleted: 0, sessions: 0 };
  cur.focusMinutes = (cur.focusMinutes || 0) + (minutes || 0);
  cur.sessions = (cur.sessions || 0) + (sessions || 0);
  cur.tasksCompleted = tasks.filter(t => t.completed).length;
  window.DAILY_SUMMARIES[key] = cur;
  try { localStorage.setItem('deskbuddy_summaries', JSON.stringify(window.DAILY_SUMMARIES)); } catch(e) {}
}

function getSummaries() {
  return window.DAILY_SUMMARIES || {};
}

function updateTaskCounter() {
  const el = document.getElementById('tasks-counter');
  if (!el) return;
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  el.textContent = `${done} / ${total} tasks completed`;
}