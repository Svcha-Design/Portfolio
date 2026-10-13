const socket = io();

let roomCode = null;
let myName = "";
let lastOptions = [];
let timerInterval = null;

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function renderLeaderboard(containerId, leaderboard, myId) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  leaderboard.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row" + (entry.id === myId ? " me" : "");
    row.innerHTML = `
      <span class="leaderboard-rank">${i + 1}</span>
      <span>${entry.name}</span>
      <span class="leaderboard-score">${entry.score}</span>
    `;
    el.appendChild(row);
  });
}

document.getElementById("joinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = document.getElementById("roomCodeInput").value.trim().toUpperCase();
  const name = document.getElementById("nameInput").value.trim();
  const errorEl = document.getElementById("joinError");
  errorEl.textContent = "";

  if (!code || !name) {
    errorEl.textContent = "Entre un code et un prenom.";
    return;
  }

  socket.emit("player:join", { roomCode: code, name }, (res) => {
    if (!res.success) {
      errorEl.textContent = res.error || "Impossible de rejoindre la partie.";
      return;
    }
    roomCode = code;
    myName = name;
    document.getElementById("waitingName").textContent = `Tu es inscrit comme "${name}"`;
    show("screen-waiting");
  });
});

socket.on("game:question", (data) => {
  show("screen-question");
  lastOptions = data.options;
  document.getElementById("questionText").textContent = data.question;
  document.getElementById("answerStatus").textContent = "";

  const grid = document.getElementById("answersGrid");
  grid.innerHTML = "";
  data.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = `answer-btn answer-${i}`;
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      Array.from(grid.children).forEach((c) => (c.disabled = true));
      btn.style.outline = "4px solid #fff";
      document.getElementById("answerStatus").textContent = "Reponse envoyee !";
      socket.emit("player:answer", { roomCode, answerIndex: i });
    });
    grid.appendChild(btn);
  });

  clearInterval(timerInterval);
  const fill = document.getElementById("timerFill");
  fill.style.width = "100%";
  const start = data.startedAt;
  const duration = data.duration;
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.max(0, 100 - (elapsed / duration) * 100);
    fill.style.width = pct + "%";
    if (elapsed >= duration) clearInterval(timerInterval);
  }, 100);
});

socket.on("game:reveal", (data) => {
  clearInterval(timerInterval);
  show("screen-reveal");

  const mine = data.results.find((r) => r.id === socket.id);
  const banner = document.getElementById("revealBanner");
  if (mine && mine.correct) {
    banner.className = "status-banner ok";
    banner.textContent = `Bonne reponse ! +${mine.pointsEarned} points`;
  } else if (mine) {
    banner.className = "status-banner ko";
    banner.textContent = "Mauvaise reponse";
  } else {
    banner.className = "status-banner ko";
    banner.textContent = "Pas de reponse";
  }

  renderLeaderboard("leaderboard", data.leaderboard, socket.id);
});

socket.on("game:over", (data) => {
  show("screen-end");
  renderLeaderboard("finalLeaderboard", data.leaderboard, socket.id);
});

socket.on("room:closed", () => {
  alert("L'hote a quitte la partie.");
  window.location.reload();
});
