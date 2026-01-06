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

// Save Data Logic (Option B)
document.getElementById('finish-btn').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    let sessionData = JSON.parse(localStorage.getItem('guitarLog') || '[]');

    routineData.forEach(item => {
        const count = document.getElementById(`input-${item.id}`).value || 0;
        sessionData.push({
            date: today,
            technique: item.name,
            count: count
        });
    });

    localStorage.setItem('guitarLog', JSON.stringify(sessionData));
    alert('Session Saved to Local Storage!');
    window.location.href = 'history.html';
});