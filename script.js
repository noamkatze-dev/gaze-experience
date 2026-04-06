// --------------------
// GLOBALS
// --------------------
let gazeX = window.innerWidth / 2;
let gazeY = window.innerHeight / 2;

let smoothX = gazeX;
let smoothY = gazeY;

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
// VIDEO + ANALYSIS
// --------------------
let video;
let edgeTexts = [];
let focusAreas = [];
let currentFocus = null;

// --------------------
// SETUP WEBGAZER
// --------------------
window.onload = async () => {

  webgazer.setRegression('ridge');
  webgazer.setTracker('clmtrackr');

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
// CALIBRATION
// --------------------
const calCanvas = document.getElementById("calCanvas");
const ctx = calCanvas.getContext("2d");

calCanvas.width = window.innerWidth;
calCanvas.height = window.innerHeight;

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

function drawCalibration() {
  ctx.clearRect(0,0,calCanvas.width,calCanvas.height);

  let p = calPoints[calIndex];

  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, Math.PI*2);
  ctx.strokeStyle = "red";
  ctx.stroke();
}

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

  let videoW, videoH;

  p.preload = () => {
    video = p.createVideo('CCCC.mp4');
  };

  p.setup = () => {
    p.createCanvas(270, 480);
    video.hide();
    video.loop();

    video.elt.onloadeddata = () => {
      videoW = video.width;
      videoH = video.height;
    };
  };

  p.draw = () => {
    p.background(0);

    if (!videoW) return;

    p.image(video, 0, 0, p.width, p.height);

    analyzeFrame(p);

    // 👁️ מעקב מבט
    smoothX += (gazeX - smoothX) * 0.15;
    smoothY += (gazeY - smoothY) * 0.15;

    let gx = p.map(smoothX, 0, window.innerWidth, 0, p.width);
    let gy = p.map(smoothY, 0, window.innerHeight, 0, p.height);

    detectFocus(gx, gy);
    drawLabels(p);
  };

});
}

// --------------------
// FOCUS SYSTEM
// --------------------
function detectFocus(gx, gy) {
  let radius = 40;

  for (let edge of edgeTexts) {
    let d = dist(gx, gy, edge.x, edge.y);

    if (d < radius) {
      currentFocus = edge;

      if (!focusAreas.includes(edge)) {
        focusAreas.push(edge);
      }
    }
  }
}

// --------------------
// DRAW LABELS
// --------------------
function drawLabels(p) {

  for (let edge of focusAreas) {

    let isCurrent = edge === currentFocus;

    if (isCurrent) {
      p.fill(255, 0, 0);
      p.textSize(10);
      p.drawingContext.filter = "none";
    } else {
      p.fill(255, 0, 0, 120);
      p.textSize(10);
      p.drawingContext.filter = "blur(2px)";
    }

    p.text(edge.text, edge.x, edge.y);
  }

  p.drawingContext.filter = "none";
}

// --------------------
// ANALYSIS (פשוט)
// --------------------
function analyzeFrame(p) {

  edgeTexts = [];

  for (let i = 0; i < 20; i++) {
    edgeTexts.push({
      x: random(p.width),
      y: random(p.height),
      text: "EDGE"
    });
  }
}
