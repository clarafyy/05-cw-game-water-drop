// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0;
let strikes = 0; // number of missed droplets this round

const winMessages = [
  "You're a water hero!",
  "Amazing — you're helping bring clean water!",
  "Champion of drops!"
];

const loseMessages = [
  "Almost there — try again!",
  "Keep practicing — you can do it!",
  "Don't give up — go for it again!"
];

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

// Difficulty settings (duration in seconds, spawn interval in ms)
let dropFallDuration = 4; // moderate default
let dropSpawnInterval = 1000; // moderate default
const difficultySettings = {
  easy: { duration: 5, spawn: 1100 },
  moderate: { duration: 3.2, spawn: 900 },
  hard: { duration: 1.8, spawn: 600 }
};

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;

  // Remove the start overlay so the dark layer is gone and game is visible
  const overlay = document.getElementById("start-overlay");
  // hide instead of remove so player can change difficulty on 'Play again'
  if (overlay) overlay.style.display = 'none';

  // Read selected difficulty from start overlay (default to moderate)
  try {
    const selected = document.querySelector('input[name="difficulty"]:checked');
    const choice = selected ? selected.value : 'moderate';
    const cfg = difficultySettings[choice] || difficultySettings.moderate;
    dropFallDuration = cfg.duration;
    dropSpawnInterval = cfg.spawn;
  } catch (e) {
    // fallback to moderate
    dropFallDuration = difficultySettings.moderate.duration;
    dropSpawnInterval = difficultySettings.moderate.spawn;
  }

  // Reset score and progress UI
  score = 0;
  strikes = 0;
  document.getElementById('score').textContent = score;
  updateProgress();
  // Clear missed icons from previous round
  const missedContainer = document.getElementById('missed-container');
  if (missedContainer) missedContainer.innerHTML = '';

  // Create new drops at the spawn rate selected by difficulty
  dropMaker = setInterval(createDrop, dropSpawnInterval);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  // Use a fixed size so all drops are the same
  const fixedSize = 60; // px
  drop.style.width = drop.style.height = `${fixedSize}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for the duration set by difficulty
  drop.style.animationDuration = dropFallDuration + "s";

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);
  // Mark as not yet caught
  drop.caught = false;

  // Remove drops that reach the bottom (weren't caught by the slider)
  drop.addEventListener("animationend", () => {
    if (drop.caught) return;
    // This drop was missed — increment strikes and show a red X next to the score
    strikes += 1;
    const missedContainer = document.getElementById('missed-container');
    if (missedContainer && strikes <= 3) {
      const img = document.createElement('img');
      img.src = 'img/Red_X.svg.png';
      img.alt = 'missed';
      img.className = 'miss-icon';
      missedContainer.appendChild(img);
    }
    // If more than 3 strikes, game over
    if (strikes > 3) {
      // Stop game immediately and show GAME OVER
      endGame('GAME OVER');
    }
    drop.remove(); // Clean up drops that weren't caught
  });
}

// Slider setup
const slider = document.getElementById('slider');
const gameContainer = document.getElementById('game-container');
let sliderWidth = (slider && slider.offsetWidth) ? slider.offsetWidth : 80;

window.addEventListener('resize', () => {
  sliderWidth = (slider && slider.offsetWidth) ? slider.offsetWidth : sliderWidth;
});

function updateSliderPosition(clientX) {
  const containerRect = gameContainer.getBoundingClientRect();
  let left = clientX - containerRect.left - sliderWidth / 2;
  if (left < 0) left = 0;
  if (left > containerRect.width - sliderWidth) left = containerRect.width - sliderWidth;
  slider.style.left = left + 'px';
}

// Desktop mouse tracking
gameContainer.addEventListener('mousemove', (e) => updateSliderPosition(e.clientX));

// Mobile touch tracking
let touchActive = false;
gameContainer.addEventListener('touchstart', (e) => { touchActive = true; updateSliderPosition(e.touches[0].clientX); }, { passive: true });
gameContainer.addEventListener('touchmove', (e) => { if (!touchActive) return; updateSliderPosition(e.touches[0].clientX); }, { passive: true });
gameContainer.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

// Collision detection interval
setInterval(() => {
  const drops = document.querySelectorAll('.water-drop');
  if (!slider) return;
  const sRect = slider.getBoundingClientRect();
  drops.forEach(drop => {
    if (drop.caught) return;
    const dRect = drop.getBoundingClientRect();
    if (dRect.bottom >= sRect.top && dRect.top < sRect.bottom) {
      if (dRect.left < sRect.right && dRect.right > sRect.left) {
        drop.caught = true;
        score += 1;
        document.getElementById('score').textContent = score;
            // update the progress bar
            updateProgress();
        drop.classList.add('caught');
        playCatchSound();
        drop.addEventListener('animationend', () => drop.remove(), { once: true });
        setTimeout(() => { if (drop.parentNode) drop.remove(); }, 400);
            // End the game when player reaches 50 drops
            if (score >= 50) {
              endGame();
            }
      }
    }
  });
}, 80);

// Simple catch sound
let audioCtx;
function playCatchSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    // ignore
  }
}

function endGame(customMessage) {
  // Stop making new drops and stop timer
  clearInterval(dropMaker);
  gameRunning = false;

  // Clear any remaining drops
  document.querySelectorAll('.water-drop').forEach(d => d.remove());

  // Choose a random end message
  let message;
  if (customMessage) {
    message = customMessage;
  } else {
    const messages = score >= 50 ? winMessages : loseMessages;
    message = messages[Math.floor(Math.random() * messages.length)];
  }

  // Show end overlay with message
  const endOverlay = document.getElementById('end-overlay');
  const endMessageEl = document.getElementById('end-message');
  if (endMessageEl) endMessageEl.textContent = message;
  if (endOverlay) endOverlay.style.display = 'flex';

  // Wire up play again
  const playAgain = document.getElementById('play-again');
  if (playAgain) {
    playAgain.onclick = () => {
      // hide overlay and restart
      if (endOverlay) endOverlay.style.display = 'none';
      // show the start overlay so the player can choose difficulty and start again
      const startOverlay = document.getElementById('start-overlay');
      if (startOverlay) startOverlay.style.display = 'flex';
    };
  }
}

// Progress bar update: fills proportionally to score / 50
function updateProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  const pct = Math.min(score, 50) / 50 * 100;
  // set height as percentage so it grows from bottom (CSS aligns items to flex-end)
  fill.style.height = pct + '%';
}
