// CONFIGURATION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfMvCp66IFJyRvHolGVPllqS9JdjaZzdNJ-IgCAIgtTk40Wo4-2J-lRTDdRbYIWSz7EQ/exec';
let allRoutines = {};
let lastSessionData = {};
let currentRoutineKey = 'module-1';
let audioCtx = null;
let metroIntervals = {};

async function initializeApp() {
    try {
        const rRes = await fetch('routines.json');
        allRoutines = await rRes.json();
        const sRes = await fetch(GOOGLE_SCRIPT_URL);
        lastSessionData = await sRes.json();
        
        // Populate dropdown from JSON keys
        const select = document.getElementById('routine-select');
        select.innerHTML = Object.keys(allRoutines).map(key => 
            `<option value="${key}">${allRoutines[key].title}</option>`).join('');
            
        loadRoutine(currentRoutineKey);
    } catch (e) { console.error(e); loadRoutine('module-1'); }
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
            <div class="timer-display" id="timer-${item.id}">${item.minutes}:00</div>
            ${item.metronome ? `<div class="metronome-tool">
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

function startTimer(id, mins) {
    let sec = mins * 60;
    const btn = document.querySelector(`#card-${id} .start-btn:last-child`);
    btn.disabled = true;
    const interval = setInterval(() => {
        sec--;
        let m = Math.floor(sec / 60), s = sec % 60;
        document.getElementById(`timer-${id}`).innerText = `${m}:${s<10?'0':''}${s}`;
        if (sec <= 0) {
            clearInterval(interval);
            document.getElementById(`card-${id}`).classList.add('flash-active');
            alert("Time up!");
            document.getElementById(`card-${id}`).classList.remove('flash-active');
            btn.disabled = false;
        }
    }, 1000);
}

function toggleMetronome(id) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const btn = document.getElementById(`metro-btn-${id}`);
    if (metroIntervals[id]) {
        clearInterval(metroIntervals[id]); delete metroIntervals[id];
        btn.innerText = "Start Click";
    } else {
        const ms = 60000 / document.getElementById(`bpm-${id}`).value;
        metroIntervals[id] = setInterval(() => {
            const osc = audioCtx.createOscillator(), env = audioCtx.createGain();
            osc.frequency.value = 880; env.gain.value = 0.1;
            osc.connect(env); env.connect(audioCtx.destination);
            osc.start(); env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
        }, ms);
        btn.innerText = "Stop Click";
    }
}

document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    let payload = allRoutines[currentRoutineKey].exercises.map(item => ({
        date: today,
        routine: allRoutines[currentRoutineKey].title,
        technique: item.id,
        count: document.getElementById(`input-${item.id}`).value || 0
    }));

    let history = JSON.parse(localStorage.getItem('guitarLog') || '[]');
    localStorage.setItem('guitarLog', JSON.stringify(history.concat(payload)));

    await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    alert('Practice Synced!');
    window.location.href = 'history.html';
});

initializeApp();
