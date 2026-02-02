// Classroom Display App
// =====================

let currentClass = null;
let classContent = {};
let timetable = [];
let timerInterval = null;
let timerSeconds = 0;
let scores = { 1: 0, 2: 0 };

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadTimetable();
    await loadAllContent();
    updateClock();
    setInterval(updateClock, 1000);
    detectCurrentClass();
    setInterval(detectCurrentClass, 60000);
    setupKeyboardShortcuts();
    setLight('green'); // Default to green
});

// Load timetable
async function loadTimetable() {
    try {
        const response = await fetch('content/timetable.json');
        timetable = await response.json();
    } catch (e) {
        console.log('No timetable found');
        timetable = [];
    }
}

// Load all class content
async function loadAllContent() {
    const classes = ['8s-french', '8l-french', '3j-french', '6t-french', '7s-french', '7m-french'];
    for (const cls of classes) {
        try {
            const response = await fetch(`content/${cls}.json`);
            classContent[cls] = await response.json();
        } catch (e) {
            console.log(`No content for ${cls}`);
        }
    }
    // Try to detect current/next class from timetable
    detectCurrentClass();

    // If no class was set from timetable, use first available
    if (!currentClass) {
        const firstClass = Object.keys(classContent)[0];
        if (firstClass) {
            setClass(firstClass);
        }
    }
}

// Update clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    document.getElementById('time').textContent = timeStr;
    document.getElementById('date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    updateCountdown(now);
}

// Detect current or next class from timetable
function detectCurrentClass() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];

    // Filter to today's classes
    const todayClasses = timetable.filter(p => !p.days || p.days.includes(today));

    // Check if we're currently in a class
    for (const period of todayClasses) {
        const [startH, startM] = period.start.split(':').map(Number);
        const [endH, endM] = period.end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        if (currentTime >= startMins && currentTime < endMins) {
            setClass(period.class);
            return;
        }
    }

    // Find next upcoming class today
    let nextClass = null;
    let nextStart = Infinity;

    for (const period of todayClasses) {
        const [startH, startM] = period.start.split(':').map(Number);
        const startMins = startH * 60 + startM;

        if (startMins > currentTime && startMins < nextStart) {
            nextStart = startMins;
            nextClass = period.class;
        }
    }

    if (nextClass) {
        setClass(nextClass);
    }
}

// Update countdown to period end
function updateCountdown(now) {
    if (!currentClass) return;

    const period = timetable.find(p => p.class === currentClass);
    if (!period) {
        document.getElementById('period-countdown').textContent = '';
        return;
    }

    const [endH, endM] = period.end.split(':').map(Number);
    const endTime = new Date(now);
    endTime.setHours(endH, endM, 0, 0);

    const diff = endTime - now;
    const countdown = document.getElementById('period-countdown');
    if (diff > 0) {
        const mins = Math.floor(diff / 60000);
        countdown.textContent = `${mins} min restantes`;

        // Flash French flag colours when 5 mins or less
        if (mins <= 5) {
            countdown.classList.add('ending-soon');
        } else {
            countdown.classList.remove('ending-soon');
        }
    } else {
        countdown.classList.remove('ending-soon');
    }
}

// Set current class
function setClass(classId) {
    currentClass = classId;
    const content = classContent[classId];
    if (!content) return;

    document.getElementById('class-name').textContent = content.className || classId;
    renderObjectives(content.objectives);
    renderVocab(content.vocabulary);
    renderSentenceBuilder(content.sentenceBuilder);
    renderTasks(content.tasks);
}

// Render objectives
function renderObjectives(objectives) {
    const list = document.getElementById('objectives-list');
    list.innerHTML = '';
    if (!objectives) return;

    objectives.forEach(obj => {
        const li = document.createElement('li');
        li.textContent = obj;
        list.appendChild(li);
    });
}

// Render vocabulary
function renderVocab(vocab) {
    const grid = document.getElementById('vocab-grid');
    grid.innerHTML = '';
    if (!vocab) return;

    vocab.forEach(item => {
        const div = document.createElement('div');
        div.className = 'vocab-item';
        div.innerHTML = `
            <span class="vocab-french">${item.french}</span>
            <span class="vocab-english">${item.english}</span>
        `;
        grid.appendChild(div);
    });
}

// Render tasks
function renderTasks(tasks) {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';
    if (!tasks) return;

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task;
        list.appendChild(li);
    });
}

// Render sentence builder
function renderSentenceBuilder(sb) {
    const container = document.getElementById('sentence-builder');
    container.innerHTML = '';
    if (!sb || !sb.columns) return;

    sb.columns.forEach((col, i) => {
        const div = document.createElement('div');
        div.className = 'sb-column';
        div.innerHTML = `<div class="sb-column-header">${sb.headers?.[i] || ''}</div>`;
        col.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sb-item';
            itemDiv.textContent = item;
            div.appendChild(itemDiv);
        });
        container.appendChild(div);
    });
}

// Timer
function startTimer(seconds) {
    clearInterval(timerInterval);
    timerSeconds = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerFinished();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').textContent = '--:--';
    document.getElementById('timer-display').className = '';
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const display = document.getElementById('timer-display');
    display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    display.classList.remove('warning', 'danger');
    if (timerSeconds <= 60 && timerSeconds > 10) {
        display.classList.add('warning');
    } else if (timerSeconds <= 10 && timerSeconds > 0) {
        display.classList.add('danger');
    }
}

function timerFinished() {
    const display = document.getElementById('timer-display');
    display.textContent = "C'est fini!";
    display.classList.add('danger');
}

// Randomiser
function pickRandomStudent() {
    const content = classContent[currentClass];
    if (!content || !content.students || content.students.length === 0) {
        document.getElementById('randomiser-result').textContent = 'No students loaded';
        return;
    }

    const widget = document.getElementById('widget-randomiser');
    const overlay = document.getElementById('randomiser-overlay');
    const result = document.getElementById('randomiser-result');

    // Expand the widget
    widget.classList.add('expanded');
    overlay.classList.add('visible');
    result.classList.add('spinning');

    // Spin through names for effect
    let spins = 0;
    const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * content.students.length);
        result.textContent = content.students[randomIndex];
        spins++;

        if (spins > 15) {
            clearInterval(spinInterval);
            result.classList.remove('spinning');
            // Final pick
            const finalIndex = Math.floor(Math.random() * content.students.length);
            result.textContent = content.students[finalIndex];
        }
    }, 100);
}

function collapseRandomiser() {
    document.getElementById('widget-randomiser').classList.remove('expanded');
    document.getElementById('randomiser-overlay').classList.remove('visible');
}

// Scoreboard
function addScore(team, points) {
    scores[team] = Math.max(0, scores[team] + points);
    document.getElementById(`score${team}`).textContent = scores[team];
}

function resetScores() {
    scores = { 1: 0, 2: 0 };
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
}

// Traffic Light
function setLight(color) {
    document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
    document.querySelector(`.light.${color}`).classList.add('active');
}

// Cycle through classes
function cycleClass() {
    const classes = Object.keys(classContent);
    const currentIndex = classes.indexOf(currentClass);
    const nextIndex = (currentIndex + 1) % classes.length;
    setClass(classes[nextIndex]);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            // Timer
            case ' ':
                e.preventDefault();
                const mins = parseInt(prompt('Timer minutes:', '5'));
                if (mins) startTimer(mins * 60);
                break;
            case '1': startTimer(60); break;
            case '2': startTimer(120); break;
            case '3': startTimer(180); break;
            case '5': startTimer(300); break;
            case '0': stopTimer(); break;

            // Randomiser
            case 'r': pickRandomStudent(); break;

            // Traffic lights
            case 'g': setLight('green'); break;
            case 'a': setLight('amber'); break;
            case 'x': setLight('red'); break;

            // Navigation
            case 'c': cycleClass(); break;
            case 'escape': collapseRandomiser(); break;

            // Scores
            case 'q': addScore(1, 1); break;
            case 'w': addScore(1, -1); break;
            case 'p': addScore(2, 1); break;
            case 'o': addScore(2, -1); break;
        }
    });
}
