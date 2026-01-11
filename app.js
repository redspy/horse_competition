const COLORS = [
    { name: 'Red', image: 'assets/horse_red.png', code: '#FF0000' },
    { name: 'Orange', image: 'assets/horse_orange.png', code: '#FF7F00' },
    { name: 'Yellow', image: 'assets/horse_yellow.png', code: '#FFFF00' },
    { name: 'Green', image: 'assets/horse_green.png', code: '#00FF00' },
    { name: 'Blue', image: 'assets/horse_blue.png', code: '#0000FF' },
    { name: 'Indigo', image: 'assets/horse_indigo.png', code: '#4B0082' },
    { name: 'Purple', image: 'assets/horse_purple.png', code: '#9400D3' }
];

const STATE = {
    horseCount: 4,
    horseColors: [], // Index -> Color Object
    horses: [], // Array of { id, position, color, finished, rank }
    isRacing: false,
    timerId: null,
    finishedCount: 0,
    startTime: 0
};

// DOM Elements
const els = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultModal: document.getElementById('result-modal'),
    horseCountDisplay: document.getElementById('horse-count-display'),
    colorSettings: document.getElementById('horse-color-settings'),
    trackLanes: document.getElementById('track-lanes'),
    resultList: document.getElementById('result-list'),
    raceStatus: document.getElementById('race-status'),
    btnStart: document.getElementById('btn-start'),
    btnReset: document.getElementById('btn-reset'),
    btnRestart: document.getElementById('btn-restart'),
    btnAdd: document.getElementById('btn-count-up'),
    btnSub: document.getElementById('btn-count-down')
};

// --- Setup Phase ---

function initSetup() {
    updateHorseCountDisplay();
    renderColorSelectors();
}

function updateHorseCountDisplay() {
    els.horseCountDisplay.textContent = STATE.horseCount;
    renderColorSelectors();
}

function renderColorSelectors() {
    els.colorSettings.innerHTML = '';
    STATE.horseColors = [];

    for (let i = 0; i < STATE.horseCount; i++) {
        // Default colors: loop through rainbow
        const defaultColorIndex = i % COLORS.length;
        STATE.horseColors.push(COLORS[defaultColorIndex]);

        const container = document.createElement('div');
        container.className = 'color-selector';

        const label = document.createElement('span');
        label.textContent = `말 ${i + 1}`;

        const colorCircle = document.createElement('div');
        colorCircle.className = 'color-circle';
        colorCircle.style.backgroundColor = COLORS[defaultColorIndex].code;
        colorCircle.dataset.index = i;
        colorCircle.dataset.colorIdx = defaultColorIndex;

        // Click to cycle color
        colorCircle.addEventListener('click', () => cycleColor(i, colorCircle));

        container.appendChild(label);
        container.appendChild(colorCircle);
        els.colorSettings.appendChild(container);
    }
}

function cycleColor(horseIndex, elem) {
    let currentIdx = parseInt(elem.dataset.colorIdx);
    let nextIdx = (currentIdx + 1) % COLORS.length;

    // Update State
    STATE.horseColors[horseIndex] = COLORS[nextIdx];

    // Update UI
    elem.style.backgroundColor = COLORS[nextIdx].code;
    elem.dataset.colorIdx = nextIdx;
}

// --- Game Logic ---

function startGame() {
    STATE.isRacing = true;
    STATE.finishedCount = 0;
    STATE.horses = [];

    // Initialize Horses
    for (let i = 0; i < STATE.horseCount; i++) {
        STATE.horses.push({
            id: i,
            position: 0, // % or pixels? Let's use % for responsiveness
            color: STATE.horseColors[i],
            finished: false,
            rank: 0,
            element: null
        });
    }

    // Switch Screens
    els.setupScreen.classList.add('hidden');
    els.gameScreen.classList.remove('hidden');
    els.resultModal.classList.add('hidden');

    renderTrack();

    // Countdown
    let count = 3;

    // Helper to trigger animation
    const animateCount = (text) => {
        els.raceStatus.textContent = text;
        els.raceStatus.style.display = 'none';
        els.raceStatus.offsetHeight; // trigger reflow
        els.raceStatus.style.display = 'block';
    };

    els.raceStatus.style.display = 'block'; // Ensure visible first
    animateCount('3');

    const countTimer = setInterval(() => {
        count--;
        if (count > 0) {
            animateCount(count);
        } else if (count === 0) {
            animateCount('START!');
        } else {
            clearInterval(countTimer);
            els.raceStatus.style.display = 'none';
            startRaceLoop();
        }
    }, 1000);
}

function renderTrack() {
    els.trackLanes.innerHTML = '';
    STATE.horses.forEach((horse, idx) => {
        const lane = document.createElement('div');
        lane.className = 'lane';

        const horseWrap = document.createElement('div');
        horseWrap.className = 'horse-wrapper';
        // Add color filter class
        // Since we are using CSS filters, we need to apply specific style
        // Or simpler: use inline style for filter if needed, or class
        // Let's use the class from COLORS object if we defined specific CSS
        // The CSS has .horse-red .horse-sprite etc. But we might need dynamic filter

        // Let's try to map color name to class or just use hue-rotate approximation
        // Red is 0deg. 
        // We can just calculate hue-rotate from the color code or pre-define classes
        // In style.css I commented about classes. Let's assume we didn't fully implement 7 classes.
        // Let's rely on inline filter for simplicity and precision

        // Hue mapping (Approximate for a red base sprite)
        // Red: 0, Orange: 30, Yellow: 60, Green: 120, Blue: 210, Indigo: 260, Purple: 290
        // Wait, if sprite is white (grayscale), hue-rotate doesn't work well without sepia.
        // Let's use: filter: drop-shadow(0 0 0 [color]) logic? No, that blurs.
        // Best for white sprite: mask-image or background-color with mix-blend-mode: multiply?
        // Let's just use the `filter` trick:
        // sepia(1) saturate(100) hue-rotate(...) 
        // But better yet, I will use the `filter: drop-shadow` method with an offset to colorize clean pixel art?
        // Actually, let's keep it simple: 
        // <div class="horse-sprite" style="filter: drop-shadow(0 0 0 ${horse.color.code})"> is tricky because original still shows.

        // I will use `filter: sepia(1) saturate(5) hue-rotate(Xdeg)` assuming white sprite.
        // But calculating X is hard.
        // Let's just use the `backgroundColor` of the wrapper mixed with the sprite?
        // Method: set div background to color, use mask-image with sprite?
        // `mask: url(sprite.png); -webkit-mask: url(sprite.png); background: color;`
        // This is the most modern and robust way for solid color silhouettes.
        // But we lose internal details of the sprite (eyes etc).

        // Since I generated a "white horse", I can just tint it.
        // Let's try `filter: drop-shadow(0 0 0 ${horse.color.code})` and `opacity: 0` on original? No.

        // Let's used a pre-defined filter list for the rainbow colors assuming a white/grey base.
        // Or... just render the color circle above the horse to ID it?
        // User asked for "Using rainbow colors for horses".
        // I will use the `background-color` with `mask-image` approach for the horse shape,
        // it makes them look like "colored silhouettes" which fits "pixel art" style sometimes.
        // OR, I will try to apply a tint overlay.

        // Let's go with the `mask-image` approach for strong distinct colors.
        // And maybe add a small eye dot if possible? No, silhouette is fine.

        horseWrap.innerHTML = `
            <div class="horse-sprite" 
                 style="background-image: url('${horse.color.image}');">
            </div>
        `;

        lane.appendChild(horseWrap);
        els.trackLanes.appendChild(lane);

        horse.element = horseWrap;
    });
}

function startRaceLoop() {
    STATE.startTime = Date.now();
    STATE.timerId = setInterval(gameTick, 150); // 150ms tick (faster updates, smoother)
}

function gameTick() {
    if (!STATE.isRacing) return;

    // 1. Calculate Ranks
    // Sort by position DESC (Leading first)
    // We need to know who is "last" to apply catch-up
    const activeHorses = STATE.horses.filter(h => !h.finished);

    // Sort active horses to find their relative rank among runners
    // But catch-up usually applies to anyone behind the leader?
    // User said: "순위가 낮을수록...". 
    // Let's sort all horses by position.
    const sortedHorses = [...STATE.horses].sort((a, b) => b.position - a.position);

    activeHorses.forEach(horse => {
        // Find current rank (0-indexed)
        const currentRank = sortedHorses.findIndex(h => h.id === horse.id);
        const total = STATE.horses.length;

        // 2. Determine Movement
        // Base: 1~3
        // 1 step = 1%? 2%? 
        // Let's say track is 0 to 90%. (Start 0, End 90 - assuming width)
        // With 1~3, and 0.5s tick. 
        // 80% width. To finish in ~10-20 seconds (20-40 ticks).
        // 80 / 30 = 2.6% per tick avg.
        // So 1 unit = 2%. Base move = 2% * (1~3) = 2%~6%.

        // Adjusted for 120 ticks target
        // Goal ~90% distance. 120 ticks -> ~0.73 per tick.
        // Random 1~5 (avg 3). So base should be ~0.25 to keep similar duration?
        // User asked for "more dynamic". Faster is okay.
        // Let's keep base unit similar or slightly lower if it gets too fast.
        // Old avg: 2 * 0.37 = 0.74
        // New avg: 3 * 0.37 = 1.11 -> Race ends in ~80 ticks (12 sec).
        // Let's slightly reduce baseUnit to keep it around 15-18 sec?
        // 88 / 120 = 0.73. New Avg Step is 3.
        // 0.73 / 3 = 0.24.
        const baseUnit = 0.25;
        const randomStep = Math.floor(Math.random() * 5) + 1; // 1, 2, 3, 4, 5
        let moveAmount = randomStep * baseUnit; // 0.37 ~ 1.11 %

        // 3. Catch-up Logic
        // "순위가 낮을수록 많은 틱이 만들어질 확률을 높이는"
        // Interpretation: Lower rank (higher index) -> Chance to get EXTRA move.
        // Formula: If rank > 0 (not first), chance = rank / total.
        // Bonus: +1 step?
        if (currentRank > 0) {
            const chance = currentRank / (total - 1 || 1); // 0 to 1
            if (Math.random() < chance * 0.7) { // 70% max chance for last place
                moveAmount += baseUnit * 1.5; // Bonus boost
            }
        }

        // Apply
        horse.position += moveAmount;

        // Render
        horse.element.style.left = `min(${horse.position}%, calc(100% - 64px))`;

        // Check Finish (Precise Collision Detection)
        const finishLine = document.querySelector('.finish-line');
        if (finishLine && !horse.finished) {
            const horseRect = horse.element.getBoundingClientRect();
            const finishRect = finishLine.getBoundingClientRect();

            // If horse's right edge touches finish line's left edge
            if (horseRect.right >= finishRect.left) {
                horse.finished = true;
                STATE.finishedCount++;
                horse.rank = STATE.finishedCount;
            }
        }
    });

    // Check Game Over (End immediately when 1st place finishes)
    if (STATE.finishedCount >= 1) {
        clearInterval(STATE.timerId);
        STATE.isRacing = false;

        // Stop animations
        document.querySelectorAll('.horse-sprite').forEach(el => {
            el.classList.add('paused');
        });

        setTimeout(showResults, 1000); // Wait a bit
    }
}

function showResults() {
    els.resultList.innerHTML = '';

    // Sort Logic:
    // 1. Finished horses (Rank 1, usually just one)
    // 2. Unfinished horses sorted by position DESC

    // Determine ranks for everyone
    // The finished horse(s) already have rank set (likely 1)
    // We need to assign ranks to others starting from finishedCount + 1

    const finishedHorses = STATE.horses.filter(h => h.finished).sort((a, b) => a.rank - b.rank);
    const runningHorses = STATE.horses.filter(h => !h.finished).sort((a, b) => b.position - a.position);

    // Assign ranks to running horses
    let nextRank = finishedHorses.length + 1;
    runningHorses.forEach(h => {
        h.rank = nextRank++;
    });

    const finalRanking = [...finishedHorses, ...runningHorses];

    finalRanking.forEach(h => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${h.rank}위</span>
            <span style="color:${h.color.code}; font-weight:bold;">말 ${h.id + 1}</span>
            <span style="font-size:0.8rem; color:#888;">(${h.finished ? '골인' : Math.round(h.position) + '%'})</span>
        `;
        els.resultList.appendChild(li);
    });

    els.resultModal.classList.remove('hidden');
}

// --- Event Listeners ---

els.btnAdd.addEventListener('click', () => {
    if (STATE.horseCount < 7) {
        STATE.horseCount++;
        initSetup();
    }
});

els.btnSub.addEventListener('click', () => {
    if (STATE.horseCount > 2) {
        STATE.horseCount--;
        initSetup();
    }
});

els.btnStart.addEventListener('click', startGame);

els.btnReset.addEventListener('click', () => {
    clearInterval(STATE.timerId);
    STATE.isRacing = false;
    els.gameScreen.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
});

els.btnRestart.addEventListener('click', () => {
    els.resultModal.classList.add('hidden');
    els.gameScreen.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
});

// Init
initSetup();
