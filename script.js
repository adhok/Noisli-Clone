// --- 1. LOCAL STORAGE & INIT ---
window.onload = function () {
    if (localStorage.getItem('workDuration')) {
        const savedWork = localStorage.getItem('workDuration');
        document.getElementById('work-duration').value = savedWork;
        updateWorkDuration(savedWork);
    }
    if (localStorage.getItem('breakDuration')) {
        const savedBreak = localStorage.getItem('breakDuration');
        document.getElementById('break-duration').value = savedBreak;
        updateBreakDuration(savedBreak);
    }
    if (localStorage.getItem('totalSessions')) {
        totalSessions = parseInt(localStorage.getItem('totalSessions'));
        updateSessionDisplay();
    }
    if (localStorage.getItem('gameHighScore')) {
        gameHighScore = parseInt(localStorage.getItem('gameHighScore'));
        document.getElementById('high-score-display').innerText = gameHighScore;
    }

    // --- PREVENT ACCIDENTAL PAUSE (Earbuds/Media Keys) ---
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', function () { });
        navigator.mediaSession.setActionHandler('pause', function () {
            console.log('External pause intercepted.');
        });
        navigator.mediaSession.setActionHandler('stop', function () { });
        navigator.mediaSession.setActionHandler('previoustrack', function () { });
        navigator.mediaSession.setActionHandler('nexttrack', function () { });
    }

    window.addEventListener('keydown', function (e) {
        if (e.key === 'MediaPlayPause' || e.key === 'MediaStop') {
            e.preventDefault();
        }
    });

    // Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// --- 2. AUDIO LOGIC ---

function toggleSound(audioId, cardId) {
    const audio = document.getElementById(audioId);
    const card = document.getElementById(cardId);
    const statusText = card.querySelector('.status-text');

    if (!audio) return;

    const isActive = card.classList.contains('active');

    if (isActive) {
        audio.pause();
        audio.currentTime = 0;
        card.classList.remove('active');
        statusText.innerText = "OFF";
        audio.dataset.fading = "false";
    } else {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                card.classList.add('active');
                statusText.innerText = "ACTIVE";
                audio.dataset.fading = "false";
                const slider = card.querySelector('input[type=range]');
                audio.volume = slider.value;
            }).catch(error => console.error("Playback failed:", error));
        }
    }
}

function setVolume(audioId, volValue) {
    const audio = document.getElementById(audioId);
    if (audio.dataset.fading !== "true") {
        audio.volume = volValue;
    }
}

function stopAllSounds() {
    ['forest', 'rain', 'birds', 'water', 'brown'].forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            const card = document.getElementById('card-' + id);
            if (card) {
                card.classList.remove('active');
                card.querySelector('.status-text').innerText = "OFF";
            }
        }
    });
}

function fadeOutAndStop() {
    const activeAudios = [];
    document.querySelectorAll('audio').forEach(a => {
        if (!a.paused) {
            a.dataset.fading = "true";
            activeAudios.push(a);
        }
    });

    if (activeAudios.length === 0) return;

    let fadeInterval = setInterval(() => {
        let stillFading = false;
        activeAudios.forEach(a => {
            if (a.volume > 0.05) {
                a.volume -= 0.05;
                stillFading = true;
            } else {
                a.volume = 0;
            }
        });

        if (!stillFading) {
            clearInterval(fadeInterval);
            activeAudios.forEach(a => {
                a.pause();
                a.dataset.fading = "false";
                const card = document.getElementById('card-' + a.id);
                a.volume = card.querySelector('input').value;
                card.classList.remove('active');
                card.querySelector('.status-text').innerText = "OFF";
            });
        }
    }, 100);
}

// --- 3. TIMER & STATE MANAGEMENT ---
let timer;
let isRunning = false;
let timeLeft = 25 * 60;
let isBreak = false;
let workDuration = 25;
let breakDuration = 5;
let gameEnabled = false;
let totalSessions = 0;

const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const modeLabel = document.getElementById('timer-mode');
const modeBtn = document.getElementById('mode-btn');

function showNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: body });
    }
}

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    timeDisplay.textContent = timeString;
    const mode = isBreak ? "Break" : "Focus";
    document.title = isRunning ? `(${timeString}) ${mode} | Eco-Focus` : "Eco-Focus | Bio-Dome";
}

function updateWorkDuration(value) {
    let duration = parseInt(value);
    if (duration < 5) duration = 5;
    workDuration = duration;
    localStorage.setItem('workDuration', duration);
    if (!isBreak && !isRunning) {
        timeLeft = workDuration * 60;
        updateDisplay();
    }
}

function updateBreakDuration(value) {
    let duration = parseInt(value);
    if (duration < 1) duration = 1;
    breakDuration = duration;
    localStorage.setItem('breakDuration', duration);
    if (isBreak && !isRunning) {
        timeLeft = breakDuration * 60;
        updateDisplay();
    }
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timer);
        startBtn.textContent = "Start";
        startBtn.classList.remove('btn-primary');
    } else {
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                startBtn.textContent = "Start";
                startBtn.classList.remove('btn-primary');
                fadeOutAndStop();
                startBtn.classList.remove('btn-primary');
                fadeOutAndStop();
                if (!isBreak) {
                    // Work session finished
                    totalSessions++;
                    localStorage.setItem('totalSessions', totalSessions);
                    updateSessionDisplay();

                    // Record detailed session data
                    const sessionData = {
                        timestamp: Date.now(),
                        duration: workDuration,
                        type: 'work'
                    };

                    let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
                    sessionHistory.push(sessionData);

                    // Prune data older than 90 days
                    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
                    sessionHistory = sessionHistory.filter(s => s.timestamp > ninetyDaysAgo);

                    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));

                    showNotification("Focus Session Complete", "Great job! Take a break.");
                } else {
                    // Break finished
                    showNotification("Break Over!", "Time to get back to work.");
                }
                if (isBreak) switchMode();
            }
        }, 1000);
        startBtn.textContent = "Pause";
        startBtn.classList.add('btn-primary');
    }
    isRunning = !isRunning;
    updateDisplay();
}

function updateSessionDisplay() {
    document.getElementById('session-count-display').innerText = "TOTAL SESSIONS: " + totalSessions;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = "Start";
    startBtn.classList.remove('btn-primary');
    timeLeft = isBreak ? breakDuration * 60 : workDuration * 60;
    updateDisplay();
}

function switchMode() {
    isBreak = !isBreak;
    resetTimer();

    const gameBtn = document.getElementById('btn-view-game');
    const lockStatus = document.getElementById('game-lock-status');

    if (isBreak) {
        // BREAK MODE
        timeLeft = breakDuration * 60;
        modeLabel.textContent = "System Cool-down";
        modeLabel.style.color = "#00bcd4";
        modeBtn.textContent = "Back to Work";
        gameEnabled = true;

        document.getElementById('btn-view-game').disabled = false;
        document.getElementById('btn-view-breathing').disabled = false;

        lockStatus.innerText = "(Ready)";
        lockStatus.style.color = "#00bcd4";
    } else {
        // WORK MODE
        timeLeft = workDuration * 60;
        modeLabel.textContent = "System Focus";
        modeLabel.style.color = "#888";
        modeBtn.textContent = "Break";
        setView('audio'); // Force back to audio
        gameEnabled = false;

        document.getElementById('btn-view-game').disabled = true;
        document.getElementById('btn-view-breathing').disabled = true;

        lockStatus.innerText = "(Locked)";
        lockStatus.style.color = "#666";
    }
    updateDisplay();
}

function setView(viewName) {
    document.getElementById('view-audio').style.display = viewName === 'audio' ? 'grid' : 'none';
    document.getElementById('view-game').style.display = viewName === 'game' ? 'block' : 'none';
    document.getElementById('view-breathing').style.display = viewName === 'breathing' ? 'flex' : 'none';
    document.getElementById('view-stats').style.display = viewName === 'stats' ? 'flex' : 'none';

    document.getElementById('btn-view-audio').classList.toggle('active', viewName === 'audio');
    document.getElementById('btn-view-game').classList.toggle('active', viewName === 'game');
    document.getElementById('btn-view-breathing').classList.toggle('active', viewName === 'breathing');
    document.getElementById('btn-view-stats').classList.toggle('active', viewName === 'stats');

    // Handle Game State
    if (viewName === 'game' && gameEnabled) {
        initGame();
    } else {
        stopGame();
    }

    // Handle Breathing State
    if (viewName === 'breathing') {
        startBreathing();
    } else {
        stopBreathing();
    }

    // Handle Statistics State
    if (viewName === 'stats') {
        renderStatistics();
    }
}

// --- BREATHING LOGIC ---
let breathInterval;

function startBreathing() {
    const circle = document.querySelector('.breath-circle');
    const text = document.getElementById('breath-instruction');

    circle.classList.add('animating');
    text.innerText = "Breathe In";

    // Sync text with CSS animation (13s total: 5s In, 3s Hold, 5s Out)

    let phase = 0;
    // Immediate start
    setTimeout(() => text.innerText = "Hold", 5000);
    setTimeout(() => text.innerText = "Breathe Out", 8000);

    breathInterval = setInterval(() => {
        text.innerText = "Breathe In";
        setTimeout(() => text.innerText = "Hold", 5000);
        setTimeout(() => text.innerText = "Breathe Out", 8000);
    }, 13000);
}

function stopBreathing() {
    const circle = document.querySelector('.breath-circle');
    circle.classList.remove('animating');
    clearInterval(breathInterval);
    document.getElementById('breath-instruction').innerText = "Ready?";
}

// --- 4. GAME ENGINE ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;
let score = 0;
let frameCount = 0;
let player = { x: 280, y: 360, w: 30, h: 20, color: '#00bcd4' };
let bullets = [];
let enemies = [];
let keys = {};
let gameRunning = false;
let baseSpeed = 2;
let gameLevel = 1;
let gameHighScore = 0;

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && document.getElementById('view-game').style.display === 'block') {
        e.preventDefault();
        if (!gameRunning && gameEnabled) startGameLoop();
        else if (gameRunning) fireBullet();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Mobile Controls Helper
function setKey(code, val) {
    keys[code] = val;
}

function handleMobileFire() {
    if (document.getElementById('view-game').style.display === 'block') {
        if (!gameRunning && gameEnabled) startGameLoop();
        else if (gameRunning) fireBullet();
    }
}

function initGame() {
    score = 0;
    frameCount = 0;
    baseSpeed = 2;
    gameLevel = 1;

    document.getElementById('score-display').innerText = score;
    document.getElementById('wave-display').innerText = "WAVE " + gameLevel;
    document.getElementById('game-start-msg').style.display = "block";
    document.getElementById('game-start-msg').innerText = "Press SPACE to Start";

    spawnWave(1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
}

function spawnWave(level) {
    enemies = [];
    const pattern = (level - 1) % 4;

    // Speed increases with level
    baseSpeed = 2 + (level * 0.5);

    if (pattern === 0) {
        // Classic Grid
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 8; c++) {
                createEnemy(50 + c * 60, 30 + r * 40);
            }
        }
    } else if (pattern === 1) {
        // The Wedge (V-shape)
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 9; c++) {
                if (Math.abs(c - 4) <= r) {
                    createEnemy(50 + c * 55, 30 + r * 40);
                }
            }
        }
    } else if (pattern === 2) {
        // Split Columns
        for (let c = 0; c < 3; c++) {
            // Left group
            for (let r = 0; r < 6; r++) createEnemy(40 + c * 50, 30 + r * 40);
            // Right group
            for (let r = 0; r < 6; r++) createEnemy(400 + c * 50, 30 + r * 40);
        }
    } else {
        // Checkerboard
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 10; c++) {
                if ((r + c) % 2 === 0) {
                    createEnemy(30 + c * 50, 30 + r * 35);
                }
            }
        }
    }
}

function createEnemy(x, y) {
    enemies.push({
        x: x, y: y, w: 30, h: 20,
        alive: true,
        mode: 'formation',
        formationX: x, formationY: y
    });
}

function startGameLoop() {
    if (!gameEnabled) return;

    // Auto-start timer if not running
    if (!isRunning) {
        toggleTimer();
    }

    gameRunning = true;
    document.getElementById('game-start-msg').style.display = "none";
    loop();
}

function stopGame() {
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
}

function fireBullet() {
    bullets.push({ x: player.x + 12, y: player.y, w: 6, h: 10 });
}

function updateGame() {
    frameCount++;

    // Player
    if (keys['ArrowLeft'] && player.x > 0) player.x -= 5;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += 5;

    // Bullets
    bullets.forEach((b, i) => {
        b.y -= 7;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Enemies Logic
    const globalSpeed = baseSpeed + (score / 100);
    const waveOffset = Math.sin(frameCount * 0.05) * 10;

    // Direction for formation (switch every 200 frames)
    let dir = Math.floor(frameCount / 200) % 2 === 0 ? 1 : -1;

    enemies.forEach(e => {
        if (!e.alive) return;

        if (e.mode === 'formation') {
            e.x += globalSpeed * dir;
            e.y = e.formationY + waveOffset; // Oscillation
        }

        if (e.mode === 'diving') {
            e.y += globalSpeed * 2.5;
            // Homing
            if (e.x < player.x) e.x += 1; else e.x -= 1;
            // Loop
            if (e.y > canvas.height) {
                e.mode = 'formation';
                e.y = 0;
            }
        }
    });

    // Trigger Random Dives
    if (frameCount % 100 === 0) {
        const living = enemies.filter(e => e.alive && e.mode === 'formation');
        if (living.length > 0) {
            living[Math.floor(Math.random() * living.length)].mode = 'diving';
        }
    }

    // Collisions
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (e.alive && b.x < e.x + e.w && b.x + b.w > e.x &&
                b.y < e.y + e.h && b.h + b.y > e.y) {
                e.alive = false;
                bullets.splice(bi, 1);
                score += 10;
                document.getElementById('score-display').innerText = score;

                // High Score Check
                if (score > gameHighScore) {
                    gameHighScore = score;
                    localStorage.setItem('gameHighScore', gameHighScore);
                    document.getElementById('high-score-display').innerText = gameHighScore;
                }
            }
        });
    });

    // Level Clear Check
    if (enemies.every(e => !e.alive)) {
        gameLevel++;
        document.getElementById('wave-display').innerText = "WAVE " + gameLevel;
        // Brief pause before spawn could be added here, currently instant
        spawnWave(gameLevel);
        // Bonus for clearing wave?
        score += 50;
        document.getElementById('score-display').innerText = score;
    }
}

function draw() {
    ctx.fillStyle = '#0f1215';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Enemies
    enemies.forEach(e => {
        if (e.alive) {
            if (e.mode === 'diving') {
                ctx.fillStyle = '#ff00ff'; // Purple Divers
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.fillStyle = '#fff'; // Big Eyes
                ctx.fillRect(e.x + 5, e.y + 8, 8, 8);
                ctx.fillRect(e.x + 18, e.y + 8, 8, 8);
            } else {
                ctx.fillStyle = '#ff4444'; // Red Standard
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.fillStyle = '#000'; // Small Eyes
                ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
                ctx.fillRect(e.x + 20, e.y + 5, 5, 5);
            }
        }
    });
}

function loop() {
    if (!gameRunning) return;
    updateGame();
    draw();
    gameLoopId = requestAnimationFrame(loop);
}

// --- 5. DATE TIME WIDGET ---
function updateDateTimeWidget() {
    const now = new Date();

    // Time
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('dt-time').innerText = timeStr;

    // Date
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    document.getElementById('dt-date').innerText = dateStr;
}

// Init and Interval
updateDateTimeWidget();
setInterval(updateDateTimeWidget, 1000);

// Location Fetch
function fetchLocation() {
    // Show loading state
    document.getElementById('dt-location').innerHTML = "Wait...";

    fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(response => response.json())
        .then(data => {
            const city = data.city;
            const country = data.country; // or country_code
            document.getElementById('dt-location').innerText = `${city}, ${country}`;
        })
        .catch(err => {
            console.error("Location fetch failed", err);
            document.getElementById('dt-location').innerText = "WORLDWIDE";
        });
}

// Removed auto-call: fetchLocation();

updateDisplay();

// --- 6. STATISTICS ENGINE ---

function getSessionHistory() {
    return JSON.parse(localStorage.getItem('sessionHistory') || '[]');
}

function calculateHourlyDistribution() {
    const history = getSessionHistory();
    const hourCounts = new Array(24).fill(0);

    history.forEach(session => {
        if (session.type === 'work') {
            const hour = new Date(session.timestamp).getHours();
            hourCounts[hour]++;
        }
    });

    return hourCounts;
}

function calculateBestStreak() {
    const history = getSessionHistory();
    if (history.length === 0) return 0;

    // Group by day
    const daysSet = new Set();
    history.forEach(s => {
        const day = new Date(s.timestamp).toDateString();
        daysSet.add(day);
    });

    const days = Array.from(daysSet).sort();
    let bestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < days.length; i++) {
        const prevDate = new Date(days[i - 1]);
        const currDate = new Date(days[i]);
        const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    return bestStreak;
}

function renderStatistics() {
    renderStatCards();
    renderHourlyChart();
}

function renderStatCards() {
    const bestStreak = calculateBestStreak();

    document.getElementById('total-sessions-stat').innerText = totalSessions;
    document.getElementById('best-streak-stat').innerText = bestStreak;
}

function renderHourlyChart() {
    const canvas = document.getElementById('statsCanvas');
    const ctx = canvas.getContext('2d');
    const hourCounts = calculateHourlyDistribution();

    // Get dynamic colors from CSS
    const styles = getComputedStyle(document.body);
    const accentColor = styles.getPropertyValue('--accent-color').trim();
    // Use a fixed start color or derive? Let's keep cyan as the low-intensity base if logical, 
    // or just use accentColor for everything.
    // Original was Cyan -> Green. 
    // Let's use accentColor as the "Max" intensity. 
    // And use a dimmed version or fixed Cyan for "Min". 
    // Since DayMode is Cyan, Min=Cyan Max=Cyan is flat. 
    // Let's enable a slight variation.
    const baseColor = styles.getPropertyValue('--text-dim').trim() || '#666';

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const innerRadius = 80;
    const maxBarLength = 150;

    const maxCount = Math.max(...hourCounts, 1);

    // Draw 24 hour segments (radial bars)
    for (let hour = 0; hour < 24; hour++) {
        const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2; // Start at top (12 o'clock)
        const count = hourCounts[hour];
        const barLength = (count / maxCount) * maxBarLength;

        // Start and end points of bar
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * (innerRadius + barLength);
        const y2 = centerY + Math.sin(angle) * (innerRadius + barLength);

        // Color gradient based on intensity
        const intensity = count / maxCount;
        // Interpolate between a subtle base and the bright accent
        // Note: interpolateColor needs hex. Ensure vars are hex.
        // If vars are not hex (e.g. name), this might break. 
        // For safety, let's just use the accentColor direct strength if complex.
        // But let's try to trust the vars are Hex for now as established in CSS.
        let color = accentColor;
        if (accentColor.startsWith('#') && baseColor.startsWith('#')) {
            color = interpolateColor(baseColor, accentColor, intensity);
        }

        // Draw bar
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw hour labels (every 3 hours)
        if (hour % 3 === 0) {
            const labelRadius = innerRadius + maxBarLength + 30;
            const labelX = centerX + Math.cos(angle) * labelRadius;
            const labelY = centerY + Math.sin(angle) * labelRadius;

            ctx.fillStyle = styles.getPropertyValue('--text-secondary').trim();
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hour.toString(), labelX, labelY);
        }
    }

    // Draw center circle with title
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('24 Hour', centerX, centerY - 10);

    ctx.fillStyle = styles.getPropertyValue('--text-dim').trim();
    ctx.font = '14px Segoe UI';
    ctx.fillText('Clock', centerX, centerY + 15);
}

function interpolateColor(color1, color2, factor) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
}

function exportStats() {
    const history = getSessionHistory();

    if (history.length === 0) {
        alert('No session data to export yet!');
        return;
    }

    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eco-focus-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

function resetStats() {
    if (confirm('Are you sure? This will delete all your session history (but not your total session count).')) {
        localStorage.removeItem('sessionHistory');
        renderStatistics();
        alert('Session history cleared!');
    }
}

// --- 7. STICKY NOTES ENGINE ---

let stickyNotes = [];

// Load Notes
function initStickyNotes() {
    const savedNotes = localStorage.getItem('stickyNotes');
    if (savedNotes) {
        stickyNotes = JSON.parse(savedNotes);
        stickyNotes.forEach(renderNote);
    }
}

function toggleColorMenu() {
    const menu = document.getElementById('note-colors-menu');
    menu.classList.toggle('active');
}

function addNote(color = '#ffeb3b') {
    const id = Date.now();
    const noteData = {
        id: id,
        x: 100 + (stickyNotes.length * 20),
        y: 100 + (stickyNotes.length * 20),
        content: '',
        color: color
    };

    stickyNotes.push(noteData);
    saveNotes();
    renderNote(noteData);

    // Close menu after selection
    document.getElementById('note-colors-menu').classList.remove('active');
}

function renderNote(noteData) {
    const container = document.getElementById('sticky-notes-container');

    const noteEl = document.createElement('div');
    noteEl.className = 'sticky-note pop-in';
    noteEl.id = 'note-' + noteData.id;
    noteEl.style.left = noteData.x + 'px';
    noteEl.style.top = noteData.y + 'px';
    noteEl.style.backgroundColor = noteData.color;

    // Remove animation class after it plays so it doesn't replay on move
    noteEl.addEventListener('animationend', () => {
        noteEl.classList.remove('pop-in');
    });

    // Handle (Drag Area)
    const handle = document.createElement('div');
    handle.className = 'note-handle';

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'note-delete';
    deleteBtn.innerHTML = '&times;';

    // Use mousedown to prevent drag initiation and stop propagation
    deleteBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Stop drag from starting
        deleteNote(noteData.id);
    });

    handle.appendChild(deleteBtn);

    // Content (Editable)
    const content = document.createElement('div');
    content.className = 'note-content';
    content.contentEditable = true;
    content.innerText = noteData.content;
    content.oninput = () => updateNoteContent(noteData.id, content.innerText);

    noteEl.appendChild(handle);
    noteEl.appendChild(content);
    container.appendChild(noteEl);

    // Drag Logic
    makeDraggable(noteEl, handle, noteData.id);
}

function updateNoteContent(id, text) {
    const note = stickyNotes.find(n => n.id === id);
    if (note) {
        note.content = text;
        saveNotes();
    }
}

function deleteNote(id) {
    if (confirm('Delete this note?')) {
        stickyNotes = stickyNotes.filter(n => n.id !== id);
        saveNotes();
        const el = document.getElementById('note-' + id);
        if (el) el.remove();
    }
}

function saveNotes() {
    localStorage.setItem('stickyNotes', JSON.stringify(stickyNotes));
}

// Drag & Drop Handling
function makeDraggable(element, handle, id) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Z-Index Management (Bring to top)
        bringToFront(element);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate cursor movement
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Set new position
        let newTop = (element.offsetTop - pos2);
        let newLeft = (element.offsetLeft - pos1);

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function closeDragElement() {
        // Stop moving when mouse released
        document.onmouseup = null;
        document.onmousemove = null;

        // Save new position
        const note = stickyNotes.find(n => n.id === id);
        if (note) {
            note.x = element.offsetLeft;
            note.y = element.offsetTop;
            saveNotes();
        }
    }
}

function bringToFront(el) {
    // Simple z-index bump, or could re-append to container
    // For now, let's just make sure it's higher than others if we tracked z-indices
    // But re-appending to parent is the DOM way to 'bring to front' visually without z-index wars
    const container = document.getElementById('sticky-notes-container');
    container.appendChild(el);
}

// Init on load
window.addEventListener('load', initStickyNotes);


// --- 8. THEME TOGGLE ---

function initTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Auto-detect based on time (6 AM - 6 PM is Day)
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    }
}

function toggleTheme() {
    const checkbox = document.getElementById('theme-toggle-input');
    const newTheme = checkbox.checked ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Sync checkbox state
    const checkbox = document.getElementById('theme-toggle-input');
    if (checkbox) {
        checkbox.checked = (theme === 'light');
    }
}

// Init theme on load
window.addEventListener('load', initTheme);
