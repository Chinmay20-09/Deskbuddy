const S = {
  focusScore: 0,
  focusState: 'neutral', // neutral | focused | deep | distracted | idle
  activeApp: null,
  sessionStart: Date.now(),
  sessionSeconds: 0,
  switchCount: 0,
  focusedSeconds: 0,
  idleSeconds: 0,
  streakSeconds: 0,
  totalSessions: 0,
  lastActivity: Date.now(),
  focusHistory: Array(8).fill(0),
  activityLog: [],
  memories: [],
  achievements: [],
  settings: { audio: true, webcam: false, memory: true, breaks: true, privacy: true },
  pomodoroActive: false, pomodoroSeconds: 25*60, pomodoroTotal: 25*60,
  lastSpeech: 0, speechCooldown: 20000,
  weeklyData: Array(35).fill(0).map(() => Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0),
  switchBuffer: [], idleTimer: null
};

// ── APPS ──────────────────────────────────────────────────────
const APPS = [
  { id: 'vscode', label: 'VS Code', type: 'work', color: '#4ade80', emoji: '💻' },
  { id: 'figma', label: 'Figma', type: 'work', color: '#4ade80', emoji: '🎨' },
  { id: 'notion', label: 'Notion', type: 'work', color: '#4ade80', emoji: '📝' },
  { id: 'chrome', label: 'Chrome', type: 'neutral', color: '#fbbf24', emoji: '🌐' },
  { id: 'youtube', label: 'YouTube', type: 'distract', color: '#f87171', emoji: '▶️' },
  { id: 'twitter', label: 'Twitter', type: 'distract', color: '#f87171', emoji: '🐦' },
  { id: 'slack', label: 'Slack', type: 'comms', color: '#a78bfa', emoji: '💬' },
  { id: 'terminal', label: 'Terminal', type: 'work', color: '#4ade80', emoji: '🖥' },
  { id: 'spotify', label: 'Spotify', type: 'ambient', color: '#2dd4bf', emoji: '🎵' },
  { id: 'bank', label: '🔒 Bank (Private)', type: 'sensitive', color: '#f87171', emoji: '🔒' },
];

const SPEECHES = {
  focused: [
    "Nice work, keep it up.",
    "You're in the zone.",
    "Great focus streak!",
    "This is productive energy.",
  ],
  deep: [
    "Deep work mode. Don't break the flow.",
    "You're really locked in today.",
    "Impressive concentration.",
  ],
  distracted: [
    "You've been switching a lot.",
    "Maybe try focusing on one thing?",
    "A little scattered — that's okay.",
  ],
  idle: [
    "Taking a break? Good idea.",
    "Still there?",
    "Idle for a bit. Ready when you are.",
  ],
  neutral: [
    "Getting to know you…",
    "Watching your workflow.",
    "Learning your patterns.",
  ]
};

const AVATARS = {
  neutral: { emoji: '😊', label: 'Neutral', desc: 'Observing your workflow…', color: 'var(--text3)' },
  focused: { emoji: '🤩', label: 'Focused', desc: 'You\'re in flow state!', color: 'var(--green)' },
  deep: { emoji: '🧠', label: 'Deep Work', desc: 'Maximum concentration.', color: 'var(--accent)' },
  distracted: { emoji: '😟', label: 'Distracted', desc: 'Lots of context switching…', color: 'var(--amber)' },
  idle: { emoji: '😴', label: 'Idle', desc: 'You seem away from desk.', color: 'var(--text2)' },
};
const ACHIEVEMENT_DEFS = {
  'pomodoro': { icon: '🍅', label: 'First Pomodoro' },
  '30m': { icon: '⚡', label: '30m Focus' },
  'streak5': { icon: '🔥', label: '5-Day Streak' },
};
const PAGE_META = {
  dash:     { title: 'Dashboard', sub: 'Your focus companion is watching' },
  focus:    { title: 'Focus Mode', sub: 'Track your deep work sessions' },
  memory:   { title: 'Memory', sub: 'What Buddy has learned about you' },
  settings: { title: 'Settings', sub: 'Configure your companion' },
};