// Classroom Display App
// =====================

let currentClass = null;
let classContent = {};
let timetable = [];
let timerInterval = null;
let timerSeconds = 0;
let scores = { 1: 0, 2: 0 };
let manualOverride = false; // Prevents auto-switching when user manually selects a class

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadTimetable();
    await loadAllContent();
    updateClock();
    setInterval(updateClock, 1000);
    detectCurrentClass();
    setInterval(detectCurrentClass, 60000);
    setupKeyboardShortcuts();
    loadWidgetPreferences();
    initDraggableWidgets();
    loadWidgetLayout();
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
    const classes = ['form-time', '8s-french', '8l-french', '3j-french', '6t-french', '7s-french', '7m-french'];
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
    // Don't auto-switch if user manually selected a class
    if (manualOverride) return;

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

    // Filter by today's day to get correct times
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const period = timetable.find(p => p.class === currentClass && (!p.days || p.days.includes(today)));
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

    // Toggle form time mode
    if (classId === 'form-time') {
        document.body.classList.add('form-time-mode');
    } else {
        document.body.classList.remove('form-time-mode');
    }

    document.getElementById('class-name').textContent = content.className || classId;
    renderObjectives(content.objectives);
    renderVocab(content.vocabulary);
    renderSentenceBuilder(content.sentenceBuilder);
    renderTasks(content.tasks);
    renderFormTime(content.formTime);
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

// Sign-in feature
function renderSignIn() {
    const grid = document.getElementById('signin-grid');
    const status = document.getElementById('signin-status');
    if (!grid) return;

    // Get 8L students
    const students8L = classContent['8l-french']?.students || [];
    if (students8L.length === 0) {
        grid.innerHTML = '<p>No students loaded</p>';
        return;
    }

    // Get today's sign-ins from localStorage
    const today = new Date().toISOString().split('T')[0];
    const signInKey = `signin-8l-${today}`;
    let signedIn = JSON.parse(localStorage.getItem(signInKey) || '[]');

    grid.innerHTML = '';
    students8L.forEach(student => {
        const btn = document.createElement('button');
        btn.className = 'signin-btn' + (signedIn.includes(student) ? ' signed-in' : '');
        btn.textContent = student;
        btn.onclick = () => toggleSignIn(student);
        grid.appendChild(btn);
    });

    // Update status
    status.textContent = `${signedIn.length}/${students8L.length} signed in`;
}

function toggleSignIn(student) {
    const today = new Date().toISOString().split('T')[0];
    const signInKey = `signin-8l-${today}`;
    let signedIn = JSON.parse(localStorage.getItem(signInKey) || '[]');

    if (signedIn.includes(student)) {
        signedIn = signedIn.filter(s => s !== student);
    } else {
        signedIn.push(student);
        // Store timestamp for records
        const timestamps = JSON.parse(localStorage.getItem(`${signInKey}-times`) || '{}');
        timestamps[student] = new Date().toLocaleTimeString('en-GB');
        localStorage.setItem(`${signInKey}-times`, JSON.stringify(timestamps));
    }

    localStorage.setItem(signInKey, JSON.stringify(signedIn));
    renderSignIn();
}

function getSignInRecord(date) {
    const signInKey = `signin-8l-${date}`;
    const signedIn = JSON.parse(localStorage.getItem(signInKey) || '[]');
    const times = JSON.parse(localStorage.getItem(`${signInKey}-times`) || '{}');
    return { date, signedIn, times };
}

function showSignInSummary() {
    const today = new Date().toISOString().split('T')[0];
    const record = getSignInRecord(today);
    const students8L = classContent['8l-french']?.students || [];
    const absent = students8L.filter(s => !record.signedIn.includes(s));

    let summary = `8L SIGN-IN: ${today}\n`;
    summary += `\nPresent (${record.signedIn.length}):\n`;
    record.signedIn.forEach(s => {
        summary += `  ${s} - ${record.times[s] || '?'}\n`;
    });
    if (absent.length > 0) {
        summary += `\nAbsent (${absent.length}):\n`;
        absent.forEach(s => {
            summary += `  ${s}\n`;
        });
    }

    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
        alert('Sign-in summary copied to clipboard!\n\n' + summary);
    }).catch(() => {
        alert(summary);
    });
}

// Render form time content
function renderFormTime(formTime) {
    const leftContainer = document.getElementById('form-time-left');
    const rightContainer = document.getElementById('form-time-right');

    if (!formTime) {
        if (leftContainer) leftContainer.style.display = 'none';
        if (rightContainer) rightContainer.style.display = 'none';
        return;
    }

    if (leftContainer) leftContainer.style.display = 'block';
    if (rightContainer) rightContainer.style.display = 'block';
    renderSignIn();

    // Fetch daily quote from API
    fetchDailyQuote();

    // Fetch On This Day from API
    fetchOnThisDay();

    // Discussion Questions (from JSON)
    const dqList = document.getElementById('discussion-list');
    dqList.innerHTML = '';
    if (formTime.discussionQuestions) {
        formTime.discussionQuestions.forEach(q => {
            const li = document.createElement('li');
            li.textContent = q;
            dqList.appendChild(li);
        });
    }

    // News Headlines (from JSON - I update these)
    const newsList = document.getElementById('news-list');
    newsList.innerHTML = '';
    if (formTime.newsHeadlines) {
        formTime.newsHeadlines.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <span class="news-headline">${item.headline}</span>
                <span class="news-source">${item.source}</span>
                <span class="news-summary">${item.summary}</span>
            `;
            newsList.appendChild(div);
        });
    }
}

// Fetch daily quote from API
async function fetchDailyQuote() {
    const quoteEl = document.getElementById('quote-of-day');

    // Check cache first (refreshes daily)
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem('daily-quote');
    if (cached) {
        const { date, quote, author } = JSON.parse(cached);
        if (date === today) {
            quoteEl.innerHTML = `"${quote}" <span class="quote-author">— ${author}</span>`;
            return;
        }
    }

    try {
        const response = await fetch('https://api.quotable.io/random?tags=inspirational|motivational|wisdom');
        const data = await response.json();

        const quote = data.content;
        const author = data.author;

        // Cache it
        localStorage.setItem('daily-quote', JSON.stringify({ date: today, quote, author }));

        quoteEl.innerHTML = `"${quote}" <span class="quote-author">— ${author}</span>`;
    } catch (e) {
        // Fallback quote
        quoteEl.innerHTML = `"The only way to do great work is to love what you do." <span class="quote-author">— Steve Jobs</span>`;
    }
}

// Fetch On This Day facts from API
async function fetchOnThisDay() {
    const otdList = document.getElementById('on-this-day-list');

    // Check cache first (refreshes daily)
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem('on-this-day');
    if (cached) {
        const { date, facts } = JSON.parse(cached);
        if (date === today) {
            renderOnThisDayFacts(facts);
            return;
        }
    }

    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const response = await fetch(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
        const data = await response.json();

        // Get 3 interesting events, prioritize more recent ones
        const events = data.events || [];
        const selected = events
            .filter(e => e.year > 1800) // Focus on more relatable history
            .slice(0, 5)
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, 3)
            .map(e => `${e.year} - ${e.description}`);

        // Cache it
        localStorage.setItem('on-this-day', JSON.stringify({ date: today, facts: selected }));

        renderOnThisDayFacts(selected);
    } catch (e) {
        otdList.innerHTML = '<li>Could not load historical facts</li>';
    }
}

function renderOnThisDayFacts(facts) {
    const otdList = document.getElementById('on-this-day-list');
    otdList.innerHTML = '';
    facts.forEach(fact => {
        const li = document.createElement('li');
        li.textContent = fact;
        otdList.appendChild(li);
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
    playTimerSound();
}

// Timer sound using Web Audio API
function playTimerSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Play 3 beeps
    [0, 0.3, 0.6].forEach(delay => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.2);

        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 0.2);
    });
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

    // Spin through names for effect (8 spins × 50ms = 0.4 seconds)
    let spins = 0;
    const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * content.students.length);
        result.textContent = content.students[randomIndex];
        spins++;

        if (spins > 8) {
            clearInterval(spinInterval);
            result.classList.remove('spinning');
            // Final pick
            const finalIndex = Math.floor(Math.random() * content.students.length);
            result.textContent = content.students[finalIndex];
        }
    }, 50);
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
    manualOverride = true;
    const classes = Object.keys(classContent);
    const currentIndex = classes.indexOf(currentClass);
    const nextIndex = (currentIndex + 1) % classes.length;
    setClass(classes[nextIndex]);
}

// Widget toggles
function showWidgetToggles() {
    document.getElementById('widget-toggles').classList.add('visible');
    document.getElementById('toggle-overlay').classList.add('visible');
}

function hideWidgetToggles() {
    document.getElementById('widget-toggles').classList.remove('visible');
    document.getElementById('toggle-overlay').classList.remove('visible');
}

function toggleWidget(widgetId, show) {
    const widget = document.getElementById(widgetId);
    if (widget) {
        if (show) {
            widget.classList.remove('hidden-widget');
        } else {
            widget.classList.add('hidden-widget');
        }
        // Save preference
        localStorage.setItem(`widget-${widgetId}`, show ? 'visible' : 'hidden');
    }
}

function loadWidgetPreferences() {
    const widgets = ['widget-objectives', 'widget-vocab', 'widget-sentence-builder', 'widget-timer',
                     'widget-randomiser', 'widget-scoreboard', 'widget-traffic', 'widget-tasks'];

    widgets.forEach(widgetId => {
        const pref = localStorage.getItem(`widget-${widgetId}`);
        if (pref === 'hidden') {
            document.getElementById(widgetId)?.classList.add('hidden-widget');
            const checkbox = document.getElementById(`toggle-${widgetId.replace('widget-', '')}`);
            if (checkbox) checkbox.checked = false;
        }
    });
}

// Draggable widgets with SortableJS
function initDraggableWidgets() {
    const columns = document.querySelectorAll('.column');

    columns.forEach(column => {
        new Sortable(column, {
            group: 'widgets',
            animation: 150,
            ghostClass: 'widget-ghost',
            chosenClass: 'widget-chosen',
            dragClass: 'widget-drag',
            handle: '.widget',
            draggable: '.widget',
            onEnd: saveWidgetLayout
        });
    });
}

function saveWidgetLayout() {
    const layout = {};
    const columns = document.querySelectorAll('.column');

    columns.forEach((column, index) => {
        const widgets = column.querySelectorAll('.widget');
        layout[`column-${index}`] = Array.from(widgets).map(w => w.id);
    });

    localStorage.setItem('widget-layout', JSON.stringify(layout));
}

function loadWidgetLayout() {
    const saved = localStorage.getItem('widget-layout');
    if (!saved) return;

    try {
        const layout = JSON.parse(saved);
        const columns = document.querySelectorAll('.column');

        columns.forEach((column, index) => {
            const widgetIds = layout[`column-${index}`];
            if (!widgetIds) return;

            widgetIds.forEach(id => {
                const widget = document.getElementById(id);
                if (widget && widget.classList.contains('widget')) {
                    column.appendChild(widget);
                }
            });
        });
    } catch (e) {
        console.log('Could not load widget layout');
    }
}

function resetWidgetLayout() {
    localStorage.removeItem('widget-layout');
    location.reload();
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
            case 'f': manualOverride = true; setClass('form-time'); break;
            case 'escape': collapseRandomiser(); break;

            // Auto mode (re-enable auto class detection)
            case 'home': manualOverride = false; detectCurrentClass(); break;

            // Sign-in summary
            case 's': if (e.shiftKey) showSignInSummary(); break;

            // Widget toggles
            case 't': if (e.shiftKey) showWidgetToggles(); break;

            // Scores
            case 'q': addScore(1, 1); break;
            case 'w': addScore(1, -1); break;
            case 'p': addScore(2, 1); break;
            case 'o': addScore(2, -1); break;
        }
    });
}
