function init() {
    loadData();

    loadTimer();

    renderTimer();

    renderSettings();

    renderMemories();

    renderAchievements();

    renderApps();

    renderWeeklyStreaks();

    renderFocusChart();

    setActiveApp('vscode');

    tick();

    setInterval(tick, 1000);

    setInterval(updateFocusHistory, 10000);

    showPage('dash');
}
window.addEventListener('DOMContentLoaded', init);