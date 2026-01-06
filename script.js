// CONFIGURATION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfMvCp66IFJyRvHolGVPllqS9JdjaZzdNJ-IgCAIgtTk40Wo4-2J-lRTDdRbYIWSz7EQ/exec';

let allRoutines = {};
let lastSessionData = {};
let currentRoutineKey = 'module-1';
let audioCtx = null;
let metroIntervals = {};
let completedExercises = new Set();

/**
 * INITIALIZATION
 * Fetches data and sets up the app
 */
async function initializeApp() {
    try {
        const [rRes, sRes] = await Promise.all([
            fetch('routines.json'),
            fetch(GOOGLE_SCRIPT_URL)
        ]);
        
        allRoutines = await rRes.json();
        if (sRes.ok) {
            lastSessionData = await sRes.json();
        }
        
        // Populate the Routine Selector Dropdown
        const select = document.getElementById('routine-select');
        select.innerHTML = Object.keys(allRoutines).map(key => 
            `<option value="${key}">${allRoutines[key].title}</option>`).join('');
            
        loadRoutine(currentRoutineKey);
    } catch (e) { 
        console.error("Initialization failed:", e); 
        // Fallback to load UI even if Sheet fetch fails
        if(Object.keys(allRoutines).length > 0) loadRoutine('module-1');
    }
}

/**
 * UI RENDERING
 * Builds the exercise cards
 */
function loadRoutine(key) {
    currentRoutineKey = key;
    completedExercises.clear();
    updateProgressBar();

    const routine = allRoutines[key];
    document.getElementById('routine-title').innerText = routine.title;
    
    const container = document.getElementById('routine-container');
    container.innerHTML = '';

    routine.exercises.forEach(item => {
        const lastScore = lastSessionData[item.id] !== undefined ? lastSessionData[item.id] : "-";
        const card = document.createElement('div');
        card.className = 'routine-card';
        card.id = `card-${item.id}`;
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${item.name}</h3>
                <span class="last-score">Last: <strong>${lastScore}</strong></span>
            </div>
            ${item.description ? `<p class="tech-desc">${item.description}</p>` : ''}
            <div class="timer-display" id="timer-${item.id}">${item.minutes}:00</div>
            
            ${item.metronome ? `
            <div class="metronome-tool">
                <input type="number" id="bpm-${item.id}" value="80"> <span>BPM</span>
                <button class="start-btn" onclick="toggleMetronome('${item.id}')" id="metro-btn-${item.id}">Start Click</button>
            </div>` : ''}
            
            <div class="input-group">
                <input type="number" id="input-${item.id}" placeholder="Reps">
                <button class="start-btn" onclick="startTimer('${item.id}', ${item.minutes})">Start Timer</button>
            </div>`;
        container.appendChild(card);
    });
}

/**
 * TIMER & PROGRESS LOGIC
 */
function startTimer(id, mins) {
    let sec = mins * 60;
    const display = document.getElementById(`timer-${id}`);
    const card = document.getElementById(`card-${id}`);
    const startBtn = card.querySelector('.input-group .start-btn');
    
    startBtn.disabled = true; // Prevent double-clicking

    const interval = setInterval(() => {
        sec--;
        let m = Math.floor(sec / 60), s = sec % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        
        if (sec <= 0) {
            clearInterval(interval);
            startBtn.disabled = false;
            card.classList.add('flash-active');
            
            // Mark as completed and update the bar
            completedExercises.add(id);
            updateProgressBar();

            setTimeout(() => {
                alert(`Time up for: ${id}`);
                card.classList.remove('flash-active');
            }, 100);
        }
    }, 1000);
}

function updateProgressBar() {
    const total = allRoutines[currentRoutineKey].exercises.length;
    const completed = completedExercises.size;
    const percentage = (completed / total) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = percentage + "%";
}

/**
 * METRONOME LOGIC
 */
function toggleMetronome(id) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const btn = document.getElementById(`metro-btn-${id}`);
    const bpmInput = document.getElementById(`bpm-${id}`);

    if (metroIntervals[id]) {
        clearInterval(metroIntervals[id]);
        delete metroIntervals[id];
        btn.innerText = "Start Click";
    } else {
        const ms = 60000 / bpmInput.value;
        metroIntervals[id] = setInterval(() => {
            const osc = audioCtx.createOscillator(), env = audioCtx.createGain();
            osc.frequency.value = 880; // High Click
            env.gain.value = 0.1;
            osc.connect(env); env.connect(audioCtx.destination);
            osc.start(); 
            env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
        }, ms);
        btn.innerText = "Stop Click";
    }
}

/**
 * DATA SUBMISSION
 * Saves to LocalStorage and Google Sheets
 */
document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    const routineTitle = allRoutines[currentRoutineKey].title;
    
    // Build the payload (Long Format)
    let payload = allRoutines[currentRoutineKey].exercises.map(item => ({
        date: today,
        routine: routineTitle,
        technique: item.id,
        count: document.getElementById(`input-${item.id}`).value || 0
    }));

    // Save locally
    let history = JSON.parse(localStorage.getItem('guitarLog') || '[]');
    localStorage.setItem('guitarLog', JSON.stringify(history.concat(payload)));

    // Send to Google Sheets
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('Practice Session Complete & Synced!');
        window.location.href = 'history.html';
    } catch (e) {
        console.error("Sync Error:", e);
        alert('Saved locally. Could not sync to cloud.');
    }
});

// Run app
initializeApp();
