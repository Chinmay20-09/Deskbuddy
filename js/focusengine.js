function tick() {
  S.sessionSeconds++;
  const activeApp = APPS.find(a => a.id === S.activeApp);
  saveTimer();

  // Count focused/idle
  if (activeApp) {
    if (activeApp.type === 'work') {
      S.focusedSeconds++;
      S.streakSeconds++;
    } else if (activeApp.type === 'distract') {
      S.streakSeconds = 0;
    } else {
      // neutral/comms/ambient don't break streak but don't build it either
    }
  } else {
    S.idleSeconds++;
  }

  // Calculate focus score
  updateFocusScore(activeApp);

  // Update UI
  updateSessionTag();
  updateStats();
  updateAvatar();
  updateFocusPage();

  // Pomodoro
  if (S.pomodoroActive) {
    S.pomodoroSeconds--;
    if (S.pomodoroSeconds <= 0) {
      finishPomodoro();
    }
    updatePomodoroUI();
  }

  // Memory
  if (S.streakSeconds > 0 && S.streakSeconds % 300 === 0) {
    addMemory(`🎯 ${Math.floor(S.streakSeconds/60)}m focus streak achieved`);
  }
  if (S.sessionSeconds === 600) addMemory('⏱ First 10-minute session today');
  if (S.switchCount === 10) addMemory('🔁 Noticed frequent app switching');
  if (S.focusedSeconds === 1800) { addMemory('🏆 30 minutes of focused work!'); awardAchievement('30m'); }

  // Auto speech
  maybeSayRandomly();
}

function updateFocusScore(activeApp) {
  const recentSwitches = S.switchBuffer.filter(t => Date.now() - t < 60000).length;
  let target = 50;
  if (!activeApp) { target = 20; S.focusState = 'idle'; }
  else if (activeApp.type === 'work') {
    if (recentSwitches < 2 && S.streakSeconds > 120) { target = 90; S.focusState = 'deep'; }
    else if (recentSwitches < 4) { target = 72; S.focusState = 'focused'; }
    else { target = 50; S.focusState = 'neutral'; }
  } else if (activeApp.type === 'distract') {
    target = recentSwitches > 3 ? 18 : 30;
    S.focusState = 'distracted';
  } else if (activeApp.type === 'comms') {
    target = 45;
    S.focusState = 'neutral';
  } else {
    target = 40;
    S.focusState = 'neutral';
  }
  S.focusScore = S.focusScore + (target - S.focusScore) * 0.08;

  // Update ring
  const circ = 326.7;
  const offset = circ - (S.focusScore / 100) * circ;
  const ring = document.getElementById('focus-ring-circle');
  if (ring) {
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = S.focusScore > 70 ? 'var(--accent)' : S.focusScore > 40 ? 'var(--amber)' : 'var(--red)';
  }
  const scoreText = document.getElementById('focus-score-text');
  if (scoreText) scoreText.textContent = Math.round(S.focusScore);
}
function updateFocusHistory() {
  S.focusHistory.push(Math.round(S.focusScore));
  S.focusHistory.shift();
  renderFocusChart();
}
// ── POMODORO ──────────────────────────────────────────────
function startPomodoro() {
  if (S.pomodoroActive) return;
  S.pomodoroActive = true;
  S.totalSessions++;
  showNotif('⏱', 'Focus session started! 25 minutes.');
  document.getElementById('timer-label').textContent = 'Focus in progress…';
  addMemory('⏱ Started a Pomodoro session');
}

function resetPomodoro() {
  S.pomodoroActive = false;
  S.pomodoroSeconds = 25 * 60;
  S.pomodoroTotal = 25 * 60;
  document.getElementById('timer-display').textContent = '25:00';
  document.getElementById('timer-label').textContent = 'Pomodoro ready';
  document.getElementById('pomodoro-bar').style.width = '0%';
}

function finishPomodoro() {
  S.pomodoroActive = false;
  S.pomodoroSeconds = 25 * 60;
  showNotif('🎉', 'Focus session complete! Time for a break.');
  document.getElementById('timer-label').textContent = 'Session complete! ✓';
  addMemory('✅ Completed a full 25m Pomodoro session');
  awardAchievement('pomodoro');
  setTimeout(() => {
    document.getElementById('pomodoro-bar').style.width = '0%';
  }, 2000);
  speakBuddy('Great work! You completed a full focus session.');
}

function updatePomodoroUI() {
  const m = Math.floor(S.pomodoroSeconds / 60);
  const s = S.pomodoroSeconds % 60;
  document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const pct = ((S.pomodoroTotal - S.pomodoroSeconds) / S.pomodoroTotal) * 100;
  document.getElementById('pomodoro-bar').style.width = pct + '%';
}

// ── IDLE ──────────────────────────────────────────────────────
function resetIdleTimer() {
  clearTimeout(S.idleTimer);
  S.idleTimer = setTimeout(() => {
    S.focusState = 'idle';
    if (S.settings.audio) speakBuddy(pick(SPEECHES.idle));
  }, 90000); // 90s idle detection
}