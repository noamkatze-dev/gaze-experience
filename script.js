let faceMesh;
let video;
let faces = [];
let myVideo; // הסרט CCCC.mp4
let gazeX = 0;
let gazeY = 0;
let smoothX = 0;
let smoothY = 0;

let edgeTexts = [];
let focusAreas = [];
let currentFocus = null;

function preload() {
  // טעינת המודל של גוגל דרך ml5
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true });
  myVideo = createVideo(['CCCC.mp4']);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // מצלמה לזיהוי פנים
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // התחלת זיהוי
  faceMesh.detectStart(video, gotFaces);

  // הגדרות וידאו CCCC
  myVideo.hide();
  myVideo.loop();
  myVideo.volume(0);

  document.getElementById('status-msg').style.display = 'none';
  
  smoothX = width / 2;
  smoothY = height / 2;
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);

  // 1. ציור הוידאו CCCC על כל המסך
  image(myVideo, 0, 0, width, height);

  // 2. עיבוד המבט
  if (faces.length > 0) {
    let face = faces[0];
    
    // נקודות האישונים (Keypoints של MediaPipe)
    // 468 הוא אישון שמאל, 473 הוא אישון ימין
    let leftPupil = face.keypoints[468];
    let rightPupil = face.keypoints[473];

    if (leftPupil && rightPupil) {
      // חישוב ממוצע בין שתי העיניים
      let avgX = (leftPupil.x + rightPupil.x) / 2;
      let avgY = (leftPupil.y + rightPupil.y) / 2;

      // המרה לקואורדינטות מסך (עם פקטור רגישות)
      // מכיוון שתנועת האישון קטנה, אנחנו מכפילים אותה כדי שתכסה את המסך
      let sensitivity = 15; 
      gazeX = map(avgX, video.width * 0.4, video.width * 0.6, 0, width);
      gazeY = map(avgY, video.height * 0.4, video.height * 0.6, 0, height);
    }
  }

  // 3. החלקת תנועה (Smoothing)
  smoothX += (gazeX - smoothX) * 0.1;
  smoothY += (gazeY - smoothY) * 0.1;

  // 4. ניתוח ויזואלי (הלוגיקה שלך)
  analyzeFrame(edgeTexts);
  detectFocus(smoothX, smoothY, edgeTexts, focusAreas, (f) => currentFocus = f);
  drawLabels(focusAreas, currentFocus);

  // אופציונלי: ציור סמן מבט לדיבג
  fill(255, 0, 0, 150);
  noStroke();
  circle(smoothX, smoothY, 15);
}

function detectFocus(gx, gy, edges, focusAreas, setCurrent) {
  let radius = 100;
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

function drawLabels(focusAreas, currentFocus) {
  for (let edge of focusAreas) {
    let isCurrent = edge === currentFocus;
    if (isCurrent) {
      fill(224, 58, 46); // הצבע האדום שלך
      drawingContext.filter = "none";
    } else {
      fill(224, 58, 46, 80);
      drawingContext.filter = "blur(4px)";
    }
    textSize(14);
    textFont('Courier New');
    text(edge.text, edge.x, edge.y);
  }
  drawingContext.filter = "none";
}

function analyzeFrame(edges) {
  // יצירת נקודות נתונים אקראיות (כפי שהיה בקוד שלך)
  if (frameCount % 60 === 0 || edges.length === 0) {
    edges.length = 0;
    for (let i = 0; i < 20; i++) {
      edges.push({
        x: random(width),
        y: random(height),
        text: "SCANNING_DATA_" + floor(random(1000, 9999))
      });
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
