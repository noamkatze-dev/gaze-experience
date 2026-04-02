// משתני מערכת
let gazeX = window.innerWidth / 2;
let gazeY = window.innerHeight / 2;
let smoothX = gazeX;
let smoothY = gazeY;
let calibrated = false;
let currentPointIndex = 0;
let dwellTimeCounter = 0;
const REQUIRED_DWELL = 1000; // מילישניות לכל נקודה

const canvas = document.getElementById("calCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// נקודות הכיול (מרכז, וארבע פינות)
const calPoints = [
    {x: window.innerWidth * 0.5, y: window.innerHeight * 0.5},
    {x: window.innerWidth * 0.1, y: window.innerHeight * 0.1},
    {x: window.innerWidth * 0.9, y: window.innerHeight * 0.1},
    {x: window.innerWidth * 0.9, y: window.innerHeight * 0.9},
    {x: window.innerWidth * 0.1, y: window.innerHeight * 0.9}
];

// 1. אתחול WebGazer עם טיפול בשגיאות
webgazer.setGazeListener((data) => {
    if (data) {
        gazeX = data.x;
        gazeY = data.y;
    }
}).begin()
  .then(() => {
      console.log("WebGazer initialized");
      webgazer.showPredictionPoints(true); // מציג נקודה אדומה איפה שהעין נמצאת
      webgazer.showVideoPreview(false);
  })
  .catch(err => {
      console.error("Camera access denied or error:", err);
  });

// 2. פונקציה שעוזרת למודל ללמוד כשלוחצים עם העכבר
window.addEventListener('click', (e) => {
    webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');
});

// 3. הלופ הראשי של האפליקציה
function mainLoop() {
    // החלקת תנועה (Linear Interpolation) לדיוק מרבי
    smoothX += (gazeX - smoothX) * 0.15;
    smoothY += (gazeY - smoothY) * 0.15;

    if (!calibrated) {
        runCalibration();
    } else {
        runExperience();
    }
    
    requestAnimationFrame(mainLoop);
}
mainLoop();

// פונקציית הכיול
function runCalibration() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let target = calPoints[currentPointIndex];
    let distance = Math.hypot(smoothX - target.x, smoothY - target.y);

    // אם המבט קרוב מספיק לנקודה (רדיוס של 120 פיקסלים)
    if (distance < 120) {
        dwellTimeCounter += 16.6; // הוספת זמן (60fps)
    } else {
        dwellTimeCounter = 0; // איפוס אם המבט ברח
    }

    let progress = Math.min(dwellTimeCounter / REQUIRED_DWELL, 1);

    // ציור עיגול המטרה
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 40, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(224, 58, 46, 0.2)";
    ctx.stroke();

    // ציור התקדמות הטעינה (קשת)
    ctx.beginPath();
    ctx.arc(target.x, target.y, 40, -Math.PI / 2, (-Math.PI / 2) + (progress * Math.PI * 2));
    ctx.strokeStyle = "#E03A2E";
    ctx.stroke();

    if (progress >= 1) {
        currentPointIndex++;
        dwellTimeCounter = 0;
        if (currentPointIndex >= calPoints.length) {
            finishCalibration();
        }
    }
}

function finishCalibration() {
    calibrated = true;
    document.getElementById("phase1").classList.add("hidden");
    document.getElementById("phase2").classList.remove("hidden");
    webgazer.showPredictionPoints(false);
    document.body.style.cursor = "none";
}

// שלב החוויה - ה-Flashlight
function runExperience() {
    let overlay = document.getElementById("overlay");
    
    // רדיוס ש"נושם" קצת עם הזמן
    let pulse = Math.sin(Date.now() * 0.003) * 15;
    let baseRadius = 130 + pulse;

    // יצירת אפקט הפנס
    overlay.style.background = `radial-gradient(circle at ${smoothX}px ${smoothY}px, 
        transparent 0px, 
        transparent ${baseRadius}px, 
        rgba(0, 0, 0, 0.95) ${baseRadius + 100}px)`;
}

// עדכון גודל קנבס בשינוי חלון
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
