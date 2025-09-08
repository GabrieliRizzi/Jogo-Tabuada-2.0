// Tabuada Hero - versão baseada no design de referência
// 10 níveis (1..10), 5 contas por nível (para teste)
// Envio de relatório via mailto: para gabrieli.rizzi.cruz@escola.pr.gov.br
// Aluno preenche apenas seu e-mail

(() => {
  // CONFIG
  const PROFESSOR_EMAIL = "gabrieli.rizzi.cruz@escola.pr.gov.br";
  const QUESTIONS_PER_LEVEL = 5; // conforme pediu para testes
  const TOTAL_LEVELS = 10;
  const CANVAS_ID = "gameCanvas";

  // DOM
  const studentEmailEl = document.getElementById("studentEmail");
  const startLevelEl = document.getElementById("startLevel");
  const btnStart = document.getElementById("btnStart");
  const gameArea = document.getElementById("gameArea");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const overlayContinue = document.getElementById("overlayContinue");
  const overlayRestart = document.getElementById("overlayRestart");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");
  const questionText = document.getElementById("questionText");
  const answerInput = document.getElementById("answerInput");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnSkip = document.getElementById("btnSkip");
  const feedbackEl = document.getElementById("feedback");
  const perLevelEl = document.getElementById("perLevel");
  const summarySection = document.getElementById("summary");
  const summaryText = document.getElementById("summaryText");
  const formStudentEmail = document.getElementById("formStudentEmail");
  const formMessage = document.getElementById("formMessage");
  const emailForm = document.getElementById("emailForm");
  const sendMailBtn = document.getElementById("sendMailBtn");
  const closeSummary = document.getElementById("closeSummary");

  // canvas
  const canvas = document.getElementById(CANVAS_ID);
  const ctx = canvas.getContext("2d");
  canvas.width = 820;
  canvas.height = 260;

  // state
  let state = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    level: 1,
    qIndex: 0,
    currentQuestion: null,
    questions: [],
    logsCurrentLevel: [], // strings com resumo da rodada atual
    studentEmail: "",
  };

  // personagem / mundo
  const hero = { x: 60, y: 200, w: 36, h: 36, vy: 0, onGround: true, color: "#ffaf7b" };
  const gravity = 0.8;
  let keys = {};
  const obstacles = []; // obstacles per level (x,y,w,h)

  // preenche select levels
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const o = document.createElement("option");
    o.value = i; o.textContent = i;
    startLevelEl.appendChild(o);
  }
  perLevelEl.textContent = QUESTIONS_PER_LEVEL;

  // util
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // cria perguntas para o nível N (multiplicador = nível)
  function generateQuestionsForLevel(n) {
    const arr = [];
    for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
      const a = randInt(1, 10);
      const b = n;
      arr.push({ a, b, answer: a * b, timeStart: null, timeMs: null, result: null });
    }
    return arr;
  }

  // preparar obstáculos simples (um por pergunta)
  function prepareObstacles() {
    obstacles.length = 0;
    for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
      // spaces: starting near right side, spread
      const x = 420 + i * 70 + randInt(-10, 30);
      obstacles.push({ x, y: 220, w: 26, h: 36, passed: false });
    }
  }

  // início do jogo
  btnStart.addEventListener("click", () => {
    const student = studentEmailEl.value.trim();
    if (!student) { alert("Digite seu e-mail."); studentEmailEl.focus(); return; }
    state.studentEmail = student;
    state.level = parseInt(startLevelEl.value) || 1;
    startLevel(state.level);
    // atualizar HUD e mostrar área do jogo
    scoreEl.textContent = state.score;
    livesEl.textContent = state.lives;
    levelEl.textContent = state.level;
    document.getElementById("intro")?.classList?.add('hidden');
    gameArea.classList.remove("hidden");
    summarySection.classList.add("hidden");
    state.running = true;
    requestAnimationFrame(gameLoop);
  });

  // iniciar nível
  function startLevel(n) {
    state.qIndex = 0;
    state.currentQuestion = null;
    state.logsCurrentLevel = [];
    state.questions = generateQuestionsForLevel(n);
    prepareObstacles();
    hero.x = 60; hero.y = 200; hero.vy = 0; hero.onGround = true;
    state.lives = Math.max(1, state.lives); // vidas mantidas
    updateHUD();
    nextQuestion();
  }

  // próxima pergunta
  function nextQuestion() {
    if (state.qIndex >= state.questions.length) {
      // nível concluído
      showLevelSummary();
      return;
    }
    const q = state.questions[state.qIndex];
    q.timeStart = performance.now();
    state.currentQuestion = q;
    questionText.textContent = `Quanto é ${q.a} × ${q.b}?  (conta ${state.qIndex+1}/${QUESTIONS_PER_LEVEL})`;
    answerInput.value = "";
    feedbackEl.textContent = "";
    // posicionar obstáculo correspondente como "ativo"
    obstacles.forEach((ob, idx) => ob.active = (idx === state.qIndex));
    // centralizar hero x se quiser
  }

  // checar resposta
  function submitAnswer() {
    if (!state.currentQuestion) return;
    const raw = answerInput.value.trim();
    if (raw === "") { feedbackEl.textContent = "Digite uma resposta."; return; }
    const val = Number(raw);
    const q = state.currentQuestion;
    q.timeMs = performance.now() - q.timeStart;
    const ok = val === q.answer;
    q.result = ok;
    const line = `${q.a}×${q.b} = ${val} → ${ok ? "✔" : "✘"} (${Math.round(q.timeMs)}ms)`;
    state.logsCurrentLevel.push(line);

    // reação do bichinho: se acertou, pular e 'passar' no obstáculo; se errou, perder vida (pequena queda)
    if (ok) {
      // força pulo
      hero.vy = -12; hero.onGround = false;
      // marcar obstáculo passado
      const ob = obstacles[state.qIndex];
      if (ob) ob.passed = true;
      state.score += 10;
    } else {
      // erro: perde vida e "tomba" (visual)
      state.lives -= 1;
      hero.vy = -6; hero.onGround = false;
      // quando vida <=0 -> game over handling
    }

    // atualizar HUD
    updateHUD();

    // avançar pra próxima após curto delay
    state.qIndex++;
    setTimeout(() => {
      if (state.lives <= 0) {
        showOverlay("Game Over", "Você ficou sem vidas. Deseja reiniciar?", false);
      } else {
        nextQuestion();
      }
    }, 700);
  }

  // pular pergunta (skip)
  function skipQuestion() {
    if (!state.currentQuestion) return;
    const q = state.currentQuestion;
    q.timeMs = performance.now() - q.timeStart;
    q.result = false;
    const line = `${q.a}×${q.b} = (pulou) → ✘ (${Math.round(q.timeMs)}ms)`;
    state.logsCurrentLevel.push(line);
    // penalidade pequena
    state.lives -= 1;
    updateHUD();
    state.qIndex++;
    setTimeout(() => {
      if (state.lives <= 0) {
        showOverlay("Game Over", "Você ficou sem vidas. Deseja reiniciar?", false);
      } else {
        nextQuestion();
      }
    }, 400);
  }

  // HUD
  function updateHUD() {
    scoreEl.textContent = state.score;
    livesEl.textContent = state.lives;
    levelEl.textContent = state.level;
  }

  // overlay (pausa / gameover / vitória de nível)
  function showOverlay(title, text, canContinue = true) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.classList.remove("hidden");
    overlayContinue.style.display = canContinue ? "inline-block" : "none";
    state.paused = true;
  }
  function hideOverlay() { overlay.classList.add("hidden"); state.paused = false; }

  overlayContinue.addEventListener("click", () => { hideOverlay(); });
  overlayRestart.addEventListener("click", () => { location.reload(); });

  // mostrar resumo do nível (preenchendo formulário)
  function showLevelSummary() {
    state.running = false;
    gameArea.classList.add("hidden");
    summarySection.classList.remove("hidden");
    const header = `Relatório — Aluno: ${state.studentEmail}\nNível: ${state.level}\nAcertos: ${state.questions.filter(q=>q.result).length}/${QUESTIONS_PER_LEVEL}\nScore atual: ${state.score}\n\nDetalhes:\n`;
    const body = state.logsCurrentLevel.join("\n");
    const msg = header + body;
    summaryText.textContent = msg;
    formStudentEmail.value = state.studentEmail;
    formMessage.value = msg;
    // deixar preparado o action mailto: do form ao submeter (a gente usa GET para mailto)
    // montamos o mailto no submit handler
  }

  // quando o aluno clica em enviar (abre cliente de e-mail via mailto:)
  emailForm.addEventListener("submit", (ev) => {
    // construir mailto: com assunto e corpo; usar encodeURIComponent
    ev.preventDefault();
    const aluno = (formStudentEmail.value || "").trim();
    if (!aluno) { alert("Confirme seu e-mail no formulário."); formStudentEmail.focus(); return; }
    const body = formMessage.value || "";
    const subject = `Relatório Tabuada — ${aluno} — Nível ${state.level}`;
    const mailto = `mailto:${PROFESSOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // abrir cliente
    window.location.href = mailto;
    // após abrir cliente, avançar para próximo nível (ou término do jogo)
    // Se quiser que todos os relatórios futuros vão sempre pro mesmo e-mail local, você diz que verifica seu email na primeira resposta — aqui o destino é fixo
    // Ajuste: ao enviar, já preparamos o próximo nível automaticamente:
    setTimeout(() => {
      // se ainda houver mais níveis
      if (state.level < TOTAL_LEVELS) {
        state.level++;
        // reset para próximo nível: manter score e vidas atuais
        startLevel(state.level);
        gameArea.classList.remove("hidden");
        summarySection.classList.add("hidden");
        state.running = true;
        requestAnimationFrame(gameLoop);
      } else {
        // jogo finalizado
        showOverlay("Parabéns!", "Você concluiu todas as tabuadas. Reinicie para jogar novamente.", false);
      }
    }, 500);
  });

  // botão fechar resumo (voltar sem enviar)
  closeSummary.addEventListener("click", () => {
    summarySection.classList.add("hidden");
    gameArea.classList.remove("hidden");
    state.running = true;
    requestAnimationFrame(gameLoop);
  });

  // controles teclado
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    // pausar com P
    if (k === "p") {
      state.paused = !state.paused;
      if (state.paused) showOverlay("Pausado", "Jogo pausado. Pressione Continuar para retornar.", true);
      else hideOverlay();
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  // botões de submit na UI
  btnSubmit.addEventListener("click", submitAnswer);
  btnSkip.addEventListener("click", skipQuestion);
  answerInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAnswer(); });

  // render loop e física simples
  let lastTime = 0;
  function gameLoop(ts = 0) {
    if (!state.running) return;
    const dt = ts - lastTime;
    lastTime = ts;
    if (!state.paused) {
      updatePhysics();
      render();
    }
    requestAnimationFrame(gameLoop);
  }

  function updatePhysics() {
    // movimento horizontal
    if (keys["arrowleft"] || keys["a"]) {
      hero.x -= 4;
      if (hero.x < 10) hero.x = 10;
    }
    if (keys["arrowright"] || keys["d"]) {
      hero.x += 4;
      if (hero.x > 760) hero.x = 760;
    }
    // pulo
    if ((keys["arrowup"] || keys["w"] || keys[" "]) && hero.onGround) {
      hero.vy = -12;
      hero.onGround = false;
    }
    // aplicar gravidade
    hero.vy += gravity;
    hero.y += hero.vy;
    if (hero.y >= 200) { hero.y = 200; hero.vy = 0; hero.onGround = true; }

    // mover obstáculos para a esquerda (simulate progression)
    obstacles.forEach((ob, idx) => {
      ob.x -= 2;
      // se obstáculo foi passado e vinha próximo do hero e hero não pulou, detecta colisão:
      if (!ob.passed && ob.active) {
        // colisão simples AABB se hero overlap with obstacle when close
        if (hero.x + hero.w > ob.x && hero.x < ob.x + ob.w && hero.y + hero.h > ob.y - ob.h) {
          // se hero está alto (pulando) considerou passar; otherwise, collide
          if (hero.y < ob.y - ob.h - 6) {
            // passou (success) -> mark
            ob.passed = true;
            // reward already given in submitAnswer flow; but keep safety
          } else {
            // collision because didn't jump high enough -> lose life
            if (state.lives > 0) {
              state.lives -= 1;
              // visual reaction
              hero.vy = -6;
              hero.onGround = false;
              updateHUD();
              // mark obstacle as passed to avoid repeated penalties
              ob.passed = true;
            }
          }
        }
      }
      // recycle obstacle back to right when out of screen
      if (ob.x < -60) ob.x = 420 + idx * 70 + randInt(-10, 30), ob.passed = false;
    });
  }

  function render() {
    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#bfe9d8");
    skyGrad.addColorStop(1, "#e0f7fa");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ground
    ctx.fillStyle = "#6b8e23";
    ctx.fillRect(0, 230, canvas.width, 30);

    // obstacles
    obstacles.forEach((ob) => {
      ctx.fillStyle = ob.passed ? "#9ee2b7" : "#3b3b3b";
      ctx.fillRect(ob.x, ob.y - ob.h, ob.w, ob.h);
      // little plant decoration
      ctx.fillStyle = "#7fd08a";
      ctx.fillRect(ob.x + ob.w / 2 - 2, ob.y - ob.h - 6, 4, 6);
    });

    // hero (cute square with eyes)
    ctx.fillStyle = hero.color;
    roundRect(ctx, hero.x, hero.y - hero.h, hero.w, hero.h, 6, true, false);
    // eyes
    ctx.fillStyle = "#222";
    ctx.fillRect(hero.x + 8, hero.y - hero.h + 8, 6, 6);
    ctx.fillRect(hero.x + hero.w - 14, hero.y - hero.h + 8, 6, 6);
    // smile
    ctx.strokeStyle = "#7a3f00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hero.x + hero.w / 2, hero.y - 10, 8, 0, Math.PI);
    ctx.stroke();

    // HUD small draws (optional)
    // Level indicator drawn in HTML already
  }

  // helper: rounded rect
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // atalho: skip question if player presses S
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "s") skipQuestion();
  });

  // small helper: random int
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // minimal touch: when the user clicks "Skip" or "Submit", we also nudge obstacles to show progression
  // tie UI buttons
  // (Submit already wired above)
  // ensure answerInput is focused when question appears
  const questionObserver = new MutationObserver(() => {
    try { answerInput.focus(); } catch (e) {}
  });
  questionObserver.observe(questionText, { childList: true, characterData: true, subtree: true });

  // debug: expose state to window for dev
  window.TABUADA_STATE = state;

  // start first frame when game running
  // End of IIFE
})();
