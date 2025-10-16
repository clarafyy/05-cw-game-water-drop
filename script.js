// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0;
let timeLeft = 30;
let timerInterval;

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

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;

  // Remove the start overlay so the dark layer is gone and game is visible
  const overlay = document.getElementById("start-overlay");
  if (overlay) overlay.remove();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

  // Reset score and timer UI
  score = 0;
  timeLeft = 30;
  document.getElementById('score').textContent = score;
  document.getElementById('time').textContent = timeLeft;

  // Start countdown timer
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    document.getElementById('time').textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);
  // Mark as not yet caught
  drop.caught = false;

  // Remove drops that reach the bottom (weren't caught by the slider)
  drop.addEventListener("animationend", () => {
    if (drop.caught) return;
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
        drop.classList.add('caught');
        playCatchSound();
        drop.addEventListener('animationend', () => drop.remove(), { once: true });
        setTimeout(() => { if (drop.parentNode) drop.remove(); }, 400);
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

function endGame() {
  // Stop making new drops and stop timer
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  gameRunning = false;

  // Clear any remaining drops
  document.querySelectorAll('.water-drop').forEach(d => d.remove());

  // Choose a random end message
  const messages = score >= 20 ? winMessages : loseMessages;
  const message = messages[Math.floor(Math.random() * messages.length)];

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
      startGame();
    };
  }
}
