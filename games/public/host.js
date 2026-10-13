const socket = io();

let roomCode = null;
let lastOptions = [];
let timerInterval = null;

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function renderLeaderboard(containerId, leaderboard) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  leaderboard.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span class="leaderboard-rank">${i + 1}</span>
      <span>${entry.name}</span>
      <span class="leaderboard-score">${entry.score}</span>
    `;
    el.appendChild(row);
  });
}

socket.emit("host:create", (res) => {
  roomCode = res.roomCode;
  document.getElementById("roomCode").textContent = roomCode;
});

socket.on("room:players", (players) => {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    list.appendChild(li);
  });
  document.getElementById("startBtn").disabled = players.length === 0;
});

document.getElementById("startBtn").addEventListener("click", () => {
  socket.emit("host:start", { roomCode });
});

document.getElementById("nextBtn").addEventListener("click", () => {
  socket.emit("host:next", { roomCode });
});

socket.on("game:question", (data) => {
  show("screen-question");
  lastOptions = data.options;

  document.getElementById("qIndex").textContent = `Question ${data.index + 1}/${data.total}`;
  document.getElementById("answerCount").textContent = "0 ont repondu";
  document.getElementById("questionText").textContent = data.question;

  const grid = document.getElementById("answersGrid");
  grid.innerHTML = "";
  data.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = `answer-btn answer-${i}`;
    div.textContent = opt;
    grid.appendChild(div);
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

socket.on("game:answerCount", ({ answered, total }) => {
  document.getElementById("answerCount").textContent = `${answered}/${total} ont repondu`;
});

socket.on("game:reveal", (data) => {
  clearInterval(timerInterval);
  show("screen-reveal");

  const grid = document.getElementById("revealGrid");
  grid.innerHTML = "";
  lastOptions.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = `answer-btn answer-${i}` + (i === data.correctIndex ? " correct" : " dim");
    div.textContent = opt;
    grid.appendChild(div);
  });

  renderLeaderboard("leaderboard", data.leaderboard);
});

socket.on("game:over", (data) => {
  show("screen-end");
  renderLeaderboard("finalLeaderboard", data.leaderboard);
});
