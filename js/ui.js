function renderApps() {
  const el = document.getElementById('app-sim');
  el.innerHTML = APPS.map(a =>
    `<div class="app-pill ${a.type === 'sensitive' ? 'sensitive' : ''}" id="pill-${a.id}" onclick="setActiveApp('${a.id}')">${a.emoji} ${a.label}</div>`
  ).join('');
}

function setActiveApp(id) {
  const app = APPS.find(a => a.id === id);
  if (!app) return;

  // Privacy: stop tracking sensitive apps
  if (app.type === 'sensitive') {
    document.querySelectorAll('.app-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('pill-' + id).classList.add('active');
    document.getElementById('active-app-label').textContent = '🔒 Tracking paused (sensitive app)';
    document.getElementById('active-app-type').textContent = 'PRIVATE';
    document.getElementById('active-app-type').className = 'tag tag-red';
    S.activeApp = null;
    showNotif('🔒', 'Tracking paused — private app detected');
    return;
  }

  if (S.activeApp && S.activeApp !== id) {
    S.switchCount++;
    S.switchBuffer.push(Date.now());
    // Only keep switches in last 60s
    const now = Date.now();
    S.switchBuffer = S.switchBuffer.filter(t => now - t < 60000);

    logActivity(S.activeApp, app);
  }

  S.activeApp = id;
  S.lastActivity = Date.now();
  resetIdleTimer();

  document.querySelectorAll('.app-pill').forEach(p => p.classList.remove('active'));
  document.getElementById('pill-' + id).classList.add('active');

  const typeLabels = { work: 'PRODUCTIVE', distract: 'DISTRACTION', neutral: 'NEUTRAL', comms: 'COMMS', ambient: 'AMBIENT' };
  const typeColors = { work: 'tag-green', distract: 'tag-red', neutral: 'tag-amber', comms: 'tag-accent', ambient: 'tag-teal' };
  document.getElementById('active-app-label').textContent = app.emoji + ' ' + app.label;
  const typeEl = document.getElementById('active-app-type');
  typeEl.textContent = typeLabels[app.type] || app.type.toUpperCase();
  typeEl.className = 'tag ' + (typeColors[app.type] || 'tag-amber');
}

function logActivity(prevId, nextApp) {
  const prev = APPS.find(a => a.id === prevId);
  if (!prev) return;
  const log = S.activityLog;
  log.unshift({ from: prev, to: nextApp, time: new Date() });
  if (log.length > 5) log.pop();
  renderFeed();
}
function renderFeed() {
  const el = document.getElementById('activity-feed');
  if (!S.activityLog.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0">No activity yet</div>';
    return;
  }
  el.innerHTML = S.activityLog.map(l => {
    const typeColors = { work: '#4ade80', distract: '#f87171', neutral: '#fbbf24', comms: '#a78bfa', ambient: '#2dd4bf' };
    return `<div class="feed-item">
      <div class="feed-dot" style="background:${typeColors[l.from.type] || '#888'}"></div>
      <div class="feed-app">${l.from.emoji} ${l.from.label} → ${l.to.emoji} ${l.to.label}</div>
      <div class="feed-dur">${formatTime(l.time)}</div>
    </div>`;
  }).join('');
}
function updateAvatar() {
  const av = AVATARS[S.focusState] || AVATARS.neutral;
  const face = document.getElementById('avatar-face');
  const stateText = document.getElementById('avatar-state-text');
  const tag = document.getElementById('state-tag');
  if (face) face.textContent = av.emoji;
  if (stateText) stateText.textContent = av.desc;
  if (tag) {
    const tagMap = { neutral:'tag-teal', focused:'tag-green', deep:'tag-accent', distracted:'tag-amber', idle:'' };
    tag.className = 'tag ' + (tagMap[S.focusState] || '');
    tag.textContent = av.label;
  }
}

function updateStats() {
  const el = id => document.getElementById(id);
  el('stat-focused').textContent = formatMin(S.focusedSeconds);
  el('stat-switches').textContent = S.switchCount;
  el('stat-idle').textContent = formatMin(S.idleSeconds);
  el('stat-sessions').textContent = S.totalSessions;
  const streakPct = Math.min((S.streakSeconds / (25 * 60)) * 100, 100);
  el('streak-bar').style.width = streakPct + '%';
  el('streak-label').textContent = formatMin(S.streakSeconds);
}

function updateSessionTag() {
  document.getElementById('session-tag').textContent = formatMin(S.sessionSeconds) + ' session';
}
function renderFocusChart() {
  const el = document.getElementById('focus-chart');
  if (!el) return;
  el.innerHTML = S.focusHistory.map(v => {
    const h = Math.max(4, v * 0.8);
    const color = v > 70 ? 'var(--accent)' : v > 40 ? 'var(--amber)' : v > 0 ? 'var(--red)' : 'var(--surface3)';
    return `<div class="chart-bar" style="height:${h}px;background:${color};opacity:0.85"></div>`;
  }).join('');
}

// ── WEEKLY STREAKS ──────────────────────────────────────────
function renderWeeklyStreaks() {
  const el = document.getElementById('weekly-streaks');
  if (!el) return;
  const colors = ['var(--surface3)', 'rgba(124,111,247,0.2)', 'rgba(124,111,247,0.5)', 'var(--accent)'];
  el.innerHTML = S.weeklyData.map((v, i) => {
    const day = ['M','T','W','T','F','S','S'][i % 7];
    const isToday = i === 34;
    return `<div class="streak-dot" style="background:${colors[v]};outline:${isToday ? '2px solid var(--accent)' : 'none'};outline-offset:1px;" title="${v > 0 ? v + ' focus sessions' : 'No sessions'}"></div>`;
  }).join('');
}

// ── FOCUS PAGE ──────────────────────────────────────────────
function updateFocusPage() {
  const av = AVATARS[S.focusState] || AVATARS.neutral;
  const el = id => document.getElementById(id);
  if (el('focus-emoji-big')) el('focus-emoji-big').textContent = av.emoji;
  if (el('focus-state-big')) el('focus-state-big').textContent = av.label;
  if (el('focus-desc-big')) el('focus-desc-big').textContent = av.desc;
}
// ── SPEECH ──────────────────────────────────────────────────
function speakBuddy(text) {
  if (!S.settings.audio) return;
  const el = document.getElementById('avatar-speech');
  if (el) {
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = 1;
    }, 200);
  }
  S.lastSpeech = Date.now();
}

function maybeSayRandomly() {
  const now = Date.now();
  if (now - S.lastSpeech < S.speechCooldown) return;
  // Only speak occasionally (roughly every 30-60s with some randomness)
  if (Math.random() > 0.03) return;
  const lines = SPEECHES[S.focusState] || SPEECHES.neutral;
  speakBuddy(pick(lines));
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── NOTIFICATIONS ────────────────────────────────────────────
function showNotif(icon, text) {
  const el = document.getElementById('notif');
  document.getElementById('notif-icon').textContent = icon;
  document.getElementById('notif-text').textContent = text;
  el.classList.add('show');
  clearTimeout(S._notifTimer);
  S._notifTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
// ── SETTINGS ─────────────────────────────────────────────────
function toggleSetting(key) {
  if (key === 'privacy') return; // always on
  S.settings[key] = !S.settings[key];
  const el = document.getElementById('toggle-' + key);
  if (el) el.classList.toggle('on', S.settings[key]);
  showNotif(S.settings[key] ? '✅' : '🔕', key.charAt(0).toUpperCase() + key.slice(1) + (S.settings[key] ? ' enabled' : ' disabled'));
  saveData();
}

// ── PAGE ROUTING ──────────────────────────────────────────────


function showPage(id) {
  ['dash','focus','memory','tasks','settings'].forEach(p => {
    document.getElementById('page-' + p).classList.toggle('active', p === id);
    document.getElementById('nav-' + p).classList.toggle('active', p === id);
  });
  const meta = PAGE_META[id] || {};
  document.getElementById('page-title').textContent = meta.title || '';
  document.getElementById('page-sub').textContent = meta.sub || '';
  if (id === 'memory') renderMemories();
  if (id === 'focus') renderWeeklyStreaks();
}

function formatMin(s) {
  if (s < 60) return s + 's';
  return Math.floor(s / 60) + 'm';
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
//setting
function renderSettings() {

    Object.keys(S.settings).forEach(key => {

        const toggle =
            document.getElementById(`toggle-${key}`);

        if (!toggle) return;

        if (S.settings[key]) {
            toggle.classList.add("on");
        } else {
            toggle.classList.remove("on");
        }

    });

}
