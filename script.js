window.saveDataAcrossSessions = false;

let gazeX = window.innerWidth / 2;
let gazeY = window.innerHeight / 2;
let smoothX = gazeX;
let smoothY = gazeY;

let calibrated = false;
let current = 0;
let dwell = 0;

const DWELL_TIME = 1000;

const canvas = document.getElementById("calCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const calPoints = [
  {x: window.innerWidth * 0.5, y: window.innerHeight * 0.5},
  {x: window.innerWidth * 0.2, y: window.innerHeight * 0.2},
  {x: window.innerWidth * 0.8, y: window.innerHeight * 0.2},
  {x: window.innerWidth * 0.8, y: window.innerHeight * 0.8},
  {x: window.innerWidth * 0.2, y: window.innerHeight * 0.8}
];

window.onload = async () => {
  if (!window.webgazer) return;

  try {
    webgazer.setRegression('ridge');
    webgazer.setTracker('clmtrackr');

    await webgazer.begin();

    webgazer.setGazeListener((data) => {
      if (data) {
        gazeX = data.x;
        gazeY = data.y;
      }
    });

    webgazer.showPredictionPoints(true);
    webgazer.showVideoPreview(true);

    requestAnimationFrame(loop);

  } catch (err) {
    console.error(err);
  }
};

// קליק רק על נקודת כיול
window.addEventListener('click', (e) => {
  if (!calibrated) {
    let p = calPoints[current];
    let d = Math.hypot(e.clientX - p.x, e.clientY - p.y);

    if (d < 80) {
      webgazer.recordScreenPosition(p.x, p.y, 'click');
    }
  }
});

function loop() {
  smoothX += (gazeX - smoothX) * 0.15;
  smoothY += (gazeY - smoothY) * 0.15;

  if (!calibrated) runCalibration();

  requestAnimationFrame(loop);
}

function runCalibration() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let p = calPoints[current];
  let d = Math.hypot(smoothX - p.x, smoothY - p.y);

  if (d < 120) dwell += 16.6;
  else dwell = 0;

  let progress = Math.min(dwell / DWELL_TIME, 1);

  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(224, 58, 46, 0.3)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(p.x, p.y, 40, -Math.PI/2, (-Math.PI/2) + progress * Math.PI * 2);
  ctx.strokeStyle = "#E03A2E";
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

function startPhase2() {
  document.getElementById("phase1").classList.add("hidden");
  document.getElementById("phase2").classList.remove("hidden");

  webgazer.showPredictionPoints(false);
  webgazer.showVideoPreview(false);

  document.body.style.cursor = "none";
}
