// --------------------
// GAZE
// --------------------
let gazeX = window.innerWidth / 2;
let gazeY = window.innerHeight / 2;

let smoothX = gazeX;
let smoothY = gazeY;

// --------------------
// CALIBRATION
// --------------------
let calibrated = false;
let calIndex = 0;

const calPoints = [
  {x: window.innerWidth * 0.2, y: window.innerHeight * 0.2},
  {x: window.innerWidth * 0.8, y: window.innerHeight * 0.2},
  {x: window.innerWidth * 0.8, y: window.innerHeight * 0.8},
  {x: window.innerWidth * 0.2, y: window.innerHeight * 0.8},
  {x: window.innerWidth * 0.5, y: window.innerHeight * 0.5}
];

// --------------------
// WEBGAZER
// --------------------
window.onload = async () => {

  if (!window.webgazer) return;

  webgazer.setTracker('TFFacemesh');
  webgazer.setRegression('ridge');

  await webgazer.begin();

  webgazer.setGazeListener((data) => {
    if (data) {
      gazeX = data.x;
      gazeY = data.y;
    }
  });

  webgazer.showVideoPreview(true);
};

// --------------------
// CANVAS כיול
// --------------------
const canvas = document.getElementById("calCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ציור נקודה
function drawCalibration() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let p = calPoints[calIndex];

  ctx.beginPath();
  ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// לופ כיול
function calibrationLoop() {
  if (!calibrated) {
    drawCalibration();
    requestAnimationFrame(calibrationLoop);
  }
}
calibrationLoop();

// --------------------
// קליקים לכיול (🔥 מתוקן)
// --------------------
window.addEventListener('click', (e) => {

  if (!calibrated) {

    let p = calPoints[calIndex];
    let d = Math.hypot(e.clientX - p.x, e.clientY - p.y);

    // 🔥 רדיוס גדול יותר
    if (d < 150) {

      webgazer.recordScreenPosition(p.x, p.y, 'click');
      calIndex++;

      if (calIndex >= calPoints.length) {

        calibrated = true;

        document.getElementById("calibration").style.display = "none";

        // נותן רגע לדפדפן
        setTimeout(() => {
          startP5();
        }, 200);
      }
    }
  }
});

// --------------------
// P5 SYSTEM
// --------------------
function startP5() {

new p5((p) => {

  let video;
  let edgeTexts = [];

  let focusAreas = [];
  let currentFocus = null;

  p.preload = () => {
    video = p.createVideo('CCCC.mp4'); // ודאי שהקובץ קיים
  };

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
    video.hide();
    video.loop();
  };

  p.draw = () => {
    p.background(0);

    // וידאו
    p.image(video, 0, 0, p.width, p.height);

    analyzeFrame(p, edgeTexts);

    // smoothing gaze
    smoothX += (gazeX - smoothX) * 0.15;
    smoothY += (gazeY - smoothY) * 0.15;

    let gx = p.map(smoothX, 0, window.innerWidth, 0, p.width);
    let gy = p.map(smoothY, 0, window.innerHeight, 0, p.height);

    detectFocus(gx, gy, edgeTexts, focusAreas, (f)=> currentFocus = f);
    drawLabels(p, focusAreas, currentFocus);
  };

});
}

// --------------------
// FOCUS
// --------------------
function detectFocus(gx, gy, edges, focusAreas, setCurrent) {
  let radius = 80;

  for (let edge of edges) {
    let d = dist(gx, gy, edge.x, edge.y);

    if (d < radius) {
      setCurrent(edge);

      if (!focusAreas.includes(edge)) {
        focusAreas.push(edge);
      }
    }
  }
}

// --------------------
// DRAW LABELS
// --------------------
function drawLabels(p, focusAreas, currentFocus) {

  for (let edge of focusAreas) {

    let isCurrent = edge === currentFocus;

    if (isCurrent) {
      p.fill(255, 0, 0);
      p.drawingContext.filter = "none";
    } else {
      p.fill(255, 0, 0, 120);
      p.drawingContext.filter = "blur(4px)";
    }

    p.textSize(14);
    p.text(edge.text, edge.x, edge.y);
  }

  p.drawingContext.filter = "none";
}

// --------------------
// ANALYSIS (דמו)
// --------------------
function analyzeFrame(p, edgeTexts) {

  edgeTexts.length = 0;

  for (let i = 0; i < 30; i++) {
    edgeTexts.push({
      x: p.random(p.width),
      y: p.random(p.height),
      text: "DATA"
    });
  }
}
