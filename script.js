// מניעת שגיאות של נתונים ישנים
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
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const calPoints = [
    {x: window.innerWidth * 0.5, y: window.innerHeight * 0.5},
    {x: window.innerWidth * 0.1, y: window.innerHeight * 0.1},
    {x: window.innerWidth * 0.9, y: window.innerHeight * 0.1},
    {x: window.innerWidth * 0.9, y: window.innerHeight * 0.9},
    {x: window.innerWidth * 0.1, y: window.innerHeight * 0.9}
];

// אתחול בטוח בתוך פונקציית טעינה
window.addEventListener('load', async () => {
    try {
        await webgazer.setGazeListener((data) => {
            if (data) {
                gazeX = data.x;
                gazeY = data.y;
            }
        }).begin();

        // הגדרות תצוגה ראשוניות
        webgazer.showPredictionPoints(true);
        webgazer.showVideoPreview(true); // השאירי true כדי לוודא שהמצלמה עובדת

        // התחלת הלופ
        requestAnimationFrame(loop);
    } catch (e) {
        console.error("WebGazer failed to start:", e);
    }
});

// אימון המודל בלחיצה
window.addEventListener('click', (e) => {
    webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');
});

function loop() {
    smoothX += (gazeX - smoothX) * 0.15;
    smoothY += (gazeY - smoothY) * 0.15;

    if (!calibrated) {
        runCalibration();
    } else {
        runExperience();
    }
    requestAnimationFrame(loop);
}

function runCalibration() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let p = calPoints[current];
    let d = Math.hypot(smoothX - p.x, smoothY - p.y);
    
    if (d < 120) {
        dwell += 16.6;
    } else {
        dwell = 0;
    }

    let progress = Math.min(dwell / DWELL_TIME, 1);

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(224, 58, 46, 0.3)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, -Math.PI/2, (-Math.PI/2) + progress * Math.PI * 2);
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

function runExperience() {
    let overlay = document.getElementById("overlay");
    let radius = 130 + Math.sin(Date.now() * 0.003) * 15;
    
    overlay.style.background = `radial-gradient(circle at ${smoothX}px ${smoothY}px, 
        transparent 0px, 
        transparent ${radius}px, 
        rgba(0,0,0,0.95) ${radius + 100}px)`;
}
