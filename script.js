let faceMesh;
let video;
let faces = [];
let myVideo; 
let smoothX = 0, smoothY = 0;
let edgeTexts = [];
let focusAreas = [];
let currentFocus = null;

function preload() {
  // טעינת ה-Tracker של ml5 (מבוסס MediaPipe)
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true });
  myVideo = createVideo(['CCCC.mp4']);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // הגדרת המצלמה לזיהוי
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // התחלת המעקב
  faceMesh.detectStart(video, gotFaces);

  myVideo.hide();
  myVideo.loop();
  myVideo.volume(0);

  document.getElementById('loading').style.display = 'none';
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);
  image(myVideo, 0, 0, width, height);

  if (faces.length > 0) {
    let face = faces[0];
    
    // נקודות האישונים (Keypoints 468 ו-473 במודל של גוגל)
    let leftIris = face.keypoints[468];
    let rightIris = face.keypoints[473];

    if (leftIris && rightIris) {
      let avgX = (leftIris.x + rightIris.x) / 2;
      let avgY = (leftIris.y + rightIris.y) / 2;

      // מיפוי תנועת העין למסך - "כיול אוטומטי"
      let targetX = map(avgX, video.width * 0.45, video.width * 0.55, 0, width);
      let targetY = map(avgY, video.height * 0.45, video.height * 0.55, 0, height);
      
      // החלקת תנועה (Smoothing)
      smoothX = lerp(smoothX, targetX, 0.1);
      smoothY = lerp(smoothY, targetY, 0.1);
    }
  }

  // לוגיקת הנתונים שלך
  updateDataPoints();
  checkFocus(smoothX, smoothY);
  drawInterface();

  // סמן מבט (Debug) - אפשר למחוק לפני הגשה
  fill(224, 58, 46, 150);
  circle(smoothX, smoothY, 10);
}

function updateDataPoints() {
  if (frameCount % 100 === 0 || edgeTexts.length === 0) {
    edgeTexts = [];
    for (let i = 0; i < 15; i++) {
      edgeTexts.push({
        x: random(width * 0.1, width * 0.9),
        y: random(height * 0.1, height * 0.9),
        text: "SENSOR_DATA_" + floor(random(100, 999))
      });
    }
  }
}

function checkFocus(gx, gy) {
  currentFocus = null;
  for (let edge of edgeTexts) {
    if (dist(gx, gy, edge.x, edge.y) < 80) {
      currentFocus = edge;
      if (!focusAreas.includes(edge)) focusAreas.push(edge);
    }
  }
}

function drawInterface() {
  textFont('Courier New');
  for (let edge of focusAreas) {
    let active = (edge === currentFocus);
    fill(224, 58, 46, active ? 255 : 80);
    if (!active) drawingContext.filter = "blur(3px)";
    textSize(14);
    text(edge.text, edge.x, edge.y);
    drawingContext.filter = "none";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
