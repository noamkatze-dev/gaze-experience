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
  {x: 200, y: 200},
  {x: window.innerWidth - 200, y: 200},
  {x: window.innerWidth - 200, y: window.innerHeight - 200},
  {x: 200, y: window.innerHeight - 200},
  {x: window.innerWidth / 2, y: window.innerHeight / 2}
];

// --------------------
// WEBGAZER INIT
// --------------------
window.onload = async () => {

  if (!window.webgazer) return;

  try {
    // 🔥 התיקון הכי חשוב
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

  } catch (e) {
    console.error(e);
  }
};

// --------------------
// CAL CANVAS
// --------------------
const calCanvas = document.getElementById("calCanvas");
const ctx = calCanvas.getContext("2d", { willReadFrequently: true });

calCanvas.width = window.innerWidth;
calCanvas.height = window.innerHeight;

// קליקים לכיול
window.addEventListener('click', (e) => {
  if (!calibrated) {
    let p = calPoints[calIndex];
    let d = Math.hypot(e.clientX - p.x, e.clientY - p.y);

    if (d < 80) {
      webgazer.recordScreenPosition(p.x, p.y, 'click');
      calIndex++;

      if (calIndex >= calPoints.length) {
        calibrated = true;
        document.getElementById("calibration").style.display = "none";
        startP5();
      }
    }
  }
});

// ציור כיול
function drawCalibration() {
  ctx.clearRect(0,0,calCanvas.width,calCanvas.height);

  let p = calPoints[calIndex];

  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, Math.PI*2);
  ctx.strokeStyle = "red";
  ctx.stroke();
}

// לופ כיול
function calLoop() {
  if (!calibrated) {
    drawCalibration();
    requestAnimationFrame(calLoop);
  }
}
calLoop();

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
    video = p.createVideo('CCCC.mp4'); // שימי את הקובץ בתיקייה
  };

  p.setup = () => {
    p.createCanvas(270, 480);
    video.hide();
    video.loop();
  };

  p.draw = () => {
    p.background(0);

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
  let radius = 40;

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
      p.drawingContext.filter = "blur(3px)";
    }

    p.textSize(10);
    p.text(edge.text, edge.x, edge.y);
  }

  p.drawingContext.filter = "none";
}

// --------------------
// ANALYSIS (דמו)
// --------------------
function analyzeFrame(p, edgeTexts) {

  edgeTexts.length = 0;

  for (let i = 0; i < 25; i++) {
    edgeTexts.push({
      x: p.random(p.width),
      y: p.random(p.height),
      text: "DATA"
    });
  }
}
