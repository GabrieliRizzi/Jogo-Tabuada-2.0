const studentEmailInput = document.getElementById("student-email");
const startBtn = document.getElementById("start-btn");
const gameArea = document.getElementById("game-area");
const hudStudent = document.getElementById("hud-student");
const hudLevel = document.getElementById("hud-level");
const hudCorrect = document.getElementById("hud-correct");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const questionEl = document.getElementById("question");
const answerInput = document.getElementById("answer-input");
const submitBtn = document.getElementById("submit-answer");
const feedback = document.getElementById("feedback");

const summaryArea = document.getElementById("summary-area");
const summaryText = document.getElementById("summary-text");
const formStudent = document.getElementById("form-student");
const formSummary = document.getElementById("form-summary");

let level = 1;
let correct = 0;
let totalPerLevel = 30;
let multiplier, multiplicand;
let logs = [];

let hero = { x:50, y:150, vy:0, jumping:false };
let obstacle = { x:500, y:150, w:20, h:40 };
let gravity = 0.8;

function startGame(){
  if(!studentEmailInput.value){ alert("Digite seu e-mail."); return; }
  level = 1; correct = 0; logs = [];
  hudStudent.textContent = studentEmailInput.value;
  hudLevel.textContent = level;
  hudCorrect.textContent = "0";
  gameArea.classList.remove("hidden");
  summaryArea.classList.add("hidden");
  newQuestion();
  requestAnimationFrame(loop);
}

function newQuestion(){
  multiplier = level;
  multiplicand = Math.floor(Math.random()*10)+1;
  questionEl.textContent = `Quanto é ${multiplicand} × ${multiplier}?`;
  answerInput.value = "";
  feedback.textContent = "";
  resetObstacle();
}

function resetObstacle(){ obstacle.x = canvas.width - 60; }

function checkAnswer(){
  const ans = parseInt(answerInput.value);
  const correctAns = multiplicand*multiplier;
  let certo = ans === correctAns;
  if(certo){
    feedback.textContent = "✅ Correto!";
    correct++;
    hero.vy = -12; hero.jumping = true;
  } else {
    feedback.textContent = `❌ Errado (correto: ${correctAns})`;
    hero.y = 150; hero.jumping = false;
  }
  logs.push(`${multiplicand}×${multiplier} = ${ans} → ${certo?"✔":"✘"}`);
  hudCorrect.textContent = correct;
  setTimeout(()=>{
    if(correct >= totalPerLevel){
      showSummary();
      level++;
      if(level<=10){
        correct = 0;
        hudLevel.textContent = level;
        hudCorrect.textContent = 0;
      }
    } else {
      newQuestion();
    }
  }, 800);
}

function showSummary(){
  gameArea.classList.add("hidden");
  summaryArea.classList.remove("hidden");
  summaryText.textContent = logs.join("\n");
  formStudent.value = studentEmailInput.value;
  formSummary.value = logs.join("\n");
  logs = [];
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#654321";
  ctx.fillRect(0,190,canvas.width,10);
  ctx.fillStyle="#ff6b6b";
  ctx.fillRect(hero.x,hero.y-40,30,40);
  ctx.fillStyle="#333";
  ctx.fillRect(obstacle.x, obstacle.y- obstacle.h, obstacle.w, obstacle.h);

  if(hero.jumping){
    hero.y += hero.vy;
    hero.vy += gravity;
    if(hero.y>=150){ hero.y=150; hero.jumping=false; }
  }
  obstacle.x -= 5;
  if(obstacle.x < -20){ resetObstacle(); }

  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", startGame);
submitBtn.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", e=>{ if(e.key==="Enter") checkAnswer(); });
