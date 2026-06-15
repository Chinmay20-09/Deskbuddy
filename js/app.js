function init() {
    loadData();

    loadTimer();

    renderTimer();

    // show correct pomodoro controls state on load
    try {
      if (typeof showPomControlsState === 'function') {
        if (S.pomodoroActive) showPomControlsState('running');
        else if (S.pomodoroSeconds < S.pomodoroTotal) showPomControlsState('paused');
        else showPomControlsState('idle');
      }
    } catch(e) {}

    renderSettings();

    renderMemories();

    renderAchievements();

    renderApps();

    renderWeeklyStreaks();

    // rebuild charts from persisted summaries when available
    try { rebuildFocusFromSummaries(); } catch(e) { renderFocusChart(); }

    setActiveApp('vscode');

    tick();

    setInterval(tick, 1000);

    setInterval(updateFocusHistory, 10000);

    showPage('dash');
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (e.key === ' ' && active && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (S.pomodoroActive) resetPomodoro(); else startPomodoro();
        } else if (e.key === 'Escape') {
            const n = document.getElementById('notif'); if (n) n.classList.remove('show');
        }
    });
}
window.addEventListener('DOMContentLoaded', init);

function rebuildFocusFromSummaries() {
  const sums = (typeof getSummaries === 'function') ? getSummaries() : {};
  const days = Object.keys(sums).sort();
  if (!days.length) return renderFocusChart();
  // populate weeklyData by last 7 days
  const last7 = days.slice(-7).map(d => sums[d].focusMinutes || 0);
  // normalize to 0-3 levels used elsewhere
  S.weeklyData = Array(35).fill(0);
  for (let i=0;i<last7.length;i++) {
    const v = last7[i];
    const level = v >= 60 ? 3 : v >= 30 ? 2 : v > 0 ? 1 : 0;
    S.weeklyData[34 - (last7.length - 1 - i)] = level;
  }
  // build focusHistory from most recent 8 summaries (scaled)
  const recent = days.slice(-8).map(d => Math.min(100, Math.round((sums[d].focusMinutes || 0) / 60 * 100)));
  while (recent.length < 8) recent.unshift(0);
  S.focusHistory = recent.slice(-8);
  renderWeeklyStreaks();
  renderFocusChart();
}