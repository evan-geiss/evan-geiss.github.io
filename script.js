// CONFIGURATION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfMvCp66IFJyRvHolGVPllqS9JdjaZzdNJ-IgCAIgtTk40Wo4-2J-lRTDdRbYIWSz7EQ/exec';
let allRoutines = {};
let lastSessionData = {};
let audioCtx = null;
let metroIntervals = {};

/**
 * INITIALIZATION: Runs when the page loads
 */
async function initializeApp() {
    try {
        // 1. Fetch the routine structure from your JSON file
        const routineResponse = await fetch('routines.json');
        allRoutines = await routineResponse.json();

        // 2. Fetch the last session data from Google Sheets (via the doGet function)
        const sheetResponse = await fetch(GOOGLE_SCRIPT_URL);
        if (sheetResponse.ok) {
            lastSessionData = await sheetResponse.json();
        }

        // 3. Build the UI (defaulting to Module 1)
        loadRoutine('module-1');
    } catch (error) {
        console.error("Initialization failed:", error);
        // Fallback: If Google Sheets fails, still try to load the routine UI
        if (Object.keys(allRoutines).length > 0) loadRoutine('module-1');
    }
}

/**
 * UI RENDERING: Builds the practice cards
 */
function loadRoutine(routineKey) {
    const routine = allRoutines[routineKey];
    const container = document.getElementById('routine-container');
    const title = document.getElementById('routine-title');
    
    if (title) title.innerText = routine.title;
    container.innerHTML = ''; 

    routine.exercises.forEach(item => {
        const card = document.createElement('div');
        card.className = 'routine-card';
        card.id = `card-${item.id}`;
        
        // Find the previous score using the ID from the sheet headers
        const lastScore = lastSessionData[item.id] !== undefined ? lastSessionData[item.id] : "-";

        const metronomeHTML = item.metronome ? `
            <div class="metronome-tool">
                <input type="number" id="bpm-${item.id}" value="80" min="40" max="240"> <span>BPM</span>
                <button class="start-btn" onclick="toggleMetronome('${item.id}')" id="metro-btn-${item.id}">Start Click</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="card-header">
                <h3>${item.name}</h3>
                <span class="last-score">Last: <strong>${lastScore}</strong></span>
            </div>
            <div class="timer-display" id="timer-${item.id}">${item.minutes}:00</div>
            ${metronomeHTML}
            <div class="input-group">
                <input type="number" id="input-${item.id}" placeholder="Reps">
                <button class="start-btn" onclick="startTimer('${item.id}', ${item.minutes})">Start Timer</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * TIMER LOGIC
 */
function startTimer(id, mins) {
    let seconds = mins * 60;
    const display = document.getElementById(`timer-${id}`);
    const card = document.getElementById(`card-${id}`);
    
    const interval = setInterval(() => {
        seconds--;
        let m = Math.floor(seconds / 60);
        let s = seconds % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;

        if (seconds <= 0) {
            clearInterval(interval);
            card.classList.add('flash-active');
            alert(`Time up for: ${id}`);
            card.classList.remove('flash-active');
        }
    }, 1000);
}

/**
 * METRONOME LOGIC
 */
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function toggleMetronome(id) {
    initAudio();
    const btn = document.getElementById(`metro-btn-${id}`);
    const bpm = document.getElementById(`bpm-${id}`).value;

    if (metroIntervals[id]) {
        clearInterval(metroIntervals[id]);
        delete metroIntervals[id];
        btn.innerText = "Start Click";
    } else {
        const ms = 60000 / bpm;
        metroIntervals[id] = setInterval(() => {
            const osc = audioCtx.createOscillator();
            const envelope = audioCtx.createGain();
            osc.frequency.value = 880; 
            envelope.gain.value = 0.1;
            osc.connect(envelope);
            envelope.connect(audioCtx.destination);
            osc.start();
            envelope.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
        }, ms);
        btn.innerText = "Stop Click";
    }
}

/**
 * DATA SUBMISSION: Saves to Google Sheets (Wide Format)
 */
document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    
    // Create one object where keys match your Google Sheet headers
    let rowData = { date: today };

    // We use the first routine key for this example; 
    // in a more advanced version, you'd track which routine is active.
    allRoutines['module-1'].exercises.forEach(item => {
        const val = document.getElementById(`input-${item.id}`).value || 0;
        rowData[item.id] = val;
    });

    // Save to LocalStorage for immediate history viewing
    let history = JSON.parse(localStorage.getItem('guitarLog') || '[]');
    history.push(rowData);
    localStorage.setItem('guitarLog', JSON.stringify(history));

    try {
        // Send to Google Sheets (doPost)
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowData)
        });
        alert('Practice Session Synced to Google Sheets!');
        window.location.href = 'history.html';
    } catch (error) {
        console.error('Submission error:', error);
        alert('Saved locally, but could not reach Google Sheets.');
    }
});

// Start the app
initializeApp();
