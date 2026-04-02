let gazeX = window.innerWidth / 2;
let gazeY = window.innerHeight / 2;

let smoothX = gazeX;
let smoothY = gazeY;

let calibrated = false;

let calPoints = [];
let current = 0;
let dwell = 0;
const DWELL_TIME = 1000;

const canvas = document.getElementById("calCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== WebGazer INIT =====
webgazer.setGazeListener((data) => {
  if (data) {
    gazeX = data.x;
    gazeY = data.y;
  }
}).begin();

// hide UI
webgazer.showPredictionPoints(true);
webgazer.showVideoPreview(false);

// ===== CALIBRATION POINTS =====
calPoints = [
  {x: innerWidth/2, y: innerHeight/2},
  {x: innerWidth*0.1, y: innerHeight*0.1},
  {x: innerWidth*0.9, y: innerHeight*0.1},
  {x: innerWidth*0.9, y: innerHeight*0.9},
  {x: innerWidth*0.1, y: innerHeight*0.9}
];

// ===== MAIN LOOP =====
function loop() {
  requestAnimationFrame(loop);

  // smooth gaze
  smoothX += (gazeX - smoothX) * 0.15;
  smoothY += (gazeY - smoothY) * 0.15;

  if (!calibrated) {
    runCalibration();
  } else {
    runExperience();
  }
}

loop();

// ===== CALIBRATION =====
function runCalibration() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let p = calPoints[current];

  let d = Math.hypot(smoothX - p.x, smoothY - p.y);

  if (d < 100) {
    dwell += 16;
  } else {
    dwell *= 0.9;
  }

  let progress = Math.min(dwell / DWELL_TIME, 1);

  // draw circle
  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, Math.PI*2);
  ctx.strokeStyle = "#E03A2E";
  ctx.stroke();

  // progress arc
  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, -Math.PI/2, (-Math.PI/2) + progress * Math.PI*2);
  ctx.stroke();

  if (progress >= 1) {
    current++;
    dwell = 0;

    if (current >= calPoints.length) {
      calibrated = true;
      startPhase2();
    }
  }
}

// ===== PHASE 2 =====
function startPhase2() {
  document.getElementById("phase1").classList.add("hidden");
  document.getElementById("phase2").classList.remove("hidden");

  webgazer.showPredictionPoints(false);
}

// ===== EXPERIENCE =====
function runExperience() {
  let overlay = document.getElementById("overlay");

  let radius = 120 + Math.sin(Date.now()*0.002) * 20;

  overlay.style.background = `
    radial-gradient(circle at ${smoothX}px ${smoothY}px,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) ${radius}px,
    rgba(0,0,0,0.9) ${radius+80}px)
  `;
}
