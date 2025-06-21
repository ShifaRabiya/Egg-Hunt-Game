const basket = document.getElementById("basket");
const basketCover = document.getElementById("basket-cover");
const egg = document.getElementById("egg");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const pauseOverlay = document.getElementById("pause-overlay");
const gameWrapper = document.querySelector(".game-container-wrapper");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const mobileControls = document.querySelector('.mobile-controls');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const moveSpeed = 8;
const acceleration = 1;
const maxSpeed = 15;
const friction = 0.9;

let score = 0;
let lives = 3;
let basketX = window.innerWidth / 2 - 50;
let movingLeft = false;
let movingRight = false;
let fallInterval = null;
let bounceInterval = null;
let gameOver = false;
let highScore = 0;
let isPaused = false;
let gameWasRunning = false;
let isMuted = false;
let basketVelocity = 0;

function updateVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Run at load
updateVH();

// Update on resize, orientation change, AND visual viewport changes
window.addEventListener('resize', updateVH);
window.addEventListener('orientationchange', updateVH);

// For iOS and Android browsers when soft UI appears/disappears
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateVH);
  window.visualViewport.addEventListener('scroll', updateVH);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") movingLeft = true;
  else if (e.key === "ArrowRight") movingRight = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") movingLeft = false;
  else if (e.key === "ArrowRight") movingRight = false;
});

function gameLoop() {
  if (!isPaused) {
    if (movingLeft && !movingRight) {
      basketVelocity -= acceleration;
    } else if (movingRight && !movingLeft) {
      basketVelocity += acceleration;
    } else {
      basketVelocity = 0; 
    }

    basketVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, basketVelocity));

    basketX += basketVelocity;

    basketX = Math.max(0, Math.min(window.innerWidth - basket.offsetWidth, basketX));

    updateBasketPosition();
  }

  requestAnimationFrame(gameLoop);
}

function dropEgg() {
  clearInterval(fallInterval);
  clearInterval(bounceInterval);

  const lane = Math.floor(Math.random() * 4);
  const hen = document.getElementById(`hen-${lane}`);
  const henRect = hen.getBoundingClientRect();

  // Randomly decide egg type: white, golden, or black
  const random = Math.random();
  let eggType = "white"; // default

  if (random < 0.10) {
    eggType = "black"; // 15% chance black
  } else if (random < 0.20) {
    eggType = "golden"; // next 20% chance golden
  }

  egg.classList.remove("golden-egg", "black-egg"); // reset all classes
  if (eggType === "golden") egg.classList.add("golden-egg");
  if (eggType === "black") egg.classList.add("black-egg");

  egg.dataset.type = eggType; // store egg type
  egg.style.left = henRect.left + henRect.width / 2 - 15 + "px";
  egg.style.top = henRect.bottom + "px";
  egg.style.display = "block";


  document.getElementById("hen-sound").play();

  let y = henRect.bottom;
  let velocity = 2;
  const gravity = 0.3;

  fallInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(fallInterval);
      return;
    }

    velocity += gravity;
    y += velocity;
    egg.style.top = y + "px";

    const eggRect = egg.getBoundingClientRect();
    const basketRect = basket.getBoundingClientRect();
    const basketWidth = basketRect.width;
    const leftBound = basketRect.left + basketWidth * 0.01;
    const rightBound = basketRect.right - basketWidth * 0.01;

    // 🥚 Egg caught
    if (
      eggRect.bottom >= basketRect.top &&
      eggRect.left >= leftBound &&
      eggRect.right <= rightBound
    ) {
      clearInterval(fallInterval);

      // Bounce animation
      let bounceY = basketRect.top + 5;
      egg.style.top = bounceY + "px";
      let bounceVelocity = -6;
      let bounceGravity = 0.5;
      let bounceCount = 0;

      bounceInterval = setInterval(() => {
        bounceVelocity += bounceGravity;
        bounceY += bounceVelocity;
        egg.style.top = bounceY + "px";

        const maxY = basketRect.top + 10;

        if (bounceY >= maxY || bounceCount > 2) {
          bounceY = maxY;
          egg.style.top = bounceY + "px";
          clearInterval(bounceInterval);
          egg.style.display = "none";
          let pointValue = 0;
          const eggType = egg.dataset.type;

          if (eggType === "golden") {
            pointValue = 5;
            document.getElementById("point-sound").play();
          } else if (eggType === "white") {
            pointValue = 1;
            document.getElementById("point-sound").play();
          } else if (eggType === "black") {
            pointValue = -10;
            document.getElementById("black-egg-sound").play();
          }

          score += pointValue;
          scoreDisplay.textContent = score;
          if (score < 0 && !gameOver) {
            gameOver = true;
            document.getElementById("game-over-sound").play();
            updateHighScoreIfNeeded();

            const gameOverScreen = document.getElementById("game-over-screen");
            document.getElementById("high-score").textContent = `High Score: ${highScore}`;
            const finalScore = document.getElementById("final-score");
            finalScore.textContent = `Score: ${score}`;
            gameOverScreen.classList.remove("hidden");
            return;
          }

          // Show floating points from basket
          const basketRect = basket.getBoundingClientRect();
          const gameRect = document.querySelector(".game-container").getBoundingClientRect();
          const x = basketRect.left + basketRect.width / 2 - gameRect.left - 10;
          const y = basketRect.top - gameRect.top - 20;
          showFloatingPoints(pointValue, x, y);
          if (!gameOver) setTimeout(dropEgg, 1000);
        }

        if (bounceY >= maxY) {
          bounceY = maxY;
          bounceVelocity *= -0.5;
          bounceCount++;
        }
      }, 20);
    }

    if (y > window.innerHeight) {
      clearInterval(fallInterval);

      const eggRect = egg.getBoundingClientRect();
      const gameRect = document.querySelector(".game-container").getBoundingClientRect();
      const x = eggRect.left - gameRect.left;
      const yOffset = gameRect.height - 70;

      document.getElementById("crack-sound").play();
      showCrackedEgg(x, yOffset);

      egg.style.display = "none";

      // 🛑 Do NOT lose life if black egg
      if (egg.dataset.type !== "black") {
        lives--;
        livesDisplay.textContent = lives;

        if (lives === 0) {
          gameOver = true;

          document.getElementById("game-over-sound").play();

          // ✅ Call it here
          updateHighScoreIfNeeded();

          const gameOverScreen = document.getElementById("game-over-screen");
          document.getElementById("high-score").textContent = `High Score: ${highScore}`;
          const finalScore = document.getElementById("final-score");
          finalScore.textContent = `Score: ${score}`;
          gameOverScreen.classList.remove("hidden");

          return;
        }
      }
      if (!gameOver) setTimeout(dropEgg, 1000);
    }
  }, 20);
}

function updateBasketPosition() {
  basket.style.left = basketX + "px";
  basketCover.style.left = basketX + "px";
}

function resetGame() {
  document.getElementById("final-score").textContent = "";
  clearInterval(fallInterval);
  clearInterval(bounceInterval);
  egg.style.display = "none";

  score = 0;
  lives = 3;
  gameOver = false;

  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;

  basketX = window.innerWidth / 2 - 50;
  updateBasketPosition();
}

function showCrackedEgg(x, y) {
  const crackedEgg = document.createElement("div");
  crackedEgg.className = "cracked-egg";
  crackedEgg.style.left = `${x}px`;
  crackedEgg.style.bottom = "0";
  document.querySelector(".game-container").appendChild(crackedEgg);

  // Trigger fade-out after a short delay
  setTimeout(() => {
    crackedEgg.style.opacity = "0";
  }, 100); // allow it to be visible first

  // Remove from DOM after 2 seconds
  setTimeout(() => {
    crackedEgg.remove();
  }, 2100);
}

function showFloatingPoints(points, x, y) {
  const pointEl = document.createElement("div");
  pointEl.className = "floating-points";

  // Set text and color
  pointEl.textContent = points > 0 ? `+${points}` : `${points}`;
  pointEl.style.color = points > 0 ? "gold" : "red";

  pointEl.style.left = `${x}px`;
  pointEl.style.top = `${y}px`;
  document.querySelector(".game-container").appendChild(pointEl);

  setTimeout(() => {
    pointEl.remove();
  }, 2000); // remove after animation
}

function startCountdown(callback) {
  const countdownEl = document.createElement("div");
  countdownEl.className = "countdown";
  countdownEl.textContent = "3";
  document.body.appendChild(countdownEl);

  let count = 3;
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      clearInterval(interval);
      countdownEl.remove();
      callback(); // call resetGame() + dropEgg()
    }
  }, 1000);
}

function fetchHighScore() {
  const stored = localStorage.getItem("highScore");
  if (stored) {
    highScore = parseInt(stored);
    document.getElementById("high-score").textContent = `High Score: ${highScore}`;
    document.getElementById("highScore").textContent = highScore;
  } else {
    highScore = 0;
    document.getElementById("high-score").textContent = `High Score: 0`;
    document.getElementById("highScore").textContent = 0;
  }
}

function updateHighScoreIfNeeded() {
  if (score > highScore) {
    highScore = score; // update in memory
    localStorage.setItem("highScore", score); // update localStorage

    document.getElementById("high-score").textContent = `High Score: ${score}`;
    document.getElementById("highScore").textContent = score;
  }
}

document.getElementById("retry-btn").addEventListener("click", () => {
  document.getElementById("button-sound").play();
  const gameOverScreen = document.getElementById("game-over-screen");
  gameOverScreen.classList.add('hidden'); 
  gameOver = false;

  startCountdown(() => {
    mobileControls.classList.remove('hidden'); 
    resetGame();
    fetchHighScore();
    dropEgg(); 
  });
});

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("button-sound").play();
  const startScreen = document.getElementById("start-screen");
  startScreen.style.display = "none";
  startScreen.classList.add('hidden');
  mobileControls.classList.remove('hidden');

  startCountdown(() => {
    resetGame();
    fetchHighScore();
    dropEgg();
  });
});

document.getElementById("rules-btn").addEventListener("click", () => {
  document.getElementById("rules-screen").classList.remove("hidden");
});

document.getElementById("close-rules-btn").addEventListener("click", () => {
  document.getElementById("rules-screen").classList.add("hidden");
});

function updateMuteIcons() {
  const allMuteBtns = document.querySelectorAll("#mute-btn-start, #mute-btn-over");
  const allUnmuteBtns = document.querySelectorAll("#unmute-btn-start, #unmute-btn-over");

  if (isMuted) {
    allMuteBtns.forEach(btn => btn.classList.add("hidden"));
    allUnmuteBtns.forEach(btn => btn.classList.remove("hidden"));
  } else {
    allUnmuteBtns.forEach(btn => btn.classList.add("hidden"));
    allMuteBtns.forEach(btn => btn.classList.remove("hidden"));
  }
}

function muteAllSounds() {
  document.querySelectorAll("audio").forEach(audio => audio.muted = true);
}

function unmuteAllSounds() {
  document.querySelectorAll("audio").forEach(audio => audio.muted = false);
}

const gameContainer = document.querySelector(".game-container");

// Hook up all buttons
document.querySelectorAll("#mute-btn-start, #mute-btn-over").forEach(btn => {
  btn.addEventListener("click", () => {
    isMuted = true;
    muteAllSounds();
    updateMuteIcons();
  });
});

document.querySelectorAll("#unmute-btn-start, #unmute-btn-over").forEach(btn => {
  btn.addEventListener("click", () => {
    isMuted = false;
    unmuteAllSounds();
    updateMuteIcons();
  });
});

leftBtn.addEventListener("touchstart", () => movingLeft = true);
leftBtn.addEventListener("touchend", () => movingLeft = false);

rightBtn.addEventListener("touchstart", () => movingRight = true);
rightBtn.addEventListener("touchend", () => movingRight = false);

// Optional: Mouse support (for testing on desktop)
leftBtn.addEventListener("mousedown", () => movingLeft = true);
leftBtn.addEventListener("mouseup", () => movingLeft = false);

rightBtn.addEventListener("mousedown", () => movingRight = true);
rightBtn.addEventListener("mouseup", () => movingRight = false);

window.onload = () => {
  updateVH();
  updateBasketPosition();
  gameLoop();
  fetchHighScore();
gameContainer.addEventListener("touchmove", function (e) {
  if (e.touches.length > 0) {
    e.preventDefault(); // Required to stop scrolling
    const touch = e.touches[0];
    basketX = touch.clientX - basket.offsetWidth / 2;
    basketX = Math.max(0, Math.min(window.innerWidth - basket.offsetWidth, basketX));
    updateBasketPosition();
  }
}, { passive: false }); // 👈 important!
};

