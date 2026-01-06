// CONFIGURATION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfMvCp66IFJyRvHolGVPllqS9JdjaZzdNJ-IgCAIgtTk40Wo4-2J-lRTDdRbYIWSz7EQ/exec';
let allRoutines = {};
let lastSessionData = {};
let currentRoutineKey = 'module-1';
let audioCtx = null;
let metroIntervals = {};

async function initializeApp() {
    try {
        // Fetch routines and last scores in parallel
        const [rRes, sRes] = await Promise.all([
            fetch('routines.json'),
            fetch(GOOGLE_SCRIPT_URL)
        ]);
        
        allRoutines = await rRes.json();
        if (sRes.ok) lastSessionData = await sRes.json();
        
        // Setup dropdown
        const select = document.getElementById('routine-select');
        select.innerHTML = Object.keys(allRoutines).map(key => 
            `<option value="${key}">${allRoutines[key].title}</option>`).join('');
            
        loadRoutine(currentRoutineKey);
    } catch (e) { 
        console.error("App Init Error:", e); 
        if(Object.keys(allRoutines).length > 0) loadRoutine('module-1');
    }
}

function loadRoutine(key) {
    currentRoutineKey = key;
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
            ${item.description ? `<p class="tech-desc" style="font-size: 0.85rem; color: #aaa; font-style: italic; margin-bottom: 10px;">${item.description}</p>` : ''}
            <div class="timer-display" id="timer-${item.id}">${item.minutes}:00</div>
            ${item.metronome ? `
            <div class="metronome-tool">
                <input type="number" id="bpm-${item.id}" value="80" style="width: 50px;"> <span>BPM</span>
                <button class="start-btn" onclick="toggleMetronome('${item.id}')" id="metro-btn-${item.id}">Start Click</button>
            </div>` : ''}
            <div class="input-group">
                <input type="number" id="input-${item.id}" placeholder="Reps">
                <button class="start-btn" onclick="startTimer('${item.id}', ${item.minutes})">Start Timer</button>
            </div>`;
        container.appendChild(card);
    });
}

function startTimer(id, mins) {
    let sec = mins * 60;
    const display = document.getElementById(`timer-${id}`);
    const card = document.getElementById(`card-${id}`);
    
    const interval = setInterval(() => {
        sec--;
        let m = Math.floor(sec / 60), s = sec % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        
        if (sec <= 0) {
            clearInterval(interval);
            card.classList.add('flash-active');
            // Play a small beep or alert
            setTimeout(() => {
                alert(`Time up for ${id}!`);
                card.classList.remove('flash-active');
            }, 100);
        }
    }, 1000);
}

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
            osc.frequency.value = 880; 
            env.gain.value = 0.1;
            osc.connect(env); env.connect(audioCtx.destination);
            osc.start(); 
            env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
        }, ms);
        btn.innerText = "Stop Click";
    }
}

document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    const routineTitle = allRoutines[currentRoutineKey].title;
    
    let payload = allRoutines[currentRoutineKey].exercises.map(item => ({
        date: today,
        routine: routineTitle,
        technique: item.id,
        count: document.getElementById(`input-${item.id}`).value || 0
    }));

    // Save locally for history page
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
        alert('Saved locally. Sync failed.');
    }
});

initializeApp();
