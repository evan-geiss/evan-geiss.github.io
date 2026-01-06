const routineData = [
    { id: 'd_chord', name: 'Chord Perfect Practice D Chord', minutes: 3 },
    { id: 'a_chord', name: 'Chord Perfect Practice A Chord', minutes: 3 },
    { id: 'anchor', name: 'Anchor Finger A & D Chords', minutes: 2 },
    { id: 'a_to_d', name: 'One Minute Changes A to D', minutes: 1 },
    { id: 'd_to_a', name: 'One Minute Changes D to A', minutes: 1 }
];

const container = document.getElementById('routine-container');

// Build the UI
routineData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'routine-card';
    card.id = `card-${item.id}`;
    card.innerHTML = `
        <h3>${item.name}</h3>
        <div class="timer-display" id="timer-${item.id}">${item.minutes}:00</div>
        <div class="input-group">
            <label>Reps:</label>
            <input type="number" id="input-${item.id}" placeholder="0">
            <button class="start-btn" onclick="startTimer('${item.id}', ${item.minutes})">Start</button>
        </div>
    `;
    container.appendChild(card);
});

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
            alert(`Time up for ${id}!`);
            card.classList.remove('flash-active');
        }
    }, 1000);
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdLjZEq5rANcbQQLzc-1c9IjqQR2OM6QwqbuxJGC0DrjMcTHcS1YIJyaccU_eBZU6ZvQ/exec';

document.getElementById('finish-btn').addEventListener('click', async () => {
    const today = new Date().toLocaleDateString();
    let currentSession = [];

    // Collect data from inputs
    routineData.forEach(item => {
        const count = document.getElementById(`input-${item.id}`).value || 0;
        currentSession.push({
            date: today,
            technique: item.name,
            count: count
        });
    });

    // 1. Save to LocalStorage (for the History page table)
    let history = JSON.parse(localStorage.getItem('guitarLog') || '[]');
    localStorage.setItem('guitarLog', JSON.stringify(history.concat(currentSession)));

    // 2. Send to Google Sheets
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Needed for Google Apps Script cross-domain
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentSession)
        });
        alert('Session saved to Sheets & Local Storage!');
        window.location.href = 'history.html';
    } catch (error) {
        console.error('Error!', error);
        alert('Saved locally, but failed to sync with Google Sheets.');
    }
});
