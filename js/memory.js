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
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0">No memories yet</div>';
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
  

    console.log("SAVE RUNNING");

    localStorage.setItem(
        "deskbuddy_memories",
        JSON.stringify(S.memories)
    );

    localStorage.setItem(
        "deskbuddy_achievements",
        JSON.stringify(S.achievements)
    );

    localStorage.setItem(
        "deskbuddy_settings",
        JSON.stringify(S.settings)
    );

    localStorage.setItem("deskbuddy_memories", JSON.stringify(S.memories));
    localStorage.setItem("deskbuddy_achievements", JSON.stringify(S.achievements));
    localStorage.setItem("deskbuddy_settings", JSON.stringify(S.settings));
}
function loadData() {
 console.log("data is loading");
    const savedMemories =
        localStorage.getItem("deskbuddy_memories");

    const savedAchievements =
        localStorage.getItem("deskbuddy_achievements");

    const savedSettings =
        localStorage.getItem("deskbuddy_settings");

    if (savedMemories) {
        S.memories = JSON.parse(savedMemories);
    }

    if (savedAchievements) {
        S.achievements = JSON.parse(savedAchievements);
    }

    if (savedSettings) {
        S.settings = JSON.parse(savedSettings);
    }
}
Object.keys(S.settings).forEach(key => {
    const el = document.getElementById('toggle-' + key);

    if (el && S.settings[key]) {
        el.classList.add('on');
    }
});