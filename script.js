const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdLjZEq5rANcbQQLzc-1c9IjqQR2OM6QwqbuxJGC0DrjMcTHcS1YIJyaccU_eBZU6ZvQ/exec';
let allRoutines = {};
let audioCtx = null;

// Initialize Audio Context for Metronome on first click (Browser security)
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// 1. Fetch the JSON data
fetch('routines.json')
    .then(response => response.json())
    .then(data => {
        allRoutines = data;
        loadRoutine('module-1'); // Default load
    });

function loadRoutine(routineKey) {
    const routine = allRoutines[routineKey];
    const container = document.getElementById('routine-container');
    document.querySelector('h1').innerText = routine.title;
    container.innerHTML = ''; 

    routine.exercises.forEach(item => {
        const card = document.createElement('div');
        card.className = 'routine-card';
        card.id = `card-${item.id}`;
        
        // Add metronome UI if enabled in JSON
        const metronomeHTML = item.metronome ? `
            <div class="metronome-tool">
                <input type="number" id="bpm-${item.id}" value="80" min="40" max="240"> BPM
                <button onclick="toggleMetronome('${item.id}')" id="metro-btn-${item.id}">Start Click</button>
            </div>
        ` : '';

        card.innerHTML = `
            <h3>${item.name}</h3>
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

// 2. Timer Logic
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
            setTimeout(() => card.classList.remove('flash-active'), 3000);
            alert(`Time up for ${id}!`);
        }
    }, 1000);
}

// 3. Metronome Logic (Web Audio API)
let metroIntervals = {};
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
            osc.frequency.value = 880; // High A
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

// 4. Save to Sheets (Option B)
document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    
    // Create a single object for the whole row
    let rowData = {
        date: today
    };

    // Loop through the routine to grab values using the IDs from your JSON
    allRoutines['module-1'].exercises.forEach(item => {
        const val = document.getElementById(`input-${item.id}`).value || 0;
        rowData[item.id] = val; // This creates keys like d_chord: 50
    });

    // 1. Save to LocalStorage
    let history = JSON.parse(localStorage.getItem('guitarLog') || '[]');
    history.push(rowData);
    localStorage.setItem('guitarLog', JSON.stringify(history));

    // 2. Send to Google Sheets
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowData)
        });
        alert('Practice session recorded!');
        window.location.href = 'history.html';
    } catch (error) {
        console.error('Error!', error);
        alert('Saved locally, but sync failed.');
    }
});
